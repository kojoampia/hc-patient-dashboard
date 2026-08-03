import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { PersonalDocumentService } from '../service/personal-document.service';
import { IPersonalDocument } from '../personal-document.model';
import { PersonalDocumentFormService } from './personal-document-form.service';

import { PersonalDocumentUpdateComponent } from './personal-document-update.component';

describe('PersonalDocument Management Update Component', () => {
  let comp: PersonalDocumentUpdateComponent;
  let fixture: ComponentFixture<PersonalDocumentUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let personalDocumentFormService: PersonalDocumentFormService;
  let personalDocumentService: PersonalDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([]), PersonalDocumentUpdateComponent],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(PersonalDocumentUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PersonalDocumentUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    personalDocumentFormService = TestBed.inject(PersonalDocumentFormService);
    personalDocumentService = TestBed.inject(PersonalDocumentService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const personalDocument: IPersonalDocument = { id: 'CBA' };

      activatedRoute.data = of({ personalDocument });
      comp.ngOnInit();

      expect(comp.personalDocument).toEqual(personalDocument);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPersonalDocument>>();
      const personalDocument = { id: 'ABC' };
      jest.spyOn(personalDocumentFormService, 'getPersonalDocument').mockReturnValue(personalDocument);
      jest.spyOn(personalDocumentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ personalDocument });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: personalDocument }));
      saveSubject.complete();

      // THEN
      expect(personalDocumentFormService.getPersonalDocument).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(personalDocumentService.update).toHaveBeenCalledWith(expect.objectContaining(personalDocument));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPersonalDocument>>();
      const personalDocument = { id: 'ABC' };
      jest.spyOn(personalDocumentFormService, 'getPersonalDocument').mockReturnValue({ id: null });
      jest.spyOn(personalDocumentService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ personalDocument: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: personalDocument }));
      saveSubject.complete();

      // THEN
      expect(personalDocumentFormService.getPersonalDocument).toHaveBeenCalled();
      expect(personalDocumentService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPersonalDocument>>();
      const personalDocument = { id: 'ABC' };
      jest.spyOn(personalDocumentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ personalDocument });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(personalDocumentService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
