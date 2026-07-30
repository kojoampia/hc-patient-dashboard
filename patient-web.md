# Patient Web — Plan

Single plan of record for `hc-patient-dashboard`. It consolidates what used to be spread across the now-deleted `AGENT.md` (refactoring plan), `code-review.md` (deploy/compose findings), `HC - Patient Blueprint.md` / `HC - Patient Checklist.md` (subsystem phases), and the `.github/todo.md` / `.github/patient_plan.md` drafts.

- **Baseline verified:** 2026-07-30 against `package.json`, `angular.json`, `jest.conf.js`, `webpack/`, `src/main/webapp`, the compose/Docker files, and the CI workflow.
- **Companion docs:** `CLAUDE.md` (what exists and how it is wired), `AGENTS.md` (standing expectations), `README.md` (stack, commands, ports).
- **Sibling plans:** `hc-patient-service/patient-api.md`, `hc-patient-gateway/patient-gateway.md`.

Status legend: `[x]` done · `[~]` partial / diverges from plan · `[ ]` not started.

## Open decisions

1. **Dev API port.** Three values disagree: `webpack/proxy.conf.js` + `webpack/environment.js` target `http://localhost:5505`, the gateway's dev port is `5503`, and `docker-compose.yml` sets `SERVER_API_URL=http://localhost:5501/`. Pick the real one and make the rest follow.
2. **Entity screens: route them or retire them.** `entities/entity.routes.ts` and `entities/entity-navbar-items.ts` are empty, so all of `entities/patientMS/**` is unreachable. Either register the routes and menu items, or delete the screens deliberately — do not leave them in limbo.
3. **Registry strategy.** CI publishes to `ghcr.io/<owner>/<repo>`; the npm deploy scripts and prod compose target `docker-registry.jojoaddison.net`. Decide which is authoritative for deployments.
4. **Runtime vs build-time API base.** `SERVER_API_URL` is baked in at image build time, so the runtime env var in `docker-compose.yml` cannot take effect. Either accept baking or introduce a runtime config file nginx can substitute.
5. **Mobile app baseline.** The blueprint calls for a fresh Angular 19+ Ionic workspace in the separate (currently empty) `hc-patient-app` repo. Decide whether it starts there or reuses this app's Angular 17 baseline and shared models. Tracked below only as a boundary note — the work itself belongs in that repo.

## Baseline — already in place

- `[x]` Angular 17 app (standalone + legacy NgModules), JHipster 8.1.0 client-only scaffold, i18n for `en`/`fr`/`de`.
- `[x]` Auth against the gateway with interceptor-based JWT attachment, `UserRouteAccessService` guards, account and admin surfaces.
- `[x]` Dashboard rendered by `HomeComponent` at `/`, with `metric-panel` and `status-panel`.
- `[x]` Modal feature views: temperature, blood pressure, heart rate, sugar, allergies, emergency.
- `[x]` d3-based widget library (linechart, piechart, heatmap, treemap, histogram, tilebox, info-box, slides, file-viewer, chatbot, faq, …).
- `[x]` Generated CRUD screens for the patient entities under `entities/patientMS/**` (present but unrouted — decision 2).
- `[x]` Jest unit tests colocated with the code (145 spec files); CI builds and publishes an nginx image to GHCR.

## Phase A — wiring and correctness

- `[ ]` Resolve decision 1 and align the proxy, `webpack/environment.js`, and compose env in one change.
- `[ ]` Resolve decision 2: centralize entity route registration in `entities/entity.routes.ts` and populate `entity-navbar-items.ts` — routes and menu land together, never separately.
- `[ ]` Rename the `hc-credential` and `hc-pay-option` areas to match the backend's `PersonalDocument` and `PaymentOption` (models, services, routes, i18n keys, specs). Coordinate with `patient-api.md` Phase A, which still has to generate those endpoints.
- `[ ]` Reinstate Cypress or drop it: `.yo-rc.json` lists it and `src/test/javascript/cypress/e2e/` exists, but the dependency and the `e2e` script are missing, so e2e cannot run.
- `[ ]` Reconcile `angular.json` metadata: project name is still `patient-gateway` and `prefix` is `jhi` while ESLint requires `hpd`.
- `[ ]` Decide the PWA posture — the service worker is registered with `enabled: false` in `app.config.ts`.

### The test suite is red as checked in

Measured on 2026-07-30 (`npx ng test`): **647 of 654 tests pass, 134 of 145 suites pass.** Three independent causes, none of them a regression — all three predate the docs/entity-config work merged into `main`:

- `[ ]` **`npm test` cannot even start.** Its `pretest` lint step reports 456 errors, all `Parsing error: Cannot read file '.../src/test/javascript/cypress/tsconfig.json'` — ESLint is configured to type-check the Cypress specs, but that `tsconfig.json` was never committed. Fix by adding it, excluding `src/test/javascript` from linting, or removing the skeleton along with the Cypress decision above. Until then use `npx ng test`.
- `[ ]` **11 suites fail to parse d3.** d3 v7 ships ESM `.js` (`node_modules/d3-selection/src/index.js` starts with `export`), while `jest.conf.js` only exempts `.mjs` and `dayjs/esm` from `transformIgnorePatterns`. Every suite that transitively imports a d3-based widget dies with "Jest encountered an unexpected token" — including `home.component.spec.ts` and the whole `dashboard/` and `features/` area. Fix by widening `transformIgnorePatterns` to cover `d3-*` (and `internmap`/`delaunator`, which d3 pulls in).
- `[ ]` **7 tests fail with `No provider for NgbActiveModal!`** in `features/*` specs (allergies, blood pressure, emergency, heart rate, sugar, temperature) plus `DashboardService › should be created`. The modal components inject `NgbActiveModal` but the specs never provide it — the same modal-wrapper inconsistency that Phase B item 4 is about, so fix them together.

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

## Phase C — deployment and packaging fixes

Verified findings; the earlier review of `build-deploy.sh` is obsolete since that script was deleted in `79f3177`.

1. `[ ]` **`docker-compose-prod.yml` is invalid.** The service declares `networks: [hcnet]` but the top-level block defines the key `devnet` (with `name: hcnet`), and compose resolves by key. `docker compose -f docker-compose-prod.yml config` fails with `service "hc-patient-dashboard" refers to undefined network hcnet`. Rename the key to `hcnet` or point the service at `devnet`, then re-run `config` as a check. (The dev file validates fine.)
2. `[ ]` **Image names don't match the tag/push scripts.** Compose builds `hc-patient-dashboard:0.0.1`; `docker:dev:tag`/`docker:prod:tag` operate on `patientdashboard:0.0.1` and push to `docker-registry.jojoaddison.net/hc/patientdashboard`; `docker-compose-prod.yml` uses a third form, `docker-registry.jojoaddison.net/hc-patient-dashboard`. `npm run deploy:dev|deploy:prod` therefore tags an image that was never built. Pick one name and one registry path and align all three.
3. `[ ]` **Resolve the registry split** (decision 3) and retire the dead publishing path.
4. `[ ]` **Fix the compose volume mounts.** `./patientdashboard:/usr/src/app` (dev) and `./hc-patient-dashboard:/usr/src/app` (prod) point at nonexistent host directories on an nginx image that serves `/usr/share/nginx/html`; the mount does nothing but create empty directories. Drop them, or bind-mount built assets onto the nginx root if live-serving local builds is the intent.
5. `[ ]` **Resolve the build-time vs runtime API base** (decision 4).
6. `[ ]` Keep `pom.xml`'s `<version>` in sync with `package.json` — CI scrapes the image tag from the pom, which is the only remaining use for that file.

## Phase D — features the blueprint expects but the web app lacks

These come from the subsystem blueprint's Phase 3 and are largely blocked on backend work. The blueprint framed them as mobile screens; decide per item whether the web dashboard also needs them.

- `[ ]` Subscription plan selection / display (Pear, Melon, Pawpaw) — blocked on `patient-api.md` Phase B, including the unresolved plan-price contradiction.
- `[ ]` Onboarding wizard (basic info → identification → plan) — blocked on a unified onboarding endpoint.
- `[ ]` Historical telemetry views — blocked on `patient-api.md` Phase C; the current metric panels read from `Stat`.
- `[ ]` Calendar / upcoming visits — no scheduling entity exists in any backend.
- `[ ]` Assigned professionals directory — needs a contract with the professional subsystem.
- `[ ]` Time-bound record sharing toggles — no sharing/consent model exists.
- `[ ]` `PATIENT`/`ANGEL` role support in the `Authority` enum and route guards — joint change tracked in `patient-gateway.md` Phase B.

## Out of scope here

The Ionic mobile app (blueprint Phase 3) belongs to the separate `hc-patient-app` repo, which currently holds only an initial commit and an empty `bin/jhipster-ionic` directory. When it starts, its plan lives there; this file only records the boundary and decision 5.
