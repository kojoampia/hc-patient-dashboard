import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../emergency.test-samples';

import { EmergencyFormService } from './emergency-form.service';

describe('Emergency Form Service', () => {
  let service: EmergencyFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmergencyFormService);
  });

  describe('Service methods', () => {
    describe('createEmergencyFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createEmergencyFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            caseId: expect.any(Object),
            raisedAt: expect.any(Object),
            resolvedAt: expect.any(Object),
            brief: expect.any(Object),
            detail: expect.any(Object),
            severity: expect.any(Object),
            status: expect.any(Object),
            outcome: expect.any(Object),
            location: expect.any(Object),
            respondentId: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });

      it('passing IEmergency should create a new form with FormGroup', () => {
        const formGroup = service.createEmergencyFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            caseId: expect.any(Object),
            raisedAt: expect.any(Object),
            resolvedAt: expect.any(Object),
            brief: expect.any(Object),
            detail: expect.any(Object),
            severity: expect.any(Object),
            status: expect.any(Object),
            outcome: expect.any(Object),
            location: expect.any(Object),
            respondentId: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });
    });

    describe('getEmergency', () => {
      it('should return NewEmergency for default Emergency initial value', () => {
        const formGroup = service.createEmergencyFormGroup(sampleWithNewData);

        const emergency = service.getEmergency(formGroup) as any;

        expect(emergency).toMatchObject(sampleWithNewData);
      });

      it('should return NewEmergency for empty Emergency initial value', () => {
        const formGroup = service.createEmergencyFormGroup();

        const emergency = service.getEmergency(formGroup) as any;

        expect(emergency).toMatchObject({});
      });

      it('should return IEmergency', () => {
        const formGroup = service.createEmergencyFormGroup(sampleWithRequiredData);

        const emergency = service.getEmergency(formGroup) as any;

        expect(emergency).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IEmergency should not enable id FormControl', () => {
        const formGroup = service.createEmergencyFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewEmergency should disable id FormControl', () => {
        const formGroup = service.createEmergencyFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
