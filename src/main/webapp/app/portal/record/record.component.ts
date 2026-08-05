import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { TrendChartComponent } from 'app/shared/ui/charts/trend-chart.component';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { VitalSummary, summariseVitals } from '../data/vitals';
import { byDateDesc, formatDay, humanise } from '../data/portal-format';

/** How many rows the summary panels show before pointing at the full list. */
const PREVIEW = 6;

/**
 * The record: who the patient is, the vitals in detail, and a way into every other list.
 *
 * The selected vital drives the trend chart — one chart shown well beats four shown small.
 */
@Component({
    selector: 'hpd-record',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, PanelComponent, EmptyStateComponent, TrendChartComponent],
    templateUrl: './record.component.html'
})
export default class RecordComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);
  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly stats = toSignal(this.data.vitals$, { initialValue: [] });
  private readonly visitations = toSignal(this.data.visitations$, { initialValue: [] });
  private readonly activity = toSignal(this.data.activity$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly humanise = humanise;

  readonly profile = toSignal(this.context.profile$, { initialValue: null });
  readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] });

  /** Which vital the trend chart is showing; null means "the first one". */
  readonly selectedKey = signal<string | null>(null);

  /** Swaps the chart for the same numbers as a table. */
  readonly showTable = signal(false);

  readonly vitals = computed(() => summariseVitals(this.stats()));

  readonly selected = computed<VitalSummary | null>(() => {
    const all = this.vitals();
    const key = this.selectedKey();
    return all.find(vital => vital.key === key) ?? all.at(0) ?? null;
  });

  readonly fullName = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return '';
    }
    return [profile.firstName, profile.middleNames, profile.lastName].filter(Boolean).join(' ').trim();
  });

  readonly recentVisits = computed(() => [...this.visitations()].sort(byDateDesc(item => item.visitedAt)).slice(0, PREVIEW));

  readonly recentActivity = computed(() =>
    [...this.activity()].sort(byDateDesc(item => item.loggedAt ?? item.createdDate)).slice(0, PREVIEW),
  );

  memberOf(id: string | null | undefined): { name: string; role: string } {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  vitalPill(flag: string): string {
    switch (flag) {
      case 'DANGER':
        return 'hc-pill--danger';
      case 'WARN':
        return 'hc-pill--warn';
      default:
        return 'hc-pill--ok';
    }
  }
}
