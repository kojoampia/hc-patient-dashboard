/**
 * Every portal destination that is *computed* rather than written into a template.
 *
 * <p>This file exists so that `portal-links.spec.ts` can check them. That spec walks the templates and
 * resolves each literal `routerLink` against the real route configuration, which is what caught the
 * "Delete your record" button pointing at a path no route defines. It could never see these three:
 * `[routerLink]="tile.link"` and `[routerLink]="caseLink(...)"` carry an expression, and the destination
 * lived in a component field the spec had no way to reach without standing the whole component up.</p>
 *
 * <p>So the destinations moved out to where a test can read them, rather than the test growing a scraper
 * for TypeScript. The same answer the sidebar already had — its paths are checked by asserting `SHELL_NAV`
 * and `SHELL_TABS` directly, because that is where they come from.</p>
 *
 * <p><b>A new computed link belongs here.</b> Put one in a component and it is invisible again, and the
 * failure is the quiet kind: `routerLink` takes any string, the anchor renders, the href looks plausible,
 * and only the person who clicks it finds out.</p>
 */

/**
 * Where the overview's tiles go.
 *
 * <p>Keyed by what the tile counts rather than by its destination, because two of them deliberately share
 * one — diet and exercise are both care-plan items and both open `/plans`.</p>
 */
export const OVERVIEW_TILE_LINKS = {
  openCases: '/cases',
  upcoming: '/schedules',
  activeMeds: '/medications',
  reports: '/reports',
  emergencies: '/emergencies',
  allergies: '/allergies',
  diet: '/plans',
  exercise: '/plans',
} as const;

/**
 * The route to a case, or null for a record that does not belong to one.
 *
 * <p>Given straight to `[routerLink]`, which renders no `href` at all for null — so a row with no case to
 * open is not a link, rather than a link that goes nowhere.</p>
 */
export function caseLink(caseId: string | null | undefined): string[] | null {
  return caseId ? ['/case', caseId] : null;
}
