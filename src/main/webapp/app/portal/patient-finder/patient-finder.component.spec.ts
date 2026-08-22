import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ActingAsService } from 'app/core/auth/acting-as.service';
import { IProfile } from 'app/entities/patientMS/profile/profile.model';
import { ProfileService } from 'app/entities/patientMS/profile/service/profile.service';

import { PatientFinderComponent } from './patient-finder.component';

describe('PatientFinderComponent', () => {
  let profileService: { query: jest.Mock };
  let actingAsService: ActingAsService;
  let fixture: ComponentFixture<PatientFinderComponent>;
  let component: PatientFinderComponent;

  const profile = (over: Partial<IProfile>): IProfile => ({ id: 'id-1', ...over }) as IProfile;

  const kojo = profile({ id: 'p1', patientId: 'patient-1', firstName: 'Kojo', lastName: 'Ampia-Addison', email: 'kojo@jac.net' });
  const ama = profile({ id: 'p2', patientId: 'patient-2', firstName: 'Ama', lastName: 'Mensah', email: 'ama@example.test' });

  /** A page of results plus the total the server reports, which is usually larger. */
  const page = (profiles: IProfile[], total = profiles.length): HttpResponse<IProfile[]> =>
    new HttpResponse({ body: profiles, headers: new HttpHeaders({ 'X-Total-Count': String(total) }) });

  const create = (): void => {
    fixture = TestBed.createComponent(PatientFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    sessionStorage.clear();
    profileService = { query: jest.fn().mockReturnValue(of(page([]))) };
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), PatientFinderComponent],
      providers: [{ provide: ProfileService, useValue: profileService }],
    });
    actingAsService = TestBed.inject(ActingAsService);
  });

  it('loads a first page without anybody typing', fakeAsync(() => {
    profileService.query.mockReturnValue(of(page([kojo, ama], 2)));

    create();
    tick(300);

    expect(component.state()).toBe('ready');
    expect(component.profiles()).toHaveLength(2);
    // No search term on the opening request: an empty box has not asked a question.
    expect(profileService.query).toHaveBeenCalledWith(expect.not.objectContaining({ search: expect.anything() }));
  }));

  it('sends the term to the server rather than filtering here', fakeAsync(() => {
    profileService.query.mockReturnValue(of(page([kojo], 1)));
    create();
    tick(300);

    component.search.set('ampia');
    fixture.detectChanges();
    tick(300);

    expect(profileService.query).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ampia' }));
  }));

  it('trims the term and waits for typing to stop', fakeAsync(() => {
    create();
    tick(300);
    const before = profileService.query.mock.calls.length;

    component.search.set('k');
    component.search.set('ko');
    component.search.set('koj');
    component.search.set('  kojo  ');
    fixture.detectChanges();
    tick(300);

    // One request for the whole word, not four, and the spaces the user left do not reach the query.
    expect(profileService.query.mock.calls.length).toBe(before + 1);
    expect(profileService.query).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'kojo' }));
  }));

  it('reports how many matched, not just how many are shown', fakeAsync(() => {
    profileService.query.mockReturnValue(of(page([kojo, ama], 453)));

    create();
    tick(300);

    expect(component.total()).toBe(453);
    expect(component.moreThanShown()).toBe(true);
  }));

  it('treats a missing total header as "this is all of them"', fakeAsync(() => {
    // Falling back to zero would put "showing 2 of 0" under a full table.
    profileService.query.mockReturnValue(of(new HttpResponse({ body: [kojo, ama] })));

    create();
    tick(300);

    expect(component.total()).toBe(2);
    expect(component.moreThanShown()).toBe(false);
  }));

  it('reports a failed fetch rather than showing an empty list', fakeAsync(() => {
    profileService.query.mockReturnValue(throwError(() => new Error('offline')));

    create();
    tick(300);

    expect(component.state()).toBe('failed');
  }));

  it('recovers when a later search succeeds', fakeAsync(() => {
    // The stream has to survive an error. catchError inside the switchMap keeps it alive; catchError on the outer
    // pipe would end it, and the box would go dead after one failed request.
    profileService.query.mockReturnValue(throwError(() => new Error('offline')));
    create();
    tick(300);
    expect(component.state()).toBe('failed');

    profileService.query.mockReturnValue(of(page([kojo], 1)));
    component.search.set('kojo');
    fixture.detectChanges();
    tick(300);

    expect(component.state()).toBe('ready');
    expect(component.profiles()).toEqual([kojo]);
  }));

  it('opens the record under the patientId the collections are keyed by', fakeAsync(() => {
    profileService.query.mockReturnValue(of(page([kojo], 1)));
    create();
    tick(300);

    component.open(kojo);

    expect(actingAsService.header()).toBe('patient-1');
    expect(actingAsService.current()?.name).toBe('Kojo Ampia-Addison');
    expect(actingAsService.actingForSomeoneElse()).toBe(true);
  }));

  it('falls back to the profile id when patientId was never set', fakeAsync(() => {
    // Profiles written before the field existed have only their own id, and PatientScope resolves identity with the
    // same fallback. Sending the other one scopes every later request to a patient with no records, which reads as
    // an empty chart rather than as a mistake.
    const legacy = profile({ id: 'legacy-9', patientId: null, firstName: 'Yaw', lastName: 'Boateng' });
    profileService.query.mockReturnValue(of(page([legacy], 1)));
    create();
    tick(300);

    component.open(legacy);

    expect(actingAsService.header()).toBe('legacy-9');
  }));

  it('names a row by email when the profile has no name yet', fakeAsync(() => {
    const unnamed = profile({ id: 'p3', patientId: 'patient-3', email: 'nobody@example.test' });
    profileService.query.mockReturnValue(of(page([unnamed], 1)));
    create();
    tick(300);

    // Never the raw id: a row reading "664f…" is not a person.
    expect(component.nameOf(unnamed)).toBe('nobody@example.test');
  }));
});
