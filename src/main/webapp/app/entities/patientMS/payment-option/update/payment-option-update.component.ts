import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IPaymentOption } from '../payment-option.model';
import { PaymentOptionService } from '../service/payment-option.service';
import { PaymentOptionFormService, PaymentOptionFormGroup } from './payment-option-form.service';

@Component({
    selector: 'hpd-payment-option-update',
    templateUrl: './payment-option-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule]
})
export class PaymentOptionUpdateComponent implements OnInit {
  isSaving = false;
  paymentOption: IPaymentOption | null = null;

  editForm: PaymentOptionFormGroup = this.paymentOptionFormService.createPaymentOptionFormGroup();

  constructor(
    protected paymentOptionService: PaymentOptionService,
    protected paymentOptionFormService: PaymentOptionFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ paymentOption }) => {
      this.paymentOption = paymentOption;
      if (paymentOption) {
        this.updateForm(paymentOption);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const paymentOption = this.paymentOptionFormService.getPaymentOption(this.editForm);
    if (paymentOption.id !== null) {
      this.subscribeToSaveResponse(this.paymentOptionService.update(paymentOption));
    } else {
      this.subscribeToSaveResponse(this.paymentOptionService.create(paymentOption));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPaymentOption>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(paymentOption: IPaymentOption): void {
    this.paymentOption = paymentOption;
    this.paymentOptionFormService.resetForm(this.editForm, paymentOption);
  }
}
