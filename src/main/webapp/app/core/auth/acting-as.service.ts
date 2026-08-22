import { Injectable, computed, signal } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

/** One of the records the signed-in person may open. */
export interface ActingAsChoice {
  readonly patientId: string;
  /** How this record is named in the picker and the banner. */
  readonly name: string;
  /** True when this is the signed-in person's own record rather than one they act for. */
  readonly own: boolean;
}

const STORAGE_KEY = 'hc-acting-as';
/**
 * The record an administrator opened by searching, rather than by holding a delegation.
 *
 * <p>Stored whole rather than by id, and this is not tidiness. The delegation list is refetched on every shell load,
 * so on a reload it is the only thing that would rebuild the choices — and it will never contain a record nobody
 * delegated. Keeping the id alone would restore a selection naming a choice that no longer exists, which reads as
 * "nothing is open" while the id sits in storage: the banner disappears and the header stops being sent, so the
 * portal quietly reverts to showing the administrator's own empty record.</p>
 */
const ADOPTED_KEY = 'hc-acting-as-opened';

/**
 * Which patient's record the portal is currently showing.
 *
 * <p>A care angel signs in as themselves and acts *as* the patient, so that decisions can be made when the patient
 * cannot make them. Everything on screen after that belongs to somebody else, and this service is the single place
 * that knows it.</p>
 *
 * <h2>Why it is a header rather than something in the token</h2>
 *
 * <p>The selection travels as `X-Acting-As` on every request, and the backend re-checks the delegation each time. A
 * token would freeze the delegation at the moment it was minted, so an angel whose access was revoked would keep it
 * until the token expired — with `rememberMe`, days. This costs a header and buys revocation that takes effect on the
 * very next request.</p>
 *
 * <h2>The one rule</h2>
 *
 * <p>The header is set by {@link ActingAsInterceptor} and nowhere else. A screen that built its own request and forgot
 * it would show the wrong patient's record while returning 200 — which is the failure the banner exists to make
 * visible, and the reason the interceptor exists to make it impossible.</p>
 */
@Injectable({ providedIn: 'root' })
export class ActingAsService {
  private readonly delegated = signal<readonly ActingAsChoice[]>([]);
  /** A record opened by searching for it rather than by holding a delegation. See {@link open}. */
  private readonly adopted = signal<ActingAsChoice | null>(this.restoreAdopted());
  private readonly selectedId = signal<string | null>(this.restore());
  /** Bumped by every mutator below, so {@link current$} can re-read without duplicating the state. */
  private readonly changed$ = new BehaviorSubject<void>(undefined);

  /** Everything the signed-in person may open: their own record, each patient they act for, and any they opened. */
  readonly available = computed<readonly ActingAsChoice[]>(() => {
    const delegated = this.delegated();
    const adopted = this.adopted();
    // A delegation for the same patient wins: it carries the name the switcher already showed, and duplicating the
    // row would offer the same record twice.
    if (!adopted || delegated.some(choice => choice.patientId === adopted.patientId)) {
      return delegated;
    }
    return [...delegated, adopted];
  });

  readonly current = computed<ActingAsChoice | null>(() => {
    const id = this.selectedId();
    const all = this.available();
    return all.find(choice => choice.patientId === id) ?? null;
  });

  /** True when the open record is not the signed-in person's own. Drives the banner. */
  readonly actingForSomeoneElse = computed(() => {
    const choice = this.current();
    return !!choice && !choice.own;
  });

  /** Whether a choice is even needed. One option is not a decision. */
  readonly mustChoose = computed(() => this.available().length > 1 && this.current() === null);

  /**
   * The same value as {@link current}, for the data layer, which is RxJS rather than signals.
   *
   * <p>Deliberately not `toObservable(this.current)`. That defers the first emission to the next effect flush, and
   * the subscriber here is the pipeline that decides *whose record the portal is showing* — it must resolve on
   * subscribe, in the same turn, like every other stream feeding a screen. A `BehaviorSubject` bumped by the three
   * mutators gives that; the signal stays the single source of truth and this only says "look again".</p>
   */
  readonly current$: Observable<ActingAsChoice | null> = this.changed$.pipe(
    map(() => this.current()),
    distinctUntilChanged((a, b) => a?.patientId === b?.patientId),
  );

  /**
   * Records what this person may open, and auto-selects when there is nothing to decide.
   *
   * @param choices their own record (if any) and every patient they hold an active delegation for.
   */
  setAvailable(choices: readonly ActingAsChoice[]): void {
    this.delegated.set(choices);
    // Validated against `available`, not against the argument. The shell refetches delegations on every load and an
    // opened record is in neither that response nor this argument, so checking the argument would clear a selection
    // that is perfectly valid — on every reload, for exactly the records this service was extended to hold.
    const all = this.available();
    const remembered = this.selectedId();
    if (remembered && all.some(choice => choice.patientId === remembered)) {
      this.changed$.next();
      return;
    }
    // A delegation the person no longer holds must not survive in local storage as a selection.
    this.selectedId.set(null);
    if (all.length === 1) {
      this.select(all[0].patientId);
      return;
    }
    this.changed$.next();
  }

  /**
   * Opens a record the caller found rather than one they were given.
   *
   * <p>For an administrator, who holds no delegations and so has nothing to switch between. The authority is the
   * role and the backend re-checks it per request exactly as it re-checks a delegation; this only records which
   * record is on screen, and the banner then says so.</p>
   *
   * @param choice the patient to open, named as the banner should name them.
   */
  open(choice: ActingAsChoice): void {
    this.adopted.set(choice);
    sessionStorage.setItem(ADOPTED_KEY, JSON.stringify(choice));
    this.select(choice.patientId);
  }

  select(patientId: string): void {
    this.selectedId.set(patientId);
    // sessionStorage rather than localStorage: a choice about whose medical record is on screen should not outlive
    // the browser session, and certainly should not be waiting for whoever opens this browser next.
    sessionStorage.setItem(STORAGE_KEY, patientId);
    this.changed$.next();
  }

  /** The header value, or null when the portal has nothing to say. */
  header(): string | null {
    return this.current()?.patientId ?? null;
  }

  /** Cleared on sign-out: the next person at this browser must not inherit a selection. */
  clear(): void {
    this.delegated.set([]);
    this.adopted.set(null);
    this.selectedId.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(ADOPTED_KEY);
    this.changed$.next();
  }

  private restore(): string | null {
    return sessionStorage.getItem(STORAGE_KEY);
  }

  private restoreAdopted(): ActingAsChoice | null {
    const stored = sessionStorage.getItem(ADOPTED_KEY);
    if (!stored) {
      return null;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<ActingAsChoice>;
      // Anything in storage is untrusted input by the time it is read back — a half-written value would otherwise
      // become a choice with an undefined patientId, which the interceptor would send as the header.
      return typeof parsed.patientId === 'string' && typeof parsed.name === 'string'
        ? { patientId: parsed.patientId, name: parsed.name, own: false }
        : null;
    } catch {
      return null;
    }
  }
}
