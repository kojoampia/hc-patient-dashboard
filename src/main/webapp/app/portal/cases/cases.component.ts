import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PersonFilterComponent } from 'app/shared/ui/person-filter/person-filter.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { StatusLabelPipe } from '../data/status-label.pipe';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, matches, pageCount, pageOf, formatInstantDay } from '../data/portal-format';

/** Rows to a page. Eight, as the demo pages, and the same on every list. */
const PAGE_SIZE = 8;

/** The case list, filterable by status and free text. */
@Component({
  selector: 'hpd-cases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SharedModule,
    RouterLink,
    IconComponent,
    EmptyStateComponent,
    PagerComponent,
    SearchBoxComponent,
    PersonFilterComponent,
    StatusLabelPipe,
  ],
  templateUrl: './cases.component.html',
})
export default class CasesComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly cases = toSignal(this.data.cases$, { initialValue: [] });

  /**
   * Cases a professional retired, newest first.
   *
   * Kept out of the list above rather than filtered into it: the working list answers "what is
   * happening to me", and an archived case is not. It is shown at all because the api excluding
   * them by default is right for a clinician's queue and wrong for a patient's own history — their
   * case did not stop having happened, and a patient who remembers one should be able to find it.
   */
  readonly archived = toSignal(this.data.archivedCases$, { initialValue: [] });

  /** Collapsed by default. Nobody opens this screen to read what is finished. */
  readonly archivedOpen = signal(false);

  /** The people who can be filtered by, in the order the care team is listed. */
  readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] as readonly CareTeamMember[] });
  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;

  readonly statuses = ['URGENT', 'OPEN', 'TREATMENT', 'CLOSED'] as const;

  readonly query = signal('');
  readonly status = signal<string | null>(null);
  readonly page = signal(1);

  /** Whose records to show — null is everyone. */
  readonly professional = signal<string | null>(null);

  readonly filtered = computed(() => {
    const needle = this.query();
    const person = this.professional();
    const status = this.status();
    return this.cases()
      .filter(item => !status || item.status === status)
      .filter(item => !person || item.assignedProfessionalId === person)
      .filter(item => matches(needle, item.title, item.brief, item.diagnosis, item.symptoms, item.caseNumber))
      .sort(byDateDesc(item => item.openedAt));
  });

  readonly totalPages = computed(() => pageCount(this.filtered(), PAGE_SIZE));
  readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setStatus(value: string | null): void {
    this.status.set(this.status() === value ? null : value);
    this.page.set(1);
  }

  setProfessional(id: string | null): void {
    this.professional.set(id);
    this.page.set(1);
  }

  memberOf(id: string | null | undefined): CareTeamMember {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  pill(status: string | null | undefined): string {
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
}
