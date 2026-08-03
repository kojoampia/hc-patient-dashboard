import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';
import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { byDateAsc, byDateDesc, formatDay, formatTime, humanise, matches } from '../data/portal-format';

/**
 * Appointments, split into what is still coming and what already happened.
 *
 * Upcoming reads soonest-first because the next one is the one that matters; past reads
 * newest-first for the same reason in reverse.
 */
@Component({
  selector: 'hpd-schedules',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent, SearchBoxComponent],
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
    return this.schedules().filter(item => matches(needle, item.name, item.description, item.location, item.attendant));
  });

  readonly formatDay = formatDay;
  readonly formatTime = formatTime;
  readonly humanise = humanise;

  readonly query = signal('');

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

  memberOf(id: string | null | undefined): { name: string; role: string } {
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
