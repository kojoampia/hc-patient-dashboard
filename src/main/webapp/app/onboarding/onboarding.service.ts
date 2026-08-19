import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IProfile } from 'app/entities/patientMS/profile/profile.model';
import {
  CareAngelAccount,
  OnboardingBaseline,
  OnboardingCareAngel,
  OnboardingCurrentState,
  OnboardingIdentification,
  OnboardingIdentity,
  OnboardingStatus,
} from './onboarding.model';

/** The step numbers the backend reports, so a resuming patient lands where they stopped. */
export const ONBOARDING_STEPS = {
  identity: 1,
  careAngel: 2,
  baseline: 3,
  currentState: 4,
  identification: 5,
} as const;

export const LAST_STEP = ONBOARDING_STEPS.identification;

/**
 * The onboarding journey, as the portal talks to it.
 *
 * <p>Two backends are involved and the split is deliberate. The clinical record and the delegation live in the patient
 * service; only the gateway can create the account a nominated care angel signs in with. Step 2 therefore makes two
 * calls, and the order matters — the account first, so its login can be recorded with the nomination.</p>
 *
 * <p>The step paths are named rather than numbered ({@code /care-angel}, {@code /baseline}, …) because the steps carry
 * genuinely different payloads, and one endpoint taking five shapes could only be typed as a map. The numbers survive
 * in {@link OnboardingStatus.step}, which is what resuming actually reads.</p>
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly applicationConfigService = inject(ApplicationConfigService);

  private readonly onboardingUrl = this.applicationConfigService.getEndpointFor('api/onboarding', 'hcpatientservice');
  /** The gateway's own API — no microservice segment, because accounts are its business. */
  private readonly careAngelUrl = this.applicationConfigService.getEndpointFor('api/care-angels');

  /** The guard's single call. Answers for somebody with no record at all, which is the whole point. */
  status(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(`${this.onboardingUrl}/status`);
  }

  /** Step 1, and the only write that may run before a profile exists. */
  start(identity: OnboardingIdentity): Observable<IProfile> {
    return this.http.post<IProfile>(this.onboardingUrl, identity);
  }

  /**
   * Step 2: create or find the angel's account, then record the nomination.
   *
   * <p>The step completes here whether or not the angel ever accepts. A patient's access to their own record must not
   * depend on somebody else's inbox — a mistyped address would otherwise lock them out of their own medical history
   * indefinitely.</p>
   */
  careAngel(careAngel: OnboardingCareAngel): Observable<IProfile> {
    return this.http
      .post<CareAngelAccount>(this.careAngelUrl, {
        firstName: careAngel.firstName,
        lastName: careAngel.lastName,
        email: careAngel.email,
        phone: careAngel.phone,
      })
      .pipe(
        // Account first, then the nomination. If the account fails, no delegation is recorded — better than a
        // nomination pointing at somebody who has no way to sign in and accept it.
        switchMap(() => this.http.patch<IProfile>(`${this.onboardingUrl}/care-angel`, careAngel)),
      );
  }

  baseline(baseline: OnboardingBaseline): Observable<IProfile> {
    return this.http.patch<IProfile>(`${this.onboardingUrl}/baseline`, baseline);
  }

  currentState(state: OnboardingCurrentState): Observable<IProfile> {
    return this.http.patch<IProfile>(`${this.onboardingUrl}/current-state`, state);
  }

  identification(identification: OnboardingIdentification): Observable<IProfile> {
    return this.http.patch<IProfile>(`${this.onboardingUrl}/identification`, identification);
  }

  complete(): Observable<IProfile> {
    return this.http.post<IProfile>(`${this.onboardingUrl}/complete`, {});
  }
}
