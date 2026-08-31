import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import { AvatarComponent } from 'app/shared/ui/avatar/avatar.component';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { SparklineComponent } from 'app/shared/ui/charts/sparkline.component';
import { TrendChartComponent } from 'app/shared/ui/charts/trend-chart.component';
import { StackBarComponent, StackSegment } from 'app/shared/ui/charts/stack-bar.component';
import { BarChartComponent, BarRow } from 'app/shared/ui/charts/bar-chart.component';
import { ModalComponent } from 'app/shared/ui/modal/modal.component';

import { AccountService } from 'app/core/auth/account.service';
import { ActingAsService } from 'app/core/auth/acting-as.service';
import { Authority } from 'app/config/authority.constants';

import { PatientFinderComponent } from '../patient-finder/patient-finder.component';
import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { StatusLabelPipe } from '../data/status-label.pipe';
import { OVERVIEW_TILE_LINKS } from '../portal-destinations';
import { PortalDataService } from '../data/portal-data.service';
import { VitalSummary, summariseVitals } from '../data/vitals';
import { byDateAsc, byDateDesc, formatDay, formatDayTime, humanise, formatInstantDay, monthlyCounts } from '../data/portal-format';

/** How many rows each summary panel shows before "see all" takes over. */
const PREVIEW = 5;

/**
 * Case statuses in the order the distribution bar reads them: settled first, then what is still
 * being worked on, then what has not been started. Anything the backend adds later is appended
 * rather than dropped.
 */
const STATUS_ORDER = ['CLOSED', 'TREATMENT', 'OPEN', 'URGENT'];

/** The two series the care-team chart plots, as i18n keys. */
const SERIES_KEYS = {
  cases: 'patientPortal.chart.cases',
  visits: 'patientPortal.chart.visits',
};

/** Where the status vocabulary lives — the same keys `hpdStatus` reads for the pills. */
const STATUS_KEY = (status: string): string => `patientPortal.status.${status}`;

/**
 * The landing screen: how the patient is doing right now, and what happens next.
 *
 * Everything here is a summary with a way through to the full list — this screen answers
 * "anything I need to know?", not "show me everything".
 */
@Component({
  selector: 'hpd-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SharedModule,
    RouterLink,
    IconComponent,
    PanelComponent,
    EmptyStateComponent,
    SparklineComponent,
    TrendChartComponent,
    StackBarComponent,
    BarChartComponent,
    AvatarComponent,
    ModalComponent,
    StatusLabelPipe,
    PatientFinderComponent,
  ],
  templateUrl: './overview.component.html',
})
export default class OverviewComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);
  private readonly translate = inject(TranslateService);
  private readonly accountService = inject(AccountService);
  private readonly actingAsService = inject(ActingAsService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly cases = toSignal(this.data.cases$, { initialValue: [] });
  private readonly stats = toSignal(this.data.vitals$, { initialValue: [] });
  private readonly schedules = toSignal(this.data.schedules$, { initialValue: [] });
  private readonly medications = toSignal(this.data.medications$, { initialValue: [] });
  private readonly reports = toSignal(this.data.reports$, { initialValue: [] });
  private readonly emergencies = toSignal(this.data.emergencies$, { initialValue: [] });
  private readonly activity = toSignal(this.data.activity$, { initialValue: [] });
  private readonly allergies = toSignal(this.data.allergies$, { initialValue: [] });
  private readonly carePlan = toSignal(this.data.carePlan$, { initialValue: [] });
  private readonly visitations = toSignal(this.data.visitations$, { initialValue: [] });
  private readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] as readonly CareTeamMember[] });

  /**
   * Whether to offer the patient finder instead of the patient's own summary.
   *
   * <p>An administrator has no {@code Profile}, so every panel below is empty for them and stays empty. The moment
   * they open somebody's record this turns false and the ordinary overview takes over — showing that patient, under
   * the banner that says whose it is.</p>
   *
   * <p>Keyed on there being no record open rather than on the role alone: an administrator who has chosen a patient
   * wants the portal, not the search they have already done.</p>
   */
  readonly showFinder = computed(() => this.accountService.hasAnyAuthority(Authority.ADMIN) && this.actingAsService.current() === null);

  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;
  readonly formatDayTime = formatDayTime;

  readonly profile = toSignal(this.context.profile$, { initialValue: null });

  readonly greetingName = computed(() => this.profile()?.firstName ?? '');

  readonly vitals = computed(() => summariseVitals(this.stats()));

  /** Anything not yet closed is what the patient is currently being seen for. */
  readonly openCases = computed(() => this.cases().filter(item => item.status !== 'CLOSED'));

  readonly tiles = computed(() => [
    { icon: 'case' as const, value: this.openCases().length, labelKey: 'patientPortal.overview.tile.openCases', link: OVERVIEW_TILE_LINKS.openCases },
    { icon: 'cal' as const, value: this.upcoming().length, labelKey: 'patientPortal.overview.tile.upcoming', link: OVERVIEW_TILE_LINKS.upcoming },
    {
      icon: 'pill' as const,
      value: this.medications().filter(m => m.status === 'ACTIVE').length,
      labelKey: 'patientPortal.overview.tile.activeMeds',
      link: OVERVIEW_TILE_LINKS.activeMeds,
    },
    { icon: 'report' as const, value: this.reports().length, labelKey: 'patientPortal.overview.tile.reports', link: OVERVIEW_TILE_LINKS.reports },
  ]);

  /**
   * What is *on* the record, as opposed to what is happening on it.
   *
   * The row above counts activity — what needs attention now. This one counts the standing facts a
   * clinician reads before they do anything: what you are allergic to, what has gone wrong before,
   * what you have agreed to do. The demo leads with these and uses them as navigation, which is why
   * every tile here links somewhere.
   */
  readonly recordTiles = computed(() => [
    {
      icon: 'alert' as const,
      value: this.emergencies().length,
      labelKey: 'patientPortal.overview.tile.emergencies',
      link: OVERVIEW_TILE_LINKS.emergencies,
    },
    { icon: 'shield' as const, value: this.allergies().length, labelKey: 'patientPortal.overview.tile.allergies', link: OVERVIEW_TILE_LINKS.allergies },
    {
      icon: 'leaf' as const,
      value: this.carePlan().filter(item => item.planType === 'DIET').length,
      labelKey: 'patientPortal.overview.tile.diet',
      link: OVERVIEW_TILE_LINKS.diet,
    },
    {
      icon: 'run' as const,
      value: this.carePlan().filter(item => item.planType === 'EXERCISE').length,
      labelKey: 'patientPortal.overview.tile.exercise',
      link: OVERVIEW_TILE_LINKS.exercise,
    },
  ]);

  /**
   * The hero's sentence: the next appointment, and how much is still open.
   *
   * Null when there is nothing ahead — a patient with no appointment gets the plain greeting rather
   * than a sentence with a gap in it.
   */
  readonly heroSummary = computed(() => {
    const next = this.nextAppointments().at(0);
    if (!next) {
      return null;
    }
    return {
      when: formatDayTime(next.scheduledAt ?? next.schedule),
      clinician: PatientContextService.memberOf(this.careTeamById(), next.attendantId).name,
      open: this.openCases().length,
      total: this.cases().length,
    };
  });

  /** Appointments still ahead of us, soonest first. */
  readonly upcoming = computed(() => {
    const now = Date.now();
    return this.schedules()
      .filter(task => task.status !== 'ATTENDED' && task.status !== 'CANCELLED')
      .filter(task => (task.scheduledAt ?? task.schedule)?.valueOf() ?? 0 >= now)
      .sort(byDateAsc(task => task.scheduledAt ?? task.schedule));
  });

  readonly nextAppointments = computed(() => this.upcoming().slice(0, PREVIEW));

  readonly recentActivity = computed(() =>
    [...this.activity()].sort(byDateDesc(entry => entry.loggedAt ?? entry.createdDate)).slice(0, PREVIEW),
  );

  readonly latestEmergency = computed(() => [...this.emergencies()].sort(byDateDesc(item => item.raisedAt))[0] ?? null);

  /**
   * The vital whose detail view is open, or null.
   *
   * The tile shows a sparkline with no numbers on it — a shape, and the latest reading. The
   * detail is where the shape becomes readable: the band it should sit in, the trend at full
   * size, and the readings behind it as a table.
   */
  readonly selectedVital = signal<VitalSummary | null>(null);

  /** The detail view's own chart/table toggle, independent of the three below. */
  readonly showVitalTable = signal(false);

  /**
   * Each "Care at a glance" chart reads its own numbers as a table.
   *
   * One flag per chart rather than one for the section: pressing Table on the distribution because
   * the segments are too small to read should not also flip the two charts either side of it.
   */
  readonly showVisitsTable = signal(false);
  readonly showDistTable = signal(false);
  readonly showTeamTable = signal(false);

  /**
   * The two series the professional chart plots, in the reader's language.
   *
   * Through `stream` rather than `instant` so they follow a language switch: these are read by the
   * chart's table headings and by its accessible summary, neither of which the translate pipe can
   * reach from here.
   */
  readonly seriesNames = toSignal(
    this.translate
      .stream([SERIES_KEYS.cases, SERIES_KEYS.visits])
      .pipe(map((names: Record<string, string>) => [names[SERIES_KEYS.cases], names[SERIES_KEYS.visits]])),
    { initialValue: ['Cases', 'Visits'] },
  );

  /**
   * The case statuses in the reader's language, keyed by enum value.
   *
   * The distribution chart draws its labels itself, so they cannot go through the `hpdStatus`
   * pipe the pills use — this reads the same keys through the same service, and follows a
   * language switch for the same reason `seriesNames` does.
   */
  readonly statusWords = toSignal(
    this.translate
      .stream(STATUS_ORDER.map(STATUS_KEY))
      .pipe(map((words: Record<string, string>) => new Map(STATUS_ORDER.map(status => [status, words[STATUS_KEY(status)]])))),
    { initialValue: new Map<string, string>() },
  );

  /** How many cases the record holds, open or not — the total the distribution divides up. */
  readonly caseTotal = computed(() => this.cases().length);

  /** Visits per month, most recent twelve — the rhythm of the patient's care. */
  readonly visitTrend = computed(() => monthlyCounts(this.visitations().map(visit => visit.visitedAt)));

  /** How the cases stand today, ordered settled-first. */
  readonly caseDistribution = computed<StackSegment[]>(() => {
    const cases = this.cases();
    const statuses = [...new Set([...STATUS_ORDER, ...cases.map(item => item.status ?? 'OPEN')])];
    return statuses
      .map(status => ({
        label: this.statusWords().get(status) ?? humanise(status),
        value: cases.filter(item => (item.status ?? 'OPEN') === status).length,
      }))
      .filter(segment => segment.value > 0);
  });

  /**
   * Cases and visits per member of the care team, busiest first.
   *
   * Members with neither are left out: a chart row of two empty bars says a professional is
   * involved in the patient's care in a way the record does not actually show.
   */
  readonly careTeamLoad = computed<BarRow[]>(() => {
    const cases = this.cases();
    const visits = this.visitations();
    return this.careTeam()
      .map(member => ({
        label: member.name,
        values: [
          cases.filter(item => item.assignedProfessionalId === member.id).length,
          visits.filter(visit => visit.professionalId === member.id).length,
        ],
      }))
      .filter(row => row.values.some(value => value > 0))
      .sort((a, b) => b.values[0] + b.values[1] - (a.values[0] + a.values[1]));
  });

  readonly recentCases = computed(() => [...this.cases()].sort(byDateDesc(item => item.openedAt)).slice(0, PREVIEW));

  /**
   * Who took a reading, in the words the patient would use.
   *
   * The demo's sentence is "Recorded 24 July 2026 by Ophelia Gaisie", and the named carer is the
   * point — she is the angel the patient knows. A reading the patient took themselves says "you",
   * through the same rule their own notes already follow; a reading the record does not attribute
   * says "your care team" rather than borrowing a name that was never recorded.
   */
  recorderOf(vital: VitalSummary): string {
    if (vital.source === 'PATIENT') {
      return this.translate.instant('patientPortal.overview.recordedByYou') as string;
    }
    if (!vital.recordedById) {
      return this.memberOf(null).name;
    }
    return this.memberOf(vital.recordedById).name;
  }

  openVital(vital: VitalSummary): void {
    this.showVitalTable.set(false);
    this.selectedVital.set(vital);
  }

  /**
   * Who wrote a timeline entry — the patient themselves, the system, or a clinician.
   *
   * The same rule the case detail and the activity trail use. This panel credited every entry to
   * `authorId` alone, so a note the patient wrote themselves was filed under "Care team" here
   * while `/record` and `/activity` said "You" about the very same record.
   */
  authorName(entry: { source?: string | null; authorId?: string | null }): string {
    return PatientContextService.authorNameOf(this.careTeamById(), entry);
  }

  /** Resolves the professional named on a record to someone with a name and a role. */
  memberOf(id: string | null | undefined): CareTeamMember {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  /** Maps a case status onto the pill that carries its urgency. */
  casePill(status: string | null | undefined): string {
    switch (status) {
      case 'URGENT':
        return 'hc-pill--danger';
      case 'OPEN':
        return 'hc-pill--warn';
      case 'TREATMENT':
        return 'hc-pill--navy';
      default:
        return 'hc-pill--grey';
    }
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
