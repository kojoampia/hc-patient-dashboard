import { Injectable, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, combineLatest, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';

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
 * Rows per request when reading a collection in full.
 *
 * Larger than the server's default of 20 so that one patient's record is usually one request, and
 * small enough that it is still a page rather than "give me everything" — the point of the change
 * is to stop pretending a collection is bounded, not to pick a bigger number and hope.
 */
const PAGE_SIZE = 100;

/**
 * A stop, so a wrong `X-Total-Count` costs one slow screen rather than a browser tab.
 *
 * 20 pages is 2,000 rows of a single collection for a single patient. Reaching it means either the
 * header is wrong or this data no longer belongs in a fetch-everything portal, and both are
 * findings rather than something to page quietly past.
 */
const MAX_PAGES = 20;

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
        return this.everyPage<T>(service, { patientId, ...extraParams }).pipe(
          map(rows => rows.filter(item => item.patientId === patientId)),
          // One failed collection must not blank the whole screen; the list renders empty.
          catchError(() => of([] as T[])),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * Fetches a collection in full, however many pages the server splits it into.
   *
   * **This method exists because the portal was reading the first page and calling it the record.**
   * Six of the twelve collections above are paginated server-side — cases, reports, medications,
   * visitations, schedules and activity — and this service asked for none of them by page. Spring
   * answers a request with no `size` using its own default of 20, so a patient with 21 visits saw
   * 20, with a 200, no error, and no console line. Measured on the quality stack 2026-08-31:
   * `GET /api/reports` returns `X-Total-Count: 11` and honours `?size=3` by returning three.
   *
   * It had not bitten yet only because the seeded records are all under twenty — which is a
   * property of the fixtures, not of the design. Vital signs cross it in a fortnight.
   *
   * The shape is deliberate. **Read the total from `X-Total-Count` rather than paging until a short
   * page arrives**: a short page is also what an unpaginated endpoint returns, and `stats` is
   * unpaginated today, so "stop when the page is short" would have been correct for the wrong
   * reason and would break the day `stats` gains a `Pageable`. An endpoint that sends no
   * `X-Total-Count` is answering in full, and one request is the whole answer.
   *
   * Page 0 is fetched first because its header is what says how many more are needed; the rest go
   * out together rather than in sequence, since they do not depend on each other.
   */
  private everyPage<T>(
    service: { query(req?: unknown): Observable<HttpResponse<T[]>> },
    params: Record<string, unknown>,
  ): Observable<T[]> {
    return service.query({ ...params, page: 0, size: PAGE_SIZE }).pipe(
      switchMap(first => {
        const rows = first.body ?? [];
        const total = Number(first.headers.get('X-Total-Count') ?? rows.length);

        // No header, or everything already in hand.
        if (!Number.isFinite(total) || total <= rows.length) {
          return of(rows);
        }

        const pages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES);
        if (pages <= 1) {
          return of(rows);
        }

        const rest = Array.from({ length: pages - 1 }, (_unused, index) =>
          service.query({ ...params, page: index + 1, size: PAGE_SIZE }).pipe(map(response => response.body ?? [])),
        );
        return forkJoin(rest).pipe(map(later => rows.concat(...later)));
      }),
    );
  }
}
