import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ICarePlanItem, NewCarePlanItem } from '../care-plan-item.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ICarePlanItem for edit and NewCarePlanItemFormGroupInput for create.
 */
type CarePlanItemFormGroupInput = ICarePlanItem | PartialWithRequiredKeyOf<NewCarePlanItem>;

type CarePlanItemFormDefaults = Pick<NewCarePlanItem, 'id' | 'completed'>;

type CarePlanItemFormGroupContent = {
  id: FormControl<ICarePlanItem['id'] | NewCarePlanItem['id']>;
  patientId: FormControl<ICarePlanItem['patientId']>;
  planType: FormControl<ICarePlanItem['planType']>;
  label: FormControl<ICarePlanItem['label']>;
  detail: FormControl<ICarePlanItem['detail']>;
  cadence: FormControl<ICarePlanItem['cadence']>;
  completed: FormControl<ICarePlanItem['completed']>;
  sortOrder: FormControl<ICarePlanItem['sortOrder']>;
  createdDate: FormControl<ICarePlanItem['createdDate']>;
  modifiedDate: FormControl<ICarePlanItem['modifiedDate']>;
  createdBy: FormControl<ICarePlanItem['createdBy']>;
  modifiedBy: FormControl<ICarePlanItem['modifiedBy']>;
};

export type CarePlanItemFormGroup = FormGroup<CarePlanItemFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class CarePlanItemFormService {
  createCarePlanItemFormGroup(carePlanItem: CarePlanItemFormGroupInput = { id: null }): CarePlanItemFormGroup {
    const carePlanItemRawValue = {
      ...this.getFormDefaults(),
      ...carePlanItem,
    };
    return new FormGroup<CarePlanItemFormGroupContent>({
      id: new FormControl(
        { value: carePlanItemRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      patientId: new FormControl(carePlanItemRawValue.patientId),
      planType: new FormControl(carePlanItemRawValue.planType),
      label: new FormControl(carePlanItemRawValue.label),
      detail: new FormControl(carePlanItemRawValue.detail),
      cadence: new FormControl(carePlanItemRawValue.cadence),
      completed: new FormControl(carePlanItemRawValue.completed),
      sortOrder: new FormControl(carePlanItemRawValue.sortOrder),
      createdDate: new FormControl(carePlanItemRawValue.createdDate),
      modifiedDate: new FormControl(carePlanItemRawValue.modifiedDate),
      createdBy: new FormControl(carePlanItemRawValue.createdBy),
      modifiedBy: new FormControl(carePlanItemRawValue.modifiedBy),
    });
  }

  getCarePlanItem(form: CarePlanItemFormGroup): ICarePlanItem | NewCarePlanItem {
    return form.getRawValue() as ICarePlanItem | NewCarePlanItem;
  }

  resetForm(form: CarePlanItemFormGroup, carePlanItem: CarePlanItemFormGroupInput): void {
    const carePlanItemRawValue = { ...this.getFormDefaults(), ...carePlanItem };
    form.reset(
      {
        ...carePlanItemRawValue,
        id: { value: carePlanItemRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): CarePlanItemFormDefaults {
    return {
      id: null,
      completed: false,
    };
  }
}
