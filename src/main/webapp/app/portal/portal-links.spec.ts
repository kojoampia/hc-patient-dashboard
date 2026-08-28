import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Routes } from '@angular/router';

import APP_ROUTES from 'app/app.routes';
import { SHELL_NAV, SHELL_TABS } from 'app/layouts/shell/shell-nav';

/**
 * Every link the portal renders points at a route that exists.
 *
 * <p>This is here because a component spec cannot catch the defect it was written for. On 2026-08-25 the
 * account-deletion screen shipped complete — component, service, three states, translations in all three
 * locales — behind a "Delete your record" button on the profile screen that pointed at
 * `/portal/delete-account`. The portal's routes are mounted at the empty path inside the shell, so that
 * URL matched nothing but the `**` catch-all and the button opened a 404. `account-deletion.component.spec.ts`
 * passed the whole time, because it mounts the component directly and never asks the router whether anything
 * can reach it. So did the build, and so did every check in `quality/`.</p>
 *
 * <p>The wrong-path-answers-something failure is this application's characteristic one — it is the same shape
 * as `register.route.spec.ts` guards for the marketing site's handoff, and the same shape as an entity path
 * swallowed by the SPA fallback. A router link is worse than either, because Angular reports nothing at all:
 * `routerLink` accepts any string, the anchor renders, the href looks plausible, and the failure exists only
 * for whoever clicks it.</p>
 *
 * <p><b>What this cannot see.</b> Only links whose destination is written literally in the template. Three in
 * the portal are computed — `[routerLink]="tile.link"` on the overview tiles and `caseLink(...)` on the record
 * screen — and are invisible here; the sidebar's `['/', item.path]` is covered instead by asserting SHELL_NAV
 * and SHELL_TABS directly, which is where those paths actually come from. `layouts/navbar/` is excluded
 * deliberately: it is generated JHipster scaffolding that nothing imports, and its entity links predate the
 * move of that CRUD under `/entities`, so it would fail this test for a reason that costs nobody anything
 * today.</p>
 */

/** Templates whose links are checked: the portal screens, and the frame they render inside. */
const TEMPLATE_ROOTS = [__dirname, join(__dirname, '..', 'layouts', 'shell')];

function templatesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return templatesUnder(path);
    }
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

/**
 * Pulls the destinations out of one template.
 *
 * <p>Two forms are literal enough to check. `routerLink="/x/y"` is the plain one. `[routerLink]="['/x', expr]"`
 * is an array whose first element is a literal path and whose remaining elements are route parameters — the
 * segment values are not knowable here, but the shape is, so each is replaced by a placeholder that any
 * `:param` in the route config will accept. Anything else is left alone rather than guessed at.</p>
 */
function linksIn(template: string): string[] {
  const links: string[] = [];

  for (const [, path] of template.matchAll(/\brouterLink="(\/[^"]*)"/g)) {
    links.push(path);
  }

  for (const [, head, rest] of template.matchAll(/\[routerLink]="\[\s*'(\/[^']*)'([^\]]*)]"/g)) {
    if (head === '/') {
      // `['/', item.path]` — the sidebar and tab bar. The value comes from SHELL_NAV, asserted separately.
      continue;
    }
    const params = (rest.match(/,/g) ?? []).length;
    links.push([head, ...Array<string>(params).fill('x')].join('/'));
  }

  return links;
}

/**
 * Every path the router can match, as patterns.
 *
 * <p>Walks the real configuration rather than a copy of it, following `loadChildren` so the lazily-mounted
 * portal, account, admin and entity routes are included — the portal's own routes are mounted at the empty
 * path, which is the exact fact the broken links got wrong, so a check that did not follow the tree would not
 * have caught them.</p>
 *
 * <p><b>`**` is excluded, and that is the whole point.</b> The catch-all redirects to `/404`, so with it in the
 * set every conceivable string "resolves" and this test asserts nothing.</p>
 */
async function matchablePaths(routes: Routes, prefix = ''): Promise<string[]> {
  const found: string[] = [];

  for (const route of routes) {
    if (route.path === '**') {
      continue;
    }
    const full = [prefix, route.path ?? ''].filter(Boolean).join('/');
    found.push(`/${full}`);

    if (route.children) {
      found.push(...(await matchablePaths(route.children, full)));
    }
    if (route.loadChildren) {
      const loaded = (await (route.loadChildren as () => Promise<{ default?: Routes } | Routes>)()) as { default?: Routes } & Routes;
      found.push(...(await matchablePaths(loaded.default ?? (loaded as Routes), full)));
    }
  }

  return found;
}

function matches(pattern: string, path: string): boolean {
  const expected = pattern.split('/').filter(Boolean);
  const actual = path.split('/').filter(Boolean);
  if (expected.length !== actual.length) {
    return false;
  }
  return expected.every((segment, i) => segment.startsWith(':') || segment === actual[i]);
}

describe('every link the portal renders', () => {
  let paths: string[];

  beforeAll(async () => {
    paths = await matchablePaths(APP_ROUTES);
  });

  const links = [...new Set(TEMPLATE_ROOTS.flatMap(templatesUnder).flatMap(file => linksIn(readFileSync(file, 'utf8'))))].sort();

  it('finds links to check, so an empty sweep cannot pass as a green test', () => {
    expect(links.length).toBeGreaterThan(10);
  });

  it.each(links)('%s resolves to a route', link => {
    expect(paths.some(pattern => matches(pattern, link))).toBe(true);
  });

  // The sidebar and the mobile tab bar build their links as ['/', item.path], so the literal that matters is
  // in shell-nav.ts rather than in the template. A typo there empties a nav entry rather than a button.
  it.each([...new Set([...SHELL_NAV.map(item => item.path), ...SHELL_TABS])])('the nav entry %s resolves to a route', path => {
    expect(paths.some(pattern => matches(pattern, `/${path}`))).toBe(true);
  });
});
