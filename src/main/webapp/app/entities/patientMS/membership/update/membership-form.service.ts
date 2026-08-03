import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IMembership, NewMembership } from '../membership.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IMembership for edit and NewMembershipFormGroupInput for create.
 */
type MembershipFormGroupInput = IMembership | PartialWithRequiredKeyOf<NewMembership>;

type MembershipFormDefaults = Pick<NewMembership, 'id'>;

type MembershipFormGroupContent = {
  id: FormControl<IMembership['id'] | NewMembership['id']>;
  patientId: FormControl<IMembership['patientId']>;
  name: FormControl<IMembership['name']>;
  description: FormControl<IMembership['description']>;
  status: FormControl<IMembership['status']>;
  memberNumber: FormControl<IMembership['memberNumber']>;
  plan: FormControl<IMembership['plan']>;
  startDate: FormControl<IMembership['startDate']>;
  renewalDate: FormControl<IMembership['renewalDate']>;
  createdDate: FormControl<IMembership['createdDate']>;
  modifiedDate: FormControl<IMembership['modifiedDate']>;
  createdBy: FormControl<IMembership['createdBy']>;
  modifiedBy: FormControl<IMembership['modifiedBy']>;
};

export type MembershipFormGroup = FormGroup<MembershipFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class MembershipFormService {
  createMembershipFormGroup(membership: MembershipFormGroupInput = { id: null }): MembershipFormGroup {
    const membershipRawValue = {
      ...this.getFormDefaults(),
      ...membership,
    };
    return new FormGroup<MembershipFormGroupContent>({
      id: new FormControl(
        { value: membershipRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      patientId: new FormControl(membershipRawValue.patientId),
      name: new FormControl(membershipRawValue.name),
      description: new FormControl(membershipRawValue.description),
      status: new FormControl(membershipRawValue.status),
      memberNumber: new FormControl(membershipRawValue.memberNumber),
      plan: new FormControl(membershipRawValue.plan),
      startDate: new FormControl(membershipRawValue.startDate),
      renewalDate: new FormControl(membershipRawValue.renewalDate),
      createdDate: new FormControl(membershipRawValue.createdDate),
      modifiedDate: new FormControl(membershipRawValue.modifiedDate),
      createdBy: new FormControl(membershipRawValue.createdBy),
      modifiedBy: new FormControl(membershipRawValue.modifiedBy),
    });
  }

  getMembership(form: MembershipFormGroup): IMembership | NewMembership {
    return form.getRawValue() as IMembership | NewMembership;
  }

  resetForm(form: MembershipFormGroup, membership: MembershipFormGroupInput): void {
    const membershipRawValue = { ...this.getFormDefaults(), ...membership };
    form.reset(
      {
        ...membershipRawValue,
        id: { value: membershipRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): MembershipFormDefaults {
    return {
      id: null,
    };
  }
}
