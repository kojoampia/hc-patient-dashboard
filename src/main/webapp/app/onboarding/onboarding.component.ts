import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { PatientContextService } from 'app/portal/data/patient-context.service';
import { LAST_STEP, ONBOARDING_STEPS, OnboardingService } from './onboarding.service';
import { OnboardingCareAngel, OnboardingCurrentState, OnboardingIdentity } from './onboarding.model';

/** The five steps, in the order they are asked and the order the backend numbers them. */
const STEP_KEYS = ['identity', 'careAngel', 'baseline', 'currentState', 'identification'] as const;
type StepKey = (typeof STEP_KEYS)[number];

/**
 * The onboarding wizard.
 *
 * <h2>Each step is saved before the next is shown</h2>
 *
 * <p>Not because a long form is tedious, but because the backend has no transaction to wrap the journey in — Mongo
 * runs standalone there — so the design makes each step independently meaningful instead. Saving as you go is what
 * turns "the tab closed halfway through" from a corrupt record into a resumable one, and it is why a returning
 * patient can be dropped back at the step they stopped at.</p>
 *
 * <h2>Step 2 does not wait for the angel</h2>
 *
 * <p>Nominating completes the step. A patient's access to their own medical history must never depend on somebody
 * else clicking a link in their inbox — a mistyped address would otherwise lock them out indefinitely.</p>
 */
@Component({
  selector: 'hpd-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export default class OnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly onboardingService = inject(OnboardingService);
  private readonly patientContext = inject(PatientContextService);
  private readonly router = inject(Router);

  readonly steps = STEP_KEYS;
  readonly stepIndex = signal(0);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly currentStep = computed<StepKey>(() => STEP_KEYS[this.stepIndex()]);
  readonly progress = computed(() => Math.round(((this.stepIndex() + 1) / STEP_KEYS.length) * 100));

  readonly identityForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    middleNames: [''],
    lastName: ['', [Validators.required]],
    birthDate: [''],
    sex: [''],
    mobilePhone: [''],
    phoneNumber: [''],
    streetAddress: [''],
    digitalAddress: [''],
    town: [''],
    city: [''],
    district: [''],
    region: [''],
    country: [''],
  });

  readonly careAngelForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    // Entered twice because a typo here sends an invitation — and, once accepted, standing access to a medical
    // record — to a stranger.
    emailConfirm: ['', [Validators.required, Validators.email]],
    contacts: [''],
    standbyFirstName: [''],
    standbyLastName: [''],
    standbyPhone: [''],
    standbyEmail: [''],
    // Never pre-ticked. This is the patient authorising a clinician to act later, and a pre-ticked box is not consent.
    advanceConsent: [false],
  });

  readonly baselineForm = this.fb.nonNullable.group({
    heightCm: [null as number | null, [Validators.required]],
    weightKg: [null as number | null, [Validators.required]],
    systolic: [null as number | null, [Validators.required]],
    diastolic: [null as number | null, [Validators.required]],
    // Optional: somebody filling this in at home may have no way to measure them, and a required field they cannot
    // answer is a wall rather than a question.
    heartRateBpm: [null as number | null],
    bloodSugarMmolL: [null as number | null],
  });

  readonly currentStateForm = this.fb.nonNullable.group({
    bloodGroup: [''],
    conditionsText: [''],
    noConditions: [false],
    allergiesText: [''],
    noAllergies: [false],
    medicationsText: [''],
    noMedications: [false],
  });

  readonly identificationForm = this.fb.nonNullable.group({
    cardType: ['', [Validators.required]],
    cardNumber: ['', [Validators.required]],
  });

  protected readonly lastStep = LAST_STEP;
  protected readonly stepNumbers = ONBOARDING_STEPS;

  /** Resumes at the step the backend recorded, so a returning patient does not re-answer what they already have. */
  constructor() {
    this.onboardingService.status().subscribe(status => {
      const answered = status.step ?? 0;
      this.stepIndex.set(Math.min(answered, STEP_KEYS.length - 1));
    });
  }

  get emailsMatch(): boolean {
    const { email, emailConfirm } = this.careAngelForm.getRawValue();
    return email.trim().toLowerCase() === emailConfirm.trim().toLowerCase();
  }

  /** A standby is optional, but naming one without consenting is not a state worth recording. */
  get standbyNeedsConsent(): boolean {
    const value = this.careAngelForm.getRawValue();
    return !!value.standbyEmail.trim() && !value.advanceConsent;
  }

  submit(): void {
    this.error.set(null);
    switch (this.currentStep()) {
      case 'identity':
        return this.save(this.onboardingService.start(this.identityPayload()));
      case 'careAngel':
        if (!this.emailsMatch) {
          return this.error.set('patientPortal.onboarding.error.emailMismatch');
        }
        if (this.standbyNeedsConsent) {
          return this.error.set('patientPortal.onboarding.error.consentRequired');
        }
        return this.save(this.onboardingService.careAngel(this.careAngelPayload()));
      case 'baseline':
        return this.save(this.onboardingService.baseline(this.baselineForm.getRawValue()));
      case 'currentState':
        return this.save(this.onboardingService.currentState(this.currentStatePayload()));
      case 'identification':
        return this.saveAndFinish();
    }
  }

  back(): void {
    this.stepIndex.update(index => Math.max(0, index - 1));
  }

  private save(request: ReturnType<OnboardingService['baseline']>): void {
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.stepIndex.update(index => Math.min(index + 1, STEP_KEYS.length - 1));
      },
      error: () => {
        this.saving.set(false);
        this.error.set('patientPortal.onboarding.error.saveFailed');
      },
    });
  }

  private saveAndFinish(): void {
    this.saving.set(true);
    this.onboardingService.identification(this.identificationForm.getRawValue()).subscribe({
      next: () =>
        this.onboardingService.complete().subscribe({
          next: () => {
            this.saving.set(false);
            // Without this the portal opens on the cached null from before the record existed, and every screen shows
            // its empty state over a record that is now full.
            this.patientContext.reload();
            void this.router.navigate(['/overview']);
          },
          error: () => {
            this.saving.set(false);
            this.error.set('patientPortal.onboarding.error.saveFailed');
          },
        }),
      error: () => {
        this.saving.set(false);
        this.error.set('patientPortal.onboarding.error.saveFailed');
      },
    });
  }

  private identityPayload(): OnboardingIdentity {
    const value = this.identityForm.getRawValue();
    return {
      firstName: value.firstName,
      middleNames: value.middleNames || null,
      lastName: value.lastName,
      birthDate: value.birthDate || null,
      sex: value.sex || null,
      mobilePhone: value.mobilePhone || null,
      phoneNumber: value.phoneNumber || null,
      address: {
        streetAddress: value.streetAddress || null,
        digitalAddress: value.digitalAddress || null,
        town: value.town || null,
        city: value.city || null,
        district: value.district || null,
        region: value.region || null,
        country: value.country || null,
      },
    };
  }

  private careAngelPayload(): OnboardingCareAngel {
    const value = this.careAngelForm.getRawValue();
    const standbyEmail = value.standbyEmail.trim();
    return {
      firstName: value.firstName,
      lastName: value.lastName,
      fullName: `${value.firstName} ${value.lastName}`.trim(),
      phone: value.phone || null,
      email: value.email.trim(),
      contacts: value.contacts || null,
      standby: standbyEmail
        ? {
            firstName: value.standbyFirstName,
            lastName: value.standbyLastName,
            fullName: `${value.standbyFirstName} ${value.standbyLastName}`.trim(),
            phone: value.standbyPhone || null,
            email: standbyEmail,
          }
        : null,
      advanceConsent: value.advanceConsent,
    };
  }

  /**
   * Free text becomes one entry per line.
   *
   * <p>The "none" flags are sent as booleans rather than inferred from an empty box, because the backend refuses a
   * group that is neither answered nor declared empty — "I have no allergies" and "I have not said" being different
   * clinical statements.</p>
   */
  private currentStatePayload(): OnboardingCurrentState {
    const value = this.currentStateForm.getRawValue();
    const lines = (text: string): string[] =>
      text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    return {
      bloodGroup: value.bloodGroup || null,
      conditions: lines(value.conditionsText).map(name => ({ name })),
      noConditions: value.noConditions,
      allergies: lines(value.allergiesText).map(name => ({ name })),
      noAllergies: value.noAllergies,
      medications: lines(value.medicationsText).map(name => ({ name })),
      noMedications: value.noMedications,
    };
  }
}
