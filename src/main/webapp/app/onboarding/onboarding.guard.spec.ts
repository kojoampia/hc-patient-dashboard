import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ActingAsService } from 'app/core/auth/acting-as.service';
import { CareDelegationService, MineResponse } from 'app/portal/data/care-delegation.service';
import { OnboardingService } from './onboarding.service';
import { onboardingGuard } from './onboarding.guard';

describe('onboardingGuard', () => {
  let onboardingService: { status: jest.Mock };
  let careDelegationService: { mine: jest.Mock };
  let actingAsService: ActingAsService;

  const run = (): any =>
    TestBed.runInInjectionContext(() => onboardingGuard({} as any, { url: '/overview' } as any));

  const mine = (delegations: any[]): MineResponse => ({ email: 'x@example.test', self: {}, delegations });

  beforeEach(() => {
    sessionStorage.clear();
    onboardingService = { status: jest.fn() };
    careDelegationService = { mine: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OnboardingService, useValue: onboardingService },
        { provide: CareDelegationService, useValue: careDelegationService },
      ],
    });
    actingAsService = TestBed.inject(ActingAsService);
  });

  it('lets an onboarded patient through', done => {
    onboardingService.status.mockReturnValue(of({ onboarded: true, status: 'COMPLETE', step: 5, profileId: 'p1' }));

    run().subscribe((result: boolean | UrlTree) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('sends a patient with no record to the wizard', done => {
    onboardingService.status.mockReturnValue(of({ onboarded: false, status: null, step: 0, profileId: null }));
    careDelegationService.mine.mockReturnValue(of(mine([])));

    run().subscribe((result: UrlTree) => {
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/onboarding');
      done();
    });
  });

  it('sends a nominated care angel to their nomination, not to the wizard', done => {
    // The trap this guards against: being an angel does not make you a patient, and a nomination that has not been
    // accepted yet is only PENDING — so it grants nothing and does not read as acting for anybody. Without this
    // branch the angel is asked to create their own patient record purely to answer somebody else's nomination, and
    // the inverse guard then keeps them in the wizard.
    onboardingService.status.mockReturnValue(of({ onboarded: false, status: null, step: 0, profileId: null }));
    careDelegationService.mine.mockReturnValue(of(mine([{ id: 'd1', patientId: 'p9', status: 'PENDING' }])));

    run().subscribe((result: UrlTree) => {
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/invitations');
      done();
    });
  });

  it('falls back to the wizard when the delegation lookup fails', done => {
    onboardingService.status.mockReturnValue(of({ onboarded: false, status: null, step: 0, profileId: null }));
    careDelegationService.mine.mockReturnValue(throwError(() => new Error('offline')));

    run().subscribe((result: UrlTree) => {
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/onboarding');
      done();
    });
  });

  it('never asks the backend when already acting for somebody', () => {
    actingAsService.setAvailable([{ patientId: 'p9', name: 'Ama', own: false }]);

    expect(run()).toBe(true);
    expect(onboardingService.status).not.toHaveBeenCalled();
  });
});
