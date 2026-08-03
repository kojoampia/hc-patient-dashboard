import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IVisitation, NewVisitation } from '../visitation.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IVisitation for edit and NewVisitationFormGroupInput for create.
 */
type VisitationFormGroupInput = IVisitation | PartialWithRequiredKeyOf<NewVisitation>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IVisitation | NewVisitation> = Omit<T, 'visitedAt'> & {
  visitedAt?: string | null;
};

type VisitationFormRawValue = FormValueOf<IVisitation>;

type NewVisitationFormRawValue = FormValueOf<NewVisitation>;

type VisitationFormDefaults = Pick<NewVisitation, 'id' | 'visitedAt'>;

type VisitationFormGroupContent = {
  id: FormControl<VisitationFormRawValue['id'] | NewVisitation['id']>;
  patientId: FormControl<VisitationFormRawValue['patientId']>;
  caseId: FormControl<VisitationFormRawValue['caseId']>;
  professionalId: FormControl<VisitationFormRawValue['professionalId']>;
  visitedAt: FormControl<VisitationFormRawValue['visitedAt']>;
  purpose: FormControl<VisitationFormRawValue['purpose']>;
  location: FormControl<VisitationFormRawValue['location']>;
  notes: FormControl<VisitationFormRawValue['notes']>;
  createdDate: FormControl<VisitationFormRawValue['createdDate']>;
  modifiedDate: FormControl<VisitationFormRawValue['modifiedDate']>;
  createdBy: FormControl<VisitationFormRawValue['createdBy']>;
  modifiedBy: FormControl<VisitationFormRawValue['modifiedBy']>;
};

export type VisitationFormGroup = FormGroup<VisitationFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class VisitationFormService {
  createVisitationFormGroup(visitation: VisitationFormGroupInput = { id: null }): VisitationFormGroup {
    const visitationRawValue = this.convertVisitationToVisitationRawValue({
      ...this.getFormDefaults(),
      ...visitation,
    });
    return new FormGroup<VisitationFormGroupContent>({
      id: new FormControl(
        { value: visitationRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      patientId: new FormControl(visitationRawValue.patientId),
      caseId: new FormControl(visitationRawValue.caseId),
      professionalId: new FormControl(visitationRawValue.professionalId),
      visitedAt: new FormControl(visitationRawValue.visitedAt),
      purpose: new FormControl(visitationRawValue.purpose),
      location: new FormControl(visitationRawValue.location),
      notes: new FormControl(visitationRawValue.notes),
      createdDate: new FormControl(visitationRawValue.createdDate),
      modifiedDate: new FormControl(visitationRawValue.modifiedDate),
      createdBy: new FormControl(visitationRawValue.createdBy),
      modifiedBy: new FormControl(visitationRawValue.modifiedBy),
    });
  }

  getVisitation(form: VisitationFormGroup): IVisitation | NewVisitation {
    return this.convertVisitationRawValueToVisitation(form.getRawValue() as VisitationFormRawValue | NewVisitationFormRawValue);
  }

  resetForm(form: VisitationFormGroup, visitation: VisitationFormGroupInput): void {
    const visitationRawValue = this.convertVisitationToVisitationRawValue({ ...this.getFormDefaults(), ...visitation });
    form.reset(
      {
        ...visitationRawValue,
        id: { value: visitationRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): VisitationFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      visitedAt: currentTime,
    };
  }

  private convertVisitationRawValueToVisitation(
    rawVisitation: VisitationFormRawValue | NewVisitationFormRawValue,
  ): IVisitation | NewVisitation {
    return {
      ...rawVisitation,
      visitedAt: dayjs(rawVisitation.visitedAt, DATE_TIME_FORMAT),
    };
  }

  private convertVisitationToVisitationRawValue(
    visitation: IVisitation | (Partial<NewVisitation> & VisitationFormDefaults),
  ): VisitationFormRawValue | PartialWithRequiredKeyOf<NewVisitationFormRawValue> {
    return {
      ...visitation,
      visitedAt: visitation.visitedAt ? visitation.visitedAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
