import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IPaymentOption, NewPaymentOption } from '../payment-option.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPaymentOption for edit and NewPaymentOptionFormGroupInput for create.
 */
type PaymentOptionFormGroupInput = IPaymentOption | PartialWithRequiredKeyOf<NewPaymentOption>;

type PaymentOptionFormDefaults = Pick<NewPaymentOption, 'id'>;

type PaymentOptionFormGroupContent = {
  id: FormControl<IPaymentOption['id'] | NewPaymentOption['id']>;
  type: FormControl<IPaymentOption['type']>;
  userID: FormControl<IPaymentOption['userID']>;
  metadata: FormControl<IPaymentOption['metadata']>;
};

export type PaymentOptionFormGroup = FormGroup<PaymentOptionFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PaymentOptionFormService {
  createPaymentOptionFormGroup(paymentOption: PaymentOptionFormGroupInput = { id: null }): PaymentOptionFormGroup {
    const paymentOptionRawValue = {
      ...this.getFormDefaults(),
      ...paymentOption,
    };
    return new FormGroup<PaymentOptionFormGroupContent>({
      id: new FormControl(
        { value: paymentOptionRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      type: new FormControl(paymentOptionRawValue.type),
      userID: new FormControl(paymentOptionRawValue.userID),
      metadata: new FormControl(paymentOptionRawValue.metadata),
    });
  }

  getPaymentOption(form: PaymentOptionFormGroup): IPaymentOption | NewPaymentOption {
    return form.getRawValue() as IPaymentOption | NewPaymentOption;
  }

  resetForm(form: PaymentOptionFormGroup, paymentOption: PaymentOptionFormGroupInput): void {
    const paymentOptionRawValue = { ...this.getFormDefaults(), ...paymentOption };
    form.reset(
      {
        ...paymentOptionRawValue,
        id: { value: paymentOptionRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): PaymentOptionFormDefaults {
    return {
      id: null,
    };
  }
}
