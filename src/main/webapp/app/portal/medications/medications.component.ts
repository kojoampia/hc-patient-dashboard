import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PersonFilterComponent } from 'app/shared/ui/person-filter/person-filter.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';
import { ModalComponent } from 'app/shared/ui/modal/modal.component';
import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';
import { IMedication } from 'app/entities/patientMS/medication/medication.model';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { StatusLabelPipe } from '../data/status-label.pipe';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, matches, pageCount, pageOf } from '../data/portal-format';

/** Rows to a page. Eight, as the demo pages, and the same on every list. */
const PAGE_SIZE = 8;

/**
 * Everything the patient has been prescribed, current and past.
 *
 * WITHHELD entries are shown rather than hidden: "Amoxicillin — not given, penicillin allergy"
 * is a safety record, and dropping it from the list is how it gets prescribed again.
 */
@Component({
  selector: 'hpd-medications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SharedModule,
    RouterLink,
    IconComponent,
    EmptyStateComponent,
    PagerComponent,
    SearchBoxComponent,
    PersonFilterComponent,
    ModalComponent,
    StatusLabelPipe,
  ],
  templateUrl: './medications.component.html',
})
export default class MedicationsComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly medications = toSignal(this.data.medications$, { initialValue: [] });

  /** The people who can be filtered by, in the order the care team is listed. */
  readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] as readonly CareTeamMember[] });
  readonly formatDay = formatDay;

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
      {
        status: 'ACTIVE' as const,
        value: all.filter(item => item.status === 'ACTIVE').length,
        labelKey: 'patientPortal.medications.count.active',
      },
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

  /**
   * The medicine whose detail view is open, or null.
   *
   * The row itself carries the dose and the prescriber; what the detail adds is the *reason* —
   * a WITHHELD entry explains that it was not given because of the allergy on the record, which
   * is the one row on this screen a patient most needs a sentence about.
   */
  readonly selected = signal<IMedication | null>(null);

  readonly query = signal('');
  readonly status = signal<string | null>(null);
  readonly page = signal(1);

  /** Whose records to show — null is everyone. */
  readonly professional = signal<string | null>(null);

  readonly filtered = computed(() => {
    const needle = this.query();
    const person = this.professional();
    const status = this.status();
    return this.medications()
      .filter(item => !status || item.status === status)
      .filter(item => !person || item.prescribedById === person)
      .filter(item => matches(needle, item.name, item.dosage, item.prescription, item.description))
      .sort(byDateDesc(item => item.startedOn ?? item.createdDate));
  });

  readonly totalPages = computed(() => pageCount(this.filtered(), PAGE_SIZE));
  readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  open(item: IMedication): void {
    this.selected.set(item);
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setStatus(value: string): void {
    this.status.set(this.status() === value ? null : value);
    this.page.set(1);
  }

  setProfessional(id: string | null): void {
    this.professional.set(id);
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
