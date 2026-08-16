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

import { CareTeamMember, PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { ACCEPTED_REPORT_TYPES, ReportUploadService } from '../data/report-upload.service';
import { byDateDesc, formatDay, matches, pageCount, pageOf } from '../data/portal-format';

/** Rows to a page. Eight, as the demo pages, and the same on every list. */
const PAGE_SIZE = 8;

/** Lab, imaging, clinical and immunisation reports, each with its plain-language summary. */
@Component({
  selector: 'hpd-reports',
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
  ],
  templateUrl: './reports.component.html',
})
export default class ReportsComponent {
  private readonly context = inject(PatientContextService);
  private readonly data = inject(PortalDataService);
  private readonly uploads = inject(ReportUploadService);
  private readonly patientId = toSignal(this.context.patientId$, { initialValue: null });

  /**
   * The file the patient picked.
   *
   * A signal even though nothing renders it: {@link canUpload} is a computed, and a computed only
   * re-runs when a *signal* it read has changed. As a plain field this would leave Save disabled
   * after a file was chosen, because nothing would have told the computed to look again.
   */
  private readonly chosen = signal<File | null>(null);

  private readonly careTeamById = toSignal(this.context.careTeamById$, { initialValue: new Map<string, CareTeamMember>() });

  private readonly casesById = toSignal(this.data.casesById$, { initialValue: new Map<string, IClinicalCase>() });
  private readonly reports = toSignal(this.data.reports$, { initialValue: [] });

  /** The people who can be filtered by, in the order the care team is listed. */
  readonly careTeam = toSignal(this.context.careTeam$, { initialValue: [] as readonly CareTeamMember[] });
  readonly formatDay = formatDay;

  /** What the file picker offers, and what the api will accept. */
  readonly acceptedTypes = ACCEPTED_REPORT_TYPES;

  /** Whether the upload dialog is open. */
  readonly uploading = signal(false);

  readonly fileName = signal('');
  readonly reportName = signal('');
  readonly uploadCase = signal<string | null>(null);
  readonly saving = signal(false);
  readonly uploadError = signal<string | null>(null);

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

  /** Whose records to show — null is everyone. */
  readonly professional = signal<string | null>(null);

  readonly filtered = computed(() => {
    const needle = this.query();
    const person = this.professional();
    const category = this.category();
    return this.reports()
      .filter(item => !category || item.category === category)
      .filter(item => !person || item.authorId === person)
      .filter(item => matches(needle, item.name, item.summary, item.description, item.category))
      .sort(byDateDesc(item => item.reportDate ?? item.createdDate));
  });

  readonly totalPages = computed(() => pageCount(this.filtered(), PAGE_SIZE));
  readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  /** The open cases a report can be filed against — a closed one is not what a new result belongs to. */
  readonly openCases = computed(() => [...this.casesById().values()].filter(item => item.status !== 'CLOSED'));

  /** A report with no name and no file is not a report. */
  readonly canUpload = computed(() => this.reportName().trim().length > 0 && this.chosen() !== null && !this.saving());

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setCategory(value: string): void {
    this.category.set(this.category() === value ? null : value);
    this.page.set(1);
  }

  setProfessional(id: string | null): void {
    this.professional.set(id);
    this.page.set(1);
  }

  openUpload(): void {
    this.chosen.set(null);
    this.fileName.set('');
    this.reportName.set('');
    this.uploadCase.set(null);
    this.uploadError.set(null);
    this.uploading.set(true);
  }

  chooseFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.uploadError.set(null);
    if (file && this.uploads.reject(file) === 'size') {
      this.chosen.set(null);
      this.fileName.set('');
      this.uploadError.set('patientPortal.reports.tooLarge');
      return;
    }
    this.chosen.set(file);
    this.fileName.set(file?.name ?? '');
    // A patient who has not named it yet gets the filename as a starting point, minus the extension.
    if (file && !this.reportName().trim()) {
      this.reportName.set(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  /**
   * Files the report, then re-reads the record.
   *
   * The whole portal's data is reloaded rather than the new report pushed into a local list: it is the server's
   * record, and the file only exists once the api says so.
   */
  save(): void {
    const patientId = this.patientId();
    const file = this.chosen();
    if (!this.canUpload() || !patientId || !file) {
      return;
    }
    this.saving.set(true);
    this.uploadError.set(null);
    this.uploads.upload(patientId, { name: this.reportName().trim(), caseId: this.uploadCase(), summary: null }, file).subscribe({
      next: () => {
        this.saving.set(false);
        this.uploading.set(false);
        this.page.set(1);
        this.data.reload();
      },
      error: () => {
        this.saving.set(false);
        this.uploadError.set('patientPortal.reports.uploadFailed');
      },
    });
  }

  memberOf(id: string | null | undefined): CareTeamMember {
    return PatientContextService.memberOf(this.careTeamById(), id);
  }

  caseLabel(caseId: string | null | undefined): string {
    const record = caseId ? this.casesById().get(caseId) : undefined;
    return record ? record.title ?? record.brief ?? '' : '';
  }
}
