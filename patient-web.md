# Patient Web — Plan

Single plan of record for `hc-patient-dashboard`. It consolidates what used to be spread across the now-deleted `AGENT.md` (refactoring plan), `code-review.md` (deploy/compose findings), `HC - Patient Blueprint.md` / `HC - Patient Checklist.md` (subsystem phases), and the `.github/todo.md` / `.github/patient_plan.md` drafts.

- **Baseline verified:** 2026-08-03 against `package.json`, `angular.json`, `jest.conf.js`, `.eslintrc.json`, `webpack/`, `src/main/webapp`, the CI workflow and its last four runs, and a full `ng test` + `npm run lint`. (Previous baseline 2026-07-30, when this repo still owned its own Docker and compose files.)
- **Companion docs:** `CLAUDE.md` (what exists and how it is wired), `AGENTS.md` (standing expectations), `README.md` (stack, commands, ports).
- **Sibling plans:** `hc-patient-service/patient-api.md`, `hc-patient-gateway/patient-gateway.md`, and `hc-patient/deploy/TODO.md` — which now owns everything about packaging and shipping this app.

Status legend: `[x]` done · `[~]` partial / diverges from plan · `[ ]` not started.

## What changed since the last baseline

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
  config change: `member-ordering` now expects private instance fields *before* public ones, because
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
2. **Mobile app baseline.** The blueprint calls for a fresh Angular 19+ Ionic workspace in the separate (currently empty) `hc-patient-app` repo. Decide whether it starts there or reuses this app's Angular 17 baseline and shared models. Tracked here only as a boundary note — the work itself belongs in that repo.

Resolved since the last baseline, kept so the numbering change is traceable:

- ~~**Dev API port.**~~ Settled 2026-08-03: the **gateway moved to 5505**, matching what
  `webpack/proxy.conf.js` and `webpack/environment.js` already targeted, so `npm start` reaches it
  with no further configuration. The move is across *every* profile — `application-dev.yml`,
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

- `[x]` Angular 17 app (standalone + legacy NgModules), JHipster 8.1.0 client-only scaffold, i18n for `en`/`fr`/`de`.
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

- `[ ]` Resolve decision 1 and align `webpack/proxy.conf.js` with `webpack/environment.js` in one change.
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
- `[ ]` Underneath sit **172 problems — 161 errors and 11 warnings — across 77 files**, none of them new (2026-07-30: 160 across 76). By rule: 73 selector-prefix (68 `component-selector` + 5 `directive-selector`, `jhi-*` where ESLint wants `hpd`), 22 `no-console`, 20 `member-ordering`, 15 empty lifecycle methods, 12 missing return types, 11 `use-lifecycle-interface`, and 19 assorted `@typescript-eslint` rules (`prefer-nullish-coalescing`, `no-unnecessary-condition`, `ban-types`, `no-unsafe-return`, …). The selector ones are Phase B territory — a repo-wide rename is deliberately not something to do in passing. Decide per group whether to fix the code or relax the rule, then gate `npm test` in CI (decision 3).

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

These come from the subsystem blueprint's Phase 3 and are largely blocked on backend work. The blueprint framed them as mobile screens; decide per item whether the web dashboard also needs them.

- `[ ]` Subscription plan selection / display (Pear, Melon, Pawpaw) — blocked on `patient-api.md` Phase B, including the unresolved plan-price contradiction.
- `[ ]` Onboarding wizard (basic info → identification → plan) — blocked on a unified onboarding endpoint.
- `[ ]` Historical telemetry views — blocked on `patient-api.md` Phase C; the current metric panels read from `Stat`. Note this means _patient_ telemetry (vitals over time), which is unrelated to the OpenTelemetry instrumentation added in 2026-08-03.
- `[ ]` Calendar / upcoming visits — no scheduling entity exists in any backend.
- `[ ]` Assigned professionals directory — needs a contract with the professional subsystem.
- `[ ]` Time-bound record sharing toggles — no sharing/consent model exists.
- `[ ]` `PATIENT`/`ANGEL` role support in the `Authority` enum and route guards — joint change tracked in `patient-gateway.md` Phase B. The enum still holds only `ROLE_ADMIN` and `ROLE_USER`, and no service in the subsystem issues the other two.

## Out of scope here

- **The Ionic mobile app** (blueprint Phase 3) belongs to the separate `hc-patient-app` repo, which currently holds only an initial commit and an empty `bin/jhipster-ionic` directory. When it starts, its plan lives there; this file only records the boundary and decision 4.
- **Packaging, images, nginx, compose, the server and its monitoring** belong to `hc-patient/deploy` and are tracked in its `TODO.md`. Changes to how this app is served — including the `/v1/traces` ingest that browser telemetry depends on — are made there, not here.
