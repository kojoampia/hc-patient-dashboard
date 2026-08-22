import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
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

  const create = (): void => {
    fixture = TestBed.createComponent(PatientFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const respond = (profiles: IProfile[]): void => {
    profileService.query.mockReturnValue(of(new HttpResponse({ body: profiles })));
  };

  beforeEach(() => {
    sessionStorage.clear();
    profileService = { query: jest.fn() };
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), PatientFinderComponent],
      providers: [{ provide: ProfileService, useValue: profileService }],
    });
    actingAsService = TestBed.inject(ActingAsService);
  });

  it('lists the patients it loaded', () => {
    respond([kojo, ama]);

    create();

    expect(component.state()).toBe('ready');
    expect(component.matches()).toHaveLength(2);
  });

  it('filters on name, email and patient id alike', () => {
    respond([kojo, ama]);
    create();

    component.search.set('ampia');
    expect(component.matches()).toEqual([kojo]);

    component.search.set('ama@example');
    expect(component.matches()).toEqual([ama]);

    component.search.set('patient-2');
    expect(component.matches()).toEqual([ama]);

    component.search.set('  KOJO  ');
    expect(component.matches()).toEqual([kojo]);
  });

  it('reports a failed fetch rather than showing an empty list', () => {
    // The two look identical in a table and mean opposite things: a system with no patients, or an administrator who
    // cannot see the patients that are there.
    profileService.query.mockReturnValue(throwError(() => new Error('offline')));

    create();

    expect(component.state()).toBe('failed');
    expect(component.profiles()).toEqual([]);
  });

  it('opens the record under the patientId the collections are keyed by', () => {
    respond([kojo]);
    create();

    component.open(kojo);

    expect(actingAsService.header()).toBe('patient-1');
    expect(actingAsService.current()?.name).toBe('Kojo Ampia-Addison');
    expect(actingAsService.actingForSomeoneElse()).toBe(true);
  });

  it('falls back to the profile id when patientId was never set', () => {
    // Profiles written before the field existed have only their own id, and PatientScope resolves identity with the
    // same fallback. Sending the other one scopes every later request to a patient with no records, which reads as
    // an empty chart rather than as a mistake.
    const legacy = profile({ id: 'legacy-9', patientId: null, firstName: 'Yaw', lastName: 'Boateng' });
    respond([legacy]);
    create();

    component.open(legacy);

    expect(actingAsService.header()).toBe('legacy-9');
  });

  it('names a row by email when the profile has no name yet', () => {
    const unnamed = profile({ id: 'p3', patientId: 'patient-3', email: 'nobody@example.test' });

    respond([unnamed]);
    create();

    // Never the raw id: a row reading "664f…" is not a person.
    expect(component.nameOf(unnamed)).toBe('nobody@example.test');
  });

  it('says so when the list may not be everybody', () => {
    respond([kojo, ama]);
    create();

    expect(component.truncated()).toBe(false);
  });
});
