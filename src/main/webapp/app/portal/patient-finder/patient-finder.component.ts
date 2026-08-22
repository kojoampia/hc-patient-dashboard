import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { ActingAsService } from 'app/core/auth/acting-as.service';
import { IProfile } from 'app/entities/patientMS/profile/profile.model';
import { ProfileService } from 'app/entities/patientMS/profile/service/profile.service';

import { formatAddress } from '../data/portal-format';

/**
 * How many profiles are fetched.
 *
 * <p>There is no search endpoint — {@code GET /api/profiles} takes paging and sorting and nothing else — so the
 * filtering below is done in the browser over what this fetches. That is honest for a subsystem of this size and
 * dishonest past it: the count is shown, and once it is reached the screen says so rather than presenting a filtered
 * view of an arbitrary page as though it were a search of everybody.</p>
 */
const FETCH_LIMIT = 500;

/** The three states this screen can be in. `failed` matters: an empty table is not the same as a failed fetch. */
type FinderState = 'loading' | 'ready' | 'failed';

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
 *
 * <p>So the banner is not decoration. Everything behind it belongs to somebody else, and the failure it exists to
 * prevent is reading a blood group believing it is the right patient's.</p>
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

  /** True once the fetch came back full, so the list may not be everybody. */
  readonly truncated = computed(() => this.profiles().length >= FETCH_LIMIT);

  readonly matches = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.profiles();
    }
    return this.profiles().filter(profile => this.haystack(profile).includes(term));
  });

  readonly formatAddress = formatAddress;

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.profileService.query({ size: FETCH_LIMIT, sort: ['lastName,asc'] }).subscribe({
      next: (response: HttpResponse<IProfile[]>) => {
        this.profiles.set(response.body ?? []);
        this.state.set('ready');
      },
      // Deliberately not an empty list. "No patients exist" and "the request failed" look identical in a table and
      // mean opposite things — one is a system with no data, the other is an administrator who cannot see the data
      // that is there.
      error: () => this.state.set('failed'),
    });
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
    return name || profile.email || profile.patientId || profile.id;
  }

  /** Everything a person might type into the box: who they are, how they are contacted, how they are keyed. */
  private haystack(profile: IProfile): string {
    return [profile.firstName, profile.middleNames, profile.lastName, profile.email, profile.mobilePhone, profile.patientId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
}

export default PatientFinderComponent;
