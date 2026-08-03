import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { CarePlanItemService } from '../service/care-plan-item.service';
import { ICarePlanItem } from '../care-plan-item.model';
import { CarePlanItemFormService } from './care-plan-item-form.service';

import { CarePlanItemUpdateComponent } from './care-plan-item-update.component';

describe('CarePlanItem Management Update Component', () => {
  let comp: CarePlanItemUpdateComponent;
  let fixture: ComponentFixture<CarePlanItemUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let carePlanItemFormService: CarePlanItemFormService;
  let carePlanItemService: CarePlanItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([]), CarePlanItemUpdateComponent],
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
      .overrideTemplate(CarePlanItemUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CarePlanItemUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    carePlanItemFormService = TestBed.inject(CarePlanItemFormService);
    carePlanItemService = TestBed.inject(CarePlanItemService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const carePlanItem: ICarePlanItem = { id: 'CBA' };

      activatedRoute.data = of({ carePlanItem });
      comp.ngOnInit();

      expect(comp.carePlanItem).toEqual(carePlanItem);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICarePlanItem>>();
      const carePlanItem = { id: 'ABC' };
      jest.spyOn(carePlanItemFormService, 'getCarePlanItem').mockReturnValue(carePlanItem);
      jest.spyOn(carePlanItemService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ carePlanItem });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: carePlanItem }));
      saveSubject.complete();

      // THEN
      expect(carePlanItemFormService.getCarePlanItem).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(carePlanItemService.update).toHaveBeenCalledWith(expect.objectContaining(carePlanItem));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICarePlanItem>>();
      const carePlanItem = { id: 'ABC' };
      jest.spyOn(carePlanItemFormService, 'getCarePlanItem').mockReturnValue({ id: null });
      jest.spyOn(carePlanItemService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ carePlanItem: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: carePlanItem }));
      saveSubject.complete();

      // THEN
      expect(carePlanItemFormService.getCarePlanItem).toHaveBeenCalled();
      expect(carePlanItemService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICarePlanItem>>();
      const carePlanItem = { id: 'ABC' };
      jest.spyOn(carePlanItemService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ carePlanItem });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(carePlanItemService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
