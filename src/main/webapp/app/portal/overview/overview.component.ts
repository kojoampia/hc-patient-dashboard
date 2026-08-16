import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { SparklineComponent } from 'app/shared/ui/charts/sparkline.component';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { summariseVitals } from '../data/vitals';
import { byDateAsc, byDateDesc, formatDay, formatDayTime, humanise, formatInstantDay } from '../data/portal-format';

/** How many rows each summary panel shows before "see all" takes over. */
const PREVIEW = 5;

/**
 * The landing screen: how the patient is doing right now, and what happens next.
 *
 * Everything here is a summary with a way through to the full list — this screen answers
 * "anything I need to know?", not "show me everything".
 */
@Component({
    selector: 'hpd-overview',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, PanelComponent, EmptyStateComponent, SparklineComponent],
    templateUrl: './overview.component.html'
})
export default class OverviewComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);
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

  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;
  readonly formatDayTime = formatDayTime;
  readonly humanise = humanise;

  readonly profile = toSignal(this.context.profile$, { initialValue: null });

  readonly greetingName = computed(() => this.profile()?.firstName ?? '');

  readonly vitals = computed(() => summariseVitals(this.stats()));

  /** Anything not yet closed is what the patient is currently being seen for. */
  readonly openCases = computed(() => this.cases().filter(item => item.status !== 'CLOSED'));

  readonly tiles = computed(() => [
    { icon: 'case' as const, value: this.openCases().length, labelKey: 'patientPortal.overview.tile.openCases', link: '/cases' },
    { icon: 'cal' as const, value: this.upcoming().length, labelKey: 'patientPortal.overview.tile.upcoming', link: '/schedules' },
    {
      icon: 'pill' as const,
      value: this.medications().filter(m => m.status === 'ACTIVE').length,
      labelKey: 'patientPortal.overview.tile.activeMeds',
      link: '/medications',
    },
    { icon: 'report' as const, value: this.reports().length, labelKey: 'patientPortal.overview.tile.reports', link: '/reports' },
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
      link: '/emergencies',
    },
    { icon: 'shield' as const, value: this.allergies().length, labelKey: 'patientPortal.overview.tile.allergies', link: '/allergies' },
    {
      icon: 'leaf' as const,
      value: this.carePlan().filter(item => item.planType === 'DIET').length,
      labelKey: 'patientPortal.overview.tile.diet',
      link: '/plans',
    },
    {
      icon: 'run' as const,
      value: this.carePlan().filter(item => item.planType === 'EXERCISE').length,
      labelKey: 'patientPortal.overview.tile.exercise',
      link: '/plans',
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

  readonly recentCases = computed(() => [...this.cases()].sort(byDateDesc(item => item.openedAt)).slice(0, PREVIEW));

  /** Resolves the professional named on a record to someone with a name and a role. */
  memberOf(id: string | null | undefined): { name: string; role: string; initials: string } {
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
