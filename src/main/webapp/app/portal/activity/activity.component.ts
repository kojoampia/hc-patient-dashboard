import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { IconName } from 'app/shared/ui/icon/icon.constants';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { SearchBoxComponent } from 'app/shared/ui/search-box/search-box.component';
import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, humanise, matches, pageCount, pageOf } from '../data/portal-format';

const PAGE_SIZE = 20;

/** Icon and dot colour per kind of timeline entry. */
const KIND_STYLE: Readonly<Record<string, { icon: IconName; colour: string } | undefined>> = {
  CASE: { icon: 'case', colour: 'var(--hc-navy)' },
  VITAL: { icon: 'heart', colour: 'var(--hc-ok)' },
  RECOMMENDATION: { icon: 'check', colour: 'var(--hc-gold)' },
  REPORT: { icon: 'report', colour: 'var(--hc-navy-700)' },
  VISIT: { icon: 'pin', colour: 'var(--hc-ok)' },
  MEDICATION: { icon: 'pill', colour: 'var(--hc-gold)' },
  NOTE: { icon: 'note', colour: 'var(--hc-grey)' },
};

const DEFAULT_STYLE = { icon: 'note' as IconName, colour: 'var(--hc-grey)' };

/** The full record timeline: everything filed, by anyone, newest first. */
@Component({
    selector: 'hpd-activity',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, EmptyStateComponent, PagerComponent, SearchBoxComponent],
    templateUrl: './activity.component.html'
})
export default class ActivityComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly activity = toSignal(this.data.activity$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly humanise = humanise;

  readonly kinds = ['CASE', 'VITAL', 'RECOMMENDATION', 'REPORT', 'VISIT', 'MEDICATION', 'NOTE'] as const;

  readonly query = signal('');
  readonly kind = signal<string | null>(null);
  readonly page = signal(1);

  readonly filtered = computed(() => {
    const needle = this.query();
    const kind = this.kind();
    return this.activity()
      .filter(item => !kind || item.kind === kind)
      .filter(item => matches(needle, item.summary, item.detail))
      .sort(byDateDesc(item => item.loggedAt ?? item.createdDate));
  });

  readonly totalPages = computed(() => pageCount(this.filtered(), PAGE_SIZE));
  readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setKind(value: string): void {
    this.kind.set(this.kind() === value ? null : value);
    this.page.set(1);
  }

  style(kind: string | null | undefined): { icon: IconName; colour: string } {
    return (kind ? KIND_STYLE[kind] : undefined) ?? DEFAULT_STYLE;
  }

  /** Entries the patient wrote themselves are attributed to them, not to a clinician. */
  authorName(item: { source?: string | null; authorId?: string | null }): string {
    if (item.source === 'PATIENT') {
      return 'You';
    }
    if (item.source === 'SYSTEM') {
      return 'Abofonsa BridgeCare';
    }
    return PatientContextService.memberOf(this.careTeamById(), item.authorId).name;
  }

  caseLabel(caseId: string | null | undefined): string {
    const record = caseId ? this.casesById().get(caseId) : undefined;
    return record ? record.title ?? record.brief ?? '' : '';
  }
}
