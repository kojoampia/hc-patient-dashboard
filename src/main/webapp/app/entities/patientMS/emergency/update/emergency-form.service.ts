import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IEmergency, NewEmergency } from '../emergency.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IEmergency for edit and NewEmergencyFormGroupInput for create.
 */
type EmergencyFormGroupInput = IEmergency | PartialWithRequiredKeyOf<NewEmergency>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IEmergency | NewEmergency> = Omit<T, 'raisedAt' | 'resolvedAt'> & {
  raisedAt?: string | null;
  resolvedAt?: string | null;
};

type EmergencyFormRawValue = FormValueOf<IEmergency>;

type NewEmergencyFormRawValue = FormValueOf<NewEmergency>;

type EmergencyFormDefaults = Pick<NewEmergency, 'id' | 'raisedAt' | 'resolvedAt'>;

type EmergencyFormGroupContent = {
  id: FormControl<EmergencyFormRawValue['id'] | NewEmergency['id']>;
  patientId: FormControl<EmergencyFormRawValue['patientId']>;
  caseId: FormControl<EmergencyFormRawValue['caseId']>;
  raisedAt: FormControl<EmergencyFormRawValue['raisedAt']>;
  resolvedAt: FormControl<EmergencyFormRawValue['resolvedAt']>;
  brief: FormControl<EmergencyFormRawValue['brief']>;
  detail: FormControl<EmergencyFormRawValue['detail']>;
  severity: FormControl<EmergencyFormRawValue['severity']>;
  status: FormControl<EmergencyFormRawValue['status']>;
  outcome: FormControl<EmergencyFormRawValue['outcome']>;
  location: FormControl<EmergencyFormRawValue['location']>;
  respondentId: FormControl<EmergencyFormRawValue['respondentId']>;
  createdDate: FormControl<EmergencyFormRawValue['createdDate']>;
  modifiedDate: FormControl<EmergencyFormRawValue['modifiedDate']>;
  createdBy: FormControl<EmergencyFormRawValue['createdBy']>;
  modifiedBy: FormControl<EmergencyFormRawValue['modifiedBy']>;
};

export type EmergencyFormGroup = FormGroup<EmergencyFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class EmergencyFormService {
  createEmergencyFormGroup(emergency: EmergencyFormGroupInput = { id: null }): EmergencyFormGroup {
    const emergencyRawValue = this.convertEmergencyToEmergencyRawValue({
      ...this.getFormDefaults(),
      ...emergency,
    });
    return new FormGroup<EmergencyFormGroupContent>({
      id: new FormControl(
        { value: emergencyRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      patientId: new FormControl(emergencyRawValue.patientId),
      caseId: new FormControl(emergencyRawValue.caseId),
      raisedAt: new FormControl(emergencyRawValue.raisedAt),
      resolvedAt: new FormControl(emergencyRawValue.resolvedAt),
      brief: new FormControl(emergencyRawValue.brief),
      detail: new FormControl(emergencyRawValue.detail),
      severity: new FormControl(emergencyRawValue.severity),
      status: new FormControl(emergencyRawValue.status),
      outcome: new FormControl(emergencyRawValue.outcome),
      location: new FormControl(emergencyRawValue.location),
      respondentId: new FormControl(emergencyRawValue.respondentId),
      createdDate: new FormControl(emergencyRawValue.createdDate),
      modifiedDate: new FormControl(emergencyRawValue.modifiedDate),
      createdBy: new FormControl(emergencyRawValue.createdBy),
      modifiedBy: new FormControl(emergencyRawValue.modifiedBy),
    });
  }

  getEmergency(form: EmergencyFormGroup): IEmergency | NewEmergency {
    return this.convertEmergencyRawValueToEmergency(form.getRawValue() as EmergencyFormRawValue | NewEmergencyFormRawValue);
  }

  resetForm(form: EmergencyFormGroup, emergency: EmergencyFormGroupInput): void {
    const emergencyRawValue = this.convertEmergencyToEmergencyRawValue({ ...this.getFormDefaults(), ...emergency });
    form.reset(
      {
        ...emergencyRawValue,
        id: { value: emergencyRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): EmergencyFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      raisedAt: currentTime,
      resolvedAt: currentTime,
    };
  }

  private convertEmergencyRawValueToEmergency(rawEmergency: EmergencyFormRawValue | NewEmergencyFormRawValue): IEmergency | NewEmergency {
    return {
      ...rawEmergency,
      raisedAt: dayjs(rawEmergency.raisedAt, DATE_TIME_FORMAT),
      resolvedAt: dayjs(rawEmergency.resolvedAt, DATE_TIME_FORMAT),
    };
  }

  private convertEmergencyToEmergencyRawValue(
    emergency: IEmergency | (Partial<NewEmergency> & EmergencyFormDefaults),
  ): EmergencyFormRawValue | PartialWithRequiredKeyOf<NewEmergencyFormRawValue> {
    return {
      ...emergency,
      raisedAt: emergency.raisedAt ? emergency.raisedAt.format(DATE_TIME_FORMAT) : undefined,
      resolvedAt: emergency.resolvedAt ? emergency.resolvedAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
