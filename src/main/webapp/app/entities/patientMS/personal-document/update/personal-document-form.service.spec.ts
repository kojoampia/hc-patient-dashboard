import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../personal-document.test-samples';

import { PersonalDocumentFormService } from './personal-document-form.service';

describe('PersonalDocument Form Service', () => {
  let service: PersonalDocumentFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonalDocumentFormService);
  });

  describe('Service methods', () => {
    describe('createPersonalDocumentFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPersonalDocumentFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            category: expect.any(Object),
            url: expect.any(Object),
            patientId: expect.any(Object),
            issuedOn: expect.any(Object),
            expiresOn: expect.any(Object),
          }),
        );
      });

      it('passing IPersonalDocument should create a new form with FormGroup', () => {
        const formGroup = service.createPersonalDocumentFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            category: expect.any(Object),
            url: expect.any(Object),
            patientId: expect.any(Object),
            issuedOn: expect.any(Object),
            expiresOn: expect.any(Object),
          }),
        );
      });
    });

    describe('getPersonalDocument', () => {
      it('should return NewPersonalDocument for default PersonalDocument initial value', () => {
        const formGroup = service.createPersonalDocumentFormGroup(sampleWithNewData);

        const personalDocument = service.getPersonalDocument(formGroup) as any;

        expect(personalDocument).toMatchObject(sampleWithNewData);
      });

      it('should return NewPersonalDocument for empty PersonalDocument initial value', () => {
        const formGroup = service.createPersonalDocumentFormGroup();

        const personalDocument = service.getPersonalDocument(formGroup) as any;

        expect(personalDocument).toMatchObject({});
      });

      it('should return IPersonalDocument', () => {
        const formGroup = service.createPersonalDocumentFormGroup(sampleWithRequiredData);

        const personalDocument = service.getPersonalDocument(formGroup) as any;

        expect(personalDocument).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPersonalDocument should not enable id FormControl', () => {
        const formGroup = service.createPersonalDocumentFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPersonalDocument should disable id FormControl', () => {
        const formGroup = service.createPersonalDocumentFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
