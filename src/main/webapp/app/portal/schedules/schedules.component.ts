import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AvatarComponent } from 'app/shared/ui/avatar/avatar.component';
import { PersonFilterComponent } from 'app/shared/ui/person-filter/person-filter.component';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';
import { ModalComponent } from 'app/shared/ui/modal/modal.component';
import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';
import { ITask } from 'app/entities/patientMS/task/task.model';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { StatusLabelPipe } from '../data/status-label.pipe';
import { PortalDataService } from '../data/portal-data.service';
import { byDateAsc, byDateDesc, formatDay, formatTime, matches, formatInstantDay } from '../data/portal-format';

/**
 * Appointments, split into what is still coming and what already happened.
 *
 * Upcoming reads soonest-first because the next one is the one that matters; past reads
 * newest-first for the same reason in reverse.
 */
@Component({
  selector: 'hpd-schedules',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SharedModule,
    RouterLink,
    IconComponent,
    EmptyStateComponent,
    SearchBoxComponent,
    AvatarComponent,
    PersonFilterComponent,
    ModalComponent,
    StatusLabelPipe,
  ],
  templateUrl: './schedules.component.html',
})
export default class SchedulesComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly schedules = toSignal(this.data.schedules$, { initialValue: [] });

  private readonly matching = computed(() => {
    const needle = this.query();
    const person = this.professional();
    return this.schedules()
      .filter(item => !person || item.attendantId === person)
      .filter(item =>
        // The formatted date is included so "28 Jul" finds an appointment, which is how a person
        // searches a schedule — the raw instant would never match what they typed.
        matches(needle, item.name, item.description, item.location, item.attendant, formatInstantDay(item.scheduledAt, item.schedule)),
      );
  });

  /** The people who can be filtered by, in the order the care team is listed. */
  readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] as readonly CareTeamMember[] });
  /**
   * The appointment whose detail view is open, or null.
   *
   * Opened from the attended table, whose rows are the only ones on this screen that do not
   * already carry everything: the upcoming cards show the clinician, the place and the case, and
   * a dialog repeating them would be a click that changes nothing.
   */
  readonly selected = signal<ITask | null>(null);

  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;
  readonly formatTime = formatTime;

  readonly query = signal('');

  /** Whose appointments to show — null is everyone. */
  readonly professional = signal<string | null>(null);

  /** Not yet attended and not cancelled, regardless of date — a missed appointment still needs action. */
  readonly upcoming = computed(() =>
    this.matching()
      .filter(item => item.status !== 'ATTENDED' && item.status !== 'CANCELLED')
      .sort(byDateAsc(item => item.scheduledAt ?? item.schedule)),
  );

  readonly past = computed(() =>
    this.matching()
      .filter(item => item.status === 'ATTENDED' || item.status === 'CANCELLED')
      .sort(byDateDesc(item => item.scheduledAt ?? item.schedule)),
  );

  memberOf(id: string | null | undefined): CareTeamMember {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  caseLabel(caseId: string | null | undefined): string {
    const record = caseId ? this.casesById().get(caseId) : undefined;
    return record ? record.title ?? record.brief ?? '' : '';
  }

  pill(status: string | null | undefined): string {
    switch (status) {
      case 'CONFIRMED':
        return 'hc-pill--ok';
      case 'PENDING':
        return 'hc-pill--warn';
      case 'CANCELLED':
        return 'hc-pill--danger';
      default:
        return 'hc-pill--grey';
    }
  }
}
