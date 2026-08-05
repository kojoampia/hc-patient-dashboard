import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { formatDay, humanise } from '../data/portal-format';

/** Order of severity, worst first — this is a safety list, not an alphabetical one. */
const SEVERITY_RANK: Readonly<Record<string, number | undefined>> = { SEVERE: 0, MODERATE: 1, MILD: 2 };

/**
 * Allergies and long-standing conditions.
 *
 * Deliberately unpaginated and unfiltered: this is the screen someone opens in a hurry to check
 * whether a drug is safe, and a hidden row is a clinical risk.
 */
@Component({
    selector: 'hpd-allergies',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, IconComponent, PanelComponent, EmptyStateComponent],
    templateUrl: './allergies.component.html'
})
export default class AllergiesComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly rawAllergies = toSignal(this.data.allergies$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly humanise = humanise;

  readonly allergies = computed(() =>
    [...this.rawAllergies()].sort((a, b) => (SEVERITY_RANK[a.severity ?? ''] ?? 3) - (SEVERITY_RANK[b.severity ?? ''] ?? 3)),
  );

  readonly conditions = toSignal(this.data.conditions$, { initialValue: [] });

  memberOf(id: string | null | undefined): { name: string; role: string } {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  pill(severity: string | null | undefined): string {
    switch (severity) {
      case 'SEVERE':
        return 'hc-pill--danger';
      case 'MODERATE':
        return 'hc-pill--warn';
      default:
        return 'hc-pill--grey';
    }
  }
}
