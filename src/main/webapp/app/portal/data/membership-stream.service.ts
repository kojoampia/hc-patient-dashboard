import { Injectable, inject } from '@angular/core';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { StateStorageService } from 'app/core/auth/state-storage.service';
import { PatientContextService } from './patient-context.service';

/**
 * The `event:` line the api puts on a membership frame — `MembershipChangedEvent.TYPE`.
 *
 * <p>A literal on the wire in two repositories, so a rename there is not a compile error here; it is a frame this
 * client silently stops recognising. Asserted as a literal on both sides for that reason.</p>
 */
export const MEMBERSHIP_CHANGED_EVENT = 'MembershipChanged';

/**
 * What the server promises when the stream is idle — `MembershipStreamRegistry.DEFAULT_HEARTBEAT_SECONDS`.
 *
 * <p>It is here to be divided into {@link SILENCE_TIMEOUT_MS} rather than to be used directly: this client never waits
 * 25 seconds for anything, it only needs to know what "too quiet" means.</p>
 */
export const SERVER_HEARTBEAT_MS = 25_000;

/**
 * How long silence is allowed to last before the connection is assumed dead.
 *
 * <p>Derived rather than chosen, because the only liveness signal this stream has is the heartbeat: nothing else
 * arrives on an idle line, and a membership can sit `PENDING` for as long as the back office takes. Two beats plus
 * slack, so one lost beat costs nothing and two mean something is genuinely wrong. It also lands at the 60 seconds
 * the quality vhost cuts an idle proxied response at, which is the other way this connection can die without a
 * packet arriving to say so.</p>
 */
export const SILENCE_TIMEOUT_MS = SERVER_HEARTBEAT_MS * 2 + 10_000;

/**
 * How long to wait before each successive reconnect, the last rung repeating for ever.
 *
 * <p>`EventSource` would have given this away free. It cannot send an `Authorization` header, and putting a token
 * carrying patient scope in a query string writes it into nginx access logs, browser history and every proxy in
 * between — so the whole of reconnect and backoff is hand-written, and this ladder is the cost of keeping the header
 * (backlog item 39).</p>
 */
const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 15_000, 30_000];

/** An SSE block is terminated by a blank line; all three line terminators are legal ahead of it. */
const BLOCK_BOUNDARY = /\r\n\r\n|\n\n|\r\r/;

/** Within a block, the same three. */
const LINE_BOUNDARY = /\r\n|\n|\r/;

/**
 * The patient's open line to their own membership: an administrator verifies their plan and the screen changes
 * without them touching it.
 *
 * <p>Backlog item 39 cycle 2, against the endpoint cycle 1 built — `GET /api/membership-events`, streamed through the
 * gateway, filtered server-side by `PatientScope`. <b>There is no filtering here and there must not be.</b> A frame
 * this client receives is a frame it was entitled to receive; deciding again on the browser's side would be a second
 * implementation of a rule the api already owns, in the one place it cannot be enforced.</p>
 *
 * <h2>`fetch` rather than `EventSource`, and what that costs</h2>
 *
 * <p>`EventSource` cannot set request headers, so it cannot send the bearer token `auth.interceptor.ts` puts on every
 * other call. The alternative — the token in the query string — is not available: it would put a JWT carrying patient
 * scope into nginx access logs, browser history and any proxy between. So this reads the body through a
 * {@link ReadableStream} instead, and pays for the header by hand-writing everything `EventSource` does for free:
 * framing, reconnect, backoff and liveness. That trade was made deliberately in item 39 and is not open here.</p>
 *
 * <h2>It carries no state, on purpose</h2>
 *
 * <p>A frame says "something about your membership changed" and nothing else is read from it — not even parsed. Item
 * 39 decided the push carries identifiers only and the client re-fetches, so the reaction to a frame is
 * {@link PatientContextService#reload}, which is what every other screen in the portal already goes through. Two
 * things follow. A payload change in the api cannot break this client, because it never looks inside `data:`. And the
 * re-fetch goes back through `HttpClient`, so it carries the interceptors' `Authorization` and `X-Acting-As` and is
 * scoped exactly as any other read is — the stream decides *when* to ask, never *what* the answer is.</p>
 *
 * <h2>Three properties of this stream that break a naive reader</h2>
 *
 * <ol>
 *   <li><b>The first thing that ever arrives is a comment.</b> The api flushes `:connected` as the stream opens — that
 *     flush is what makes the response headers arrive in 22ms rather than up to 25 seconds (backlog item 63). A reader
 *     that treats the first blank-line-delimited block as an event and parses its `data:` chokes on byte one. Comments
 *     are handled from the first block by {@link dispatch}, which is also where `:keep-alive` lands.</li>
 *   <li><b>The server ends every stream after thirty minutes, by design.</b> It bounds the visibility decision
 *     `PatientScope` froze at connect, so a revoked care angel's open tab cannot go on receiving a patient's frames.
 *     That arrives as a clean end of body, and is <b>not</b> a failure — see {@link reconnect}.</li>
 *   <li><b>Silence longer than two heartbeats is the only evidence available that the line is dead.</b> A TCP
 *     connection dropped by a proxy or a sleeping laptop produces no event a browser can see; it just stops.
 *     {@link SILENCE_TIMEOUT_MS} is the watchdog.</li>
 * </ol>
 *
 * <h2>Why it re-fetches on every connect</h2>
 *
 * <p>The stream does not replay. A client disconnected across an activation would otherwise miss it and sit on
 * "Awaiting confirmation" until the patient restarted the app — which is the entire defect item 39 exists to fix,
 * reintroduced through the back door of a dropped connection. Re-fetching on connect makes the push an optimisation
 * rather than the only path, and it is why the thirty-minute close is harmless.</p>
 *
 * <p>Started and stopped by `ShellComponent`, which is the frame every portal screen renders into, so the stream's
 * lifetime is the portal's. It is not started for the onboarding wizard, which runs on a different layout for
 * somebody who has no record yet, let alone a membership.</p>
 */
@Injectable({ providedIn: 'root' })
export class MembershipStreamService {
  private readonly applicationConfigService = inject(ApplicationConfigService);
  private readonly stateStorageService = inject(StateStorageService);
  private readonly context = inject(PatientContextService);

  private readonly url = this.applicationConfigService.getEndpointFor('api/membership-events', 'hcpatientservice');

  /** Whether {@link start} has been called and {@link stop} has not. Every continuation below checks it. */
  private running = false;

  /**
   * The controller for the connection in flight, or null between attempts.
   *
   * <p>Also the identity of an attempt: a continuation that finds a different controller here belongs to a connection
   * that has already been replaced, and must do nothing rather than schedule a second reconnect.</p>
   */
  private controller: AbortController | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private silenceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Which rung of {@link RECONNECT_DELAYS_MS} the next failure waits for. */
  private rung = 0;

  /** Opens the stream, if it is not already open. Safe to call twice; the second call does nothing. */
  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    void this.connect();
  }

  /**
   * Closes the stream and cancels anything pending.
   *
   * <p>Not optional and not merely tidy. An abandoned reader holds an open connection to the gateway for as long as
   * the tab lives, goes on calling {@link PatientContextService#reload} on a service every screen shares, and fails
   * nothing while it does — which is exactly the kind of leak that is never noticed.</p>
   */
  stop(): void {
    this.running = false;
    this.rung = 0;
    this.clearSilenceWatchdog();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    // Aborting errors the body stream, so the pending read() rejects and the loop below unwinds.
    this.controller?.abort();
    this.controller = null;
  }

  /**
   * One connection attempt, from the request to the end of the body.
   *
   * <p>The `fetch` promise resolving <em>is</em> the "connected" signal: it settles when the response headers arrive,
   * which is the thing item 63 made happen on connect rather than on the first heartbeat. A stream that answered its
   * headers and then went quiet is still caught, by the watchdog {@link read} arms before its first read.</p>
   */
  private async connect(): Promise<void> {
    const token = this.stateStorageService.getAuthenticationToken();
    if (!token) {
      // Signed out. There is nothing to listen to and no point retrying — the shell is rebuilt on the next sign-in
      // and starts this again.
      this.running = false;
      return;
    }

    const controller = new AbortController();
    this.controller = controller;

    let response: Response;
    try {
      response = await fetch(this.url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
        // A cached event stream is a contradiction, and a stale one would be replayed as though it were new.
        cache: 'no-store',
      });
    } catch {
      this.reconnect(controller);
      return;
    }

    if (!response.ok || !response.body) {
      // Includes the expired-token case. Retrying is bounded by the ladder's top rung rather than special-cased:
      // `auth-expired.interceptor.ts` signs the session out on the next ordinary request, and the shell's teardown
      // stops this.
      this.reconnect(controller);
      return;
    }

    // Connected. The ladder resets here rather than on the first frame, because a frame may be half an hour away —
    // and this one line is also the whole of "the thirty-minute close is not a failure": a close can only follow a
    // connection that worked, so the ladder is always back at its first rung by the time one arrives. Deleting it
    // makes a long-lived tab reconnect later and later for ever, having never had anything go wrong. See reconnect().
    this.rung = 0;
    // The stream does not replay, so this is what guarantees a change made while this client was disconnected is not
    // missed. See the class javadoc.
    this.context.reload();
    await this.read(response.body.getReader(), controller);
  }

  /**
   * Reads the body until it ends, breaks, or goes quiet, and frames what arrives.
   *
   * <p>Chunk boundaries are not frame boundaries: a block can arrive split across two reads, and two blocks can
   * arrive in one. The partial tail is kept in `buffer` and completed by the next chunk. `TextDecoder` is given
   * `{ stream: true }` for the same reason one level down — a multi-byte character can straddle a chunk.</p>
   */
  private async read(reader: ReadableStreamDefaultReader<Uint8Array>, controller: AbortController): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';
    this.armSilenceWatchdog(controller);

    for (;;) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch {
        // The connection broke, or the watchdog aborted it, or stop() did. The guard in reconnect() drops the last
        // case; the other two are the same thing to this client.
        this.reconnect(controller);
        return;
      }

      if (chunk.done) {
        // The server completed the stream — the thirty-minute maximum age, or a restart. See reconnect().
        this.reconnect(controller);
        return;
      }

      // Any bytes at all count as alive — a keep-alive comment is exactly as good as a frame, which is the point of
      // sending one.
      this.armSilenceWatchdog(controller);
      buffer += decoder.decode(chunk.value, { stream: true });
      const blocks = buffer.split(BLOCK_BOUNDARY);
      // The last piece is whatever follows the final blank line: either empty, or a block still arriving.
      buffer = blocks.pop() ?? '';
      blocks.forEach(block => this.dispatch(block));
    }
  }

  /**
   * Acts on one complete SSE block.
   *
   * <p><b>A block carrying only comments is the ordinary case here, not an edge case.</b> The first block of every
   * stream is `:connected` and every idle 25 seconds produces `:keep-alive`; a reader that assumes a block has a
   * `data:` line fails on the first thing the server ever sends it.</p>
   *
   * <p>Only the `event:` field is read. `data:` is deliberately never parsed — see the class javadoc — and an event
   * this client does not recognise is ignored rather than treated as a change, so a second kind of push (which the
   * api's frame is typed to allow) cannot make the portal re-fetch on something that has nothing to do with it.</p>
   */
  private dispatch(block: string): void {
    let name = '';
    for (const line of block.split(LINE_BOUNDARY)) {
      if (line === '' || line.startsWith(':')) {
        continue;
      }
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      if (field === 'event') {
        // One optional space after the colon belongs to the framing rather than to the value.
        name = (colon === -1 ? '' : line.slice(colon + 1)).replace(/^ /, '');
      }
    }
    if (name === MEMBERSHIP_CHANGED_EVENT) {
      this.context.reload();
    }
  }

  /**
   * Schedules the next attempt, or does nothing if this connection has already been superseded or stopped.
   *
   * <h3>Why the server's own close and a broken connection come here by the same door</h3>
   *
   * <p>They are told apart, and the place that tells them apart is {@link connect}, which resets the ladder the
   * moment a connection succeeds. The api completes every stream at thirty minutes deliberately, to bound the
   * visibility it froze at connect — so an end of body always follows a connection that worked, the ladder is
   * therefore already back at its first rung when it arrives, and a long-lived tab reconnects in a second however
   * many times it renews. A stream that never connected cannot end; it can only fail.</p>
   *
   * <p><b>This method had a `reason` parameter that reset the ladder for a close, and mutation showed it changed
   * nothing.</b> With escalation made unconditional — the exact defect the parameter existed to prevent — all sixteen
   * tests stayed green, because every close in a real sequence is followed by a connect that resets the ladder
   * anyway. It was a second filter expressing a rule enforced one method away, and its cost was that it made the
   * real guard look tested when it was not. Deleting `this.rung = 0` from {@link connect} now reddens
   * <i>"treats the thirty-minute server close as normal and does not escalate"</i>, which is the whole point.</p>
   *
   * <p>A close still waits the first rung rather than reconnecting instantly. One second is invisible half an hour
   * in, and it is what bounds a server that is completing streams as fast as it opens them — a restart does exactly
   * that, and an instant reconnect would answer it with a request per round trip.</p>
   */
  private reconnect(controller: AbortController): void {
    if (!this.running || this.controller !== controller) {
      return;
    }
    this.clearSilenceWatchdog();
    this.controller = null;

    const delayMs = RECONNECT_DELAYS_MS[this.rung];
    this.rung = Math.min(this.rung + 1, RECONNECT_DELAYS_MS.length - 1);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delayMs);
  }

  /**
   * Restarts the dead-connection timer.
   *
   * <p>Armed before the first read rather than after it, so a response whose headers arrived and whose body never
   * does is caught too — which is the shape the endpoint this replaced had, and the shape item 63 fixed.</p>
   */
  private armSilenceWatchdog(controller: AbortController): void {
    this.clearSilenceWatchdog();
    this.silenceTimer = setTimeout(() => {
      this.silenceTimer = null;
      // Aborting rejects the pending read, so the failure path is the one the loop already has rather than a second
      // one written here. Silence is a failure and escalates, unlike a close.
      controller.abort();
    }, SILENCE_TIMEOUT_MS);
  }

  private clearSilenceWatchdog(): void {
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}
