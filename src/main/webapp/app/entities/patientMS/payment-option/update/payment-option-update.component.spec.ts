import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { PaymentOptionService } from '../service/payment-option.service';
import { IPaymentOption } from '../payment-option.model';
import { PaymentOptionFormService } from './payment-option-form.service';

import { PaymentOptionUpdateComponent } from './payment-option-update.component';

describe('PaymentOption Management Update Component', () => {
  let comp: PaymentOptionUpdateComponent;
  let fixture: ComponentFixture<PaymentOptionUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let paymentOptionFormService: PaymentOptionFormService;
  let paymentOptionService: PaymentOptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([]), PaymentOptionUpdateComponent],
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
      .overrideTemplate(PaymentOptionUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PaymentOptionUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    paymentOptionFormService = TestBed.inject(PaymentOptionFormService);
    paymentOptionService = TestBed.inject(PaymentOptionService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const paymentOption: IPaymentOption = { id: 'CBA' };

      activatedRoute.data = of({ paymentOption });
      comp.ngOnInit();

      expect(comp.paymentOption).toEqual(paymentOption);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPaymentOption>>();
      const paymentOption = { id: 'ABC' };
      jest.spyOn(paymentOptionFormService, 'getPaymentOption').mockReturnValue(paymentOption);
      jest.spyOn(paymentOptionService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ paymentOption });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: paymentOption }));
      saveSubject.complete();

      // THEN
      expect(paymentOptionFormService.getPaymentOption).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(paymentOptionService.update).toHaveBeenCalledWith(expect.objectContaining(paymentOption));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPaymentOption>>();
      const paymentOption = { id: 'ABC' };
      jest.spyOn(paymentOptionFormService, 'getPaymentOption').mockReturnValue({ id: null });
      jest.spyOn(paymentOptionService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ paymentOption: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: paymentOption }));
      saveSubject.complete();

      // THEN
      expect(paymentOptionFormService.getPaymentOption).toHaveBeenCalled();
      expect(paymentOptionService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPaymentOption>>();
      const paymentOption = { id: 'ABC' };
      jest.spyOn(paymentOptionService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ paymentOption });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(paymentOptionService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
