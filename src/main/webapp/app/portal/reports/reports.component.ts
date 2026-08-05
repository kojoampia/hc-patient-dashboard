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
import { byDateDesc, formatDay, matches, pageCount, pageOf } from '../data/portal-format';

const PAGE_SIZE = 10;

/** Lab, imaging, clinical and immunisation reports, each with its plain-language summary. */
@Component({
    selector: 'hpd-reports',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent, PagerComponent, SearchBoxComponent],
    templateUrl: './reports.component.html'
})
export default class ReportsComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly reports = toSignal(this.data.reports$, { initialValue: [] });

  readonly formatDay = formatDay;

  readonly query = signal('');
  readonly category = signal<string | null>(null);
  readonly page = signal(1);

  /** Categories come from the data rather than a fixed list — the backend does not constrain them. */
  readonly categories = computed(() =>
    [
      ...new Set(
        this.reports()
          .map(item => item.category)
          .filter((c): c is string => !!c),
      ),
    ].sort((a, b) => a.localeCompare(b)),
  );

  readonly filtered = computed(() => {
    const needle = this.query();
    const category = this.category();
    return this.reports()
      .filter(item => !category || item.category === category)
      .filter(item => matches(needle, item.name, item.summary, item.description, item.category))
      .sort(byDateDesc(item => item.reportDate ?? item.createdDate));
  });

  readonly totalPages = computed(() => pageCount(this.filtered(), PAGE_SIZE));
  readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setCategory(value: string): void {
    this.category.set(this.category() === value ? null : value);
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
