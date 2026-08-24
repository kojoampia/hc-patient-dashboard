import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { ActingAsService } from 'app/core/auth/acting-as.service';
import { IProfile } from 'app/entities/patientMS/profile/profile.model';
import { ProfileService } from 'app/entities/patientMS/profile/service/profile.service';

import { formatAddress } from '../data/portal-format';

/** How many rows one search returns. A page, not a roster — the count below says how many there are in total. */
const PAGE_SIZE = 50;

/**
 * How long to wait after the last keystroke.
 *
 * <p>Long enough that typing a name is one request rather than eight, short enough not to feel like lag. The
 * in-flight request is cancelled rather than merely ignored, so this is about load rather than correctness.</p>
 */
const DEBOUNCE_MS = 250;

/** The three states this screen can be in. `failed` matters: an empty table is not the same as a failed fetch. */
type FinderState = 'loading' | 'ready' | 'failed';

interface SearchResult {
  readonly profiles: readonly IProfile[];
  /** How many matched in total, which is usually more than were returned. */
  readonly total: number;
}

/**
 * Find a patient, and open their record.
 *
 * <h2>Why this exists</h2>
 *
 * <p>An administrator has no {@code Profile} and never will, so the portal has nothing of their own to show them —
 * they land on an overview whose every panel is empty. But they can read every patient, so the useful thing to put
 * on that screen is the way to reach one.</p>
 *
 * <h2>What "act as" means here, and what it does not</h2>
 *
 * <p>It records which record is on screen. It grants nothing: the authority is the role, the backend re-reads it on
 * every request, and an administrator could already read any of these patients. What the selection does is
 * <em>narrow</em> — {@code PatientScope} confines a caller who names a patient to that patient — which is what makes
 * the portal show one record rather than every patient's records under one person's name.</p>
 */
@Component({
  selector: 'hpd-patient-finder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, FormsModule, IconComponent, PanelComponent, EmptyStateComponent],
  templateUrl: './patient-finder.component.html',
})
export class PatientFinderComponent {
  private readonly profileService = inject(ProfileService);
  private readonly actingAsService = inject(ActingAsService);

  readonly state = signal<FinderState>('loading');
  readonly search = signal('');
  readonly profiles = signal<readonly IProfile[]>([]);
  /** How many patients matched, as opposed to how many are on screen. */
  readonly total = signal(0);

  /** True when the server has more matches than this page shows. */
  readonly moreThanShown = computed(() => this.total() > this.profiles().length);

  readonly formatAddress = formatAddress;

  constructor() {
    toObservable(this.search)
      .pipe(
        map(term => term.trim()),
        debounceTime(DEBOUNCE_MS),
        distinctUntilChanged(),
        // No startWith: toObservable emits the signal's current value on subscribe, so the empty term already
        // fetches the opening list. Adding one sent the first request twice.
        tap(() => this.state.set('loading')),
        // switchMap and not mergeMap: the request for "ko" must not be able to land after the request for "kojo"
        // and repaint the older answer under the newer term. That race is invisible on a fast network and routine
        // on a slow one, and it shows one patient's row while the box says another patient's name.
        switchMap(term => this.fetch(term)),
        takeUntilDestroyed(),
      )
      .subscribe(result => {
        if (result === null) {
          this.state.set('failed');
          return;
        }
        this.profiles.set(result.profiles);
        this.total.set(result.total);
        this.state.set('ready');
      });
  }

  /** Re-runs the current search. Bound to the retry button on the failed state. */
  retry(): void {
    // Nudging the signal re-enters the pipeline above; distinctUntilChanged would swallow setting it to itself.
    const term = this.search();
    this.search.set(term === '' ? ' ' : '');
    this.search.set(term);
  }

  /**
   * Opens a patient's record.
   *
   * <p>Keyed by {@code patientId}, falling back to {@code id} — the identifier the collections are keyed by was added
   * after some profiles were written, and the backend resolves identity with the same fallback. Sending the wrong one
   * would scope every subsequent request to a patient with no records and look like an empty chart.</p>
   */
  open(profile: IProfile): void {
    this.actingAsService.open({
      patientId: profile.patientId ?? profile.id,
      name: this.nameOf(profile),
      own: false,
    });
  }

  nameOf(profile: IProfile): string {
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    // Never the raw id as a last resort: a row saying "664f…" is not a person, and the email is the one field the
    // record is looked up by, so it is always the more useful of the two.
    // `||` and not `??`: a profile with an empty name must fall through to the email, and `??` would
    // stop at the empty string and label the row with nothing at all.
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return name || profile.email || profile.patientId || profile.id;
  }

  /** Null means the request failed, which is not the same answer as nobody matched. */
  private fetch(term: string): Observable<SearchResult | null> {
    const query: Record<string, unknown> = { size: PAGE_SIZE, sort: ['lastName,asc'] };
    if (term) {
      query['search'] = term;
    }
    return this.profileService.query(query).pipe(
      map((response: HttpResponse<IProfile[]>) => {
        const profiles = response.body ?? [];
        // X-Total-Count is what the pagination headers call it. Falling back to the page length rather than to zero:
        // a missing header should read as "this is all of them", not as "there are none", which would put a
        // "showing 50 of 0" under a full table.
        const total = Number(response.headers.get('X-Total-Count') ?? profiles.length);
        return { profiles, total: Number.isFinite(total) ? total : profiles.length };
      }),
      // Deliberately not an empty list. "No patients matched" and "the request failed" look identical in a table and
      // mean opposite things — one is an answer, the other is an administrator who cannot see the data that is there.
      catchError(() => of(null)),
    );
  }
}

export default PatientFinderComponent;
