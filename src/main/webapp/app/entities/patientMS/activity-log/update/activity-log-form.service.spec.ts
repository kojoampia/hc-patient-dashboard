import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../activity-log.test-samples';

import { ActivityLogFormService } from './activity-log-form.service';

describe('ActivityLog Form Service', () => {
  let service: ActivityLogFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityLogFormService);
  });

  describe('Service methods', () => {
    describe('createActivityLogFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createActivityLogFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            caseId: expect.any(Object),
            loggedAt: expect.any(Object),
            summary: expect.any(Object),
            detail: expect.any(Object),
            kind: expect.any(Object),
            source: expect.any(Object),
            authorId: expect.any(Object),
            createdDate: expect.any(Object),
            createdBy: expect.any(Object),
          }),
        );
      });

      it('passing IActivityLog should create a new form with FormGroup', () => {
        const formGroup = service.createActivityLogFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            patientId: expect.any(Object),
            caseId: expect.any(Object),
            loggedAt: expect.any(Object),
            summary: expect.any(Object),
            detail: expect.any(Object),
            kind: expect.any(Object),
            source: expect.any(Object),
            authorId: expect.any(Object),
            createdDate: expect.any(Object),
            createdBy: expect.any(Object),
          }),
        );
      });
    });

    describe('getActivityLog', () => {
      it('should return NewActivityLog for default ActivityLog initial value', () => {
        const formGroup = service.createActivityLogFormGroup(sampleWithNewData);

        const activityLog = service.getActivityLog(formGroup) as any;

        expect(activityLog).toMatchObject(sampleWithNewData);
      });

      it('should return NewActivityLog for empty ActivityLog initial value', () => {
        const formGroup = service.createActivityLogFormGroup();

        const activityLog = service.getActivityLog(formGroup) as any;

        expect(activityLog).toMatchObject({});
      });

      it('should return IActivityLog', () => {
        const formGroup = service.createActivityLogFormGroup(sampleWithRequiredData);

        const activityLog = service.getActivityLog(formGroup) as any;

        expect(activityLog).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IActivityLog should not enable id FormControl', () => {
        const formGroup = service.createActivityLogFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewActivityLog should disable id FormControl', () => {
        const formGroup = service.createActivityLogFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
