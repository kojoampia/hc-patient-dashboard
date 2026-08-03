import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'address',
    data: { pageTitle: 'patientDashboardApp.patientMsAddress.home.title' },
    loadChildren: () => import('./patientMS/address/address.routes'),
  },
  {
    path: 'condition',
    data: { pageTitle: 'patientDashboardApp.patientMsCondition.home.title' },
    loadChildren: () => import('./patientMS/condition/condition.routes'),
  },
  {
    path: 'medication',
    data: { pageTitle: 'patientDashboardApp.patientMsMedication.home.title' },
    loadChildren: () => import('./patientMS/medication/medication.routes'),
  },
  {
    path: 'stat',
    data: { pageTitle: 'patientDashboardApp.patientMsStat.home.title' },
    loadChildren: () => import('./patientMS/stat/stat.routes'),
  },
  {
    path: 'team',
    data: { pageTitle: 'patientDashboardApp.patientMsTeam.home.title' },
    loadChildren: () => import('./patientMS/team/team.routes'),
  },
  {
    path: 'task',
    data: { pageTitle: 'patientDashboardApp.patientMsTask.home.title' },
    loadChildren: () => import('./patientMS/task/task.routes'),
  },
  {
    path: 'membership',
    data: { pageTitle: 'patientDashboardApp.patientMsMembership.home.title' },
    loadChildren: () => import('./patientMS/membership/membership.routes'),
  },
  {
    path: 'report',
    data: { pageTitle: 'patientDashboardApp.patientMsReport.home.title' },
    loadChildren: () => import('./patientMS/report/report.routes'),
  },
  {
    path: 'metadata',
    data: { pageTitle: 'patientDashboardApp.patientMsMetadata.home.title' },
    loadChildren: () => import('./patientMS/metadata/metadata.routes'),
  },
  {
    path: 'profile',
    data: { pageTitle: 'patientDashboardApp.patientMsProfile.home.title' },
    loadChildren: () => import('./patientMS/profile/profile.routes'),
  },
  {
    path: 'payment-option',
    data: { pageTitle: 'patientDashboardApp.patientMsPaymentOption.home.title' },
    loadChildren: () => import('./patientMS/payment-option/payment-option.routes'),
  },
  {
    path: 'personal-document',
    data: { pageTitle: 'patientDashboardApp.patientMsPersonalDocument.home.title' },
    loadChildren: () => import('./patientMS/personal-document/personal-document.routes'),
  },
  {
    path: 'recommendation',
    data: { pageTitle: 'patientDashboardApp.patientMsRecommendation.home.title' },
    loadChildren: () => import('./patientMS/recommendation/recommendation.routes'),
  },
  {
    path: 'clinical-case',
    data: { pageTitle: 'patientDashboardApp.patientMsClinicalCase.home.title' },
    loadChildren: () => import('./patientMS/clinical-case/clinical-case.routes'),
  },
  {
    path: 'professional',
    data: { pageTitle: 'patientDashboardApp.patientMsProfessional.home.title' },
    loadChildren: () => import('./patientMS/professional/professional.routes'),
  },
  {
    path: 'visitation',
    data: { pageTitle: 'patientDashboardApp.patientMsVisitation.home.title' },
    loadChildren: () => import('./patientMS/visitation/visitation.routes'),
  },
  {
    path: 'emergency',
    data: { pageTitle: 'patientDashboardApp.patientMsEmergency.home.title' },
    loadChildren: () => import('./patientMS/emergency/emergency.routes'),
  },
  {
    path: 'activity-log',
    data: { pageTitle: 'patientDashboardApp.patientMsActivityLog.home.title' },
    loadChildren: () => import('./patientMS/activity-log/activity-log.routes'),
  },
  {
    path: 'care-plan-item',
    data: { pageTitle: 'patientDashboardApp.patientMsCarePlanItem.home.title' },
    loadChildren: () => import('./patientMS/care-plan-item/care-plan-item.routes'),
  },
  {
    path: 'allergy',
    data: { pageTitle: 'patientDashboardApp.patientMsAllergy.home.title' },
    loadChildren: () => import('./patientMS/allergy/allergy.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
