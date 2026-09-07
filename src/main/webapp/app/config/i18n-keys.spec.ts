import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The bundles, read against the app that names them: every key exists, every placeholder is supplied, every locale
 * carries the same keys.
 *
 * <p>Ported from `hc-patient-app`'s `src/app/core/i18n-keys.spec.ts`, which was written for `docs/backlog.md` item 6
 * — a string reading `recorded {{ when }} by {{ who }}` whose two call sites both passed `{ name }`. ngx-translate
 * leaves an unmatched placeholder as literal text, so patients read the braces. This repository had no equivalent
 * check (item 13): `translation-fallback.spec.ts` pins the fallback <em>behaviour</em> and nothing read the bundles
 * themselves.</p>
 *
 * <p><b>A missing key here falls back to English rather than rendering a marker</b>, which is what makes a mismatch
 * invisible to everyone developing in English and is the reason this is a test rather than a review habit.</p>
 *
 * <p>Two differences from the mobile original, both forced by this repository's shape. The bundles are per-feature
 * files merged by `MergeJsonWebpackPlugin` at build time, so there is no merged file on disk to read and the merge
 * has to be done here — <b>deeply</b>, because twenty entity bundles share the `patientDashboardApp` root and a
 * shallow merge silently keeps only the last of them. And the call-site forms differ: this app uses the
 * `hpdTranslate` directive with `[translateValues]` as well as the `| translate: { … }` pipe.</p>
 */
describe('translation keys', () => {
  const APP = join(__dirname, '..');
  const I18N = join(__dirname, '..', '..', 'i18n');

  type Bundle = Record<string, unknown>;

  /** What `MergeJsonWebpackPlugin` does to `i18n/<locale>/*.json`: a deep merge, later files winning on conflict. */
  function merge(into: Bundle, from: Bundle): Bundle {
    for (const [key, value] of Object.entries(from)) {
      const existing = into[key];
      if (typeof value === 'object' && value !== null && typeof existing === 'object' && existing !== null) {
        merge(existing as Bundle, value as Bundle);
      } else {
        into[key] = value;
      }
    }
    return into;
  }

  const locales: (readonly [string, Bundle])[] = readdirSync(I18N, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const dir = join(I18N, entry.name);
      const bundle = readdirSync(dir)
        .filter(name => name.endsWith('.json'))
        .reduce<Bundle>((merged, name) => merge(merged, JSON.parse(readFileSync(join(dir, name), 'utf8')) as Bundle), {});
      return [entry.name, bundle] as const;
    });

  /**
   * ngx-translate walks the dotted path, but tolerates a literal dotted key at any depth — which this codebase
   * relies on: `global.form.username.label` is stored as `{ global: { form: { "username.label": … } } }`, the
   * JHipster convention. A checker that only walked segment by segment would report a hundred false positives and
   * be switched off, which is worse than not having one.
   */
  function lookup(bundle: unknown, parts: readonly string[]): string | undefined {
    if (parts.length === 0) {
      return typeof bundle === 'string' ? bundle : undefined;
    }
    if (typeof bundle !== 'object' || bundle === null) {
      return undefined;
    }
    const node = bundle as Record<string, unknown>;
    for (let taken = parts.length; taken > 0; taken--) {
      const joined = parts.slice(0, taken).join('.');
      if (joined in node) {
        const found = lookup(node[joined], parts.slice(taken));
        if (found !== undefined) {
          return found;
        }
      }
    }
    return undefined;
  }

  function sources(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return sources(path);
      }
      return /\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [path] : [];
    });
  }

  /** A dotted identifier in quotes. Hyphens are allowed inside a segment because `global.item-count` is a real key. */
  const KEY = '([a-zA-Z][a-zA-Z0-9]*(?:\\.[a-zA-Z0-9_-]+)+)';

  /**
   * Quoted dotted expressions that look like keys and are not: a component property read inside an Angular binding,
   * where the property happens to share a name with a bundle root. The scan cannot tell the two apart — `"entity.url"`
   * in `[src]="entity.url"` and `"error.http.404"` in a TS constant are the same characters — so the few that exist
   * are named here rather than each being reported forever as a missing key.
   */
  const NOT_TRANSLATION_KEYS = new Set([
    // admin/metrics/metrics.component.html — `[jvmMemoryMetrics]="metrics.jvm"` and friends, off the component's
    // `metrics` object. The keys it really names (`metrics.jvm.title`, …) are scanned normally and do resolve.
    'metrics.jvm',
    'metrics.processMetrics',
    'metrics.garbageCollector',
    'metrics.services',
    'metrics.cache',
    'metrics.databases',
    // widgets/info-box/info-box.component.html — fields of the component's `entity` input.
    'entity.url',
    'entity.businessName',
    'entity.middleName',
    'entity.physicalAddress',
    'entity.digitalAddress',
  ]);

  /**
   * What this guard found on its first run, 2026-09-07, and what it therefore cannot fail on yet.
   *
   * <p>Every entry is a key the app names and <b>no locale defines, English included</b> — so there is nothing to
   * fall back to and the screen shows `translation-not-found[…]`. Filling them in means writing four languages'
   * worth of copy, one of them Spanish that `i18n/es/README.md` says nobody who speaks it has read, and that is a
   * separate piece of work from installing the guard. Recorded here so the test fails on the eleventh rather than
   * quietly tolerating a set nobody has counted.</p>
   *
   * <p>The list is asserted to be <b>exact</b>: filling a key in without striking it off here fails too, so it
   * cannot rot into a suppression list.</p>
   */
  const MISSING_TODAY = [
    // The three entity bundles where `detail` is a plain field label rather than the `{ title: … }` object the
    // other seventeen have — the anomaly `i18n/es/README.md` records finding during the fifth Spanish tranche.
    // Their detail screens ship the marker as their heading.
    'patientDashboardApp.patientMsActivityLog.detail.title',
    'patientDashboardApp.patientMsCarePlanItem.detail.title',
    'patientDashboardApp.patientMsEmergency.detail.title',
    // Keys named by a template and defined nowhere.
    'home.facebook',
    'footer.copyright',
    'global.field.drop-down-box',
    'global.field.searchBy',
    'global.slide.learn',
    'register.form.code',
    // shared/ui/modal/modal.component.ts — a key cited by the usage example in the component's own doc comment,
    // not by any markup. It is on this list because the scan reads comments too, and inventing a key in an example
    // is still worth correcting the day somebody copies it.
    'patientPortal.medications.detail',
  ];

  // Any quoted dotted identifier whose first segment is a real top-level bundle. Keys assembled at runtime from
  // fragments are not caught by this and cannot be — nothing short of rendering every screen would be.
  const roots = new Set(Object.keys(locales[0][1]));
  const used = new Map<string, Set<string>>();

  beforeAll(() => {
    for (const file of sources(APP)) {
      const text = readFileSync(file, 'utf8');
      for (const [, key] of text.matchAll(new RegExp(`['"]${KEY}['"]`, 'g'))) {
        if (roots.has(key.split('.')[0]) && !NOT_TRANSLATION_KEYS.has(key)) {
          used.set(key, (used.get(key) ?? new Set()).add(file.slice(APP.length + 1)));
        }
      }
    }
  });

  /**
   * Guards the loader. Unlike the mobile original this reads four directories and merges them itself, so a moved
   * path leaves the rest of this file asserting nothing — `it.each` over an empty list of locales reports no failure
   * at all — and a merge that stopped recursing would drop nineteen of the twenty bundles sharing
   * `patientDashboardApp` while still producing a plausible-looking object.
   */
  it('reads and deeply merges every locale bundle', () => {
    expect(locales.map(([name]) => name).sort()).toEqual(['de', 'en', 'es', 'fr']);
    for (const [name, bundle] of locales) {
      expect({ [name]: Object.keys(bundle).length > 15 }).toEqual({ [name]: true });
      const entities = bundle.patientDashboardApp as Record<string, unknown>;
      expect({ [name]: Object.keys(entities).length > 15 }).toEqual({ [name]: true });
    }
  });

  it.each(locales.map(([name]) => name))('%s defines every key the app uses', locale => {
    const bundle = locales.find(([name]) => name === locale)![1];

    const missing = [...used.entries()]
      .filter(([key]) => !MISSING_TODAY.includes(key))
      .filter(([key]) => lookup(bundle, key.split('.')) === undefined)
      .map(([key, files]) => `${key} — used in ${[...files].sort().join(', ')}`);

    expect(missing).toEqual([]);
    // Guards the guard: a regex that stopped matching would pass this vacuously.
    expect(used.size).toBeGreaterThan(500);
  });

  it('has nothing on the known-missing list that has since been filled in', () => {
    const filledIn = MISSING_TODAY.filter(key => locales.some(([, bundle]) => lookup(bundle, key.split('.')) !== undefined));

    expect(filledIn).toEqual([]);
    // And every entry is a key the app really names — a typo here would silently exempt nothing.
    expect(MISSING_TODAY.filter(key => !used.has(key))).toEqual([]);
  });

  /**
   * Every placeholder a string declares must be supplied where that string is used — in every locale.
   *
   * <p>This is the check `docs/backlog.md` item 13 asks for. The key EXISTS in all four locales when this fails, so
   * the tests above pass on it — key parity says nothing about what is inside the string.</p>
   *
   * <p><b>Asserting the rendered text contains no braces would pass vacuously.</b> Component specs import
   * `TranslateModule.forRoot()` with no loader, so the pipe emits the KEY rather than the English value and the
   * literal can never appear under the harness. The comparison has to be between the bundle and the call site,
   * which is what this is.</p>
   *
   * <p>One direction only: a placeholder declared and not passed renders as visible rubbish, which is the defect. A
   * param passed and not declared is dead weight and renders nothing, and failing on it would be this test
   * insisting on a tidy-up rather than reporting a defect.</p>
   */
  describe('placeholder parity', () => {
    /** `'some.key' | translate: { a: …, b: … }` — the template form. */
    const PIPE = new RegExp(`['"]${KEY}['"]\\s*\\|\\s*translate\\s*:\\s*(\\{[^{}]*\\})`, 'g');
    /** `translate.instant('some.key', { a: … })` and its `get`/`stream` siblings — the service form. */
    const SERVICE = new RegExp(`\\.(?:instant|get|stream)\\(\\s*['"]${KEY}['"]\\s*,\\s*(\\{[^{}]*\\})`, 'g');
    /**
     * `<p hpdTranslate="some.key" [translateValues]="{ a: … }">` — this app's own directive, and the form two thirds
     * of the sites here use. `[^<>]*?` keeps the match inside one element: a tag cannot contain either character, so
     * this cannot pair one element's key with another element's params.
     */
    const DIRECTIVE = new RegExp(`\\[?hpdTranslate\\]?=\\s*"'?${KEY}'?"[^<>]*?\\[translateValues\\]=\\s*"(\\{[^"]*\\})"`, 'g');

    /** Property names in an object literal, shorthand (`{ count }`) included. */
    function paramsOf(literal: string): Set<string> {
      return new Set([...literal.matchAll(/[{,]\s*([a-zA-Z_$][\w$]*)\s*[:,}]/g)].map(match => match[1]));
    }

    /** `{{ name }}` — ngx-translate's own interpolation, which is not Angular's and is not compiled. */
    function placeholdersOf(value: string): Set<string> {
      return new Set([...value.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(match => match[1]));
    }

    /** Every place a key is used WITH params. Keys used without any are none of this test's business. */
    const sites: { key: string; params: Set<string>; file: string }[] = [];

    beforeAll(() => {
      for (const file of sources(APP)) {
        const text = readFileSync(file, 'utf8');
        for (const pattern of [PIPE, SERVICE, DIRECTIVE]) {
          for (const [, key, literal] of text.matchAll(pattern)) {
            if (roots.has(key.split('.')[0])) {
              sites.push({ key, params: paramsOf(literal), file: file.slice(APP.length + 1) });
            }
          }
        }
      }
    });

    it('supplies every placeholder the string declares, in every locale', () => {
      let declaring = 0;

      const unsupplied = sites.flatMap(({ key, params, file }) =>
        locales.flatMap(([locale, bundle]) => {
          const value = lookup(bundle, key.split('.'));
          // A key that resolves nowhere is the first test's finding, not this one's.
          if (value === undefined) {
            return [];
          }
          const declared = placeholdersOf(value);
          if (declared.size > 0) {
            declaring++;
          }
          const missing = [...declared].filter(name => !params.has(name));
          return missing.length === 0
            ? []
            : [`${key} in ${locale} wants {${missing.join(', ')}} — ${file} passes {${[...params].join(', ')}}`];
        }),
      );

      expect(unsupplied).toEqual([]);
      // Guards the guard, in both directions a silent break could take. A call-site regex that stopped matching
      // would leave nothing to compare; a `placeholdersOf` that stopped matching would compare against nothing.
      expect(sites.length).toBeGreaterThan(40);
      expect(declaring).toBeGreaterThan(150);
    });
  });

  /** The locales are kept in lockstep, so a key added to one and forgotten in the others is a defect on its own. */
  it('defines the same keys in every locale', () => {
    const flatten = (node: unknown, prefix = ''): string[] =>
      typeof node === 'object' && node !== null
        ? Object.entries(node).flatMap(([key, value]) => flatten(value, prefix ? `${prefix}.${key}` : key))
        : [prefix];

    const [first, ...rest] = locales.map(([name, bundle]) => [name, new Set(flatten(bundle))] as const);

    for (const [name, keys] of rest) {
      expect({ [name]: [...keys].filter(key => !first[1].has(key)).sort() }).toEqual({ [name]: [] });
      expect({ [`${first[0]} vs ${name}`]: [...first[1]].filter(key => !keys.has(key)).sort() }).toEqual({
        [`${first[0]} vs ${name}`]: [],
      });
    }
  });
});
