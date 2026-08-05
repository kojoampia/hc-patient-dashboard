import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { IRecommendation } from 'app/entities/patientMS/recommendation/recommendation.model';
import { RecommendationService } from 'app/entities/patientMS/recommendation/service/recommendation.service';
import { ClinicalCaseService } from '../service/clinical-case.service';
import { IClinicalCase } from '../clinical-case.model';
import { ClinicalCaseFormService } from './clinical-case-form.service';

import { ClinicalCaseUpdateComponent } from './clinical-case-update.component';

describe('ClinicalCase Management Update Component', () => {
  let comp: ClinicalCaseUpdateComponent;
  let fixture: ComponentFixture<ClinicalCaseUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let clinicalCaseFormService: ClinicalCaseFormService;
  let clinicalCaseService: ClinicalCaseService;
  let recommendationService: RecommendationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [RouterTestingModule.withRoutes([]), ClinicalCaseUpdateComponent],
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
      .overrideTemplate(ClinicalCaseUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ClinicalCaseUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    clinicalCaseFormService = TestBed.inject(ClinicalCaseFormService);
    clinicalCaseService = TestBed.inject(ClinicalCaseService);
    recommendationService = TestBed.inject(RecommendationService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Recommendation query and add missing value', () => {
      const clinicalCase: IClinicalCase = { id: 'CBA' };
      const recommendations: IRecommendation[] = [{ id: '1cb1e8df-06bb-4c01-8624-ca5c6f651190' }];
      clinicalCase.recommendations = recommendations;

      const recommendationCollection: IRecommendation[] = [{ id: 'd311d4f4-0258-4b13-bbcc-373851163e18' }];
      jest.spyOn(recommendationService, 'query').mockReturnValue(of(new HttpResponse({ body: recommendationCollection })));
      const additionalRecommendations = [...recommendations];
      const expectedCollection: IRecommendation[] = [...additionalRecommendations, ...recommendationCollection];
      jest.spyOn(recommendationService, 'addRecommendationToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ clinicalCase });
      comp.ngOnInit();

      expect(recommendationService.query).toHaveBeenCalled();
      expect(recommendationService.addRecommendationToCollectionIfMissing).toHaveBeenCalledWith(
        recommendationCollection,
        ...additionalRecommendations.map(expect.objectContaining),
      );
      expect(comp.recommendationsSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const clinicalCase: IClinicalCase = { id: 'CBA' };
      const recommendation: IRecommendation = { id: '35a2e8dd-d2ad-40ac-91b1-af074c950162' };
      clinicalCase.recommendations = [recommendation];

      activatedRoute.data = of({ clinicalCase });
      comp.ngOnInit();

      expect(comp.recommendationsSharedCollection).toContain(recommendation);
      expect(comp.clinicalCase).toEqual(clinicalCase);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IClinicalCase>>();
      const clinicalCase = { id: 'ABC' };
      jest.spyOn(clinicalCaseFormService, 'getClinicalCase').mockReturnValue(clinicalCase);
      jest.spyOn(clinicalCaseService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ clinicalCase });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: clinicalCase }));
      saveSubject.complete();

      // THEN
      expect(clinicalCaseFormService.getClinicalCase).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(clinicalCaseService.update).toHaveBeenCalledWith(expect.objectContaining(clinicalCase));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IClinicalCase>>();
      const clinicalCase = { id: 'ABC' };
      jest.spyOn(clinicalCaseFormService, 'getClinicalCase').mockReturnValue({ id: null });
      jest.spyOn(clinicalCaseService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ clinicalCase: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: clinicalCase }));
      saveSubject.complete();

      // THEN
      expect(clinicalCaseFormService.getClinicalCase).toHaveBeenCalled();
      expect(clinicalCaseService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IClinicalCase>>();
      const clinicalCase = { id: 'ABC' };
      jest.spyOn(clinicalCaseService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ clinicalCase });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(clinicalCaseService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareRecommendation', () => {
      it('Should forward to recommendationService', () => {
        const entity = { id: 'ABC' };
        const entity2 = { id: 'CBA' };
        jest.spyOn(recommendationService, 'compareRecommendation');
        comp.compareRecommendation(entity, entity2);
        expect(recommendationService.compareRecommendation).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
