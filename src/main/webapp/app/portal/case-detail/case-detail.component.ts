import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import dayjs from 'dayjs/esm';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PanelComponent } from 'app/shared/ui/panel/panel.component';
import { PagerComponent } from 'app/shared/ui/pager/pager.component';
import { AvatarComponent } from 'app/shared/ui/avatar/avatar.component';
import { ModalComponent } from 'app/shared/ui/modal/modal.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { ActivityLogService } from 'app/entities/patientMS/activity-log/service/activity-log.service';

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { StatusLabelPipe } from '../data/status-label.pipe';
import { PortalDataService } from '../data/portal-data.service';
import { byDateDesc, formatDay, humanise, formatInstantDay, pageCount, pageOf } from '../data/portal-format';

/** Rows the timeline shows at once, as the demo pages a case's panels. */
const PAGE_SIZE = 3;

/**
 * One case in full: what was reported, what was found, what was recommended, and everything
 * filed against it — visits, medications, reports and timeline entries.
 */
@Component({
  selector: 'hpd-case-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SharedModule,
    RouterLink,
    IconComponent,
    PanelComponent,
    PagerComponent,
    AvatarComponent,
    ModalComponent,
    EmptyStateComponent,
    StatusLabelPipe,
  ],
  templateUrl: './case-detail.component.html',
})
export default class CaseDetailComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);
  private readonly activityLogs = inject(ActivityLogService);
  private readonly patientId = toSignal(this.context.patientId$, { initialValue: null });

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });
  private readonly cases = toSignal(this.data.cases$, { initialValue: [] });
  private readonly medications = toSignal(this.data.medications$, { initialValue: [] });
  private readonly reports = toSignal(this.data.reports$, { initialValue: [] });
  private readonly visitations = toSignal(this.data.visitations$, { initialValue: [] });
  private readonly activity = toSignal(this.data.activity$, { initialValue: [] });

  readonly formatDay = formatDay;
  readonly formatInstantDay = formatInstantDay;

  /** Bound from the route by `withComponentInputBinding()`. */
  readonly caseId = signal<string | null>(null);

  /** Whether the "Log activity" dialog is up. */
  readonly logging = signal(false);

  /** The note being written, and what has become of it. */
  readonly noteTitle = signal('');
  readonly noteDetail = signal('');
  readonly saving = signal(false);
  readonly saveFailed = signal(false);

  /** Which page of the timeline is showing. */
  readonly timelinePage = signal(1);

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

  readonly timelinePages = computed(() => pageCount(this.caseActivity(), PAGE_SIZE));
  readonly timelineRows = computed(() => pageOf(this.caseActivity(), this.timelinePage(), PAGE_SIZE));

  /** A note with no title is not a record of anything, so Save stays closed until there is one. */
  readonly canSave = computed(() => this.noteTitle().trim().length > 0 && !this.saving());

  openLog(): void {
    this.noteTitle.set('');
    this.noteDetail.set('');
    this.saveFailed.set(false);
    this.logging.set(true);
  }

  /**
   * Files the patient's own note against this case.
   *
   * `source: PATIENT` is what makes the trail credit it to "You" rather than to the care team —
   * the same field the attribution reads everywhere else. The whole portal's data is reloaded
   * rather than the entry pushed into a local list: the record is the server's, and a note that
   * only exists in this tab until a refresh is a note the patient cannot trust.
   */
  save(): void {
    const patientId = this.patientId();
    if (!this.canSave() || !patientId) {
      return;
    }
    this.saving.set(true);
    this.saveFailed.set(false);
    this.activityLogs
      .create({
        id: null,
        patientId,
        caseId: this.caseId(),
        summary: this.noteTitle().trim(),
        detail: this.noteDetail().trim() || null,
        kind: 'NOTE',
        source: 'PATIENT',
        loggedAt: dayjs(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.logging.set(false);
          this.timelinePage.set(1);
          this.data.reload();
        },
        error: () => {
          this.saving.set(false);
          this.saveFailed.set(true);
        },
      });
  }

  /** The case as plain text, for pasting into a message to somebody who is not on the portal. */
  copy(): void {
    const record = this.item();
    if (!record) {
      return;
    }
    const lines = [
      `${record.title ?? record.brief ?? ''}`,
      `${formatInstantDay(record.openedAt)} · ${this.clinician().name} · ${humanise(record.status)}`,
      '',
      `${record.symptoms ?? ''}`,
      `${record.diagnosis ?? ''}`,
    ];
    void navigator.clipboard.writeText(lines.join('\n').trim());
  }

  print(): void {
    window.print();
  }

  memberOf(id: string | null | undefined): CareTeamMember {
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
