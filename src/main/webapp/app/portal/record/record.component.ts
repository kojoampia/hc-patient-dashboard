import { ChangeDetectionStrategy, Component, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { TrendChartComponent } from 'app/shared/ui/charts/trend-chart.component';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { StatusLabelPipe } from '../data/status-label.pipe';
import { PortalDataService } from '../data/portal-data.service';
import { VitalSummary, summariseVitals } from '../data/vitals';
import { byDateDesc, formatDay, formatInstantDay, pageCount, pageOf } from '../data/portal-format';

/**
 * Rows a record panel shows at once.
 *
 * Three, as the demo pages its record panels — and the reason the panels page at all rather than
 * previewing the newest few: with five collections side by side, a preview that cuts off at six
 * leaves the patient no way to reach the seventh except by opening another screen.
 */
const PANEL_PAGE = 3;

/** A record panel's list: the page you are on, the rows to draw, and how many pages there are. */
interface PanelList<T> {
  readonly page: WritableSignal<number>;
  readonly rows: Signal<readonly T[]>;
  readonly totalPages: Signal<number>;
}

/**
 * Wraps a sorted collection as a paginated panel.
 *
 * Five panels each needing a page number, a slice and a page count is fifteen fields written the
 * same way; this is those three, once.
 */
function paged<T>(all: Signal<readonly T[]>): PanelList<T> {
  const page = signal(1);
  return {
    page,
    rows: computed(() => pageOf(all(), page(), PANEL_PAGE)),
    totalPages: computed(() => pageCount(all(), PANEL_PAGE)),
  };
}

/**
 * The record: who the patient is, the vitals in detail, and every other list in reach.
 *
 * The selected vital drives the trend chart — one chart shown well beats four shown small. Below
 * it sit the five collections as paginated panels, each with a way into its full screen; the care
 * team closes the page. That arrangement is deliberately not the demo's six equal panels: vitals
 * are what a patient opens this page for, so they stay above the fold and full width.
 */
@Component({
  selector: 'hpd-record',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SharedModule,
    RouterLink,
    IconComponent,
    PanelComponent,
    PagerComponent,
    EmptyStateComponent,
    TrendChartComponent,
    StatusLabelPipe,
  ],
  templateUrl: './record.component.html',
})
export default class RecordComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);
  private readonly translate = inject(TranslateService);
  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly stats = toSignal(this.data.vitals$, { initialValue: [] });
  private readonly cases = toSignal(this.data.cases$, { initialValue: [] });
  private readonly visitations = toSignal(this.data.visitations$, { initialValue: [] });
  private readonly activity = toSignal(this.data.activity$, { initialValue: [] });
  private readonly medications = toSignal(this.data.medications$, { initialValue: [] });
  private readonly reports = toSignal(this.data.reports$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;

  readonly profile = toSignal(this.context.profile$, { initialValue: null });
  readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] });

  /** Which vital the trend chart is showing; null means "the first one". */
  readonly selectedKey = signal<string | null>(null);

  /** Swaps the chart for the same numbers as a table. */
  readonly showTable = signal(false);

  readonly vitals = computed(() => summariseVitals(this.stats()));

  readonly casePanel = paged(computed(() => [...this.cases()].sort(byDateDesc(item => item.openedAt))));
  readonly visitPanel = paged(computed(() => [...this.visitations()].sort(byDateDesc(item => item.visitedAt))));
  readonly activityPanel = paged(computed(() => [...this.activity()].sort(byDateDesc(item => item.loggedAt ?? item.createdDate))));
  readonly medicationPanel = paged(computed(() => [...this.medications()].sort(byDateDesc(item => item.startedOn ?? item.createdDate))));
  readonly reportPanel = paged(computed(() => [...this.reports()].sort(byDateDesc(item => item.reportDate ?? item.createdDate))));

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

  memberOf(id: string | null | undefined): CareTeamMember {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  /** Entries the patient wrote themselves are attributed to them, not to a clinician. */
  authorName(item: { source?: string | null; authorId?: string | null }): string {
    return PatientContextService.authorNameOf(this.careTeamById(), item);
  }

  /**
   * The route to a case, or null for a record that does not belong to one.
   *
   * Given straight to `[routerLink]`, which renders no `href` at all for null — so a row with no
   * case to open is not a link, rather than a link that goes nowhere.
   */
  caseLink(caseId: string | null | undefined): string[] | null {
    return caseId ? ['/case', caseId] : null;
  }

  /**
   * Who took the reading the chart is showing. The same rule the overview's detail view uses — a
   * reading the patient took themselves is theirs, and one the record does not attribute is the
   * care team's rather than a name that was never written down.
   */
  recorderOf(vital: VitalSummary): string {
    if (vital.source === 'PATIENT') {
      return this.translate.instant('patientPortal.overview.recordedByYou') as string;
    }
    return this.memberOf(vital.recordedById).name;
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

  print(): void {
    window.print();
  }
}
