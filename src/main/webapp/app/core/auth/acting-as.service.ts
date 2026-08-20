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
  private readonly choices = signal<readonly ActingAsChoice[]>([]);
  private readonly selectedId = signal<string | null>(this.restore());
  /** Bumped by every mutator below, so {@link current$} can re-read without duplicating the state. */
  private readonly changed$ = new BehaviorSubject<void>(undefined);

  /** Everything the signed-in person may open: their own record, plus each patient they act for. */
  readonly available = this.choices.asReadonly();

  readonly current = computed<ActingAsChoice | null>(() => {
    const id = this.selectedId();
    const all = this.choices();
    return all.find(choice => choice.patientId === id) ?? null;
  });

  /** True when the open record is not the signed-in person's own. Drives the banner. */
  readonly actingForSomeoneElse = computed(() => {
    const choice = this.current();
    return !!choice && !choice.own;
  });

  /** Whether a choice is even needed. One option is not a decision. */
  readonly mustChoose = computed(() => this.choices().length > 1 && this.current() === null);

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
    this.choices.set(choices);
    const remembered = this.selectedId();
    if (remembered && choices.some(choice => choice.patientId === remembered)) {
      return;
    }
    // A delegation the person no longer holds must not survive in local storage as a selection.
    this.selectedId.set(null);
    if (choices.length === 1) {
      this.select(choices[0].patientId);
      return;
    }
    this.changed$.next();
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
    this.choices.set([]);
    this.selectedId.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    this.changed$.next();
  }

  private restore(): string | null {
    return sessionStorage.getItem(STORAGE_KEY);
  }
}
