/** Where a patient is in the journey, as `GET /api/onboarding/status` reports it. */
export interface OnboardingStatus {
  /** Null means COMPLETE — every profile written before onboarding existed reads null. */
  readonly status: 'IN_PROGRESS' | 'COMPLETE' | null;
  /** The highest step answered, so a returning patient resumes rather than restarts. */
  readonly step: number | null;
  /** Null when there is no record at all, which is what "not started" actually is. */
  readonly profileId: string | null;
  /** The backend's own answer to the guard's question, so the rule lives in one place. */
  readonly onboarded: boolean;
}

export interface OnboardingAddress {
  digitalAddress?: string | null;
  streetAddress?: string | null;
  areaCode?: string | null;
  town?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  region?: string | null;
  country?: string | null;
}

/** Step 1. `email`, `patientId` and `id` are deliberately absent: the server takes identity from the token. */
export interface OnboardingIdentity {
  firstName: string;
  middleNames?: string | null;
  lastName: string;
  birthDate?: string | null;
  sex?: string | null;
  mobilePhone?: string | null;
  phoneNumber?: string | null;
  address?: OnboardingAddress | null;
}

/** Step 2. Completes on nomination — it does not wait for the angel to accept. */
export interface OnboardingCareAngel {
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  email: string;
  contacts?: string | null;
  standby?: OnboardingStandbyNominee | null;
  /** Required when a standby is named: it is the only record that the patient ever agreed to it. */
  advanceConsent?: boolean | null;
}

export interface OnboardingStandbyNominee {
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  email: string;
}

/** Step 3. Heart rate and blood sugar are optional — a patient at home may have no way to measure them. */
export interface OnboardingBaseline {
  heightCm: number | null;
  weightKg: number | null;
  systolic: number | null;
  diastolic: number | null;
  heartRateBpm?: number | null;
  bloodSugarMmolL?: number | null;
}

/**
 * Step 4.
 *
 * Each repeatable group carries an explicit "none" flag, because "I have no allergies" and "I have not answered yet"
 * are different clinical statements and an empty list cannot tell them apart.
 */
export interface OnboardingCurrentState {
  bloodGroup?: string | null;
  conditions?: OnboardingConditionEntry[] | null;
  noConditions?: boolean | null;
  allergies?: OnboardingAllergyEntry[] | null;
  noAllergies?: boolean | null;
  medications?: OnboardingMedicationEntry[] | null;
  noMedications?: boolean | null;
}

export interface OnboardingConditionEntry {
  name: string;
  description?: string | null;
}

export interface OnboardingAllergyEntry {
  name: string;
  category?: string | null;
  severity?: string | null;
  reaction?: string | null;
}

export interface OnboardingMedicationEntry {
  name: string;
  dosage?: string | null;
  prescription?: string | null;
  status?: string | null;
  startedOn?: string | null;
}

/** Step 5. Required, and with no "none" accepted. */
export interface OnboardingIdentification {
  cardType: string;
  cardNumber: string;
}

/** What `POST /api/care-angels` answers on the gateway. Never carries the reset key. */
export interface CareAngelAccount {
  readonly login: string;
  readonly email: string;
  readonly accountExisted: boolean;
}
