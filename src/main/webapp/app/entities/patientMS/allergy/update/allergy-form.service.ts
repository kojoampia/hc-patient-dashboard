import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IAllergy, NewAllergy } from '../allergy.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IAllergy for edit and NewAllergyFormGroupInput for create.
 */
type AllergyFormGroupInput = IAllergy | PartialWithRequiredKeyOf<NewAllergy>;

type AllergyFormDefaults = Pick<NewAllergy, 'id'>;

type AllergyFormGroupContent = {
  id: FormControl<IAllergy['id'] | NewAllergy['id']>;
  patientId: FormControl<IAllergy['patientId']>;
  name: FormControl<IAllergy['name']>;
  category: FormControl<IAllergy['category']>;
  severity: FormControl<IAllergy['severity']>;
  reaction: FormControl<IAllergy['reaction']>;
  notedOn: FormControl<IAllergy['notedOn']>;
  notedById: FormControl<IAllergy['notedById']>;
  createdDate: FormControl<IAllergy['createdDate']>;
  modifiedDate: FormControl<IAllergy['modifiedDate']>;
  createdBy: FormControl<IAllergy['createdBy']>;
  modifiedBy: FormControl<IAllergy['modifiedBy']>;
};

export type AllergyFormGroup = FormGroup<AllergyFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class AllergyFormService {
  createAllergyFormGroup(allergy: AllergyFormGroupInput = { id: null }): AllergyFormGroup {
    const allergyRawValue = {
      ...this.getFormDefaults(),
      ...allergy,
    };
    return new FormGroup<AllergyFormGroupContent>({
      id: new FormControl(
        { value: allergyRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      patientId: new FormControl(allergyRawValue.patientId),
      name: new FormControl(allergyRawValue.name),
      category: new FormControl(allergyRawValue.category),
      severity: new FormControl(allergyRawValue.severity),
      reaction: new FormControl(allergyRawValue.reaction),
      notedOn: new FormControl(allergyRawValue.notedOn),
      notedById: new FormControl(allergyRawValue.notedById),
      createdDate: new FormControl(allergyRawValue.createdDate),
      modifiedDate: new FormControl(allergyRawValue.modifiedDate),
      createdBy: new FormControl(allergyRawValue.createdBy),
      modifiedBy: new FormControl(allergyRawValue.modifiedBy),
    });
  }

  getAllergy(form: AllergyFormGroup): IAllergy | NewAllergy {
    return form.getRawValue() as IAllergy | NewAllergy;
  }

  resetForm(form: AllergyFormGroup, allergy: AllergyFormGroupInput): void {
    const allergyRawValue = { ...this.getFormDefaults(), ...allergy };
    form.reset(
      {
        ...allergyRawValue,
        id: { value: allergyRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): AllergyFormDefaults {
    return {
      id: null,
    };
  }
}
