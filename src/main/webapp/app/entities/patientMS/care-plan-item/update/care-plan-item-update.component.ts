import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CarePlanType } from 'app/entities/enumerations/care-plan-type.model';
import { ICarePlanItem } from '../care-plan-item.model';
import { CarePlanItemService } from '../service/care-plan-item.service';
import { CarePlanItemFormService, CarePlanItemFormGroup } from './care-plan-item-form.service';

@Component({
    selector: 'hpd-care-plan-item-update',
    templateUrl: './care-plan-item-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule]
})
export class CarePlanItemUpdateComponent implements OnInit {
  isSaving = false;
  carePlanItem: ICarePlanItem | null = null;
  carePlanTypeValues = Object.keys(CarePlanType);

  editForm: CarePlanItemFormGroup = this.carePlanItemFormService.createCarePlanItemFormGroup();

  constructor(
    protected carePlanItemService: CarePlanItemService,
    protected carePlanItemFormService: CarePlanItemFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ carePlanItem }) => {
      this.carePlanItem = carePlanItem;
      if (carePlanItem) {
        this.updateForm(carePlanItem);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const carePlanItem = this.carePlanItemFormService.getCarePlanItem(this.editForm);
    if (carePlanItem.id !== null) {
      this.subscribeToSaveResponse(this.carePlanItemService.update(carePlanItem));
    } else {
      this.subscribeToSaveResponse(this.carePlanItemService.create(carePlanItem));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ICarePlanItem>>): void {
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

  protected updateForm(carePlanItem: ICarePlanItem): void {
    this.carePlanItem = carePlanItem;
    this.carePlanItemFormService.resetForm(this.editForm, carePlanItem);
  }
}
