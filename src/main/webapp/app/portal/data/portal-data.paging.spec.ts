import { TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, of } from 'rxjs';

import { IReport } from 'app/entities/patientMS/report/report.model';
import { ReportService } from 'app/entities/patientMS/report/service/report.service';

import { PatientContextService } from './patient-context.service';
import { PortalDataService } from './portal-data.service';

/**
 * That the portal reads a whole collection rather than its first page.
 *
 * Six of the api's patient collections are paginated — cases, reports, medications, visitations,
 * schedules and activity — and this service used to ask for none of them by page. Spring answers a
 * request carrying no `size` with its own default of 20, so a patient with 21 reports saw 20, with
 * a 200, no error and nothing in the console. Nothing failed; the record was just shorter than the
 * record.
 *
 * These assert against the *header*, not against a row count, because a row count alone passes
 * whether the fix is real or the fixture is small — which is exactly how the defect survived: the
 * seeded records are all under twenty.
 */
describe('PortalDataService — reading past the first page', () => {
  const report = (id: string): IReport => ({ id, patientId: 'patient-1' }) as IReport;

  const page = (rows: IReport[], total?: number): HttpResponse<IReport[]> =>
    new HttpResponse({
      body: rows,
      headers: total === undefined ? new HttpHeaders() : new HttpHeaders({ 'X-Total-Count': String(total) }),
    });

  let query: jest.Mock;
  let service: PortalDataService;

  const build = (): void => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReportService, useValue: { query } },
        { provide: PatientContextService, useValue: { patientId$: of('patient-1'), reload: jest.fn() } },
      ],
    });
    service = TestBed.inject(PortalDataService);
  };

  it('asks for an explicit page size rather than accepting the server default', async () => {
    query = jest.fn().mockReturnValue(of(page([report('r1')], 1)));
    build();

    await firstValueFrom(service.reports$);

    // The whole defect in one assertion. A request with no `size` is answered with 20 rows and a
    // 200, so every other check in this suite would pass while the screen was short.
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ patientId: 'patient-1', page: 0, size: 100 }));
  });

  it('fetches the remaining pages when the total exceeds the first one', async () => {
    const first = Array.from({ length: 100 }, (_unused, index) => report(`a${index}`));
    const second = Array.from({ length: 40 }, (_unused, index) => report(`b${index}`));

    query = jest.fn().mockImplementation((req: { page: number }) => of(req.page === 0 ? page(first, 140) : page(second, 140)));
    build();

    const rows = await firstValueFrom(service.reports$);

    expect(rows).toHaveLength(140);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 100 }));
  });

  it('makes one request when the endpoint sends no X-Total-Count', async () => {
    // `stats` is unpaginated today and answers in full. Paging until a short page arrived would
    // stop here for the wrong reason — right answer, wrong rule, and it would break the day that
    // endpoint gains a Pageable.
    query = jest.fn().mockReturnValue(of(page([report('r1'), report('r2')])));
    build();

    const rows = await firstValueFrom(service.reports$);

    expect(rows).toHaveLength(2);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('stops at the page cap rather than trusting a wrong total', async () => {
    // A header claiming far more than exists must cost a slow screen, not a hung tab.
    query = jest.fn().mockImplementation(() => of(page([report('r')], 10_000_000)));
    build();

    await firstValueFrom(service.reports$);

    expect(query).toHaveBeenCalledTimes(20);
  });
});
