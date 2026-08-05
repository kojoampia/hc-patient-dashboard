import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IProfessional } from '../professional.model';
import { ProfessionalService } from '../service/professional.service';
import { ProfessionalFormService, ProfessionalFormGroup } from './professional-form.service';

@Component({
    selector: 'hpd-professional-update',
    templateUrl: './professional-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule]
})
export class ProfessionalUpdateComponent implements OnInit {
  isSaving = false;
  professional: IProfessional | null = null;

  editForm: ProfessionalFormGroup = this.professionalFormService.createProfessionalFormGroup();

  constructor(
    protected professionalService: ProfessionalService,
    protected professionalFormService: ProfessionalFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ professional }) => {
      this.professional = professional;
      if (professional) {
        this.updateForm(professional);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const professional = this.professionalFormService.getProfessional(this.editForm);
    if (professional.id !== null) {
      this.subscribeToSaveResponse(this.professionalService.update(professional));
    } else {
      this.subscribeToSaveResponse(this.professionalService.create(professional));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IProfessional>>): void {
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

  protected updateForm(professional: IProfessional): void {
    this.professional = professional;
    this.professionalFormService.resetForm(this.editForm, professional);
  }
}
