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

  // --- a record opened by searching for it, rather than one held by delegation ------------------------------

  const found: ActingAsChoice = { patientId: 'found-9', name: 'Efua Sarpong', own: false };

  it('opens a record nobody delegated', () => {
    service.open(found);

    expect(service.header()).toBe('found-9');
    expect(service.actingForSomeoneElse()).toBe(true);
    expect(service.current()?.name).toBe('Efua Sarpong');
  });

  it('keeps an opened record when the delegation list is refetched', () => {
    service.open(found);

    // What the shell does on every load. The response cannot contain a record nobody delegated, so validating the
    // remembered selection against it alone would clear a perfectly valid choice — on every reload, for exactly the
    // records this was extended to hold.
    service.setAvailable([]);

    expect(service.header()).toBe('found-9');
  });

  it('restores an opened record after a reload', () => {
    service.open(found);

    // A second instance is what a reload produces: same sessionStorage, fresh service, and the shell has not yet
    // answered with the delegations.
    const reloaded = new ActingAsService();

    expect(reloaded.header()).toBe('found-9');
    expect(reloaded.current()?.name).toBe('Efua Sarpong');
  });

  it('does not offer the same patient twice when a delegation covers them too', () => {
    service.open(found);
    service.setAvailable([own, { patientId: 'found-9', name: 'Efua Sarpong', own: false }]);

    expect(service.available().filter(choice => choice.patientId === 'found-9')).toHaveLength(1);
  });

  it('forgets an opened record on sign-out', () => {
    service.open(found);

    service.clear();

    expect(service.header()).toBeNull();
    expect(sessionStorage.getItem('hc-acting-as-opened')).toBeNull();
    expect(new ActingAsService().header()).toBeNull();
  });

  it('ignores a corrupt stored record rather than sending a broken header', () => {
    sessionStorage.setItem('hc-acting-as-opened', '{"patientId":');
    sessionStorage.setItem('hc-acting-as', 'found-9');

    // Storage is untrusted input by the time it is read back: a half-written value would otherwise become a choice
    // with an undefined patientId, and the interceptor would put that on the wire.
    expect(new ActingAsService().header()).toBeNull();
  });

  it('ignores a stored record missing the fields the banner needs', () => {
    sessionStorage.setItem('hc-acting-as-opened', JSON.stringify({ patientId: 'found-9' }));
    sessionStorage.setItem('hc-acting-as', 'found-9');

    expect(new ActingAsService().header()).toBeNull();
  });
});
