import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { VisitationService } from '../service/visitation.service';
import { IVisitation } from '../visitation.model';
import { VisitationFormService } from './visitation-form.service';

import { VisitationUpdateComponent } from './visitation-update.component';

describe('Visitation Management Update Component', () => {
  let comp: VisitationUpdateComponent;
  let fixture: ComponentFixture<VisitationUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let visitationFormService: VisitationFormService;
  let visitationService: VisitationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [RouterTestingModule.withRoutes([]), VisitationUpdateComponent],
    providers: [
        FormBuilder,
        {
            provide: ActivatedRoute,
            useValue: {
                params: from([{}]),
            },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
})
      .overrideTemplate(VisitationUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(VisitationUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    visitationFormService = TestBed.inject(VisitationFormService);
    visitationService = TestBed.inject(VisitationService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const visitation: IVisitation = { id: 'CBA' };

      activatedRoute.data = of({ visitation });
      comp.ngOnInit();

      expect(comp.visitation).toEqual(visitation);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IVisitation>>();
      const visitation = { id: 'ABC' };
      jest.spyOn(visitationFormService, 'getVisitation').mockReturnValue(visitation);
      jest.spyOn(visitationService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ visitation });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: visitation }));
      saveSubject.complete();

      // THEN
      expect(visitationFormService.getVisitation).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(visitationService.update).toHaveBeenCalledWith(expect.objectContaining(visitation));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IVisitation>>();
      const visitation = { id: 'ABC' };
      jest.spyOn(visitationFormService, 'getVisitation').mockReturnValue({ id: null });
      jest.spyOn(visitationService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ visitation: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: visitation }));
      saveSubject.complete();

      // THEN
      expect(visitationFormService.getVisitation).toHaveBeenCalled();
      expect(visitationService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IVisitation>>();
      const visitation = { id: 'ABC' };
      jest.spyOn(visitationService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ visitation });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(visitationService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
