import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IActivityLog, NewActivityLog } from '../activity-log.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IActivityLog for edit and NewActivityLogFormGroupInput for create.
 */
type ActivityLogFormGroupInput = IActivityLog | PartialWithRequiredKeyOf<NewActivityLog>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IActivityLog | NewActivityLog> = Omit<T, 'loggedAt'> & {
  loggedAt?: string | null;
};

type ActivityLogFormRawValue = FormValueOf<IActivityLog>;

type NewActivityLogFormRawValue = FormValueOf<NewActivityLog>;

type ActivityLogFormDefaults = Pick<NewActivityLog, 'id' | 'loggedAt'>;

type ActivityLogFormGroupContent = {
  id: FormControl<ActivityLogFormRawValue['id'] | NewActivityLog['id']>;
  patientId: FormControl<ActivityLogFormRawValue['patientId']>;
  caseId: FormControl<ActivityLogFormRawValue['caseId']>;
  loggedAt: FormControl<ActivityLogFormRawValue['loggedAt']>;
  summary: FormControl<ActivityLogFormRawValue['summary']>;
  detail: FormControl<ActivityLogFormRawValue['detail']>;
  kind: FormControl<ActivityLogFormRawValue['kind']>;
  source: FormControl<ActivityLogFormRawValue['source']>;
  authorId: FormControl<ActivityLogFormRawValue['authorId']>;
  createdDate: FormControl<ActivityLogFormRawValue['createdDate']>;
  createdBy: FormControl<ActivityLogFormRawValue['createdBy']>;
};

export type ActivityLogFormGroup = FormGroup<ActivityLogFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ActivityLogFormService {
  createActivityLogFormGroup(activityLog: ActivityLogFormGroupInput = { id: null }): ActivityLogFormGroup {
    const activityLogRawValue = this.convertActivityLogToActivityLogRawValue({
      ...this.getFormDefaults(),
      ...activityLog,
    });
    return new FormGroup<ActivityLogFormGroupContent>({
      id: new FormControl(
        { value: activityLogRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      patientId: new FormControl(activityLogRawValue.patientId),
      caseId: new FormControl(activityLogRawValue.caseId),
      loggedAt: new FormControl(activityLogRawValue.loggedAt),
      summary: new FormControl(activityLogRawValue.summary),
      detail: new FormControl(activityLogRawValue.detail),
      kind: new FormControl(activityLogRawValue.kind),
      source: new FormControl(activityLogRawValue.source),
      authorId: new FormControl(activityLogRawValue.authorId),
      createdDate: new FormControl(activityLogRawValue.createdDate),
      createdBy: new FormControl(activityLogRawValue.createdBy),
    });
  }

  getActivityLog(form: ActivityLogFormGroup): IActivityLog | NewActivityLog {
    return this.convertActivityLogRawValueToActivityLog(form.getRawValue() as ActivityLogFormRawValue | NewActivityLogFormRawValue);
  }

  resetForm(form: ActivityLogFormGroup, activityLog: ActivityLogFormGroupInput): void {
    const activityLogRawValue = this.convertActivityLogToActivityLogRawValue({ ...this.getFormDefaults(), ...activityLog });
    form.reset(
      {
        ...activityLogRawValue,
        id: { value: activityLogRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ActivityLogFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      loggedAt: currentTime,
    };
  }

  private convertActivityLogRawValueToActivityLog(
    rawActivityLog: ActivityLogFormRawValue | NewActivityLogFormRawValue,
  ): IActivityLog | NewActivityLog {
    return {
      ...rawActivityLog,
      loggedAt: dayjs(rawActivityLog.loggedAt, DATE_TIME_FORMAT),
    };
  }

  private convertActivityLogToActivityLogRawValue(
    activityLog: IActivityLog | (Partial<NewActivityLog> & ActivityLogFormDefaults),
  ): ActivityLogFormRawValue | PartialWithRequiredKeyOf<NewActivityLogFormRawValue> {
    return {
      ...activityLog,
      loggedAt: activityLog.loggedAt ? activityLog.loggedAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
