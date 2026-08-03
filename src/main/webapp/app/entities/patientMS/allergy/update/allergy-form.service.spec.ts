import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../allergy.test-samples';

import { AllergyFormService } from './allergy-form.service';

describe('Allergy Form Service', () => {
  let service: AllergyFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllergyFormService);
  });

  describe('Service methods', () => {
    describe('createAllergyFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createAllergyFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            name: expect.any(Object),
            category: expect.any(Object),
            severity: expect.any(Object),
            reaction: expect.any(Object),
            notedOn: expect.any(Object),
            notedById: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });

      it('passing IAllergy should create a new form with FormGroup', () => {
        const formGroup = service.createAllergyFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            name: expect.any(Object),
            category: expect.any(Object),
            severity: expect.any(Object),
            reaction: expect.any(Object),
            notedOn: expect.any(Object),
            notedById: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });
    });

    describe('getAllergy', () => {
      it('should return NewAllergy for default Allergy initial value', () => {
        const formGroup = service.createAllergyFormGroup(sampleWithNewData);

        const allergy = service.getAllergy(formGroup) as any;

        expect(allergy).toMatchObject(sampleWithNewData);
      });

      it('should return NewAllergy for empty Allergy initial value', () => {
        const formGroup = service.createAllergyFormGroup();

        const allergy = service.getAllergy(formGroup) as any;

        expect(allergy).toMatchObject({});
      });

      it('should return IAllergy', () => {
        const formGroup = service.createAllergyFormGroup(sampleWithRequiredData);

        const allergy = service.getAllergy(formGroup) as any;

        expect(allergy).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IAllergy should not enable id FormControl', () => {
        const formGroup = service.createAllergyFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewAllergy should disable id FormControl', () => {
        const formGroup = service.createAllergyFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
