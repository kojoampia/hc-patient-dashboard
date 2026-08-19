import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AvatarComponent } from 'app/shared/ui/avatar/avatar.component';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';

import { PatientContextService } from '../data/patient-context.service';
import { StatusLabelPipe } from '../data/status-label.pipe';
import { PortalDataService } from '../data/portal-data.service';
import { formatAddress, formatDay } from '../data/portal-format';
import { CareDelegation, CareDelegationService } from '../data/care-delegation.service';

type ProfileTab = 'about' | 'contact' | 'careAngel' | 'membership' | 'careTeam';

/** The tabs, in order. Kept as data so the template does not repeat the list twice. */
const TABS: readonly { readonly id: ProfileTab; readonly labelKey: string }[] = [
  { id: 'about', labelKey: 'patientPortal.profile.tab.about' },
  { id: 'contact', labelKey: 'patientPortal.profile.tab.contact' },
  { id: 'careAngel', labelKey: 'patientPortal.profile.tab.careAngel' },
  { id: 'membership', labelKey: 'patientPortal.profile.tab.membership' },
  { id: 'careTeam', labelKey: 'patientPortal.profile.tab.careTeam' },
];

/** Who the patient is, how to reach them, what plan they are on, and who looks after them. */
@Component({
  selector: 'hpd-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent, AvatarComponent, StatusLabelPipe],
  templateUrl: './profile.component.html',
})
export default class ProfileComponent {
  private readonly context = inject(PatientContextService);
  private readonly careDelegationService = inject(CareDelegationService);
  private readonly data = inject(PortalDataService);
  private readonly memberships = toSignal(this.data.memberships$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly formatAddress = formatAddress;
  readonly tabs = TABS;

  readonly activeTab = signal<ProfileTab>('about');

  /** Bumped after a revocation so the list re-reads rather than showing what was true a moment ago. */
  private readonly delegationRefresh = signal(0);
  readonly busy = signal(false);
  readonly delegationError = signal<string | null>(null);

  /**
   * Every delegation over this patient's record, in any state.
   *
   * <p>Deliberately not just the active one. A patient needs to see that a nomination is still waiting — that is the
   * difference between "nobody accepted yet" and "nothing was ever sent", and only one of those is worth chasing —
   * and to see a standby they consented to, which grants nothing today but would matter a great deal on the day it is
   * activated.</p>
   */
  readonly delegations = toSignal(
    toObservable(this.delegationRefresh).pipe(switchMap(() => this.careDelegationService.forCurrentPatient())),
    { initialValue: [] as readonly CareDelegation[] },
  );

  readonly profile = toSignal(this.context.profile$, { initialValue: null });
  readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] });

  readonly fullName = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return '';
    }
    return [profile.firstName, profile.middleNames, profile.lastName].filter(Boolean).join(' ').trim();
  });

  readonly initials = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return '';
    }
    return `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  });

  /** The membership currently in force, preferring an explicitly active one. */
  /**
   * Ends a delegation.
   *
   * <p>The angel is emailed, and the record of who could act and between which dates is kept — revoking sets a status
   * rather than erasing anything. Access stops on their very next request, because the backend re-reads the
   * delegation rather than trusting a token.</p>
   */
  revoke(delegation: CareDelegation): void {
    this.busy.set(true);
    this.delegationError.set(null);
    this.careDelegationService.revoke(delegation.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.delegationRefresh.update(value => value + 1);
        // The profile carries a cached copy of the active angel's name; without this the screen keeps showing
        // somebody who can no longer act.
        this.context.reload();
      },
      error: () => {
        this.busy.set(false);
        this.delegationError.set('patientPortal.profile.careAngel.error.revokeFailed');
      },
    });
  }

  readonly membership = computed(() => {
    const all = this.memberships();
    return all.find(item => item.status?.toUpperCase() === 'ACTIVE') ?? all.at(0) ?? null;
  });
}
