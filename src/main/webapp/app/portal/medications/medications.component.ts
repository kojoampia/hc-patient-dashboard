import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';
import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, humanise, matches, pageCount, pageOf } from '../data/portal-format';

const PAGE_SIZE = 15;

/**
 * Everything the patient has been prescribed, current and past.
 *
 * WITHHELD entries are shown rather than hidden: "Amoxicillin — not given, penicillin allergy"
 * is a safety record, and dropping it from the list is how it gets prescribed again.
 */
@Component({
    selector: 'hpd-medications',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent, PagerComponent, SearchBoxComponent],
    templateUrl: './medications.component.html'
})
export default class MedicationsComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly medications = toSignal(this.data.medications$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly humanise = humanise;

  readonly statuses = ['ACTIVE', 'COMPLETED', 'WITHHELD'] as const;

  /**
   * The shape of the list before you read it: what is being taken, what is finished, and what was
   * withheld. The last one is why this row exists — a withheld prescription is a safety decision
   * somebody made about this patient, and in a list of fourteen it is one row like any other.
   * Counting it puts it where the eye lands, and clicking it filters to exactly that.
   */
  readonly counts = computed(() => {
    const all = this.medications();
    return [
      { status: 'ACTIVE' as const, value: all.filter(item => item.status === 'ACTIVE').length, labelKey: 'patientPortal.medications.count.active' },
      {
        status: 'COMPLETED' as const,
        value: all.filter(item => item.status === 'COMPLETED').length,
        labelKey: 'patientPortal.medications.count.completed',
      },
      {
        status: 'WITHHELD' as const,
        value: all.filter(item => item.status === 'WITHHELD').length,
        labelKey: 'patientPortal.medications.count.withheld',
      },
    ];
  });

  readonly query = signal('');
  readonly status = signal<string | null>(null);
  readonly page = signal(1);

  readonly filtered = computed(() => {
    const needle = this.query();
    const status = this.status();
    return this.medications()
      .filter(item => !status || item.status === status)
      .filter(item => matches(needle, item.name, item.dosage, item.prescription, item.description))
      .sort(byDateDesc(item => item.startedOn ?? item.createdDate));
  });

  readonly totalPages = computed(() => pageCount(this.filtered(), PAGE_SIZE));
  readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setStatus(value: string): void {
    this.status.set(this.status() === value ? null : value);
    this.page.set(1);
  }

  memberOf(id: string | null | undefined): { name: string } {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  caseLabel(caseId: string | null | undefined): string {
    const record = caseId ? this.casesById().get(caseId) : undefined;
    return record ? record.title ?? record.brief ?? '' : '';
  }

  pill(status: string | null | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'hc-pill--ok';
      case 'WITHHELD':
        return 'hc-pill--danger';
      default:
        return 'hc-pill--grey';
    }
  }
}
