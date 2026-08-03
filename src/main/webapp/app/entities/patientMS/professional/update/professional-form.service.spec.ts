import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../professional.test-samples';

import { ProfessionalFormService } from './professional-form.service';

describe('Professional Form Service', () => {
  let service: ProfessionalFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfessionalFormService);
  });

  describe('Service methods', () => {
    describe('createProfessionalFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createProfessionalFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            firstName: expect.any(Object),
            lastName: expect.any(Object),
            role: expect.any(Object),
            specialty: expect.any(Object),
            email: expect.any(Object),
            phoneNumber: expect.any(Object),
            imageUrl: expect.any(Object),
            initials: expect.any(Object),
            location: expect.any(Object),
            teamId: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });

      it('passing IProfessional should create a new form with FormGroup', () => {
        const formGroup = service.createProfessionalFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            firstName: expect.any(Object),
            lastName: expect.any(Object),
            role: expect.any(Object),
            specialty: expect.any(Object),
            email: expect.any(Object),
            phoneNumber: expect.any(Object),
            imageUrl: expect.any(Object),
            initials: expect.any(Object),
            location: expect.any(Object),
            teamId: expect.any(Object),
            createdDate: expect.any(Object),
            modifiedDate: expect.any(Object),
            createdBy: expect.any(Object),
            modifiedBy: expect.any(Object),
          }),
        );
      });
    });

    describe('getProfessional', () => {
      it('should return NewProfessional for default Professional initial value', () => {
        const formGroup = service.createProfessionalFormGroup(sampleWithNewData);

        const professional = service.getProfessional(formGroup) as any;

        expect(professional).toMatchObject(sampleWithNewData);
      });

      it('should return NewProfessional for empty Professional initial value', () => {
        const formGroup = service.createProfessionalFormGroup();

        const professional = service.getProfessional(formGroup) as any;

        expect(professional).toMatchObject({});
      });

      it('should return IProfessional', () => {
        const formGroup = service.createProfessionalFormGroup(sampleWithRequiredData);

        const professional = service.getProfessional(formGroup) as any;

        expect(professional).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IProfessional should not enable id FormControl', () => {
        const formGroup = service.createProfessionalFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewProfessional should disable id FormControl', () => {
        const formGroup = service.createProfessionalFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
