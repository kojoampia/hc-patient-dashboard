import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IRecommendation } from 'app/entities/patientMS/recommendation/recommendation.model';
import { RecommendationService } from 'app/entities/patientMS/recommendation/service/recommendation.service';
import { CaseStatus } from 'app/entities/enumerations/case-status.model';
import { ClinicalCaseService } from '../service/clinical-case.service';
import { IClinicalCase } from '../clinical-case.model';
import { ClinicalCaseFormService, ClinicalCaseFormGroup } from './clinical-case-form.service';

@Component({
  selector: 'hpd-clinical-case-update',
  templateUrl: './clinical-case-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ClinicalCaseUpdateComponent implements OnInit {
  isSaving = false;
  clinicalCase: IClinicalCase | null = null;
  caseStatusValues = Object.keys(CaseStatus);

  recommendationsSharedCollection: IRecommendation[] = [];

  editForm: ClinicalCaseFormGroup = this.clinicalCaseFormService.createClinicalCaseFormGroup();

  constructor(
    protected clinicalCaseService: ClinicalCaseService,
    protected clinicalCaseFormService: ClinicalCaseFormService,
    protected recommendationService: RecommendationService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  compareRecommendation = (o1: IRecommendation | null, o2: IRecommendation | null): boolean =>
    this.recommendationService.compareRecommendation(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ clinicalCase }) => {
      this.clinicalCase = clinicalCase;
      if (clinicalCase) {
        this.updateForm(clinicalCase);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const clinicalCase = this.clinicalCaseFormService.getClinicalCase(this.editForm);
    if (clinicalCase.id !== null) {
      this.subscribeToSaveResponse(this.clinicalCaseService.update(clinicalCase));
    } else {
      this.subscribeToSaveResponse(this.clinicalCaseService.create(clinicalCase));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IClinicalCase>>): void {
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

  protected updateForm(clinicalCase: IClinicalCase): void {
    this.clinicalCase = clinicalCase;
    this.clinicalCaseFormService.resetForm(this.editForm, clinicalCase);

    this.recommendationsSharedCollection = this.recommendationService.addRecommendationToCollectionIfMissing<IRecommendation>(
      this.recommendationsSharedCollection,
      ...(clinicalCase.recommendations ?? []),
    );
  }

  protected loadRelationshipsOptions(): void {
    this.recommendationService
      .query()
      .pipe(map((res: HttpResponse<IRecommendation[]>) => res.body ?? []))
      .pipe(
        map((recommendations: IRecommendation[]) =>
          this.recommendationService.addRecommendationToCollectionIfMissing<IRecommendation>(
            recommendations,
            ...(this.clinicalCase?.recommendations ?? []),
          ),
        ),
      )
      .subscribe((recommendations: IRecommendation[]) => (this.recommendationsSharedCollection = recommendations));
  }
}
