import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ActivityKind } from 'app/entities/enumerations/activity-kind.model';
import { ActivitySource } from 'app/entities/enumerations/activity-source.model';
import { IActivityLog } from '../activity-log.model';
import { ActivityLogService } from '../service/activity-log.service';
import { ActivityLogFormService, ActivityLogFormGroup } from './activity-log-form.service';

@Component({
  standalone: true,
  selector: 'hpd-activity-log-update',
  templateUrl: './activity-log-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ActivityLogUpdateComponent implements OnInit {
  isSaving = false;
  activityLog: IActivityLog | null = null;
  activityKindValues = Object.keys(ActivityKind);
  activitySourceValues = Object.keys(ActivitySource);

  editForm: ActivityLogFormGroup = this.activityLogFormService.createActivityLogFormGroup();

  constructor(
    protected activityLogService: ActivityLogService,
    protected activityLogFormService: ActivityLogFormService,
    protected activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ activityLog }) => {
      this.activityLog = activityLog;
      if (activityLog) {
        this.updateForm(activityLog);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const activityLog = this.activityLogFormService.getActivityLog(this.editForm);
    if (activityLog.id !== null) {
      this.subscribeToSaveResponse(this.activityLogService.update(activityLog));
    } else {
      this.subscribeToSaveResponse(this.activityLogService.create(activityLog));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IActivityLog>>): void {
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

  protected updateForm(activityLog: IActivityLog): void {
    this.activityLog = activityLog;
    this.activityLogFormService.resetForm(this.editForm, activityLog);
  }
}
