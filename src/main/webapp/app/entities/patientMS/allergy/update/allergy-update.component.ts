import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AllergyCategory } from 'app/entities/enumerations/allergy-category.model';
import { AllergySeverity } from 'app/entities/enumerations/allergy-severity.model';
import { IAllergy } from '../allergy.model';
import { AllergyService } from '../service/allergy.service';
import { AllergyFormService, AllergyFormGroup } from './allergy-form.service';

@Component({
    selector: 'hpd-allergy-update',
    templateUrl: './allergy-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule]
})
export class AllergyUpdateComponent implements OnInit {
  isSaving = false;
  allergy: IAllergy | null = null;
  allergyCategoryValues = Object.keys(AllergyCategory);
  allergySeverityValues = Object.keys(AllergySeverity);

  editForm: AllergyFormGroup = this.allergyFormService.createAllergyFormGroup();

  constructor(
    protected allergyService: AllergyService,
    protected allergyFormService: AllergyFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ allergy }) => {
      this.allergy = allergy;
      if (allergy) {
        this.updateForm(allergy);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const allergy = this.allergyFormService.getAllergy(this.editForm);
    if (allergy.id !== null) {
      this.subscribeToSaveResponse(this.allergyService.update(allergy));
    } else {
      this.subscribeToSaveResponse(this.allergyService.create(allergy));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IAllergy>>): void {
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

  protected updateForm(allergy: IAllergy): void {
    this.allergy = allergy;
    this.allergyFormService.resetForm(this.editForm, allergy);
  }
}
