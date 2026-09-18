import { TestBed } from '@angular/core/testing';

import { StateStorageService } from 'app/core/auth/state-storage.service';
import { PatientContextService } from './patient-context.service';
import { MEMBERSHIP_CHANGED_EVENT, MembershipStreamService, SERVER_HEARTBEAT_MS, SILENCE_TIMEOUT_MS } from './membership-stream.service';

const encoder = new TextEncoder();

/**
 * Exactly what the api flushes as the stream opens, byte for byte.
 *
 * <p>Read off the wire on 2026-09-18 against the quality stack through both nginx hops — `:connected\n\n` then
 * `:keep-alive\n\n`, LF only, no space after the colon. It is written out here rather than built from the constants
 * because the point of these tests is that the client survives what the server actually sends.</p>
 */
const CONNECTED_COMMENT = ':connected\n\n';
const KEEP_ALIVE_COMMENT = ':keep-alive\n\n';

/** A membership frame in the shape `MembershipStreamRegistry.deliver` builds: an id, a name, and JSON data. */
const membershipFrame = (membershipId = 'm1', status = 'ACTIVE'): string =>
  `id:e-${membershipId}\nevent:${MEMBERSHIP_CHANGED_EVENT}\n` +
  `data:{"eventId":"e-${membershipId}","type":"${MEMBERSHIP_CHANGED_EVENT}","patientId":"p1",` +
  `"membershipId":"${membershipId}","status":"${status}"}\n\n`;

/**
 * One response body, standing in for a connected server.
 *
 * <p>Deliberately not a real `ReadableStream`: what these tests need is the four things a server can do to a
 * connected client — write, go quiet, end the stream cleanly, and break — each as a method a test can call at a
 * moment of its choosing. jsdom has no `fetch` and no body to borrow either way.</p>
 */
class FakeBody {
  private waiting: { resolve: (result: ReadableStreamReadResult<Uint8Array>) => void; reject: (error: unknown) => void } | null = null;

  private readonly queued: ReadableStreamReadResult<Uint8Array>[] = [];

  /** True once the client aborted the request, which is what teardown and the silence watchdog both do. */
  cancelled = false;

  constructor(signal: AbortSignal) {
    // A real abort errors the body stream, so whatever read() is outstanding rejects. Anything less and teardown
    // would look like it worked while the loop sat waiting for ever.
    signal.addEventListener('abort', () => {
      this.cancelled = true;
      this.fail(new Error('aborted'));
    });
  }

  getReader(): ReadableStreamDefaultReader<Uint8Array> {
    return {
      read: (): Promise<ReadableStreamReadResult<Uint8Array>> =>
        new Promise<ReadableStreamReadResult<Uint8Array>>((resolve, reject) => {
          const next = this.queued.shift();
          if (next) {
            resolve(next);
            return;
          }
          this.waiting = { resolve, reject };
        }),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
  }

  /** The server writes bytes — a whole block, or any fragment of one. */
  writes(text: string): void {
    this.deliver({ done: false, value: encoder.encode(text) });
  }

  /** The server completes the stream. This is what the thirty-minute maximum age does, and it is not an error. */
  ends(): void {
    this.deliver({ done: true, value: undefined } as ReadableStreamReadResult<Uint8Array>);
  }

  /** The connection breaks under the client. */
  breaks(): void {
    this.fail(new Error('network'));
  }

  private deliver(result: ReadableStreamReadResult<Uint8Array>): void {
    const waiting = this.waiting;
    this.waiting = null;
    if (waiting) {
      waiting.resolve(result);
      return;
    }
    this.queued.push(result);
  }

  private fail(error: Error): void {
    const waiting = this.waiting;
    this.waiting = null;
    waiting?.reject(error);
  }
}

/**
 * Lets every pending promise continuation run.
 *
 * <p><b>Jest's fake timers rather than Angular's `fakeAsync`, and that is not a preference.</b> `tsconfig.json`
 * targets `es2022`, so `async`/`await` compiles to a native async function — and zone.js cannot follow a native
 * `await`. Under `fakeAsync` the continuation after `await fetch(...)` never runs at all inside the synchronous test
 * body, so the stream never appears to connect and every assertion about it is vacuous. Measured: the first draft of
 * this suite failed 9 of 16 that way.</p>
 */
const settle = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};

/** Moves the fake clock, then lets whatever that started finish. */
const advance = async (ms: number): Promise<void> => {
  await jest.advanceTimersByTimeAsync(ms);
  await settle();
};

describe('MembershipStreamService', () => {
  let service: MembershipStreamService;
  let reload: jest.Mock;
  let fetchMock: jest.Mock;
  let opened: FakeBody[];
  /** What the next fetch answers with. Changed by the tests that are about a connection not being made. */
  let answers: 'stream' | 'refused' | 'unreachable';
  let token: string | null;
  const originalFetch = globalThis.fetch;

  /** The connection the client is on now. */
  const latest = (): FakeBody => opened[opened.length - 1];

  beforeEach(() => {
    // Every wait in this service is a setTimeout, so the clock is the only thing a test has to move.
    jest.useFakeTimers();
    opened = [];
    answers = 'stream';
    token = 'a.jwt.value';
    reload = jest.fn();

    fetchMock = jest.fn((_url: string, init: { signal: AbortSignal }) => {
      if (answers === 'unreachable') {
        return Promise.reject(new Error('offline'));
      }
      if (answers === 'refused') {
        return Promise.resolve({ ok: false, status: 503, body: null });
      }
      const body = new FakeBody(init.signal);
      opened.push(body);
      return Promise.resolve({ ok: true, status: 200, body });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    TestBed.configureTestingModule({
      providers: [
        { provide: PatientContextService, useValue: { reload } },
        { provide: StateStorageService, useValue: { getAuthenticationToken: () => token } },
      ],
    });
    service = TestBed.inject(MembershipStreamService);
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it('opens the stream through the gateway route, with the token in the header and nowhere else', async () => {
    service.start();
    await settle();

    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    // Built through ApplicationConfigService, so the gateway's routing applies. A hardcoded service path is a
    // workspace-wide rule violation rather than a style preference.
    expect(url).toBe('services/hcpatientservice/api/membership-events');
    expect(init.headers.Authorization).toBe('Bearer a.jwt.value');
    // The whole reason EventSource was ruled out: a token in the query string is a JWT carrying patient scope
    // written into nginx access logs, browser history and every proxy in between.
    expect(url).not.toContain('a.jwt.value');

    service.stop();
  });

  it('survives the comment-only block the stream opens with, and reads the frame after it', async () => {
    service.start();
    await settle();
    reload.mockClear();

    // The FIRST thing this client ever receives. A reader that treats the first blank-line-delimited block as an
    // event and parses its `data:` breaks here, on byte one, before any membership has changed.
    latest().writes(CONNECTED_COMMENT);
    await settle();

    // A comment is not a change.
    expect(reload).not.toHaveBeenCalled();
    // And it is not a failure either: nothing reconnected.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The half that a comment-swallowing bug cannot fake — the reader is still working afterwards.
    latest().writes(membershipFrame());
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('ignores the keep-alive comment the same way', async () => {
    service.start();
    await settle();
    reload.mockClear();

    latest().writes(CONNECTED_COMMENT + KEEP_ALIVE_COMMENT);
    await settle();

    expect(reload).not.toHaveBeenCalled();

    // Asserted after the negative, because "nothing reloaded" is also what a reader that died on the first comment
    // looks like. Measured: with comment handling broken this test stayed GREEN without these two lines.
    latest().writes(membershipFrame());
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('re-fetches on connect, because the stream does not replay', async () => {
    service.start();
    await settle();

    // A client that was disconnected while an administrator verified the plan would otherwise never learn of it —
    // which is item 39's own defect, reintroduced through a dropped connection.
    expect(reload).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('re-fetches exactly once for a membership frame', async () => {
    service.start();
    await settle();
    reload.mockClear();

    latest().writes(membershipFrame());
    await settle();

    expect(reload).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('frames a block that arrives split across two reads', async () => {
    service.start();
    await settle();
    reload.mockClear();

    const frame = membershipFrame();
    latest().writes(frame.slice(0, 20));
    await settle();
    // Nothing yet: a chunk boundary is not a frame boundary, and acting on half a block is how a client invents an
    // event the server never sent.
    expect(reload).not.toHaveBeenCalled();

    latest().writes(frame.slice(20));
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('ignores an event type it does not know', async () => {
    service.start();
    await settle();
    reload.mockClear();

    // The api's frame is typed so a second kind of push can share this topic. Re-fetching memberships because
    // something else happened would be acting on a message addressed to somebody else.
    latest().writes('id:x\nevent:SomethingElse\ndata:{"x":1}\n\n');
    await settle();

    expect(reload).not.toHaveBeenCalled();

    // The same strengthening the two comment tests carry, and for the same reason: "nothing reloaded" is also what a
    // client that died on the unknown event looks like, so the negative alone would stay green while the stream was
    // gone. Asserting the reader still works afterwards is what tells "ignored" from "killed".
    latest().writes(membershipFrame());
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('reconnects when acting on a frame throws, instead of dying where nothing can see it', async () => {
    service.start();
    await settle();
    const abandoned = latest();

    // reload() reaches every subscriber of the portal's shared pipelines, so a synchronous throw out of one of them
    // arrives exactly here. Without a catch it rejects the read loop, propagates through connect(), and is lost in
    // `void this.connect()`: no reconnect, `running` still true, and the watchdog firing once into a void a minute
    // later. The stream would be dead for the life of the tab with nothing surfaced.
    reload.mockImplementationOnce(() => {
      throw new Error('a subscriber blew up');
    });
    abandoned.writes(membershipFrame());
    await settle();

    // The connection it walked away from is closed rather than left open beside the new one.
    expect(abandoned.cancelled).toBe(true);

    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // One on the first connect, one that threw, one on the reconnect — so the change whose handling threw is picked
    // up anyway rather than lost with the connection.
    expect(reload).toHaveBeenCalledTimes(3);

    service.stop();
  });

  it('treats the thirty-minute server close as normal and does not escalate', async () => {
    service.start();
    await settle();
    latest().writes(CONNECTED_COMMENT);
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // What the api does at thirty minutes to bound the visibility PatientScope froze at connect: complete(), not
    // completeWithError(). A client that read this as a failure would climb the ladder on every long-lived tab.
    latest().ends();
    await advance(999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Three closes in a row, each answered at the same first rung. An escalating client would be at 2s and then 5s.
    latest().ends();
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    latest().ends();
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    // And each reconnect re-fetches, which is what stops a patient missing an activation that happened while the
    // stream was being renewed.
    expect(reload).toHaveBeenCalledTimes(4);

    service.stop();
  });

  it('backs off further each time the connection fails', async () => {
    answers = 'unreachable';

    service.start();
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();

    // 1s, 2s, 5s, 15s, 30s — and the last rung repeats rather than growing without bound.
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await advance(2000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    await advance(15000);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    await advance(30000);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    await advance(30000);
    expect(fetchMock).toHaveBeenCalledTimes(7);

    service.stop();
  });

  it('starts the ladder again once a connection succeeds', async () => {
    answers = 'unreachable';
    service.start();
    await settle();
    await advance(1000);
    await advance(2000);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    answers = 'stream';
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    // A stream that breaks after a good connection waits one second, not the five the previous failures had reached.
    latest().breaks();
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(5);

    service.stop();
  });

  it('reconnects when a refused response comes back instead of a stream', async () => {
    answers = 'refused';
    service.start();
    await settle();

    expect(reload).not.toHaveBeenCalled();
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    service.stop();
  });

  it('gives up on a line that has gone quiet for longer than two heartbeats', async () => {
    // The only liveness signal there is. A connection dropped by a proxy or by a sleeping laptop produces no event a
    // browser can see; it simply stops arriving.
    expect(SILENCE_TIMEOUT_MS).toBeGreaterThan(SERVER_HEARTBEAT_MS * 2);

    service.start();
    await settle();
    latest().writes(CONNECTED_COMMENT);
    await settle();
    const abandoned = latest();

    await advance(SILENCE_TIMEOUT_MS - 1);
    // One lost beat is not evidence of anything.
    expect(abandoned.cancelled).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(abandoned.cancelled).toBe(true);
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    service.stop();
  });

  it('counts a keep-alive as proof the line is alive', async () => {
    service.start();
    await settle();

    await advance(SERVER_HEARTBEAT_MS);
    latest().writes(KEEP_ALIVE_COMMENT);
    await settle();

    await advance(SILENCE_TIMEOUT_MS - 1);
    // The beat pushed the deadline out. Without that, an idle stream — which is the ordinary state of this one,
    // since a membership can sit PENDING for as long as the back office takes — would be torn down every minute.
    expect(latest().cancelled).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('stops the reader and everything pending when the portal is torn down', async () => {
    service.start();
    await settle();
    const body = latest();
    reload.mockClear();

    service.stop();
    await settle();

    // The connection is actually closed, not merely forgotten. A forgotten reader holds a connection to the gateway
    // open for the life of the tab and goes on reloading a service every screen shares.
    expect(body.cancelled).toBe(true);

    // Nothing rescheduled itself, and a late frame on the old connection reaches nobody.
    body.writes(membershipFrame());
    await advance(60_000);
    expect(reload).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('opens one stream however often it is started', async () => {
    service.start();
    service.start();
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it('does not connect at all without a token', async () => {
    token = null;

    service.start();
    await advance(60_000);

    // Signed out. There is nothing to listen to, and retrying would be a request per rung for as long as the tab
    // stayed open.
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
