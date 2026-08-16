import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
import dayjs from 'dayjs/esm';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';

import { CareTeamMember, PatientContextService } from './patient-context.service';

const ACCOUNT = { email: 'kojo@jac.net' } as Account;

describe('PatientContextService', () => {
  describe('the profile fetched by email', () => {
    let service: PatientContextService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: AccountService, useValue: { identity: () => of(ACCOUNT) } },
        ],
      });
      service = TestBed.inject(PatientContextService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('converts birthDate to a dayjs, as the entity service would', done => {
      // This endpoint is fetched directly, so nothing else applies the conversion. Left as the raw
      // string it emptied /record and the profile's About tab — every formatter threw on it.
      service.profile$.subscribe(profile => {
        expect(dayjs.isDayjs(profile?.birthDate)).toBe(true);
        expect(profile?.birthDate?.format('DD MMM YYYY')).toBe('19 Apr 1976');
        done();
      });

      httpMock
        .expectOne(req => req.url.endsWith('/api/profiles/email/kojo%40jac.net'))
        .flush({ id: 'patient-kojo', patientId: 'patient-kojo', birthDate: '1976-04-19' });
    });

    it('leaves birthDate unset when the record has none', done => {
      service.profile$.subscribe(profile => {
        expect(profile?.birthDate).toBeUndefined();
        done();
      });

      httpMock.expectOne(req => req.url.includes('/api/profiles/email/')).flush({ id: 'patient-kojo' });
    });

    it('treats a patient with no profile document as an empty state, not an error', done => {
      service.profile$.subscribe(profile => {
        expect(profile).toBeNull();
        done();
      });

      httpMock.expectOne(req => req.url.includes('/api/profiles/email/')).flush('nope', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('authorNameOf', () => {
    const grace: CareTeamMember = {
      id: 'professional-grace',
      name: 'Dr. Grace Mensah',
      role: 'General Practitioner',
      initials: 'GM',
      location: 'Accra · Osu',
      imageUrl: null,
    };
    const careTeam = new Map([[grace.id, grace]]);

    it('credits the patient for what the patient wrote', () => {
      // The case timeline resolved authorId first and fell through to the "Care team" stand-in, so
      // the portal told the patient their own note was written by somebody else.
      expect(PatientContextService.authorNameOf(careTeam, { source: 'PATIENT', authorId: null })).toBe('You');
    });

    it('still credits the patient when an authorId happens to be set', () => {
      expect(PatientContextService.authorNameOf(careTeam, { source: 'PATIENT', authorId: 'professional-grace' })).toBe('You');
    });

    it('names the clinician for a professional entry', () => {
      expect(PatientContextService.authorNameOf(careTeam, { source: 'PROFESSIONAL', authorId: 'professional-grace' })).toBe(
        'Dr. Grace Mensah',
      );
    });

    it('names the platform for a system entry', () => {
      expect(PatientContextService.authorNameOf(careTeam, { source: 'SYSTEM', authorId: null })).toBe('Abofonsa BridgeCare');
    });

    it('falls back to the care team when the professional is not on it', () => {
      expect(PatientContextService.authorNameOf(careTeam, { source: 'PROFESSIONAL', authorId: 'someone-else' })).toBe('Care team');
      expect(PatientContextService.authorNameOf(careTeam, {})).toBe('Care team');
    });
  });
});
