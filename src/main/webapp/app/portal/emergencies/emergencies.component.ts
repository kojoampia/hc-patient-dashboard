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
import { byDateDesc, formatDayTime, humanise, matches } from '../data/portal-format';

/** Every emergency raised on this record, newest first, with what came of it. */
@Component({
    selector: 'hpd-emergencies',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent, SearchBoxComponent],
    templateUrl: './emergencies.component.html'
})
export default class EmergenciesComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly emergencies = toSignal(this.data.emergencies$, { initialValue: [] });

  readonly formatDayTime = formatDayTime;
  readonly humanise = humanise;

  readonly query = signal('');

  readonly filtered = computed(() => {
    const needle = this.query();
    return this.emergencies()
      .filter(item => matches(needle, item.brief, item.detail, item.outcome, item.location))
      .sort(byDateDesc(item => item.raisedAt));
  });

  memberOf(id: string | null | undefined): { name: string; role: string } {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  caseLabel(caseId: string | null | undefined): string {
    const record = caseId ? this.casesById().get(caseId) : undefined;
    return record ? record.title ?? record.brief ?? '' : '';
  }

  severityPill(severity: string | null | undefined): string {
    switch (severity) {
      case 'HIGH':
        return 'hc-pill--danger';
      case 'MODERATE':
        return 'hc-pill--warn';
      default:
        return 'hc-pill--grey';
    }
  }

  statusPill(status: string | null | undefined): string {
    return status === 'RESOLVED' ? 'hc-pill--ok' : 'hc-pill--warn';
  }
}
