import { Routes } from '@angular/router';

import { onboardingCompleteGuard } from './onboarding.guard';

/**
 * The wizard, on the signed-out layout but behind the signed-in guard.
 *
 * <p>A patient here has an account and a token but no record, which is a state neither existing layout was built for.
 * The portal shell is wrong — its sidebar is a list of destinations that would all be empty — and it would fire the
 * patient-scoped fetches the shell makes on load, for a patient who does not exist yet.</p>
 */
const routes: Routes = [
  {
    path: '',
    canActivate: [onboardingCompleteGuard],
    title: 'patientPortal.onboarding.title',
    loadComponent: () => import('./onboarding.component'),
  },
];

export default routes;
