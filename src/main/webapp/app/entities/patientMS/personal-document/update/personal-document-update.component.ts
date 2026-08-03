import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IPersonalDocument } from '../personal-document.model';
import { PersonalDocumentService } from '../service/personal-document.service';
import { PersonalDocumentFormService, PersonalDocumentFormGroup } from './personal-document-form.service';

@Component({
  standalone: true,
  selector: 'hpd-personal-document-update',
  templateUrl: './personal-document-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class PersonalDocumentUpdateComponent implements OnInit {
  isSaving = false;
  personalDocument: IPersonalDocument | null = null;

  editForm: PersonalDocumentFormGroup = this.personalDocumentFormService.createPersonalDocumentFormGroup();

  constructor(
    protected personalDocumentService: PersonalDocumentService,
    protected personalDocumentFormService: PersonalDocumentFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ personalDocument }) => {
      this.personalDocument = personalDocument;
      if (personalDocument) {
        this.updateForm(personalDocument);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const personalDocument = this.personalDocumentFormService.getPersonalDocument(this.editForm);
    if (personalDocument.id !== null) {
      this.subscribeToSaveResponse(this.personalDocumentService.update(personalDocument));
    } else {
      this.subscribeToSaveResponse(this.personalDocumentService.create(personalDocument));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPersonalDocument>>): void {
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

  protected updateForm(personalDocument: IPersonalDocument): void {
    this.personalDocument = personalDocument;
    this.personalDocumentFormService.resetForm(this.editForm, personalDocument);
  }
}
