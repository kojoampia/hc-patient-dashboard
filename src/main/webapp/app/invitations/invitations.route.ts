import { Routes } from '@angular/router';

/**
 * Reachable whatever the caller's own onboarding state, because a care angel need not be a patient.
 *
 * Deliberately no guard beyond the signed-in one on its parent: the screen only ever shows nominations naming this
 * person, and the backend refuses an answer from anybody else.
 */
const routes: Routes = [
  {
    path: '',
    title: 'patientPortal.invitations.title',
    loadComponent: () => import('./invitations.component'),
  },
];

export default routes;
