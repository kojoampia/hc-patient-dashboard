import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import { ActingAsService } from 'app/core/auth/acting-as.service';
import { Authority } from 'app/config/authority.constants';
import { CareDelegationService, MineResponse } from 'app/portal/data/care-delegation.service';
import { OnboardingService } from './onboarding.service';
import { onboardingCompleteGuard, onboardingGuard } from './onboarding.guard';

describe('onboardingGuard', () => {
  let onboardingService: { status: jest.Mock };
  let careDelegationService: { mine: jest.Mock };
  let accountService: { hasAnyAuthority: jest.Mock };
  let actingAsService: ActingAsService;

  const run = (): any => TestBed.runInInjectionContext(() => onboardingGuard({} as any, { url: '/overview' } as any));

  const mine = (delegations: any[]): MineResponse => ({ email: 'x@example.test', self: {}, delegations });

  beforeEach(() => {
    sessionStorage.clear();
    onboardingService = { status: jest.fn() };
    careDelegationService = { mine: jest.fn() };
    accountService = { hasAnyAuthority: jest.fn().mockReturnValue(false) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OnboardingService, useValue: onboardingService },
        { provide: CareDelegationService, useValue: careDelegationService },
        { provide: AccountService, useValue: accountService },
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

  // An administrator has no Profile and is never meant to acquire one, so "not onboarded" is their steady state and
  // not a stage they are partway through. Sending them to the wizard asked them to create a patient record for a
  // staff account — and, because /admin and /entities hang off the same shell-parent this guard is attached to, it
  // redirected them out of the administrative screens themselves.
  it('lets an administrator through rather than into the wizard', () => {
    accountService.hasAnyAuthority.mockImplementation((authority: string | string[]) => authority === Authority.ADMIN);

    expect(run()).toBe(true);
    expect(accountService.hasAnyAuthority).toHaveBeenCalledWith(Authority.ADMIN);
  });

  it('never asks the backend for an administrator', () => {
    accountService.hasAnyAuthority.mockReturnValue(true);

    run();

    expect(onboardingService.status).not.toHaveBeenCalled();
    expect(careDelegationService.mine).not.toHaveBeenCalled();
  });

  it('still sends a plain patient with no record to the wizard', done => {
    // Guards the fix itself: the admin branch must not swallow the case the guard exists for.
    accountService.hasAnyAuthority.mockReturnValue(false);
    onboardingService.status.mockReturnValue(of({ onboarded: false, status: null, step: 0, profileId: null }));
    careDelegationService.mine.mockReturnValue(of(mine([])));

    run().subscribe((result: UrlTree) => {
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/onboarding');
      done();
    });
  });
});

describe('onboardingCompleteGuard', () => {
  let onboardingService: { status: jest.Mock };
  let accountService: { hasAnyAuthority: jest.Mock };

  const run = (): any => TestBed.runInInjectionContext(() => onboardingCompleteGuard({} as any, { url: '/onboarding' } as any));

  beforeEach(() => {
    sessionStorage.clear();
    onboardingService = { status: jest.fn() };
    accountService = { hasAnyAuthority: jest.fn().mockReturnValue(false) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OnboardingService, useValue: onboardingService },
        { provide: AccountService, useValue: accountService },
      ],
    });
  });

  it('keeps an onboarded patient out of the wizard', done => {
    onboardingService.status.mockReturnValue(of({ onboarded: true, status: 'COMPLETE', step: 5, profileId: 'p1' }));

    run().subscribe((result: UrlTree) => {
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/overview');
      done();
    });
  });

  it('lets an un-onboarded patient in', done => {
    onboardingService.status.mockReturnValue(of({ onboarded: false, status: null, step: 0, profileId: null }));

    run().subscribe((result: boolean) => {
      expect(result).toBe(true);
      done();
    });
  });

  // The pair has to agree about who belongs in the wizard: a rule added to one guard and not the other is how they
  // come to disagree, and two guards that disagree is a redirect loop. An administrator's status says "not
  // onboarded" and always will, so without this they are let straight in by typing the URL.
  it('turns an administrator away even though their status says not onboarded', done => {
    accountService.hasAnyAuthority.mockReturnValue(true);
    onboardingService.status.mockReturnValue(of({ onboarded: false, status: null, step: 0, profileId: null }));

    const result = run();

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/overview');
    expect(onboardingService.status).not.toHaveBeenCalled();
    done();
  });
});
