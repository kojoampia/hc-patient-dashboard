import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';

import { PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { formatDay, humanise } from '../data/portal-format';

type ProfileTab = 'about' | 'contact' | 'membership' | 'careTeam';

/** The tabs, in order. Kept as data so the template does not repeat the list twice. */
const TABS: readonly { readonly id: ProfileTab; readonly labelKey: string }[] = [
  { id: 'about', labelKey: 'patientPortal.profile.tab.about' },
  { id: 'contact', labelKey: 'patientPortal.profile.tab.contact' },
  { id: 'membership', labelKey: 'patientPortal.profile.tab.membership' },
  { id: 'careTeam', labelKey: 'patientPortal.profile.tab.careTeam' },
];

/** Who the patient is, how to reach them, what plan they are on, and who looks after them. */
@Component({
  selector: 'hpd-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent],
  templateUrl: './profile.component.html',
})
export default class ProfileComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);
  private readonly memberships = toSignal(this.data.memberships$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly humanise = humanise;
  readonly tabs = TABS;

  readonly activeTab = signal<ProfileTab>('about');

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
  readonly membership = computed(() => {
    const all = this.memberships();
    return all.find(item => item.status?.toUpperCase() === 'ACTIVE') ?? all.at(0) ?? null;
  });
}
