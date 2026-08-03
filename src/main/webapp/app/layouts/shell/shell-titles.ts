/** The topbar's two lines for a portal screen: a breadcrumb above, the page title below. */
export interface PageTitle {
  readonly crumbKey: string;
  readonly titleKey: string;
}

/**
 * Keyed by the first path segment. Screens reached from a parent — `case`, `visitations`,
 * `activity` — appear here too, so their title is their own even though the sidebar keeps the
 * parent lit.
 */
/** Shown for any path with no entry of its own, and for the portal root. */
export const DEFAULT_PAGE_TITLE: PageTitle = {
  crumbKey: 'patientPortal.nav.group.overview',
  titleKey: 'patientPortal.title.overview',
};

export const PAGE_TITLES: Readonly<Record<string, PageTitle | undefined>> = {
  overview: DEFAULT_PAGE_TITLE,
  record: { crumbKey: 'patientPortal.nav.group.health', titleKey: 'patientPortal.title.record' },
  schedules: { crumbKey: 'patientPortal.nav.group.health', titleKey: 'patientPortal.title.schedules' },
  emergencies: { crumbKey: 'patientPortal.nav.group.health', titleKey: 'patientPortal.title.emergencies' },
  cases: { crumbKey: 'patientPortal.nav.group.clinical', titleKey: 'patientPortal.title.cases' },
  case: { crumbKey: 'patientPortal.nav.cases', titleKey: 'patientPortal.title.case' },
  medications: { crumbKey: 'patientPortal.nav.group.clinical', titleKey: 'patientPortal.title.medications' },
  reports: { crumbKey: 'patientPortal.nav.group.clinical', titleKey: 'patientPortal.title.reports' },
  plans: { crumbKey: 'patientPortal.nav.group.clinical', titleKey: 'patientPortal.title.plans' },
  allergies: { crumbKey: 'patientPortal.nav.group.clinical', titleKey: 'patientPortal.title.allergies' },
  visitations: { crumbKey: 'patientPortal.nav.record', titleKey: 'patientPortal.title.visitations' },
  activity: { crumbKey: 'patientPortal.nav.record', titleKey: 'patientPortal.title.activity' },
  profile: { crumbKey: 'patientPortal.nav.group.account', titleKey: 'patientPortal.title.profile' },
};
