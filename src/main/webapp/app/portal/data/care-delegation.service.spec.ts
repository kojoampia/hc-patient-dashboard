import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CareDelegation, CareDelegationService, MineResponse, toActingAsChoices } from './care-delegation.service';

describe('CareDelegationService', () => {
  let service: CareDelegationService;
  let httpMock: HttpTestingController;

  const delegation = (over: Partial<CareDelegation>): CareDelegation =>
    ({ id: 'd1', patientId: 'p1', angelEmail: 'kofi@example.test', status: 'ACTIVE', ...over }) as CareDelegation;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CareDelegationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('toActingAsChoices', () => {
    it('offers only delegations that actually confer access', () => {
      const response: MineResponse = {
        email: 'kofi@example.test',
        self: {},
        delegations: [
          delegation({ id: 'a', patientId: 'active', status: 'ACTIVE', patientName: 'Ama' }),
          delegation({ id: 'p', patientId: 'pending', status: 'PENDING' }),
          delegation({ id: 's', patientId: 'standby', status: 'STANDBY' }),
          delegation({ id: 'r', patientId: 'revoked', status: 'REVOKED' }),
        ],
      };

      // A pending nomination and a dormant standby grant nothing. Offering either in the picker would present a
      // record the very next request refuses, which reads as a broken portal rather than as "not yet".
      expect(toActingAsChoices(response).map(choice => choice.patientId)).toEqual(['active']);
    });

    it('labels a delegated record with the patient, never the angel', () => {
      const response: MineResponse = {
        email: 'kofi@example.test',
        self: {},
        delegations: [delegation({ patientId: 'p9', patientName: 'Ama Mensah', angelName: 'Kofi Boateng' })],
      };

      // This label is how somebody tells whose medical record they are about to open. The angel's name here would be
      // their own name — which is exactly the confusion the acting-as banner exists to prevent.
      expect(toActingAsChoices(response)[0].name).toBe('Ama Mensah');
    });

    it('puts the caller first and marks it as their own', () => {
      const response: MineResponse = {
        email: 'ama@example.test',
        self: { patientId: 'me', firstName: 'Ama', lastName: 'Mensah' },
        delegations: [delegation({ patientId: 'other', patientName: 'Kwesi' })],
      };

      expect(toActingAsChoices(response)).toEqual([
        { patientId: 'me', name: 'Ama Mensah', own: true },
        { patientId: 'other', name: 'Kwesi', own: false },
      ]);
    });

    it('answers for somebody with no record of their own', () => {
      // An angel who is not themselves a patient. This is the case that cannot be resolved through the patient scope
      // at all, which is why the endpoint exists.
      const response: MineResponse = { email: 'kofi@example.test', self: {}, delegations: [] };

      expect(toActingAsChoices(response)).toEqual([]);
    });
  });

  it('lists only nominations still waiting on an answer', done => {
    service.myInvitations().subscribe(invitations => {
      expect(invitations.map(invitation => invitation.id)).toEqual(['waiting']);
      done();
    });

    httpMock
      .expectOne(request => request.url.endsWith('/mine'))
      .flush({
        email: 'kofi@example.test',
        self: {},
        delegations: [
          delegation({ id: 'waiting', status: 'PENDING' }),
          delegation({ id: 'accepted', status: 'ACTIVE' }),
          delegation({ id: 'declined', status: 'DECLINED' }),
        ],
      });
  });

  it('ends a delegation without deleting it', done => {
    service.revoke('d1').subscribe(() => done());

    // A POST to /revoke rather than a DELETE, because the record of who could act and between which dates is the
    // point — revoking sets a status.
    const request = httpMock.expectOne(req => req.url.endsWith('/d1/revoke'));
    expect(request.request.method).toBe('POST');
    request.flush(delegation({ status: 'REVOKED', revokedBy: 'PATIENT' }));
  });
});
