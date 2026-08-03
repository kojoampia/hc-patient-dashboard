import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../payment-option.test-samples';

import { PaymentOptionFormService } from './payment-option-form.service';

describe('PaymentOption Form Service', () => {
  let service: PaymentOptionFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentOptionFormService);
  });

  describe('Service methods', () => {
    describe('createPaymentOptionFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPaymentOptionFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            type: expect.any(Object),
            userID: expect.any(Object),
            metadata: expect.any(Object),
          }),
        );
      });

      it('passing IPaymentOption should create a new form with FormGroup', () => {
        const formGroup = service.createPaymentOptionFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            type: expect.any(Object),
            userID: expect.any(Object),
            metadata: expect.any(Object),
          }),
        );
      });
    });

    describe('getPaymentOption', () => {
      it('should return NewPaymentOption for default PaymentOption initial value', () => {
        const formGroup = service.createPaymentOptionFormGroup(sampleWithNewData);

        const paymentOption = service.getPaymentOption(formGroup) as any;

        expect(paymentOption).toMatchObject(sampleWithNewData);
      });

      it('should return NewPaymentOption for empty PaymentOption initial value', () => {
        const formGroup = service.createPaymentOptionFormGroup();

        const paymentOption = service.getPaymentOption(formGroup) as any;

        expect(paymentOption).toMatchObject({});
      });

      it('should return IPaymentOption', () => {
        const formGroup = service.createPaymentOptionFormGroup(sampleWithRequiredData);

        const paymentOption = service.getPaymentOption(formGroup) as any;

        expect(paymentOption).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPaymentOption should not enable id FormControl', () => {
        const formGroup = service.createPaymentOptionFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPaymentOption should disable id FormControl', () => {
        const formGroup = service.createPaymentOptionFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
