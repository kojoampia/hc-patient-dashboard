import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IPersonalDocument, NewPersonalDocument } from '../personal-document.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPersonalDocument for edit and NewPersonalDocumentFormGroupInput for create.
 */
type PersonalDocumentFormGroupInput = IPersonalDocument | PartialWithRequiredKeyOf<NewPersonalDocument>;

type PersonalDocumentFormDefaults = Pick<NewPersonalDocument, 'id'>;

type PersonalDocumentFormGroupContent = {
  id: FormControl<IPersonalDocument['id'] | NewPersonalDocument['id']>;
  name: FormControl<IPersonalDocument['name']>;
  category: FormControl<IPersonalDocument['category']>;
  url: FormControl<IPersonalDocument['url']>;
  patientId: FormControl<IPersonalDocument['patientId']>;
  issuedOn: FormControl<IPersonalDocument['issuedOn']>;
  expiresOn: FormControl<IPersonalDocument['expiresOn']>;
};

export type PersonalDocumentFormGroup = FormGroup<PersonalDocumentFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PersonalDocumentFormService {
  createPersonalDocumentFormGroup(personalDocument: PersonalDocumentFormGroupInput = { id: null }): PersonalDocumentFormGroup {
    const personalDocumentRawValue = {
      ...this.getFormDefaults(),
      ...personalDocument,
    };
    return new FormGroup<PersonalDocumentFormGroupContent>({
      id: new FormControl(
        { value: personalDocumentRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      name: new FormControl(personalDocumentRawValue.name),
      category: new FormControl(personalDocumentRawValue.category),
      url: new FormControl(personalDocumentRawValue.url),
      patientId: new FormControl(personalDocumentRawValue.patientId),
      issuedOn: new FormControl(personalDocumentRawValue.issuedOn),
      expiresOn: new FormControl(personalDocumentRawValue.expiresOn),
    });
  }

  getPersonalDocument(form: PersonalDocumentFormGroup): IPersonalDocument | NewPersonalDocument {
    return form.getRawValue() as IPersonalDocument | NewPersonalDocument;
  }

  resetForm(form: PersonalDocumentFormGroup, personalDocument: PersonalDocumentFormGroupInput): void {
    const personalDocumentRawValue = { ...this.getFormDefaults(), ...personalDocument };
    form.reset(
      {
        ...personalDocumentRawValue,
        id: { value: personalDocumentRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): PersonalDocumentFormDefaults {
    return {
      id: null,
    };
  }
}
