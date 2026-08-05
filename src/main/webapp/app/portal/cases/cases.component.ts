import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, humanise, matches, pageCount, pageOf } from '../data/portal-format';

const PAGE_SIZE = 12;

/** The case list, filterable by status and free text. */
@Component({
    selector: 'hpd-cases',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent, PagerComponent, SearchBoxComponent],
    templateUrl: './cases.component.html'
})
export default class CasesComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly cases = toSignal(this.data.cases$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly humanise = humanise;

  readonly statuses = ['URGENT', 'OPEN', 'TREATMENT', 'CLOSED'] as const;

  readonly query = signal('');
  readonly status = signal<string | null>(null);
  readonly page = signal(1);

  readonly filtered = computed(() => {
    const needle = this.query();
    const status = this.status();
    return this.cases()
      .filter(item => !status || item.status === status)
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

  memberOf(id: string | null | undefined): { name: string; role: string } {
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
