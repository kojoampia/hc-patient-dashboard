import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { PatientContextService } from 'app/portal/data/patient-context.service';

import OnboardingComponent from './onboarding.component';
import { OnboardingService } from './onboarding.service';

/**
 * The wizard's own behaviour, which was the last untested piece of Phase C.
 *
 * <p>What is worth pinning here is not the form plumbing but the three rules the journey rests on: a returning
 * patient resumes where they stopped, a step is saved before the next one is shown, and a failed save does not
 * advance. The backend has no transaction to wrap the journey in, so "each step is independently meaningful" is not
 * a nicety — it is the only thing that makes a closed tab recoverable rather than a half-written record.</p>
 */
describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;
  let onboarding: jest.Mocked<
    Pick<OnboardingService, 'status' | 'start' | 'careAngel' | 'baseline' | 'currentState' | 'identification' | 'complete'>
  >;
  let patientContext: { reload: jest.Mock };
  let router: Router;

  /** `step` as `GET /api/onboarding/status` reports it: how many steps have been answered. */
  function buildWith(step: number): void {
    onboarding = {
      status: jest.fn(() => of({ status: 'IN_PROGRESS', step, profileId: 'p1', onboarded: false })),
      start: jest.fn(() => of({})),
      careAngel: jest.fn(() => of({})),
      baseline: jest.fn(() => of({})),
      currentState: jest.fn(() => of({})),
      identification: jest.fn(() => of({})),
      complete: jest.fn(() => of({})),
    } as unknown as typeof onboarding;
    patientContext = { reload: jest.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([]), OnboardingComponent],
      providers: [
        FormBuilder,
        { provide: OnboardingService, useValue: onboarding },
        { provide: PatientContextService, useValue: patientContext },
      ],
    })
      .overrideTemplate(OnboardingComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
  }

  beforeEach(waitForAsync(() => buildWith(0)));

  describe('resuming', () => {
    it('starts at the first step for somebody who has answered nothing', () => {
      expect(component.currentStep()).toBe('identity');
    });

    it('drops a returning patient at the step they stopped at', waitForAsync(() => {
      buildWith(2);
      // Two steps answered means the third is the one to ask. Adjoa in the quality fixtures is exactly this.
      expect(component.currentStep()).toBe('baseline');
    }));

    it('clamps a completed journey to the last step rather than running off the end', waitForAsync(() => {
      buildWith(5);
      expect(component.currentStep()).toBe('identification');
      expect(component.stepIndex()).toBe(4);
    }));
  });

  describe('saving a step', () => {
    it('sends step 1 and only then shows step 2', () => {
      component.identityForm.patchValue({ firstName: 'Adjoa', lastName: 'Mensah' });

      component.submit();

      expect(onboarding.start).toHaveBeenCalledTimes(1);
      expect(component.currentStep()).toBe('careAngel');
    });

    it('stays on the step when the save fails, and says so', () => {
      onboarding.start.mockReturnValueOnce(throwError(() => new Error('nope')));
      component.identityForm.patchValue({ firstName: 'Adjoa', lastName: 'Mensah' });

      component.submit();

      // Advancing over a failed save is the one behaviour that would silently lose an answer: the next step saves
      // fine, the journey completes, and the record is missing whatever step 1 asked for.
      expect(component.currentStep()).toBe('identity');
      expect(component.error()).toBe('patientPortal.onboarding.error.saveFailed');
      expect(component.saving()).toBe(false);
    });

    it('does not leave the saving flag set after a failure', () => {
      onboarding.start.mockReturnValueOnce(throwError(() => new Error('nope')));

      component.submit();

      // The submit button is disabled while saving; a stuck flag is an unrecoverable screen.
      expect(component.saving()).toBe(false);
    });
  });

  describe('the care angel step', () => {
    beforeEach(() => {
      component.stepIndex.set(1);
      component.careAngelForm.patchValue({ firstName: 'Ophelia', lastName: 'Gaisie', email: 'ophelia@example.test' });
    });

    it('refuses a mismatched confirmation without sending anything', () => {
      component.careAngelForm.patchValue({ emailConfirm: 'ophelia@example.tset' });

      component.submit();

      // The address is typed twice because a typo here sends standing access to a medical record to a stranger.
      expect(onboarding.careAngel).not.toHaveBeenCalled();
      expect(component.error()).toBe('patientPortal.onboarding.error.emailMismatch');
      expect(component.currentStep()).toBe('careAngel');
    });

    it('accepts a confirmation that differs only in case or spacing', () => {
      component.careAngelForm.patchValue({ emailConfirm: '  Ophelia@Example.Test ' });

      component.submit();

      expect(onboarding.careAngel).toHaveBeenCalledTimes(1);
      expect(component.currentStep()).toBe('baseline');
    });

    it('refuses a standby nominee who has not been consented to', () => {
      component.careAngelForm.patchValue({ emailConfirm: 'ophelia@example.test', standbyEmail: 'esi@example.test', advanceConsent: false });

      component.submit();

      // Naming a standby is authorising a clinician to activate them later. Recording the name without the consent
      // would leave a nominee nobody agreed to.
      expect(onboarding.careAngel).not.toHaveBeenCalled();
      expect(component.error()).toBe('patientPortal.onboarding.error.consentRequired');
    });

    it('omits the standby block entirely when no standby was named', () => {
      component.careAngelForm.patchValue({ emailConfirm: 'ophelia@example.test' });

      component.submit();

      expect(onboarding.careAngel.mock.calls[0][0]).toMatchObject({ standby: null });
    });
  });

  describe('the last step', () => {
    beforeEach(() => {
      component.stepIndex.set(4);
      component.identificationForm.patchValue({ cardType: 'GHANA_CARD', cardNumber: 'GZ-228-44998' });
    });

    it('saves the identification, completes, and reloads the record before opening the portal', () => {
      component.submit();

      expect(onboarding.identification).toHaveBeenCalledTimes(1);
      expect(onboarding.complete).toHaveBeenCalledTimes(1);
      // Without the reload the portal opens on the cached null from before the record existed, and every screen
      // shows its empty state over a record that is now full.
      expect(patientContext.reload).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/overview']);
    });

    it('does not complete when the identification save fails', () => {
      onboarding.identification.mockReturnValueOnce(throwError(() => new Error('nope')));

      component.submit();

      expect(onboarding.complete).not.toHaveBeenCalled();
      expect(patientContext.reload).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.error()).toBe('patientPortal.onboarding.error.saveFailed');
    });

    it('holds the journey open when identification is unanswered', () => {
      component.identificationForm.reset({ cardType: '', cardNumber: '' });

      // "None" is deliberately not an accepted answer at step 5, and this is the binding the submit button reads —
      // `[disabled]="identificationForm.invalid || saving()"`. A patient cannot finish without identifying themselves.
      expect(component.identificationForm.invalid).toBe(true);
    });
  });

  describe('going back', () => {
    it('steps back without re-sending anything', () => {
      component.stepIndex.set(2);

      component.back();

      expect(component.currentStep()).toBe('careAngel');
      expect(onboarding.baseline).not.toHaveBeenCalled();
    });

    it('cannot step back off the front of the journey', () => {
      component.back();
      component.back();

      expect(component.stepIndex()).toBe(0);
    });
  });
});
