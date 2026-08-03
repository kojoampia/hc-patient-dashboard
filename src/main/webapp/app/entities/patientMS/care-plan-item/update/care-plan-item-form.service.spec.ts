import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../care-plan-item.test-samples';

import { CarePlanItemFormService } from './care-plan-item-form.service';

describe('CarePlanItem Form Service', () => {
  let service: CarePlanItemFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarePlanItemFormService);
  });

  describe('Service methods', () => {
    describe('createCarePlanItemFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createCarePlanItemFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            planType: expect.any(Object),
            label: expect.any(Object),
            detail: expect.any(Object),
            cadence: expect.any(Object),
            completed: expect.any(Object),
            sortOrder: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });

      it('passing ICarePlanItem should create a new form with FormGroup', () => {
        const formGroup = service.createCarePlanItemFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            planType: expect.any(Object),
            label: expect.any(Object),
            detail: expect.any(Object),
            cadence: expect.any(Object),
            completed: expect.any(Object),
            sortOrder: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });
    });

    describe('getCarePlanItem', () => {
      it('should return NewCarePlanItem for default CarePlanItem initial value', () => {
        const formGroup = service.createCarePlanItemFormGroup(sampleWithNewData);

        const carePlanItem = service.getCarePlanItem(formGroup) as any;

        expect(carePlanItem).toMatchObject(sampleWithNewData);
      });

      it('should return NewCarePlanItem for empty CarePlanItem initial value', () => {
        const formGroup = service.createCarePlanItemFormGroup();

        const carePlanItem = service.getCarePlanItem(formGroup) as any;

        expect(carePlanItem).toMatchObject({});
      });

      it('should return ICarePlanItem', () => {
        const formGroup = service.createCarePlanItemFormGroup(sampleWithRequiredData);

        const carePlanItem = service.getCarePlanItem(formGroup) as any;

        expect(carePlanItem).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing ICarePlanItem should not enable id FormControl', () => {
        const formGroup = service.createCarePlanItemFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewCarePlanItem should disable id FormControl', () => {
        const formGroup = service.createCarePlanItemFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
