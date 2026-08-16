import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import dayjs from 'dayjs/esm';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IReport } from 'app/entities/patientMS/report/report.model';
import { ReportService } from 'app/entities/patientMS/report/service/report.service';

/** What the api accepts, and what the file picker should therefore offer. */
export const ACCEPTED_REPORT_TYPES = 'application/pdf,image/jpeg,image/png,image/heic';

/** Ten megabytes, the same limit the api enforces — checked here only to fail fast and kindly. */
export const MAX_REPORT_BYTES = 10 * 1024 * 1024;

/**
 * Filing a report the patient has themselves — a clinic PDF, or a photograph of a lab slip.
 *
 * <p>Two calls, not one: the report document is created first and the file is attached to it. That is the api's
 * shape, and it is the better failure mode — an upload that dies halfway leaves a report the patient can retry
 * against rather than nothing at all, and the record still says a report exists.</p>
 *
 * Kept beside the portal's other data services rather than added to the generated `ReportService`, which is a
 * JHipster regeneration point.
 */
@Injectable({ providedIn: 'root' })
export class ReportUploadService {
  private readonly http = inject(HttpClient);
  private readonly reports = inject(ReportService);
  private readonly applicationConfig = inject(ApplicationConfigService);

  /**
   * Creates the report and attaches the file.
   *
   * @param patientId whose record this belongs to.
   * @param details what the patient called it and, optionally, the case it relates to.
   * @param file the chosen file.
   */
  upload(patientId: string, details: { name: string; caseId: string | null; summary: string | null }, file: File): Observable<IReport> {
    return this.reports
      .create({
        id: null,
        name: details.name,
        summary: details.summary,
        caseId: details.caseId,
        patientId,
        category: 'Uploaded',
        reportDate: dayjs(),
      })
      .pipe(
        switchMap(created => {
          const report = created.body!;
          const form = new FormData();
          form.append('file', file);
          return this.http.post<IReport>(this.applicationConfig.getEndpointFor(`api/reports/${report.id}/file`, 'hcpatientservice'), form);
        }),
      );
  }

  /** Whether a file can be sent at all, so the patient hears about it before waiting for an upload. */
  reject(file: File): 'size' | null {
    return file.size > MAX_REPORT_BYTES ? 'size' : null;
  }
}
