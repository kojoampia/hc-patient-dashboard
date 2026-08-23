import { TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import dayjs from 'dayjs/esm';
import { firstValueFrom, of } from 'rxjs';

import { IClinicalCase } from 'app/entities/patientMS/clinical-case/clinical-case.model';
import { ClinicalCaseService } from 'app/entities/patientMS/clinical-case/service/clinical-case.service';

import { PatientContextService } from './patient-context.service';
import { PortalDataService } from './portal-data.service';

/**
 * How one fetch of cases becomes three views of them.
 *
 * The split is worth its own spec because each half fails silently in a different way: the working
 * list quietly growing to include retired cases, the archived section quietly staying empty, or the
 * by-id map quietly losing the case a report names.
 */
describe('PortalDataService — live, archived and by-id', () => {
  const live = (over: Partial<IClinicalCase> = {}): IClinicalCase =>
    ({ id: 'live-1', patientId: 'patient-1', title: 'A sore throat', ...over }) as IClinicalCase;

  const archived = (over: Partial<IClinicalCase> = {}): IClinicalCase =>
    ({
      id: 'gone-1',
      patientId: 'patient-1',
      title: 'Resolved last year',
      archivedAt: dayjs('2026-08-12T09:00:00Z'),
      archivedById: 'grace',
      ...over,
    }) as IClinicalCase;

  let query: jest.Mock;
  let service: PortalDataService;

  const build = (cases: IClinicalCase[]): void => {
    query = jest.fn().mockReturnValue(of(new HttpResponse({ body: cases })));
    TestBed.configureTestingModule({
      providers: [
        // PortalDataService injects every entity service, so they all need an HttpClient even
        // though only the case one is exercised here.
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ClinicalCaseService, useValue: { query } },
        { provide: PatientContextService, useValue: { patientId$: of('patient-1'), reload: jest.fn() } },
      ],
    });
    service = TestBed.inject(PortalDataService);
  };

  it('asks the server for archived cases too, once', async () => {
    build([live(), archived()]);

    await firstValueFrom(service.cases$);
    await firstValueFrom(service.archivedCases$);

    // The api hides archived cases unless asked. Without the flag the archived section can only ever
    // be empty, and it would look like "nothing has been archived" rather than "we never asked".
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ patientId: 'patient-1', includeArchived: true }));
    // One request feeding all three views, not one each.
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('keeps archived cases out of the working list', async () => {
    build([live(), archived()]);

    expect((await firstValueFrom(service.cases$)).map(c => c.id)).toEqual(['live-1']);
  });

  it('puts them in the archived list instead', async () => {
    build([live(), archived()]);

    expect((await firstValueFrom(service.archivedCases$)).map(c => c.id)).toEqual(['gone-1']);
  });

  it('orders the archived list newest first', async () => {
    build([
      archived({ id: 'older', archivedAt: dayjs('2026-01-01T00:00:00Z') }),
      archived({ id: 'newer', archivedAt: dayjs('2026-08-20T00:00:00Z') }),
    ]);

    expect((await firstValueFrom(service.archivedCases$)).map(c => c.id)).toEqual(['newer', 'older']);
  });

  it('indexes archived cases by id as well', async () => {
    // The regression this guards: a report attached to a case a clinician later archived would find
    // nothing in the map and render with its case name missing.
    build([live(), archived()]);

    const byId = await firstValueFrom(service.casesById$);

    expect(byId.get('gone-1')?.title).toBe('Resolved last year');
    expect(byId.size).toBe(2);
  });

  it('treats a case with no archivedAt as live', async () => {
    // Cases written before the field existed have no key at all. The api reads that as live; so
    // must this, or the whole history moves into the archived section on the first load.
    build([live({ archivedAt: null }), live({ id: 'live-2', archivedAt: undefined })]);

    expect((await firstValueFrom(service.cases$)).map(c => c.id)).toEqual(['live-1', 'live-2']);
    expect(await firstValueFrom(service.archivedCases$)).toEqual([]);
  });
});
