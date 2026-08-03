import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { ProfessionalService } from '../service/professional.service';
import { IProfessional } from '../professional.model';
import { ProfessionalFormService } from './professional-form.service';

import { ProfessionalUpdateComponent } from './professional-update.component';

describe('Professional Management Update Component', () => {
  let comp: ProfessionalUpdateComponent;
  let fixture: ComponentFixture<ProfessionalUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let professionalFormService: ProfessionalFormService;
  let professionalService: ProfessionalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([]), ProfessionalUpdateComponent],
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
      .overrideTemplate(ProfessionalUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ProfessionalUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    professionalFormService = TestBed.inject(ProfessionalFormService);
    professionalService = TestBed.inject(ProfessionalService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const professional: IProfessional = { id: 'CBA' };

      activatedRoute.data = of({ professional });
      comp.ngOnInit();

      expect(comp.professional).toEqual(professional);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProfessional>>();
      const professional = { id: 'ABC' };
      jest.spyOn(professionalFormService, 'getProfessional').mockReturnValue(professional);
      jest.spyOn(professionalService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ professional });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: professional }));
      saveSubject.complete();

      // THEN
      expect(professionalFormService.getProfessional).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(professionalService.update).toHaveBeenCalledWith(expect.objectContaining(professional));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProfessional>>();
      const professional = { id: 'ABC' };
      jest.spyOn(professionalFormService, 'getProfessional').mockReturnValue({ id: null });
      jest.spyOn(professionalService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ professional: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: professional }));
      saveSubject.complete();

      // THEN
      expect(professionalFormService.getProfessional).toHaveBeenCalled();
      expect(professionalService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProfessional>>();
      const professional = { id: 'ABC' };
      jest.spyOn(professionalService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ professional });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(professionalService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
