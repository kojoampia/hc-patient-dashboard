import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EmergencySeverity } from 'app/entities/enumerations/emergency-severity.model';
import { EmergencyStatus } from 'app/entities/enumerations/emergency-status.model';
import { IEmergency } from '../emergency.model';
import { EmergencyService } from '../service/emergency.service';
import { EmergencyFormService, EmergencyFormGroup } from './emergency-form.service';

@Component({
  standalone: true,
  selector: 'hpd-emergency-update',
  templateUrl: './emergency-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class EmergencyUpdateComponent implements OnInit {
  isSaving = false;
  emergency: IEmergency | null = null;
  emergencySeverityValues = Object.keys(EmergencySeverity);
  emergencyStatusValues = Object.keys(EmergencyStatus);

  editForm: EmergencyFormGroup = this.emergencyFormService.createEmergencyFormGroup();

  constructor(
    protected emergencyService: EmergencyService,
    protected emergencyFormService: EmergencyFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ emergency }) => {
      this.emergency = emergency;
      if (emergency) {
        this.updateForm(emergency);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const emergency = this.emergencyFormService.getEmergency(this.editForm);
    if (emergency.id !== null) {
      this.subscribeToSaveResponse(this.emergencyService.update(emergency));
    } else {
      this.subscribeToSaveResponse(this.emergencyService.create(emergency));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IEmergency>>): void {
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

  protected updateForm(emergency: IEmergency): void {
    this.emergency = emergency;
    this.emergencyFormService.resetForm(this.editForm, emergency);
  }
}
