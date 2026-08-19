import { TestBed } from '@angular/core/testing';

import { ActingAsChoice, ActingAsService } from './acting-as.service';

describe('ActingAsService', () => {
  let service: ActingAsService;

  const own: ActingAsChoice = { patientId: 'me', name: 'Ama Mensah', own: true };
  const delegated: ActingAsChoice = { patientId: 'other', name: 'Kwesi Boateng', own: false };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActingAsService);
  });

  it('asks for a choice only when there is genuinely one to make', () => {
    service.setAvailable([own]);

    // One option is not a decision — somebody with only their own record must never see a picker.
    expect(service.mustChoose()).toBe(false);
    expect(service.current()).toEqual(own);
    expect(service.actingForSomeoneElse()).toBe(false);
  });

  it('waits for a choice when a person is both a patient and an angel', () => {
    service.setAvailable([own, delegated]);

    expect(service.mustChoose()).toBe(true);
    expect(service.header()).toBeNull();
  });

  it('reports acting for somebody else only when the record is not their own', () => {
    service.setAvailable([own, delegated]);

    service.select('other');
    expect(service.actingForSomeoneElse()).toBe(true);
    expect(service.header()).toBe('other');

    service.select('me');
    expect(service.actingForSomeoneElse()).toBe(false);
  });

  it('drops a remembered selection the person no longer holds', () => {
    service.setAvailable([own, delegated]);
    service.select('other');

    // The delegation was revoked between one page load and the next. A stale selection surviving in storage would ask
    // the backend for a record it will refuse, which reads to the user as a broken portal rather than a revocation.
    service.setAvailable([own]);

    expect(service.header()).toBe('me');
  });

  it('forgets everything on sign-out', () => {
    service.setAvailable([own, delegated]);
    service.select('other');

    service.clear();

    // Whoever signs in next at this browser must not inherit a selection, least of all one naming somebody else's
    // medical record.
    expect(service.header()).toBeNull();
    expect(sessionStorage.getItem('hc-acting-as')).toBeNull();
  });
});
