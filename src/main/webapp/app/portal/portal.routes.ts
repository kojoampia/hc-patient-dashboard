import { Routes } from '@angular/router';

/**
 * The patient portal's screens. Every one of these renders inside the shell, so the shell owns
 * the parent route and these are its children.
 *
 * `record`, `cases` and `profile` each have detail screens reached from the list rather than the
 * sidebar; `shell-nav.ts` maps those back to the nav entry that should stay lit.
 */
const routes: Routes = [
  {
    path: 'overview',
    title: 'patientPortal.title.overview',
    loadComponent: () => import('./overview/overview.component'),
  },
  {
    path: 'record',
    title: 'patientPortal.title.record',
    loadComponent: () => import('./record/record.component'),
  },
  {
    path: 'visitations',
    title: 'patientPortal.title.visitations',
    loadComponent: () => import('./visitations/visitations.component'),
  },
  {
    path: 'activity',
    title: 'patientPortal.title.activity',
    loadComponent: () => import('./activity/activity.component'),
  },
  {
    path: 'cases',
    title: 'patientPortal.title.cases',
    loadComponent: () => import('./cases/cases.component'),
  },
  {
    path: 'case/:id',
    title: 'patientPortal.title.case',
    loadComponent: () => import('./case-detail/case-detail.component'),
  },
  {
    path: 'schedules',
    title: 'patientPortal.title.schedules',
    loadComponent: () => import('./schedules/schedules.component'),
  },
  {
    path: 'emergencies',
    title: 'patientPortal.title.emergencies',
    loadComponent: () => import('./emergencies/emergencies.component'),
  },
  {
    path: 'medications',
    title: 'patientPortal.title.medications',
    loadComponent: () => import('./medications/medications.component'),
  },
  {
    path: 'reports',
    title: 'patientPortal.title.reports',
    loadComponent: () => import('./reports/reports.component'),
  },
  {
    path: 'plans',
    title: 'patientPortal.title.plans',
    loadComponent: () => import('./plans/plans.component'),
  },
  {
    path: 'allergies',
    title: 'patientPortal.title.allergies',
    loadComponent: () => import('./allergies/allergies.component'),
  },
  {
    path: 'profile',
    title: 'patientPortal.title.profile',
    loadComponent: () => import('./profile/profile.component'),
  },
  /*
   * Deliberately not a sidebar entry — it is reached from the profile screen, which is. A
   * destructive path has no business sitting in the nav beside "Activity", and `NAV_OWNER` maps it
   * back to `profile` so the sidebar stays lit on the entry the patient came from.
   *
   * Parity with hc-patient-app's `/tabs/delete-account`, which came first: the mobile app needed it
   * for Google Play's account-deletion requirement, and somebody who uses both clients should find
   * the same thing in both.
   */
  {
    path: 'delete-account',
    title: 'patientPortal.deleteAccount.title',
    loadComponent: () => import('./account/account-deletion.component'),
  },
];

export default routes;
