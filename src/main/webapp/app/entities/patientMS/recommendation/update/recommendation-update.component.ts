import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IRecommendation } from '../recommendation.model';
import { RecommendationService } from '../service/recommendation.service';
import { RecommendationFormService, RecommendationFormGroup } from './recommendation-form.service';

@Component({
  standalone: true,
  selector: 'hpd-recommendation-update',
  templateUrl: './recommendation-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class RecommendationUpdateComponent implements OnInit {
  isSaving = false;
  recommendation: IRecommendation | null = null;

  editForm: RecommendationFormGroup = this.recommendationFormService.createRecommendationFormGroup();

  constructor(
    protected recommendationService: RecommendationService,
    protected recommendationFormService: RecommendationFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ recommendation }) => {
      this.recommendation = recommendation;
      if (recommendation) {
        this.updateForm(recommendation);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const recommendation = this.recommendationFormService.getRecommendation(this.editForm);
    if (recommendation.id !== null) {
      this.subscribeToSaveResponse(this.recommendationService.update(recommendation));
    } else {
      this.subscribeToSaveResponse(this.recommendationService.create(recommendation));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IRecommendation>>): void {
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

  protected updateForm(recommendation: IRecommendation): void {
    this.recommendation = recommendation;
    this.recommendationFormService.resetForm(this.editForm, recommendation);
  }
}
