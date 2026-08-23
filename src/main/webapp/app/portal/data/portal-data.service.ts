import { Injectable, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, combineLatest, map, of, shareReplay, switchMap } from 'rxjs';

import { IActivityLog } from 'app/entities/patientMS/activity-log/activity-log.model';
import { IAllergy } from 'app/entities/patientMS/allergy/allergy.model';
import { ICarePlanItem } from 'app/entities/patientMS/care-plan-item/care-plan-item.model';
import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';
import { ICondition } from 'app/entities/patientMS/condition/condition.model';
import { IEmergency } from 'app/entities/patientMS/emergency/emergency.model';
import { IMedication } from 'app/entities/patientMS/medication/medication.model';
import { IMembership } from 'app/entities/patientMS/membership/membership.model';
import { IReport } from 'app/entities/patientMS/report/report.model';
import { IStat } from 'app/entities/patientMS/stat/stat.model';
import { ITask } from 'app/entities/patientMS/task/task.model';
import { IVisitation } from 'app/entities/patientMS/visitation/visitation.model';

import { byDateDesc } from './portal-format';

import { ActivityLogService } from 'app/entities/patientMS/activity-log/service/activity-log.service';
import { AllergyService } from 'app/entities/patientMS/allergy/service/allergy.service';
import { CarePlanItemService } from 'app/entities/patientMS/care-plan-item/service/care-plan-item.service';
import { ClinicalCaseService } from 'app/entities/patientMS/clinical-case/service/clinical-case.service';
import { ConditionService } from 'app/entities/patientMS/condition/service/condition.service';
import { EmergencyService } from 'app/entities/patientMS/emergency/service/emergency.service';
import { MedicationService } from 'app/entities/patientMS/medication/service/medication.service';
import { MembershipService } from 'app/entities/patientMS/membership/service/membership.service';
import { ReportService } from 'app/entities/patientMS/report/service/report.service';
import { StatService } from 'app/entities/patientMS/stat/service/stat.service';
import { TaskService } from 'app/entities/patientMS/task/service/task.service';
import { VisitationService } from 'app/entities/patientMS/visitation/service/visitation.service';

import { PatientContextService } from './patient-context.service';

/** Anything the portal lists carries the patient it belongs to. */
interface PatientScoped {
  patientId?: string | null;
}

/**
 * Every collection the portal reads, already narrowed to the signed-in patient.
 *
 * Screens depend on this rather than on the generated entity services directly, for two reasons:
 * the patient filter is applied in exactly one place, and each collection is fetched once and
 * shared across the screens that need it — the overview alone would otherwise re-request cases,
 * vitals, medications and appointments that the individual screens fetch again a click later.
 */
@Injectable({ providedIn: 'root' })
export class PortalDataService {
  private readonly context = inject(PatientContextService);

  /**
   * Every case, archived or not — one request, split three ways below.
   *
   * The api excludes archived cases from `GET /api/clinical-cases` unless asked, which is right for
   * a clinician's queue and wrong for a patient's own history: their case did not stop having
   * happened. Asking for everything once and filtering here costs nothing extra and keeps the three
   * views consistent with each other.
   */
  private readonly allCases$ = this.scoped<IClinicalCase>(inject(ClinicalCaseService), { includeArchived: true });

  /** The working list: what is still live. Every screen that counts or lists cases reads this. */
  readonly cases$ = this.allCases$.pipe(
    map(cases => cases.filter(item => !item.archivedAt)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /** What a professional retired, newest first. Shown collapsed rather than mixed into the list. */
  readonly archivedCases$ = this.allCases$.pipe(
    map(cases => cases.filter(item => item.archivedAt).sort(byDateDesc(item => item.archivedAt))),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  readonly vitals$ = this.scoped<IStat>(inject(StatService));
  readonly medications$ = this.scoped<IMedication>(inject(MedicationService));
  readonly reports$ = this.scoped<IReport>(inject(ReportService));
  readonly schedules$ = this.scoped<ITask>(inject(TaskService));
  readonly visitations$ = this.scoped<IVisitation>(inject(VisitationService));
  readonly emergencies$ = this.scoped<IEmergency>(inject(EmergencyService));
  readonly activity$ = this.scoped<IActivityLog>(inject(ActivityLogService));
  readonly carePlan$ = this.scoped<ICarePlanItem>(inject(CarePlanItemService));
  readonly allergies$ = this.scoped<IAllergy>(inject(AllergyService));
  readonly conditions$ = this.scoped<ICondition>(inject(ConditionService));
  readonly memberships$ = this.scoped<IMembership>(inject(MembershipService));

  /**
   * Cases indexed by id, so a medication or report can name the case it belongs to.
   *
   * Built from every case rather than only the live ones, and that is the fix for something the
   * api's archiving default quietly broke: a report attached to a case a clinician later archived
   * would find nothing here and render with its case name missing.
   */
  readonly casesById$: Observable<ReadonlyMap<string, IClinicalCase>> = this.allCases$.pipe(
    map(cases => new Map(cases.map(item => [item.id, item]))),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /** Re-fetches everything. The context owns the trigger, so this also refreshes the care team. */
  reload(): void {
    this.context.reload();
  }

  /**
   * Fetches a collection for the current patient.
   *
   * `patientId` goes to the server as a query parameter; the same filter is then applied again
   * on the response. That is not redundant — a service that does not yet honour the parameter
   * returns everything, and the portal must not show one patient another's records because a
   * backend was behind.
   */
  private scoped<T extends PatientScoped>(
    service: { query(req?: unknown): Observable<HttpResponse<T[]>> },
    extraParams: Record<string, unknown> = {},
  ): Observable<readonly T[]> {
    return combineLatest([this.context.patientId$]).pipe(
      switchMap(([patientId]) => {
        if (!patientId) {
          return of([] as T[]);
        }
        return service.query({ patientId, ...extraParams }).pipe(
          map(response => (response.body ?? []).filter(item => item.patientId === patientId)),
          // One failed collection must not blank the whole screen; the list renders empty.
          catchError(() => of([] as T[])),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
}
