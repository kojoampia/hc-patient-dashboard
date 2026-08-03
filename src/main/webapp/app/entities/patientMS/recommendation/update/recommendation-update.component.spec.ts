import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { RecommendationService } from '../service/recommendation.service';
import { IRecommendation } from '../recommendation.model';
import { RecommendationFormService } from './recommendation-form.service';

import { RecommendationUpdateComponent } from './recommendation-update.component';

describe('Recommendation Management Update Component', () => {
  let comp: RecommendationUpdateComponent;
  let fixture: ComponentFixture<RecommendationUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let recommendationFormService: RecommendationFormService;
  let recommendationService: RecommendationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([]), RecommendationUpdateComponent],
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
      .overrideTemplate(RecommendationUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(RecommendationUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    recommendationFormService = TestBed.inject(RecommendationFormService);
    recommendationService = TestBed.inject(RecommendationService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const recommendation: IRecommendation = { id: 'CBA' };

      activatedRoute.data = of({ recommendation });
      comp.ngOnInit();

      expect(comp.recommendation).toEqual(recommendation);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IRecommendation>>();
      const recommendation = { id: 'ABC' };
      jest.spyOn(recommendationFormService, 'getRecommendation').mockReturnValue(recommendation);
      jest.spyOn(recommendationService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ recommendation });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: recommendation }));
      saveSubject.complete();

      // THEN
      expect(recommendationFormService.getRecommendation).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(recommendationService.update).toHaveBeenCalledWith(expect.objectContaining(recommendation));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IRecommendation>>();
      const recommendation = { id: 'ABC' };
      jest.spyOn(recommendationFormService, 'getRecommendation').mockReturnValue({ id: null });
      jest.spyOn(recommendationService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ recommendation: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: recommendation }));
      saveSubject.complete();

      // THEN
      expect(recommendationFormService.getRecommendation).toHaveBeenCalled();
      expect(recommendationService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IRecommendation>>();
      const recommendation = { id: 'ABC' };
      jest.spyOn(recommendationService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ recommendation });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(recommendationService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
