/** The topbar's two lines for a portal screen: a breadcrumb above, the page title below. */
export interface PageTitle {
  readonly crumbKey: string;
  readonly titleKey: string;
}

/**
 * Keyed by the first path segment.
 *
 * <p>The crumb names where the screen sits, and there are exactly two cases. A screen that is in the
 * sidebar takes its own `groupKey` from `SHELL_NAV` — "Health", "Clinical", "Account". A screen reached
 * from a parent takes the parent's nav label instead, so `case` reads "Cases ▸ Case", which is the only
 * entry of that kind today.</p>
 *
 * <p><b>The two must not be mixed up, and were until 2026-08-28:</b> `visitations` and `activity` carried
 * `nav.record`, from when they were reached from the record screen and had no sidebar entry of their own.
 * They have had entries since, so the breadcrumb said "Record" while the sidebar lit something else — the
 * same stale assumption that had `NAV_OWNER` pointing their highlight at `record`. Note the two do not
 * land in the same group: `visitations` is under Health, `activity` under Account. `shell-nav.spec.ts`
 * fails if a screen that is in the sidebar breadcrumbs to another sidebar entry.</p>
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
  visitations: { crumbKey: 'patientPortal.nav.group.health', titleKey: 'patientPortal.title.visitations' },
  activity: { crumbKey: 'patientPortal.nav.group.account', titleKey: 'patientPortal.title.activity' },
  profile: { crumbKey: 'patientPortal.nav.group.account', titleKey: 'patientPortal.title.profile' },
  // Reached from the profile screen, so it names that parent — the same form as `case` above. Without an
  // entry it fell through to its NAV_OWNER owner and the topbar read "Account > Profile" while the patient
  // was on "Delete your record": the crumb happened to be right and the title named a different screen.
  'delete-account': { crumbKey: 'patientPortal.nav.profile', titleKey: 'patientPortal.deleteAccount.title' },
};
