import PORTAL_ROUTES from 'app/portal/portal.routes';
import { NAV_OWNER, SHELL_NAV, SHELL_TABS, navOwnerOf } from './shell-nav';
import { PAGE_TITLES } from './shell-titles';

/**
 * The sidebar lights the entry the patient actually clicked.
 *
 * <p>`NAV_OWNER` exists for screens reached from a parent rather than from the nav — a case detail should
 * keep "Cases" lit rather than leaving the whole sidebar unselected. Its failure mode is quiet and in two
 * directions, and both were live until 2026-08-28.</p>
 *
 * <p><b>An entry for a screen that IS in the nav sends the highlight somewhere else.</b> `visitations` and
 * `activity` were mapped to `record` — correct when they had no sidebar entry (`patient-web.md` Phase E,
 * B1), wrong once entries were added and this map was not revisited. Clicking Visitations lit "My record".</p>
 *
 * <p><b>A missing entry lights nothing at all.</b> The map keyed `cases`, which is a nav entry and resolves
 * to itself through the fallback anyway, so the line did nothing — while `case/:id`, the detail screen it
 * was written for, had no entry and lit no part of the sidebar. `shell-titles.ts` keys that screen `case`,
 * and always did; the two files disagreed about the name of the same thing.</p>
 *
 * <p>Neither is visible to a component test, and neither breaks anything: every screen renders correctly
 * with the wrong entry lit. Only these two rules catch them.</p>
 */
describe('the sidebar highlight', () => {
  const navPaths = SHELL_NAV.map(item => item.path);

  it.each(navPaths)('%s owns itself — a nav entry may not redirect the highlight elsewhere', path => {
    expect(navOwnerOf(path)).toBe(path);
  });

  it('has no NAV_OWNER entry for a screen that is in the nav', () => {
    expect(Object.keys(NAV_OWNER).filter(key => navPaths.includes(key))).toEqual([]);
  });

  // Every routed portal screen lights something. `case/:id` is the one this map was written for, and the
  // one it missed; anything added later that is reached from a parent has to be added here too.
  const routedHeads = [
    ...new Set(
      PORTAL_ROUTES.map(route => (route.path ?? '').split('/').filter(Boolean)[0]).filter((head): head is string => Boolean(head)),
    ),
  ];

  it.each(routedHeads)('/%s lights a real sidebar entry', head => {
    expect(navPaths).toContain(navOwnerOf(head));
  });

  /*
   * ...and names itself in the topbar. A missing entry is not a blank title, which is why this had to be
   * asserted rather than noticed: `activeOwnerOrExact` falls back to the screen's NAV_OWNER owner, so
   * `delete-account` rendered "Account > Profile" — a complete, plausible topbar naming a different screen.
   */
  it.each(routedHeads)('/%s names itself in the topbar', head => {
    expect(PAGE_TITLES[head]).toBeDefined();
  });

  it.each(SHELL_TABS)('the mobile tab %s is a sidebar entry too', tab => {
    expect(navPaths).toContain(tab);
  });

  /*
   * The breadcrumb has the same two-cases-do-not-mix rule as the highlight, and broke the same way. A screen
   * in the sidebar names its own group; a screen reached from a parent names the parent — `case` reads
   * "Cases ▸ Case". `visitations` and `activity` did the second while being the first, so the crumb said
   * "Record" while the sidebar lit something else.
   *
   * The assertion is deliberately narrow: crumbs must not be *another nav entry's* label. It cannot be
   * "the crumb equals this item's groupKey", because `overview` legitimately breaks that — it is the portal
   * root and DEFAULT_PAGE_TITLE serves every unrecognised path as well, so its crumb is "Overview" rather
   * than the "Health" group it happens to sit in.
   */
  const navEntryTitles = navPaths.filter(path => path in PAGE_TITLES).map(path => [path, PAGE_TITLES[path]!.crumbKey] as const);
  const parentCrumbs = navPaths.map(path => `patientPortal.nav.${path}`);

  it.each(navEntryTitles)('%s breadcrumbs to its own group, not to another sidebar entry', (_path, crumbKey) => {
    expect(parentCrumbs).not.toContain(crumbKey);
  });
});
