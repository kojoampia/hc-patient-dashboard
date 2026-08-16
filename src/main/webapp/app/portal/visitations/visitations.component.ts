import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';
import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, matches, pageCount, pageOf, formatInstantDay } from '../data/portal-format';

/** Rows to a page. Eight, as the demo pages, and the same on every list. */
const PAGE_SIZE = 8;

/** Every visit that took place, newest first. */
@Component({
  selector: 'hpd-visitations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, RouterLink, EmptyStateComponent, PagerComponent, SearchBoxComponent],
  templateUrl: './visitations.component.html',
})
export default class VisitationsComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly visitations = toSignal(this.data.visitations$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;

  readonly query = signal('');
  readonly page = signal(1);

  readonly filtered = computed(() => {
    const needle = this.query();
    return this.visitations()
      .filter(item => matches(needle, item.purpose, item.location, item.notes, formatInstantDay(item.visitedAt)))
      .sort(byDateDesc(item => item.visitedAt));
  });

  readonly totalPages = computed(() => pageCount(this.filtered(), PAGE_SIZE));
  readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  memberOf(id: string | null | undefined): { name: string; role: string } {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  caseLabel(caseId: string | null | undefined): string {
    const record = caseId ? this.casesById().get(caseId) : undefined;
    return record ? record.title ?? record.brief ?? '' : '';
  }
}
