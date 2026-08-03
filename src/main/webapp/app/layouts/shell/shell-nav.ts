import { Signal } from '@angular/core';

import { IconName } from 'app/shared/ui/icon/icon.constants';

/** One destination in the portal's sidebar. */
export interface ShellNavItem {
  /** Router path, relative to the portal root. */
  readonly path: string;
  /** Translation key for the label. */
  readonly labelKey: string;
  /** Shorter label for the mobile tab bar, where the full one will not fit. */
  readonly shortLabelKey?: string;
  readonly icon: IconName;
  /** Translation key for the group heading this item sits under. */
  readonly groupKey: string;
  /**
   * Optional count rendered as a badge. A signal rather than a number so the sidebar tracks live
   * data without the nav config having to know where that data comes from.
   */
  badge?: Signal<number>;
}

/**
 * The portal's navigation, in display order. Grouping is derived from `groupKey`: a heading is
 * emitted whenever it changes, so the order of this array is the order on screen.
 */
export const SHELL_NAV: readonly ShellNavItem[] = [
  { path: 'overview', labelKey: 'patientPortal.nav.overview', icon: 'home', groupKey: 'patientPortal.nav.group.health' },
  {
    path: 'record',
    labelKey: 'patientPortal.nav.record',
    shortLabelKey: 'patientPortal.nav.recordShort',
    icon: 'folder',
    groupKey: 'patientPortal.nav.group.health',
  },
  {
    path: 'schedules',
    labelKey: 'patientPortal.nav.schedules',
    shortLabelKey: 'patientPortal.nav.schedulesShort',
    icon: 'cal',
    groupKey: 'patientPortal.nav.group.health',
  },
  { path: 'emergencies', labelKey: 'patientPortal.nav.emergencies', icon: 'alert', groupKey: 'patientPortal.nav.group.health' },
  { path: 'cases', labelKey: 'patientPortal.nav.cases', icon: 'case', groupKey: 'patientPortal.nav.group.clinical' },
  { path: 'medications', labelKey: 'patientPortal.nav.medications', icon: 'pill', groupKey: 'patientPortal.nav.group.clinical' },
  { path: 'reports', labelKey: 'patientPortal.nav.reports', icon: 'report', groupKey: 'patientPortal.nav.group.clinical' },
  { path: 'plans', labelKey: 'patientPortal.nav.plans', icon: 'leaf', groupKey: 'patientPortal.nav.group.clinical' },
  { path: 'allergies', labelKey: 'patientPortal.nav.allergies', icon: 'shield', groupKey: 'patientPortal.nav.group.clinical' },
  { path: 'profile', labelKey: 'patientPortal.nav.profile', icon: 'user', groupKey: 'patientPortal.nav.group.account' },
];

/** The five destinations that fit on the mobile tab bar. */
export const SHELL_TABS: readonly string[] = ['overview', 'record', 'schedules', 'cases', 'profile'];

/**
 * Screens that are reached from a parent rather than from the sidebar. The sidebar highlights the
 * owner so a case detail page does not leave the whole nav looking unselected.
 */
export const NAV_OWNER: Readonly<Record<string, string | undefined>> = {
  cases: 'cases',
  visitations: 'record',
  activity: 'record',
};

/** Resolves the sidebar entry that should read as active for a given portal path. */
export function navOwnerOf(path: string): string {
  const head: string | undefined = path.split('/').filter(Boolean)[0];
  if (!head) {
    return 'overview';
  }
  return NAV_OWNER[head] ?? head;
}
