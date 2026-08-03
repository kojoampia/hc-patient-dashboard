import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IReport, NewReport } from '../report.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IReport for edit and NewReportFormGroupInput for create.
 */
type ReportFormGroupInput = IReport | PartialWithRequiredKeyOf<NewReport>;

type ReportFormDefaults = Pick<NewReport, 'id'>;

type ReportFormGroupContent = {
  id: FormControl<IReport['id'] | NewReport['id']>;
  category: FormControl<IReport['category']>;
  description: FormControl<IReport['description']>;
  summary: FormControl<IReport['summary']>;
  name: FormControl<IReport['name']>;
  url: FormControl<IReport['url']>;
  patientId: FormControl<IReport['patientId']>;
  caseId: FormControl<IReport['caseId']>;
  authorId: FormControl<IReport['authorId']>;
  reportDate: FormControl<IReport['reportDate']>;
  createdDate: FormControl<IReport['createdDate']>;
  modifiedDate: FormControl<IReport['modifiedDate']>;
  createdBy: FormControl<IReport['createdBy']>;
  modifiedBy: FormControl<IReport['modifiedBy']>;
};

export type ReportFormGroup = FormGroup<ReportFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ReportFormService {
  createReportFormGroup(report: ReportFormGroupInput = { id: null }): ReportFormGroup {
    const reportRawValue = {
      ...this.getFormDefaults(),
      ...report,
    };
    return new FormGroup<ReportFormGroupContent>({
      id: new FormControl(
        { value: reportRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      category: new FormControl(reportRawValue.category),
      description: new FormControl(reportRawValue.description),
      summary: new FormControl(reportRawValue.summary),
      name: new FormControl(reportRawValue.name),
      url: new FormControl(reportRawValue.url),
      patientId: new FormControl(reportRawValue.patientId),
      caseId: new FormControl(reportRawValue.caseId),
      authorId: new FormControl(reportRawValue.authorId),
      reportDate: new FormControl(reportRawValue.reportDate),
      createdDate: new FormControl(reportRawValue.createdDate),
      modifiedDate: new FormControl(reportRawValue.modifiedDate),
      createdBy: new FormControl(reportRawValue.createdBy),
      modifiedBy: new FormControl(reportRawValue.modifiedBy),
    });
  }

  getReport(form: ReportFormGroup): IReport | NewReport {
    return form.getRawValue() as IReport | NewReport;
  }

  resetForm(form: ReportFormGroup, report: ReportFormGroupInput): void {
    const reportRawValue = { ...this.getFormDefaults(), ...report };
    form.reset(
      {
        ...reportRawValue,
        id: { value: reportRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ReportFormDefaults {
    return {
      id: null,
    };
  }
}
