import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../visitation.test-samples';

import { VisitationFormService } from './visitation-form.service';

describe('Visitation Form Service', () => {
  let service: VisitationFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitationFormService);
  });

  describe('Service methods', () => {
    describe('createVisitationFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createVisitationFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            caseId: expect.any(Object),
            professionalId: expect.any(Object),
            visitedAt: expect.any(Object),
            purpose: expect.any(Object),
            location: expect.any(Object),
            notes: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });

      it('passing IVisitation should create a new form with FormGroup', () => {
        const formGroup = service.createVisitationFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            caseId: expect.any(Object),
            professionalId: expect.any(Object),
            visitedAt: expect.any(Object),
            purpose: expect.any(Object),
            location: expect.any(Object),
            notes: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });
    });

    describe('getVisitation', () => {
      it('should return NewVisitation for default Visitation initial value', () => {
        const formGroup = service.createVisitationFormGroup(sampleWithNewData);

        const visitation = service.getVisitation(formGroup) as any;

        expect(visitation).toMatchObject(sampleWithNewData);
      });

      it('should return NewVisitation for empty Visitation initial value', () => {
        const formGroup = service.createVisitationFormGroup();

        const visitation = service.getVisitation(formGroup) as any;

        expect(visitation).toMatchObject({});
      });

      it('should return IVisitation', () => {
        const formGroup = service.createVisitationFormGroup(sampleWithRequiredData);

        const visitation = service.getVisitation(formGroup) as any;

        expect(visitation).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IVisitation should not enable id FormControl', () => {
        const formGroup = service.createVisitationFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewVisitation should disable id FormControl', () => {
        const formGroup = service.createVisitationFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
