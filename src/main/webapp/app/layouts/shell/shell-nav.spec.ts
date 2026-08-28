import PORTAL_ROUTES from 'app/portal/portal.routes';
import { NAV_OWNER, SHELL_NAV, SHELL_TABS, navOwnerOf } from './shell-nav';

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

  it.each(SHELL_TABS)('the mobile tab %s is a sidebar entry too', tab => {
    expect(navPaths).toContain(tab);
  });
});
