import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, humanise, formatInstantDay } from '../data/portal-format';

/**
 * One case in full: what was reported, what was found, what was recommended, and everything
 * filed against it — visits, medications, reports and timeline entries.
 */
@Component({
    selector: 'hpd-case-detail',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterLink, IconComponent, PanelComponent, EmptyStateComponent],
    templateUrl: './case-detail.component.html'
})
export default class CaseDetailComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly cases = toSignal(this.data.cases$, { initialValue: [] });
  private readonly medications = toSignal(this.data.medications$, { initialValue: [] });
  private readonly reports = toSignal(this.data.reports$, { initialValue: [] });
  private readonly visitations = toSignal(this.data.visitations$, { initialValue: [] });
  private readonly activity = toSignal(this.data.activity$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;
  readonly humanise = humanise;

  /** Bound from the route by `withComponentInputBinding()`. */
  readonly caseId = signal<string | null>(null);

  readonly item = computed(() => this.cases().find(entry => entry.id === this.caseId()) ?? null);

  @Input()
  set id(value: string) {
    this.caseId.set(value);
  }

  /** True only once the list has loaded — before that, "not found" would be a lie. */
  readonly missing = computed(() => this.cases().length > 0 && !this.item());

  readonly clinician = computed(() => PatientContextService.memberOf(this.careTeamById(), this.item()?.assignedProfessionalId));

  readonly recommendations = computed(() => this.item()?.recommendations ?? []);

  readonly caseMedications = computed(() =>
    this.medications()
      .filter(entry => entry.caseId === this.caseId())
      .sort(byDateDesc(entry => entry.startedOn ?? entry.createdDate)),
  );

  readonly caseReports = computed(() =>
    this.reports()
      .filter(entry => entry.caseId === this.caseId())
      .sort(byDateDesc(entry => entry.reportDate ?? entry.createdDate)),
  );

  readonly caseVisits = computed(() =>
    this.visitations()
      .filter(entry => entry.caseId === this.caseId())
      .sort(byDateDesc(entry => entry.visitedAt)),
  );

  readonly caseActivity = computed(() =>
    this.activity()
      .filter(entry => entry.caseId === this.caseId())
      .sort(byDateDesc(entry => entry.loggedAt ?? entry.createdDate)),
  );

  memberOf(id: string | null | undefined): { name: string; role: string } {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  /** Who wrote a timeline entry — the patient themselves, the system, or a clinician. */
  authorName(entry: { source?: string | null; authorId?: string | null }): string {
    return PatientContextService.authorNameOf(this.careTeamById(), entry);
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
