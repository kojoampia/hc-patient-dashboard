import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IProfessional, NewProfessional } from '../professional.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IProfessional for edit and NewProfessionalFormGroupInput for create.
 */
type ProfessionalFormGroupInput = IProfessional | PartialWithRequiredKeyOf<NewProfessional>;

type ProfessionalFormDefaults = Pick<NewProfessional, 'id'>;

type ProfessionalFormGroupContent = {
  id: FormControl<IProfessional['id'] | NewProfessional['id']>;
  firstName: FormControl<IProfessional['firstName']>;
  lastName: FormControl<IProfessional['lastName']>;
  role: FormControl<IProfessional['role']>;
  specialty: FormControl<IProfessional['specialty']>;
  email: FormControl<IProfessional['email']>;
  phoneNumber: FormControl<IProfessional['phoneNumber']>;
  imageUrl: FormControl<IProfessional['imageUrl']>;
  initials: FormControl<IProfessional['initials']>;
  location: FormControl<IProfessional['location']>;
  teamId: FormControl<IProfessional['teamId']>;
  createdDate: FormControl<IProfessional['createdDate']>;
  modifiedDate: FormControl<IProfessional['modifiedDate']>;
  createdBy: FormControl<IProfessional['createdBy']>;
  modifiedBy: FormControl<IProfessional['modifiedBy']>;
};

export type ProfessionalFormGroup = FormGroup<ProfessionalFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ProfessionalFormService {
  createProfessionalFormGroup(professional: ProfessionalFormGroupInput = { id: null }): ProfessionalFormGroup {
    const professionalRawValue = {
      ...this.getFormDefaults(),
      ...professional,
    };
    return new FormGroup<ProfessionalFormGroupContent>({
      id: new FormControl(
        { value: professionalRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      firstName: new FormControl(professionalRawValue.firstName),
      lastName: new FormControl(professionalRawValue.lastName),
      role: new FormControl(professionalRawValue.role),
      specialty: new FormControl(professionalRawValue.specialty),
      email: new FormControl(professionalRawValue.email),
      phoneNumber: new FormControl(professionalRawValue.phoneNumber),
      imageUrl: new FormControl(professionalRawValue.imageUrl),
      initials: new FormControl(professionalRawValue.initials),
      location: new FormControl(professionalRawValue.location),
      teamId: new FormControl(professionalRawValue.teamId),
      createdDate: new FormControl(professionalRawValue.createdDate),
      modifiedDate: new FormControl(professionalRawValue.modifiedDate),
      createdBy: new FormControl(professionalRawValue.createdBy),
      modifiedBy: new FormControl(professionalRawValue.modifiedBy),
    });
  }

  getProfessional(form: ProfessionalFormGroup): IProfessional | NewProfessional {
    return form.getRawValue() as IProfessional | NewProfessional;
  }

  resetForm(form: ProfessionalFormGroup, professional: ProfessionalFormGroupInput): void {
    const professionalRawValue = { ...this.getFormDefaults(), ...professional };
    form.reset(
      {
        ...professionalRawValue,
        id: { value: professionalRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ProfessionalFormDefaults {
    return {
      id: null,
    };
  }
}
