import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IVisitation } from '../visitation.model';
import { VisitationService } from '../service/visitation.service';
import { VisitationFormService, VisitationFormGroup } from './visitation-form.service';

@Component({
  standalone: true,
  selector: 'hpd-visitation-update',
  templateUrl: './visitation-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class VisitationUpdateComponent implements OnInit {
  isSaving = false;
  visitation: IVisitation | null = null;

  editForm: VisitationFormGroup = this.visitationFormService.createVisitationFormGroup();

  constructor(
    protected visitationService: VisitationService,
    protected visitationFormService: VisitationFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ visitation }) => {
      this.visitation = visitation;
      if (visitation) {
        this.updateForm(visitation);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const visitation = this.visitationFormService.getVisitation(this.editForm);
    if (visitation.id !== null) {
      this.subscribeToSaveResponse(this.visitationService.update(visitation));
    } else {
      this.subscribeToSaveResponse(this.visitationService.create(visitation));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IVisitation>>): void {
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

  protected updateForm(visitation: IVisitation): void {
    this.visitation = visitation;
    this.visitationFormService.resetForm(this.editForm, visitation);
  }
}
