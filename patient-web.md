# Patient Web — Plan

Single plan of record for `hc-patient-dashboard`. It consolidates what used to be spread across the now-deleted `AGENT.md` (refactoring plan), `code-review.md` (deploy/compose findings), `HC - Patient Blueprint.md` / `HC - Patient Checklist.md` (subsystem phases), and the `.github/todo.md` / `.github/patient_plan.md` drafts.

- **Baseline verified:** 2026-08-03 against `package.json`, `angular.json`, `jest.conf.js`, `.eslintrc.json`, `webpack/`, `src/main/webapp`, the CI workflow and its last four runs, and a full `ng test` + `npm run lint`. (Previous baseline 2026-07-30, when this repo still owned its own Docker and compose files.)
- **Demo parity audited:** 2026-08-16, both the mockup and the running portal walked side by side against the seeded record — see Phase E, which is now where the remaining distance to `patient-web-demo.html` is tracked.
- **Companion docs:** `CLAUDE.md` (what exists and how it is wired), `AGENTS.md` (standing expectations), `README.md` (stack, commands, ports).
- **Sibling plans:** `hc-patient-service/patient-api.md`, `hc-patient-gateway/patient-gateway.md`, and `hc-patient/deploy/TODO.md` — which now owns everything about packaging and shipping this app.

Status legend: `[x]` done · `[~]` partial / diverges from plan · `[ ]` not started.

## What changed since the last baseline

### The sidebar lit the wrong entry (2026-08-28)

Clicking **Visitations** highlighted **My record**. So did clicking **Activity**. Three faults in one
nine-line map, all of them in `NAV_OWNER`, and none of them breaking anything — every screen rendered
correctly with the wrong entry lit, which is why they survived.

`NAV_OWNER` exists for screens reached from a parent rather than from the nav, so a case detail keeps
_Cases_ lit instead of leaving the whole sidebar unselected. It fails quietly in **two** directions.

- `[x]` **`visitations: 'record'` and `activity: 'record'` were entries for screens that are in the nav.**
  Both were correct when written — neither had a sidebar entry, which is precisely what Phase E, B1 below
  recorded — and both went stale when entries were added and this map was not revisited. An entry here for
  a nav screen does not merely do nothing; it redirects the highlight away from the thing just clicked.
- `[x]` **`cases: 'cases'` was the wrong key and did nothing.** `cases` is a nav entry, so the fallback in
  `navOwnerOf` already resolves it to itself. The screen the line was written for is the case _detail_,
  routed at `case/:id`, whose head is `case` — which had no entry, so opening a case lit no part of the
  sidebar at all. That is the exact failure the map's own comment claims to prevent. `shell-titles.ts`
  keys the same screen `case`, and always did: two files disagreeing about the name of one thing.
- `[x]` **`shell-nav.spec.ts` now asserts both rules** — every `SHELL_NAV` path owns itself, and every
  routed portal screen lights a real entry. Verified by restoring the old map and watching all three
  defects go red.

- `[x]` **The breadcrumbs carried the same stale assumption, and were changed the same day.** `PAGE_TITLES`
  gave `visitations` and `activity` the crumb `patientPortal.nav.record` — correct when they were reached
  from the record screen, wrong once they had entries of their own, so the crumb said "Record" while the
  sidebar lit something else. They take their own group now, and **the two are not the same group**:
  `visitations` sits under _Health_, `activity` under _Account_. (An earlier note here said both were under
  Health. They are not — `SHELL_NAV` puts `activity` in the account group beside `profile`.)

  The rule is two cases that must not be mixed: a screen **in** the sidebar names its own `groupKey`; a
  screen reached **from a parent** names the parent, which is why `case` reads "Cases ▸ Case" and is the only
  entry of that kind. `shell-nav.spec.ts` asserts the narrow half of it — a screen in the sidebar must not
  breadcrumb to another sidebar entry's label. Deliberately not "the crumb equals this item's `groupKey`",
  because `overview` legitimately breaks that: it is the portal root, `DEFAULT_PAGE_TITLE` serves every
  unrecognised path too, and its crumb is "Overview" rather than the "Health" group it happens to sit in.

- `[x]` **The deletion screen names itself now.** `delete-account` had no `PAGE_TITLES` entry, so it fell
  through to its `NAV_OWNER` owner and the topbar read **Account ▸ Profile** while the patient was on
  "Delete your record" — the crumb right by accident, the title naming a different screen. It takes the
  `case` form: `crumbKey: 'patientPortal.nav.profile'`, `titleKey: 'patientPortal.deleteAccount.title'`, so
  it reads **Profile ▸ Delete your record**. Both keys already existed in `en`, `fr` and `de`.

  **A missing entry is not a blank title**, which is why this had to be asserted rather than noticed:
  `activeOwnerOrExact` falls back to the owner, so the topbar was complete, plausible, and about the wrong
  screen. `shell-nav.spec.ts` now requires every routed portal screen to have an entry — the third rule in
  that file, after the highlight and the crumb, and all three are the same failure wearing different
  clothes: a portal screen's relationship to the frame around it was never checked anywhere.

### "Delete your record" led to a 404 (2026-08-28)

The account-deletion screen shipped complete on 2026-08-25 — component, `DeletionRequestService`, the intro,
confirm and pending states, translations in all three locales, a route at `delete-account`, and a `NAV_OWNER`
entry so the sidebar stays lit on `profile` while it is open. It was **unreachable for three days**, and so was
the way back out of it.

`portal.routes.ts` is mounted at the empty path inside the shell, so the portal's screens are `/profile`,
`/record`, `/overview`. Two links were written with a `/portal` prefix that no route defines.

- `[x]` **`profile.component.html` linked to `/portal/delete-account`.** The reported symptom: the button
  renders, the anchor has an href, and clicking it lands on the 404 page.
- `[x]` **`account-deletion.component.html` linked back to `/portal/profile`.** The screen was stranded at
  both ends, which is why the first defect was never worked around by hand.
- `[x]` **`portal-links.spec.ts` now asserts every literal `routerLink` in the portal and the shell resolves
  against the real route config**, `loadChildren` followed and `**` deliberately excluded — with the catch-all
  in the set, every conceivable string resolves and the test asserts nothing. Verified by reverting the fix and
  watching it go red, which is the only thing that distinguishes a guard from a green test.

**Why nothing caught it, which is the part worth keeping.** `account-deletion.component.spec.ts` passed
throughout: it mounts the component directly and never asks the router whether anything can reach it. So did
`ng build`, and so did every check in `quality/` — they read the running stack, and the stack was fine. Angular
reports nothing here at all, because `routerLink` accepts any string. **A link is worse than a wrong route
path**, which at least `register.route.spec.ts` would pin: the failure exists only for whoever clicks it.

Two things this uncovered and did **not** fix:

- `[x]` **`layouts/navbar/` deleted — 2026-08-31.** Generated JHipster scaffolding that nothing imported; its
  entity links pointed at `/allergy`, `/address`, `/clinical-case` and the rest, all predating that CRUD moving
  under `/entities`. Deleted rather than repaired, because repairing maintains a component no route renders.

  The exclusion it had in `portal-links.spec.ts` was honest but was still a standing lie of a kind: **a sweep
  that skips a directory reports on the rest of the app as though the app were the rest.** Deleting the
  directory removed the exclusion rather than the failure. `navbar-item.model.d.ts` survives alone —
  `entities/entity-navbar-items.ts` imports the type and is a generator needle file. The `.navbar` rules in
  `global.scss` stay: `DashboardComponent` still uses those Bootstrap classes.
- `[x]` **The computed links are checkable — 2026-08-31.** `[routerLink]="tile.link"` on the overview tiles and
  `caseLink(...)` behind five rows of the record screen both carried an expression, so the destination lived in
  a component field no test could reach without standing the whole component up.

  The destinations moved to `portal/portal-destinations.ts`, where the spec reads them — **the same answer the
  sidebar already had**, whose paths are checked by asserting `SHELL_NAV` and `SHELL_TABS` directly. Check the
  source of the value, not the template that interpolates it. The alternative was teaching the spec to scrape
  TypeScript, which trades a blind spot for a guess.

  Eight tile destinations and `caseLink` are asserted, including that it returns `null` for a missing case:
  `[routerLink]="null"` renders no href, so a row with no case is not a link rather than a link that goes
  nowhere — a behaviour somebody could "tidy" into a string. **A new computed link belongs in that file**, or
  it is invisible again.

### The patient handoff contract, honoured (2026-08-25)

`web.abofonsa.com` links families straight to `/account/register?locale=…&src=…` from its landing page.
`register.component.ts` took no `ActivatedRoute` and read no query string, so **both parameters were dropped on
the floor**: a family who read the offer in French got an English form, and nobody could say whether the offer
converted. `docs/patient-handoff-contract.md` carries the contract and the response.

- `[x]` **`locale` is read and degrades rather than validating.** A supported locale starts the form in that
  language and — because the form submits `translateService.currentLang` as `langKey` — is stored on the
  account. Unknown, misspelled or absent leaves the language untouched, because people share these links with
  the query string mangled and a broken parameter must never cost somebody a working form.
- `[x]` **`src` is allow-listed here and enforced at the gateway.** The browser copy keeps an ordinary visitor's
  URL honest and is worth nothing as a defence: `/api/register` is public, so anybody can post anything
  without going near the form. The cost is stated rather than hidden — **a surface nobody has agreed to loses
  its attribution silently.**
- `[x]` **`/account/register` is pinned** by `register.route.spec.ts`, asserting the path _and_ the component.
  A rename would otherwise answer 200 and serve the shell while the sending site's button led nowhere.
- `[x]` **Spanish, account path only.** The contract advertised `es` and this app served three languages, so a
  Spanish reader had been landing in English since the link went up. Clinical bundles are deliberately last
  and behind clinical review.
- `[x]` **German and French gaps closed** — de was missing ten keys, fr one. Found while scoping this.
- `[ ]` **The clinical Spanish bundles** — `patientPortal.json` and `patientMs*`, 1030 keys. Needs a
  Spanish-speaking clinician, not a faster translator.
- `[ ]` **Pricing agreement.** Plan selection renders `priceAmount` verbatim from the Abofonsa plans API while
  the landing page pitches the first month free. This side authors no pricing; somebody who owns both has to
  confirm they agree.

### The administrator's portal, and what an empty screen was hiding (2026-08-22)

- `[x]` **An administrator is no longer sent to the onboarding wizard.** `onboardingGuard` asked a
  patient-shaped question — _is there a record here yet_ — and for `ROLE_ADMIN` every answer to it is
  wrong. The reported symptom was the landing page; the worse half was that `/admin` and `/entities`
  hang off the same shell-parent the guard is attached to, so an administrator was redirected **out of
  the administrative screens themselves** — the only place in this app a patient's record can be
  corrected, unreachable by the only role permitted to use it. Fixed in both guards, because a pair
  that must agree is exactly where a rule added to one and not the other goes wrong.
- `[x]` **`portal/patient-finder/`** replaces that empty overview: search the directory, open a
  record, and the ordinary portal takes over under the acting-as banner.
- `[x]` **Server-side search.** It first filtered up to 500 profiles in the browser, because
  `GET /api/profiles` took paging and sorting and nothing else. Quality held 453 by the time it
  shipped — one bulk load from the point where the box filters a page while looking exactly like a
  complete search of a small system. `?search=` landed in the api and this now sends it.
- `[x]` **`ActingAsService` learned about a record that was found rather than delegated**, stored
  whole rather than by id. The shell refetches delegations on every load and that response can never
  contain a record nobody delegated, so an id alone would restore a selection naming a choice that no
  longer exists — banner gone, header unsent, silently back to the administrator's own empty record.
  On every reload.
- `[~]` Opening a record grants nothing on its own; it _narrows_. That half did not exist until
  `hc-patient-service` shipped it the same day. Before it, an administrator naming a patient was
  served every patient's records under that one patient's name — 200 throughout.

### `/management/info` is no longer called (2026-08-22)

- `[x]` `ProfileService` and `ProfileInfo` deleted; the ribbon reads `window.location.hostname` and
  the admin menu's API-docs item is unconditional. An actuator endpoint is not part of this
  application's API, it publishes the build and active profiles to anyone who asks, and it answered
  401 for a signed-out visitor — reaching the global `ErrorHandler` and logging a console error on
  every load of the sign-in page.
- `[~]` The replacement is a **weaker signal, deliberately**: the old ribbon marked which Spring
  profiles were running, this one marks which machine you are looking at. `dev` or `test` on the
  production host would no longer light anything up; that case is guarded by `deploy.sh` and by
  `SPRING_PROFILES_ACTIVE`, and this component is no longer part of that defence.

That console error is worth keeping in mind beyond its own fix. It is what made a healthy deploy look
broken during the 2026-08-22 release: a stale token in a browser produced the 401, which suppressed
the ribbon and logged an error, and the two together read exactly like a regression in the image
about to go to production.

### Earlier

Two things moved the ground under this plan, and most of the edits below follow from them:

- **Deployment left this repo.** `d5f0bfe` deleted `Dockerfile`, `nginx.conf`, `docker-compose.yml`, `docker-compose-prod.yml`, `.dockerignore` and the `docker:*:tag` / `deploy:*` npm scripts. They live in `hc-patient/deploy/` (repo `kojoampia/hc-patient-ci`), which builds all three subsystem images and ships them. Phase C was almost entirely about those files; it is rewritten below rather than carried forward.
- **The app is in production.** `https://patient.abofonsa.com` has served this dashboard since 2026-07-31, with browser telemetry since 2026-08-03. Items that were theoretical when written now have a live deployment to be true of.

### The user-interface refactor (branch `feature/ui-refactor`, 2026-08-03)

The dashboard was rebuilt against the design in `patient-web-demo.html`. This is the largest change
the repo has taken and it settles several items below.

- **Design system.** `content/scss/_tokens.scss` (navy/gold/cream palette, radii, shadows, data-viz
  colour roles), `_components.scss` and `_utilities.scss`, all namespaced `hc-`. The namespace is
  load-bearing: Bootstrap and ng-bootstrap are still on the page for the account, admin and entity
  screens, and the design uses bare `.row`, `.card`, `.modal` and `.tabs`. `_bootstrap-variables.scss`
  now points Bootstrap's own variables at the same tokens, so those screens inherit the palette.
- **Two layouts.** `layouts/shell/` is the portal frame (navy sidebar, sticky topbar, mobile drawer
  and bottom tab bar); `layouts/auth-shell/` is the signed-out split brand/form screen shared by
  sign-in, register, activate and password reset. Both are empty-path route parents, so `app.routes.ts`
  redirects `/` to `overview` explicitly — without that the router resolves `/` to whichever parent is
  declared first and renders it with an empty outlet.
- **13 portal screens** under `app/portal/`: overview, record, cases, case detail, schedules,
  emergencies, medications, reports, plans, allergies, visitations, activity, profile. They read
  through `portal/data/portal-data.service.ts`, which scopes every collection to the signed-in
  patient in one place and shares each fetch across the screens that need it.
- **`jhi` → `hpd` selector migration, completed.** `.yo-rc.json` has said `jhiPrefix: hpd` since the
  app was generated, but the scaffold was emitted with `jhi`. Regenerating the entities produced
  templates referencing `hpd-alert-error`/`hpdSort`/`hpdTranslate` against shared components still
  declaring `jhi-*`, so the two halves no longer compiled together. All 139 affected files were
  migrated. This also cleared the 161 pre-existing lint errors that came from the same mismatch.
- **Lint is clean.** `npm run lint` reports zero problems, down from 172. Getting there needed one
  config change: `member-ordering` now expects private instance fields _before_ public ones, because
  class field initialisers run before constructor parameter properties are assigned — so a public
  field derived from an `inject()`ed service only works if the service is declared above it.
- **Entity model extended.** See `hc-patient-service/patient.jdl`, now the model of record for both
  repos. Six entities were added (Professional, Visitation, Emergency, ActivityLog, CarePlanItem,
  Allergy) and eight extended. Vitals are `Stat`, by decision — there is no separate Vital entity.
- **Verified:** `npx ng test` 202 suites / 978 tests, `npm run lint` clean, `npm run webapp:prod`
  clean, and the built bundle loaded in a real browser (per the rule below, a production build alone
  does not prove the SPA boots).

## Open decisions

1. **What should CI do?** The registry question is settled — `docker.jojoaddison.net` is authoritative, and `deploy/` pushes there. But `.github/workflows/docker-publish.yml` still tries to build and publish to GHCR, and **has failed on every push since 2026-07-30** (see Phase C). The image is now built from `deploy/docker/web.Dockerfile` with a named build context this repo cannot reproduce alone, so CI cannot simply be repointed. Decide between: retire the workflow entirely, or replace image publishing with what a client repo actually needs — `lint`, `test`, `webapp:prod`. Recommended: the latter, since `npm test` is not gated anywhere today.
2. ~~**Mobile app baseline.**~~ Settled, and the question was stale when written: it named Angular 17 long after this app had moved to 20. `hc-patient-app` is no longer empty — an Ionic 9 / Angular 20 / Capacitor 8 app was ported from this repo at `12e418c` and merged 2026-08-21. `mobile/patient-mobile.md` is its plan of record. Nothing here blocks on it.

Resolved since the last baseline, kept so the numbering change is traceable:

- ~~**Dev API port.**~~ Settled 2026-08-03: the **gateway moved to 5505**, matching what
  `webpack/proxy.conf.js` and `webpack/environment.js` already targeted, so `npm start` reaches it
  with no further configuration. The move is across _every_ profile — `application-dev.yml`,
  `application-prod.yml`, the Jib container port, `.yo-rc.json`, `package.json` — plus `deploy/`'s
  nginx upstreams, compose port map, Dockerfile `EXPOSE` and both health checks, so there is one
  port for the whole subsystem rather than a dev/prod split waiting to be tripped over.
  **It needs a `./deploy.sh` to take effect on `patient.abofonsa.com`** — until then the running
  stack's nginx still proxies to 5503.

- ~~**Entity screens: route them or retire them.**~~ Settled by the UI refactor: routed, behind
  `ROLE_ADMIN`. `entities/entity.routes.ts` and `entities/entity-navbar-items.ts` are populated,
  and CRUD now exists for all twenty entities including `ClinicalCase` and `Recommendation`. They
  are an administrative surface — they edit any patient's records — so they sit under `/entities`
  with an authority guard rather than in the patient's own navigation.

- ~~**Registry strategy.**~~ Settled by `deploy/`: `docker.jojoaddison.net`. What remains is decision 1 above — the dead GHCR path in this repo.
- ~~**Runtime vs build-time API base.**~~ Settled: the bundle is built **same-origin** (`SERVER_API_URL` empty, `<base href="/">`), so there is nothing to substitute at runtime and the gateway needs no CORS. The compose env var that could never take effect is gone with the compose file.

## Baseline — already in place

- `[x]` Angular 20 app (standalone + legacy NgModules), JHipster 8.1.0 client-only scaffold, i18n for `en`/`fr`/`de`, plus a partial `es` (2026-08-25). Was Angular 17 at the last baseline; the guide's stack table said 17 until 2026-08-23.
- `[x]` Auth against the gateway with interceptor-based JWT attachment, `UserRouteAccessService` guards, account and admin surfaces.
- `[x]` Dashboard rendered by `HomeComponent` at `/`, with `metric-panel` and `status-panel`.
- `[x]` Modal feature views: temperature, blood pressure, heart rate, sugar, allergies, emergency.
- `[x]` d3-based widget library (linechart, piechart, heatmap, treemap, histogram, tilebox, info-box, slides, file-viewer, chatbot, faq, …).
- `[x]` Generated CRUD screens for the patient entities under `entities/patientMS/**` (present but unrouted — decision 2).
- `[x]` Jest unit tests colocated with the code (146 spec files, all passing — see below).
- `[x]` **Deployed to production** (2026-07-31) as an nginx image built and shipped by `hc-patient/deploy`. This repo builds the bundle; it no longer packages or ships it.
- `[~]` CI exists but is **broken** — `docker-publish.yml` has failed on every push since 2026-07-30 (Phase C).
- `[x]` **Browser telemetry** (2026-08-03) — `core/telemetry/` initialises the OpenTelemetry web SDK
  from `bootstrap.ts`, tracing document load, XHR and fetch, and reporting uncaught errors through a
  `TelemetryErrorHandler`. Spans POST to the same-origin `/v1/traces`, which nginx forwards to the
  host's shared collector, and W3C `traceparent` on same-origin requests puts a click in the same
  Tempo trace as the gateway, the microservice and the MongoDB query. Compiled out of development
  builds. Four things to keep in mind before changing it:
  - **Query strings are stripped before export.** This is a patient application and Tempo is shared
    with every other app on the host. If an endpoint is ever added that puts something identifying in
    the _path_, `scrubUrl` has to cover that too.
  - **Sampling is 10%, decided in the browser.** The constraint is the shared monitoring stack's
    disk, not the client. Raise it while investigating something specific, then put it back.
  - **`__OTEL_ENABLED__` is declared in `webpack/environment.js` as well as in the webpack config.**
    `jest.conf.js` spreads that file into its `globals` and Jest does not run DefinePlugin, so a
    constant defined only in `webpack.custom.js` is undefined under test and every suite that
    transitively imports `app.constants.ts` dies with a `ReferenceError`.
  - **It is fail-safe by design, and must stay that way.** The first version took the SPA down for
    ~12 minutes in production: `OTLPTraceExporter` validates its `url` with the `URL` constructor,
    which throws on a bare path, so the configured `/v1/traces` threw during module evaluation of the
    bootstrap chunk — before `bootstrapApplication`. Angular never started, while every curl and
    health check still returned 200. The path now resolves against `window.location.origin` and
    `initTelemetry()` catches everything, so the next mistake of that shape costs telemetry rather
    than the application. `telemetry.spec.ts` covers both halves. Telemetry is compiled out under
    Jest, so **no unit test can catch a constructor that throws** — loading the page in a real
    browser is the only check that would have, and it is now the last step of any deploy touching
    this app.

## Phase A — wiring and correctness

- `[x]` **An expired token no longer locks you out.** Settled 2026-08-16. `auth.interceptor.ts`
  attached the stored token to _every_ same-origin request, `/api/authenticate` included. Spring
  Security's bearer filter runs **before** authorization, so a present-but-expired token fails the
  request outright and `permitAll` never gets a say: sign-in answered 401 for a reason that had
  nothing to do with the credentials typed into it, and because the stored token was what caused the
  failure, trying again did the same. Clearing site data by hand was the only way back in — and the
  trigger is ordinary, a token expiring while the tab is closed. The interceptor now skips the
  endpoints whose job is to _get_ you a token, matched against the gateway's own `permitAll` list;
  keep the two in step. Found from a real 401 report, and it cost this repo's own verification loop
  three ports before it was fixed.

- `[x]` **The dev server can reach a gateway.** Settled 2026-08-16. The ports had agreed since
  2026-08-03, but `npm start` still could not talk to one: the dev bundle was built with an absolute
  `SERVER_API_URL` of `http://localhost:5505/`, so the browser went cross-origin, straight past
  `webpack/proxy.conf.js`, into the gateway's deliberately-disabled CORS — `403` on the preflight,
  `503` on the request. The proxy had been configured correctly and used by nothing the whole time.
  `SERVER_API_URL` is now empty in **every** mode, so dev is same-origin like production and the
  proxy carries it; `HC_GATEWAY_URL` moves that proxy's target, which is how you develop against a
  gateway elsewhere — `ssh -N -L 5505:127.0.0.1:15505 jacserver` and the quality stack's seeded
  record. Verified by signing in against it from `npm start`. This is what makes the rest of Phase E
  checkable locally instead of by shipping and looking.
- `[ ]` Resolve decision 2: centralize entity route registration in `entities/entity.routes.ts` and populate `entity-navbar-items.ts` — routes and menu land together, never separately.
- `[ ]` Rename the `hc-credential` and `hc-pay-option` areas to match the backend's `PersonalDocument` and `PaymentOption` (models, services, routes, i18n keys, specs). Coordinate with `patient-api.md` Phase A, which still has to generate those endpoints.
- `[ ]` Generate `clinical-case` and `recommendation` screens, or record the decision not to. `api` shipped both in `519ba8f` with a full resource stack; the frontend has nothing for either, and `ClinicalCase` **replaced** `MedCase` rather than renaming it, so there is no old screen to adapt.
- `[ ]` Reinstate Cypress or drop it: `.yo-rc.json` still lists `clientTestFrameworks: ["cypress"]` and `src/test/javascript/cypress/e2e/` exists, but the dependency and the `e2e` script are missing, so e2e cannot run.
- `[ ]` Reconcile `angular.json` metadata: project name is still `patient-gateway` and `prefix` is `jhi` while ESLint requires `hpd`.
- `[ ]` Decide the PWA posture — the service worker is registered with `enabled: false` in `app.config.ts`.

### Test suite state

Measured on 2026-08-03 with `npx ng test`: **all 146 suites and 681 tests pass** in ~110s. (2026-07-30: 145 suites, 677 tests; the difference is `telemetry.spec.ts`.) Three problems were fixed to get there originally:

- `[x]` d3 v7 and its transitive deps (`internmap`, `delaunator`, `robust-predicates`) publish ESM in plain `.js` files, which Jest could not parse — 11 suites died with "Jest encountered an unexpected token", including `home.component.spec.ts` and everything under `dashboard/` and `features/`. `jest.conf.js` now exempts them in `transformIgnorePatterns`.
- `[x]` The six `features/*` wrapper specs failed with `No provider for NgbActiveModal!`. They now provide it, plus the HTTP and router doubles that the embedded `StatComponent` needs, and blank out that child's template — these are wrapper smoke tests, and the list has its own spec.
- `[x]` `dashboard.component.spec.ts`, `dashboard.service.spec.ts` and `status.component.spec.ts` lacked `HttpClientTestingModule` (and animations, for the ngx-charts content). `stat.service.spec.ts` did not compile: this service's `query(type, req?)` and `search(type, req)` take the metric type, because they read `/api/stats/{type}`, and the generated spec still called them without it.

`npm test` **still fails**, in its `pretest` lint step rather than on parse errors:

- `[x]` ESLint could not parse _any_ file, because `parserOptions.project` pointed at `src/test/javascript/cypress/tsconfig.json`, which was never committed — 456 identical parse errors. That entry is gone and the un-runnable Cypress skeleton is in `.eslintignore` (with a comment saying to restore both when Cypress comes back); both come back with the Cypress decision above.
- `[x]` **Cleared 2026-08-24: lint is clean, and `npm test` runs for the first time.** The backlog had
  fallen to 48 errors; all are fixed rather than suppressed, except two `prefer-nullish-coalescing`
  sites where `||` is deliberate and `??` would be a defect — those carry a disable and the reason
  (the fallback exists for an _empty string_, which `??` passes straight through, so a profile with
  a blank name would have rendered as a blank row). Lint now runs as its own CI step: the `pretest`
  hook was the only thing that ever ran it and CI called `npx ng test` directly, so lint was
  enforced nowhere — and because the hook fails before Jest starts, `npm test` exited 1 having
  tested nothing.
- `[x]` ~~Underneath sit **172 problems — 161 errors and 11 warnings — across 77 files**, none of them new (2026-07-30: 160 across 76). By rule:~~ 73 selector-prefix (68 `component-selector` + 5 `directive-selector`, `jhi-*` where ESLint wants `hpd`), 22 `no-console`, 20 `member-ordering`, 15 empty lifecycle methods, 12 missing return types, 11 `use-lifecycle-interface`, and 19 assorted `@typescript-eslint` rules (`prefer-nullish-coalescing`, `no-unnecessary-condition`, `ban-types`, `no-unsafe-return`, …). The selector ones are Phase B territory — a repo-wide rename is deliberately not something to do in passing. Decide per group whether to fix the code or relax the rule, then gate `npm test` in CI (decision 3).

## Phase B — refactoring

Goals: clearer module/route boundaries, stronger typing at API and component boundaries, thinner components (orchestration separated from presentation), less duplication across modal wrappers, safer reuse of generated entity services, and continued compatibility with JHipster regeneration points.

Suggested order when no narrower task is given:

1. `[ ]` **Restore and document entity route aggregation** (Phase A, decision 2) before any broad cleanup — route topology first, so nothing is deleted or moved on a false read of what is reachable.
2. `[ ]` **Break up `dashboard/dashboard.component.ts`.** It currently mixes UI state, hardcoded card definitions, modal orchestration, `sessionStorage` access, account logic, and API calls. Split into: a typed view model for cards and selected-page state; a modal launcher / typed route-to-component map replacing the `switch`; a typed facade for profile-summary loading; presentational child components where the template repeats card or panel markup. Stop extending the `switch` and the untyped card objects.
3. `[ ]` **Type `dashboard/dashboard.service.ts`.** Replace `Observable<any>` with an explicit profile-summary interface, keep endpoint construction in `getEndpointFor`, and align the model with the `Profile` entity if the payload really matches.
4. `[ ]` **Unify the `features/*` modal wrappers.** Either keep them as thin, typed, consistent wrappers or remove the redundant ones and open the target components directly. Do not leave near-identical wrappers with ad hoc naming and lifecycle code.
5. `[ ]` **Review `widgets/`** for duplicated visualization inputs and inconsistent component APIs; converge on one input contract before adding widgets.
6. `[ ]` **Tighten HTTP/domain typing repo-wide.** Generated entity services are typed; the hand-written ones are not. Remove `any`, `HttpResponse<any>`, and `any[]`; keep DTO transformation in the service layer; reuse entity models instead of duplicating shapes.
7. `[ ]` **Normalize Angular style deliberately.** Standalone-first for new work, but migrate vertical slices only when already touching them; remove dead NgModules only after all consumers move. No repo-wide style rewrite in one pass.

Constraints that apply to all of the above:

- Preserve JHipster-managed seams: `jhipster-needle-*` markers, generated entity CRUD patterns, account/admin/auth flows, i18n key structure, and gateway endpoint construction. Refactor around them, not through them.
- Do not hardcode API base URLs, replace typed entity services with generic helpers, delete apparently unused entity modules before checking route/menu wiring, or rename selectors and translation keys broadly without updating every call site.
- Keep feature-specific code in `dashboard`, `features`, `widgets`, or `entities` — `shared` stays for broadly reused primitives.
- Prefer extracting typed helpers/facades over adding conditionals; preserve behavior unless the task explicitly changes UX.
- Add or preserve characterization coverage where behavior is subtle, and verify with `npm run lint`, `npm test` (narrow with `npm test -- --test-path-pattern=<area>`), and `npm run webapp:build:dev`. Never `./mvnw` here.
- Anything touching `bootstrap.ts`, `app.config.ts`, or `core/telemetry/` gets loaded in a real browser before it ships — see the telemetry note in the baseline for why a green build and a green suite are not sufficient there.

## Phase C — CI

Everything this phase used to contain was about files that are no longer here. Recorded once, then closed:

- `[x]` `docker-compose-prod.yml`'s invalid network key, the three-way image-name disagreement between compose and the `docker:*:tag` scripts, and the compose volume mounts pointing at nonexistent host directories on an nginx image — **all resolved by deletion** in `d5f0bfe`, not by fixing them. `hc-patient/deploy/` builds the image from `deploy/docker/web.Dockerfile` with `deploy/docker` passed as a named build context, which is also why the repo's own `.dockerignore` went away (dropping the build context from 3 GB to 148 kB).

What is left is one broken workflow:

1. `[ ]` **`.github/workflows/docker-publish.yml` fails on every push and has since 2026-07-30.** It builds `file: ./Dockerfile.prod`, but `ac2df38` consolidated `Dockerfile.prod` into `Dockerfile` on 2026-07-30, and `d5f0bfe` then removed `Dockerfile` too. Four consecutive failed runs; the latest (`30809635272`, 2026-08-03) dies in 24s with:

   ```
   ERROR: failed to build: failed to solve: failed to read dockerfile:
   open Dockerfile.prod: no such file or directory
   ```

   The workflow has not been touched since 2026-05-10. Resolve with decision 3 — retire it, or repurpose it to `lint` + `test` + `webapp:prod`. Repointing it at the real Dockerfile is not an option: that file is in another repository and needs a build context this one does not have.

2. `[ ]` **Then decide whether `pom.xml` survives.** Its only remaining consumer is that workflow's version scrape (`<version>0.0.1</version>`, currently in sync with `package.json`). There are no Java sources, and its Enforcer rule fails on the installed JDK anyway. If image publishing goes, so can the pom.

## Phase D — features the blueprint expects but the web app lacks

> **Much of this landed on 2026-08-19** with patient onboarding and care delegation. Two traps found
> on the way, both of which will bite anyone touching this area:
>
> - `PatientContextService.profile$` used to map _any_ failure to "no profile". Harmless while
>   nothing read it; not harmless once a route guard does — a network blip would have thrown a fully
>   onboarded patient into the wizard, and a 401 would have looked like a brand-new account. It
>   narrows to 404 now. **Do not widen it back.**
> - `Profile.address` is a document, not a string. Anything interpolating it directly prints
>   `[object Object]`; `formatAddress` in `portal/data/portal-format.ts` is the one way to render it.

These come from the subsystem blueprint's Phase 3 and are largely blocked on backend work. The blueprint framed them as mobile screens; decide per item whether the web dashboard also needs them.

- `[x]` Subscription plan selection — built 2026-08-19, and the price contradiction is gone rather than resolved: the tiers come from Abofonsa through a gateway proxy at `/api/plans`, and `priceAmount` arrives pre-formatted for the locale. **Render it, never re-format it** — two products quoting different numbers for one tier is exactly what restating a price causes. It lives on the profile's membership tab, _not_ at `/plans`, which is already the care plan (diet and exercise). Choosing writes a `Membership` with status `PENDING`: this records a choice, it does not bill for one.
- `[x]` Onboarding wizard — built 2026-08-19. Five steps at `/onboarding`, on `AuthShellComponent` behind the signed-in guard rather than in the portal shell: a patient here has a token but no record, and the shell would fire patient-scoped fetches for a patient who does not exist, behind a sidebar of destinations that would all be empty. Each step saves before the next is shown, because the backend has no transaction to wrap the journey in. Plan selection is deliberately _not_ a step (see above). See `docs/onboarding.md` §16 for the endpoint contract.
- `[ ]` **A public account-deletion page — decided 2026-08-28 that `/delete-account` does not cover it.** Google Play requires deletion to be requestable from a URL that does not need the app installed, and asked whether the portal screen answered that, the architect's answer was **no**: the portal screen is for signed-in patients, and a separate unauthenticated page is still wanted. So this is `web`'s work and not `mobile`'s, it is the only piece of _product_ left in `docs/android-publishing-steps.md`, and it is not closed by the 404 fix above. Open questions it will have to settle: what identifies the requester without a session, and how a request made that way is rate-limited — `/api/deletion-requests` is authenticated today, so nothing in `api` serves this yet either.
- `[ ]` Historical telemetry views — blocked on `patient-api.md` Phase C; the current metric panels read from `Stat`. Note this means _patient_ telemetry (vitals over time), which is unrelated to the OpenTelemetry instrumentation added in 2026-08-03.
- `[ ]` Calendar / upcoming visits — no scheduling entity exists in any backend.
- `[ ]` Assigned professionals directory — needs a contract with the professional subsystem.
- `[ ]` Time-bound record sharing toggles — no sharing/consent model exists.
- `[x]` `PATIENT`/`ANGEL` role support — the `Authority` enum now holds all four. No route guards on them, and that is the answer rather than an omission: an angel's authority comes from an `ACTIVE` care delegation the backend re-reads per request, so guarding a screen on `ROLE_ANGEL` would leave the menu entry for somebody whose delegation was revoked.
- `[x]` **Acting as another patient** — a care angel opens the patient's record through an `X-Acting-As` header set by **one** interceptor and nothing else. A screen that built its own request and forgot it would silently read the wrong person's record and answer 200, which is why it is not a per-service concern. The shell shows a loud, persistent banner naming whose record is open; that is a safety control, not decoration.
- `[x]` **Care nominations** at `/invitations`, and **delegation management** on the profile's care-angel tab — see, and withdraw, whoever may act for you.

## Phase E — demo parity

`patient-web-demo.html` is the design the portal was rebuilt against, and it is still the target: it is
the only artefact that says what "finished" looks like, and the quality stack now seeds the record it
was drawn against, so the two can be compared directly rather than argued about.

**Audited 2026-08-16**, both running side by side — the mockup served locally, the portal on the
quality stack at `patient.healthconnect.local` signed in as `kojo`, against
`quality/patient-demo-seed.json`. All thirteen routes walked in both, plus the browser console and the
two routes that have no way in. Nothing below is inferred from source alone; where a cause is named,
the console or the rendered output showed it. Item ids are stable references for review, not
priorities.

### E1 — built but broken

Already-built screens failing in front of the user. Cheapest items on the list, and the ones that make
the portal look unfinished however much else is done.

**All five fixed 2026-08-16**, verified in a browser against the seeded record. Two things the fixing
turned up are worth keeping: A1 and A3 were one bug, and the first attempt at A2 broke every
`LocalDate` in the app until a test caught it — instants and calendar dates need opposite treatment,
which the formatters now name (`formatDay` never shifts; `formatInstantDay`, `formatDayTime` and
`formatTime` render in the clinic's zone). The portal also had **no tests at all** — 13 screens, zero
specs against 204 elsewhere in the repo — which is how A1 and A3 shipped; there are now two suites
over exactly what changed, and anything built for E2–E4 should arrive with its own.

- `[x]` **A1 · `/record` throws on every load.** `formatDay()` is typed for `dayjs.Dayjs` and is handed
  a plain string, so the template dies before painting: the page shows a name, three literal `· · ·`
  placeholders and two empty boxes. Console: `TypeError: e.format is not a function at formatDay`, 7×
  per load, `portal/data/portal-format.ts:10`. **Cause:** `PatientContextService` fetches the profile
  with a raw `http.get` — the one profile endpoint `ProfileService` does not cover — so nothing
  applied that service's date conversion. Fixed where the fetch happens; the formatters also tolerate
  a string now rather than turning one into a blank screen. **This was the same bug as A3.**
- `[x]` **A2 · every time renders in the reader's timezone.** Instants are stored UTC and formatted
  with the browser's offset (`formatDayTime()`, `portal-format.ts:15`). Ghana keeps UTC year round, so
  every appointment, alert and log entry is wrong for any reader outside it — +2h from Berlin, and the
  kidney-stone alert moves from _30 Apr 11:05 PM_ to **01 May 01:05 AM**, i.e. onto the wrong day. A
  record that reports the wrong date for an emergency is worse than one that reports none. Decide
  whether the portal renders in the record's zone (Africa/Accra) or the reader's, then apply it in the
  one formatter.
- `[x]` **A3 · Profile › About renders six labels and no values.** Born, Sex, Blood group, Card, Card
  number, Social. The API returns all six and the neighbouring Contact tab binds the same record
  correctly, so this is that tab's binding.
- `[x]` **A4 · the search magnifier is drawn over its input**, covering the placeholder, on all four
  search screens (cases, emergencies, visitations, activity).
- `[x]` **A5 · a patient's own note is credited to "Care team"** on case detail, while `/activity`
  renders the same record as "You". Whose words a record carries is not cosmetic.
  **One instance was missed and fixed 2026-08-16**: the overview's _Recent activity_ panel still read
  `authorId` alone, so the note the patient wrote themselves was filed under "Care team" there while
  `/record` and `/activity` said "You" about the very same record. Found by reading the deployed
  quality stack rather than by a test — the two panels sit two screens apart and nothing compares
  them.

### E2 — built but unreachable

**Both closed 2026-08-16.** B1 needed no code: it was a symptom of A1, not a gap of its own.

- `[x]` **B1 · Visitations and the Activity trail have no nav entry.** Both are complete and good —
  eighteen visits with case links; kind icons, kind filter chips and correct attribution. `shell-nav.ts`
  lists ten items and neither is among them, and the demo's route to them is the record-panel expanders
  (C2), which do not exist yet. Reachable today only by typing the URL. Closing C2 closes this; adding
  two nav entries closes it sooner.
  **Neither was needed.** `/record` already carries a **See all** under Recent visits and Recent
  activity, linking to both screens — the demo's own route to them, in a simpler form than the panel
  expanders. They were unreachable because the page they live on was throwing (A1), not because the
  route was missing. Fixing A1 restored it; verified by clicking through to `/visitations`. Adding
  sidebar entries would have _diverged_ from the mockup, whose ten nav items are exactly the ten this
  portal has — the record is deliberately the way in. C2 still stands on its own for the panels and
  their pagination.
- `[x]` **B2 · the Emergencies badge is never set.** The demo carries a red `4` — the only number in
  the nav. `ShellNavItem` already declared `badge?: Signal<number>`, the template already rendered it
  in both the sidebar and the mobile tab bar, and `_components.scss` already styled it. Only the
  assignment was missing. `ShellComponent` now supplies it from `PortalDataService.emergencies$`,
  which is where the interface's own comment said it should come from — "a signal … so the sidebar
  tracks live data without the nav config having to know where that data comes from". The count is
  fetched in the frame rather than on the Emergencies screen because its job is to be visible from
  the screens that are _not_ it; the fetch is shared, so the screens that show alerts anyway cost
  nothing extra.

### E3 — in the demo, not yet built

**Re-verified against source 2026-08-16 before starting, and six of the fourteen were wrong or
overstated.** The audit was screenshot-driven, and things below the fold or hidden behind A1's crash
read as missing. Corrections first, because a backlog that overstates the work is as expensive as one
that misses it:

| Item | Audited as                            | Actually                                                                                                                                                                   |
| ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C3   | care-line banner absent               | **Built** — red banner, blurb and a working `tel:` button. The screenshot was scrolled past it. Only the care angel's name is missing from the blurb                       |
| C11  | "renders whole lists"                 | **Implemented** on five screens through `shared/ui/pager`. Page sizes are 12/10/20/15 against the demo's 8, so the seeded record mostly fits one page and no pager appears |
| C14  | search may be narrower                | Case search already matches title, brief, **diagnosis, symptoms** and number. Only the placeholder undersells it                                                           |
| C13  | avatars absent                        | Rendered on **profile** for the patient and the care team; absent on schedules, case detail and overview. The seed carries no `imageUrl`, so initials show regardless      |
| C1   | "the d3 `widgets/` library is unused" | Misleading. `shared/ui/charts` (sparkline, trend-chart) is newer and already used by the record page; `widgets/` is the legacy layer                                       |
| C2   | "the page has to be built"            | It exists — identity, vitals with trend and reading history, recent visits, recent activity, care team. Three panels and the header actions are what is missing            |

#### Decisions taken 2026-08-16

Asked and answered rather than assumed, because each changes what gets built:

1. **Charts are built on `shared/ui/charts`**, extending it with a bar chart and a stacked bar. It is
   what the record page already uses, so the portal keeps one chart style. The legacy d3 `widgets/`
   is left untouched and retiring it is a separate decision.
2. **The record hub gains the missing panels only** — cases, medications, reports — keeping the
   vitals-forward layout and the care-team panel rather than flattening to the demo's six equal
   panels. Coverage matches; the arrangement stays as it is, because it reads better.
3. **The overview shows both tile rows**: the portal's activity counts (open cases, upcoming visits,
   active medications, reports) _and_ the demo's record counts (emergencies, allergies, diet,
   exercise). They answer different questions and both are wanted.
4. **Avatar markup goes on schedules, case detail and overview, but no photographs go into the
   seed** — they render the same initials circle the profile screen already uses. The mockup's base64
   faces stay out of `patient-demo-seed.json`.

#### The work, in build order

Batch 1 — the record's own counts and copy. **Done 2026-08-16**, verified against the seeded record
from `npm start` over a tunnel; every string added to `en`, `fr` and `de` (209 keys each, checked
equal — see the correction below):

> **That parenthesis was wrong, and it is corrected here because it is load-bearing.** A key missing from one
> bundle does **not** render as the raw key. `translation.module.ts` calls `setDefaultLang('en')`, so
> ngx-translate falls back to the English string; the `translation-not-found[key]` marker only appears when
> English lacks the key too. Verified 2026-08-25 and pinned by `config/translation-fallback.spec.ts`.
>
> Keeping the bundles equal is still right. What was wrong was the stakes — it made a fourth language look like
> an all-or-nothing 1221-key sweep, when a locale can in fact ship in tranches and degrade to English in between.
> Spanish was added that way as a direct result.

- `[x]` **C6 · both tile rows on the overview** (decision 3), the demo's row linking through under
  "Tap any tile to open it".
- `[x]` **C7 · the hero says something specific.** "Your next appointment is 28 Jul 2026 at 09:30 AM
  with Dr. Grace Mensah. 3 of your 12 cases are still active," with **Open my record**. Ours describes
  the product instead of the patient's situation and offers no action.
- `[x]` **C9 · medications summary tiles** — 5 taking now, 8 completed, and **1 withheld (allergy)**.
  The rows are all present; the count that makes the withheld one findable is not.
- `[x]` **C4 · allergies states what it protects, and what it blocked.** The banner ("2 allergies on
  your record. Every professional who opens your context sees this panel first, and prescribing is
  blocked against it") and **Blocked by this record**, listing the withheld Amoxicillin. That row
  exists in the portal — on Medications. Here, where it means something, it is absent.
- `[x]` **C3 · name the care angel in the care-line blurb.** Reduced to its real remainder: the banner
  and the call button are built; the demo also says "and your care angel Ophelia Gaisie is called at
  the same time", which is the part that tells the patient who actually turns up.

Batch 2 — list mechanics. **Done 2026-08-16**, verified against the seeded record:

- `[x]` **C11 · page size.** Pagination works; the demo pages at 8 and we page at 12/10/20/15. Settle
  on one number and apply it, so a list looks the same everywhere.
- `[x]` **C12 · filter by professional, not just status.** The demo's Filter spans clinician _and_
  status across four screens. We have status chips on Cases and nothing elsewhere, so "what has Yaw
  Boateng seen me about?" is not askable.
- `[x]` **C14 · widen the placeholders to match the scope that already exists** ("Search cases,
  symptoms, diagnoses…"), and check the other screens' scope against their own placeholder.
- `[x]` **C13 · avatar markup on schedules, case detail and overview** (decision 4), showing initials.
  Landed on schedules and the overview's next-appointments panel through a new `hpd-avatar`, which
  also replaced the inline pattern the profile screen had. **Case detail is deliberately not among
  them**: the demo shows the clinician there as a _card_ with photo, role and "See appointments",
  which is C5 — putting a bare avatar in the header instead would invent a placement the demo does
  not have and then have to be undone.

Batch 3 — the two features. **Done 2026-08-16**, verified against the seeded record from `npm start` over a tunnel:

- `[x]` **C2 · the record hub gains cases, medications and reports panels** (decision 2), each
  paginated, plus the Print/Close header. **+ Add activity** and **↑ Upload report** are C10.
  Five list panels now sit under **On this record** — cases, visitations, activity trail,
  medications, reports — each paging the whole collection three rows at a time, with an expander in
  its head to the full screen. Visits and activity used to preview six rows behind a _See all_; with
  five panels side by side a preview leaves no way to reach the seventh row without leaving the
  page, so they page like the rest. Rows that belong to a case open it. Two things came out of
  building it: `.hc-drow__sub` carried a top margin with no `display`, so the secondary text ran on
  from the title as if it were part of it on every screen that uses a dated row — it is a block now;
  and rows with no case render as anchors without an `href`, which is not a link rather than a link
  that goes nowhere.
- `[x]` **C1 · "Care at a glance" — three charts with table views** (decision 1). Visits over time
  (area, direct endpoint label), case distribution (stacked bar, 9 closed / 2 in treatment / 1 open,
  "12 cases on file since January 2019"), and cases-and-visits per professional (grouped horizontal
  bars). Each has a **Table** toggle, introduced as "Every chart has a table view — press Table to
  read the numbers": an accessibility commitment, not a chart option. `chart.table` and `chart.when`
  are already in the i18n bundle and the record page already implements the pattern.
  On the overview, where the demo puts it. `shared/ui/charts` gained `hpd-stack-bar` and
  `hpd-bar-chart` alongside the existing sparkline and trend chart; the legacy d3 `widgets/` was not
  touched. Each chart has its own Table flag, so reading one set of numbers does not flip the two
  either side of it. Two things the seeded record exposed: the trend chart padded its scale 35%
  below the minimum, which on a series of counts drew a gridline at **−1.7 visits** — it now stops
  at zero, and `[wholeNumbers]` snaps the axis to whole numbers for a count; and the bar chart is
  drawn at a 900-wide viewBox rather than 620 because it is laid out full width, and an SVG scaled
  up a third scales its type with it — 11.5px labels were arriving at 17px, larger than the card
  heading above them. `monthlyCounts` keeps empty months at zero: a gap in care is a finding, and
  plotting only the months that have something turns a quiet spring into an unbroken line.

#### Decisions taken 2026-08-16 (batch 4)

5. **The portal gets its own dialog** — `hpd-modal` in `shared/ui`, built on the portal's `hc-`
   CSS rather than on `NgbModal`. ng-bootstrap stays where it already is: the account, admin and
   entity screens. `.modal` is a Bootstrap class, and opening one inside an `hc-` screen means
   styling _around_ `.modal-dialog`, `.modal-content` and their z-index rather than with them.
6. **Log activity writes for real** — `POST /api/activity-logs` with `source: PATIENT`, then a
   reload of the shared data. The api gates `/api/**` on `authenticated()` only, so a signed-in
   patient may file against their own record; nothing needed changing on the backend for this.

Batch 4 — **C5, C8, the A5 leftover and D1 done 2026-08-16**; C10 still blocked.

- `[x]` **C5 · case detail: Log activity, and the clinician.** **Log activity** (framed "Your own
  notes appear here too"), the paginated activity-trail panel, the clinician card (photo, "General
  Practitioner · Accra · Osu", **See appointments**), and Print / Copy / Close. The note is a real
  write, per decision 6 — verified by writing "Dizzy on standing up" against case 12 and watching it
  come back from the server credited to **You**. Copy puts the case on the clipboard as plain text,
  for sending to somebody who is not on the portal.
- `[x]` **C8 · detail views for vitals, appointments, alerts, medicines and reports.** **Three of
  the five were already covered, and building all five would have added a click that changes
  nothing** — the audit counted the demo's _table rows_, and this portal renders three of those
  lists as cards that already carry the whole record:

  | Row                     | Was it terminal?                                          | Built?                                                                  |
  | ----------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
  | Medications             | yes — a table row                                         | **yes**: the withheld reason is the one sentence this screen most needs |
  | Vitals, on the overview | yes — a static tile with an unlabelled sparkline          | **yes**: band, full-size trend, and the readings as a table             |
  | Appointments, attended  | yes — a table row                                         | **yes**: adds the clinician card and the case                           |
  | Reports                 | no — the card carries summary, author, case and Open file | no                                                                      |
  | Emergencies             | no — the card carries detail, outcome and who attended    | no                                                                      |
  | Appointments, upcoming  | no — the card carries clinician, place and case           | no                                                                      |
  | Vitals, on the record   | no — the tile already drives the trend chart beside it    | no                                                                      |

- `[x]` **C10 · Upload a report**, with **+ Add activity** (C2) and **Log activity** (C5) — the demo's
  position that the record belongs to the patient. ~~blocked on an api decision~~ **Unblocked and
  built 2026-08-16**: the api stores report files in GridFS, in the MongoDB it already uses, and
  serves them back through `PatientScope` so a file is visible exactly when its report is. The
  portal creates the report first and attaches the file second — the api's shape, and the better
  failure: an upload that dies halfway leaves a report to retry against rather than nothing. PDF,
  JPEG, PNG and HEIC up to 10 MB, decided from the _bytes_ rather than the filename.
  **Opening the file needed a second fix, found by deploying it.** "Open file" was a plain
  `<a href>`, and a browser navigation carries no Authorization header — so following it produced a
  401 error page for every uploaded file. Nothing had revealed it before, because every _seeded_
  report has an empty `url` and the button had never been pressed against a real file. It now
  fetches through the interceptor and opens the result as a blob, with the tab opened inside the
  click itself so a popup blocker still trusts it.

### E4 — wording, vocabulary and seed data

- `[x]` **D1 · status vocabulary drifted** toward the enum names: _In treatment → Treatment_, _Taking
  now → Active_, _Attended → Completed_, _Urgent → High_, _Awaiting confirmation → Pending_. The
  severity one matters most; _Urgent_ is what a person reads on an emergency.
  Fixed 2026-08-16 by an `hpdStatus` pipe over a `patientPortal.status.*` map, replacing `humanise`
  on twenty pills across ten screens — the enum values are unique across the domains the portal
  renders, so one flat map covers cases, medications, appointments, emergencies, allergies and
  vitals. Anything the backend adds later falls back to sentence case rather than rendering a raw
  translation key. It also caught a pair nobody had listed: vitals read **Ok** and **Warn**, where
  the demo reads _In range_ and _Watch_.
- `[ ]` **D2 · "What was reported" / "What was found"** replace the demo's _Symptoms_ / _Diagnosis_.
  This reads as an improvement on the demo rather than drift from it — make it a decision and apply it
  everywhere, rather than leaving two documents disagreeing.
- `[x]` **D3 · honorifics dropped** ("Dr. Grace Mensah" → "Grace Mensah"). ~~The seed stores the
  honorific; this is presentation.~~ **It did not.** `Professional.honorific` was added to the api,
  the generator now lifts it out of the mockup's own name, and `CareTeamMember.name` carries it — so
  it appears everywhere a clinician is named, without every screen having to remember a second
  field. The mockup gives an honorific to exactly one of the six people, and the seed does the same:
  guessing "Dr." onto a physiotherapist would be the very mistake this item is about. Note the
  api redacts professionals for non-staff callers by _whitelist_, so the field had to be named there
  too or a patient would never have seen it.
- `[x]` **D4 · sign-in asks for a username, not an email.** ~~The demo signs in with `kojo@jac.net` and
  offers **Continue with care card**~~ — **decided 2026-08-16: authentication is exclusively by
  login.** Not a gap, and not deferred: the demo diverges from the product here and the portal is
  right as it stands.

  That closes the care card with it. "Continue with care card" is a second credential, and the
  number it would accept is printed on a physical card _and_ displayed on the profile screen — a
  credential a patient shows to a receptionist and carries in a wallet is not one that should open
  a record. It stays what it is: a field on the record, never a way in.

  Register and Forgot password stay. Neither is an alternative credential — one creates a login, the
  other recovers it — so both are consistent with login-only authentication. Nothing in the app
  needed changing: the sign-in screen already asks for a username and nothing anywhere offers a card.

  One consequence worth carrying forward: **registration is open**, so a login is obtainable by
  anyone with an email address. That is exactly the exposure `PatientScope` in the api was written
  against, and it is why cross-patient access has to stay a thing a _role_ grants rather than a check
  somebody remembers to write.

- `[x]` **D5 · vitals carry no attribution.** Demo: "Recorded 24 July 2026 by Ophelia Gaisie."
  `Stat` gained `source` and `recordedById`, mirroring `ActivityLog`, so a reading the patient took
  at home reads "you" through the attribution rule the portal already had. **Half the seeded
  readings are deliberately unattributed**: three of the six reading days are Ophelia's home visits,
  whose stated purpose is "Vitals and glucose check", and the other three fall on physiotherapy
  sessions at the Tema centre — a physiotherapist taking a glucose reading is not something this
  record says. Leaving those unnamed is the record being honest, and it exercises both rendering
  paths.
- `[ ]` **D6 · case rows print their title twice.** `patient-demo-seed.json` sets `brief` to the same
  string as `title` because the mockup has one label per case. Either give `brief` real content or stop
  rendering it. Seed-side fix lives in `hc-patient-quality`.
- `[ ]` **D7 · ongoing conditions show a bare `—` and repeat themselves.** The panel is an addition
  beyond the demo; it needs a date and a description that adds something. Seed-side, as D6.
- `[ ]` **D8 · the sidebar drops the patient's location** ("Patient · Accra, GH" → "Patient"), which is
  already on the record.
- `[ ]` **D9 · the sign-in counters are inherited, not computed.** Both show _12 cases · 41 visits · 6
  professionals · 24/7_; twelve and six match the record, forty-one does not (eighteen are seeded).
  They read as live numbers on a page nobody has signed into. Decide whether they are marketing copy or
  a figure, and make them honest either way.

### Ahead of the demo — keep when closing the above

Not gaps. Recorded so a parity pass does not quietly delete them.

- Case links on every artefact — medications, reports, visits and activity all link back to the case
  that produced them. The demo does not.
- Report summaries inline on the list, rather than one click away.
- Kind filter chips on the activity trail.
- The "Most recent alert" panel on the overview, with narrative and outcome.
- Ongoing conditions surfaced on Allergies (see D7).

## Out of scope here

- **The Ionic mobile app** (blueprint Phase 3) belongs to the separate `hc-patient-app` repo, which currently holds only an initial commit and an empty `bin/jhipster-ionic` directory. When it starts, its plan lives there; this file only records the boundary and decision 4.
- **Packaging, images, nginx, compose, the server and its monitoring** belong to `hc-patient/deploy` and are tracked in its `TODO.md`. Changes to how this app is served — including the `/v1/traces` ingest that browser telemetry depends on — are made there, not here.
