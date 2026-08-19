# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Health Connect Patient Dashboard (`patientDashboard`) — the Angular web client for the patient subsystem. Generated with JHipster 8.1.0 as a **client-only** app (`skipServer: true`): there are **no Java sources here** and Maven cannot build this repo.

|                  |                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Framework        | Angular 17.0.6 (standalone components + some legacy NgModules)                                    |
| Language         | TypeScript 5.2.2, RxJS 7.8                                                                        |
| UI               | ng-bootstrap 16 + Bootstrap/SCSS, d3 7 for the custom widgets                                     |
| Tests            | Jest 29 via `@angular-builders/jest` (`jest.conf.js`)                                             |
| Build            | Angular CLI 17 + `@angular-builders/custom-webpack` (`webpack/`), output `target/classes/static/` |
| i18n             | enabled — `en`, `fr`, `de` under `src/main/webapp/i18n`                                           |
| Dev server       | 4200 (`npm start`, HMR)                                                                           |
| Component prefix | ESLint requires `hpd`; `angular.json` still says `jhi` and legacy `jhi-*` selectors remain        |

Companion docs in this repo:

- `patient-web.md` — **the plan of record**: open decisions, wiring fixes, refactoring order and hotspots, deployment/packaging findings, and blueprint features that are still blocked. Check it before starting new work.
- `AGENTS.md` — standing style/typing/security/performance expectations.
- `README.md` — commands, ports, Docker, CI.

`AGENT.md`, `code-review.md`, `HC - Patient Blueprint.md`, `HC - Patient Checklist.md`, `.github/todo.md`, and `.github/patient_plan.md` were deleted in the consolidation — their content is in `patient-web.md` (or, for backend/mobile phases, the sibling repos' plans). Note `AGENTS.md` (plural) is the live conventions file; the old singular `AGENT.md` is gone.

Sibling plans: `hc-patient-service/patient-api.md`, `hc-patient-gateway/patient-gateway.md`.

## How it reaches the backend

```
browser → this app (ng serve :4200, webpack proxy) → hc-patient-gateway :5505
                                                       /services/hcpatientservice/** → hc-patient-service :8081
```

- Always build URLs with `ApplicationConfigService.getEndpointFor(api, microservice?)` — pass `'hcpatientservice'` for microservice calls so the gateway's routing applies. Never hardcode a host, port, or `/services/...` prefix.
- The gateway issues the JWT; `core/interceptor` attaches it. Route protection uses `UserRouteAccessService` with `data.authorities`.
- `webpack/proxy.conf.js` forwards `/api`, `/services`, `/management`, `/v3/api-docs`, `/auth`, `/health` to **`http://localhost:5505`**, and that is where the gateway listens. These disagreed until 2026-08-03 (the gateway was on 5503); the gateway moved rather than the proxy, in every profile. Production builds same-origin (`SERVER_API_URL` empty, `<base href="/">`) and the web container's nginx does the fan-out.
- The `Authority` enum holds `ROLE_ADMIN`, `ROLE_USER`, `ROLE_PATIENT` and `ROLE_ANGEL`. No route guards on the last two, and that is the answer rather than an omission: an angel's authority is an `ACTIVE` care delegation the backend re-reads per request, so guarding a screen on `ROLE_ANGEL` would leave the menu entry for somebody whose delegation was revoked.
- **`X-Acting-As`** is set by `ActingAsInterceptor` and by nothing else. A care angel opens a patient's record through it; a screen that built its own request and forgot it would silently read the wrong person's record and answer 200.

## Commands

```bash
npm install
npm start                                    # dev server :4200 with HMR
npm test                                     # Jest + coverage (pretest runs lint)
npm test -- --test-path-pattern=dashboard    # one area — Jest flags must be kebab-case here
npx ng test --coverage=false                 # skips the pretest lint step, which currently fails
npm run lint | npm run lint:fix
npm run webapp:build:dev | npm run webapp:prod
npm run prettier:check | npm run prettier:format
```

Do **not** run `./mvnw` here: there is nothing to compile. `pom.xml` used to set `java.version` 26 against an Enforcer rule allowing only `[17,26)` — a contradiction that failed every Maven goal outright; it is now 25 and internally consistent, but the pom still builds nothing. It survives solely because CI scrapes the image version from its first `<version>`.

Angular CLI rejects camelCase Jest flags (`--testPathPattern` → `Unknown arguments`), so pass kebab-case through `ng test`. Calling `npx jest` directly does not work: `jest.conf.js` carries no transform, since the Angular preset comes from the builder.

`npx ng test` passes (146 suites, 681 tests, ~110s). `npm test` runs ESLint first and still fails there on 172 pre-existing problems — 161 errors and 11 warnings across 77 files, mostly `jhi-*` selectors against the `hpd` rule — so prefer `npx ng test` while working. `patient-web.md` Phase A tracks the remainder; don't read those lint errors as something you caused. Note CI gates nothing today: the only workflow has been failing since 2026-07-30 (`patient-web.md` Phase C).

## Layout

Source root is `src/main/webapp` (`angular.json` `sourceRoot`).

```
src/main/webapp/app/
  core/          auth, interceptors, ApplicationConfigService, request utilities
                 telemetry/  OpenTelemetry browser SDK setup + the global ErrorHandler
  shared/        shared module, i18n helpers, alerts, common UI plumbing
  config/        constants, authorities, dayjs/datepicker configuration
  layouts/shell/      the portal frame — navy sidebar, sticky topbar, mobile drawer and tab bar
  layouts/auth-shell/ the signed-out split brand/form screen
  portal/        the 13 patient screens (see below) + portal/data/ — the scoped data layer
  home/          landing route — renders DashboardComponent
  dashboard/     dashboard component/service + metric-panel, status-panel
  features/      modal wrappers: temperature, blood pressure, heart rate, sugar, allergies, emergency
  widgets/       d3 visualizations (linechart, piechart, heatmap, treemap, histogram, tilebox, …)
  entities/      user/ plus patientMS/** generated CRUD
  onboarding/    the five-step wizard, on the auth layout behind the signed-in guard
  invitations/   where a nominated care angel accepts or declines
  account/ admin/ login/   standard JHipster surfaces
```

**The portal is the app.** `app/portal/` holds thirteen routed screens — overview, record, cases, case
detail, schedules, emergencies, medications, reports, plans, allergies, visitations, activity, profile
— built against `patient-web-demo.html` on `feature/ui-refactor`. They read through
`portal/data/portal-data.service.ts`, which scopes every collection to the signed-in patient in one
place, and format through `portal/data/portal-format.ts`. `app.routes.ts` redirects `/` to `overview`.
`layouts/shell/shell-nav.ts` defines the sidebar; it lists ten of the thirteen, so `visitations` and
`activity` are routed but have no way in (`patient-web.md` Phase E, B1).

Two wiring facts that surprise people:

1. **`HomeComponent` is not the portal.** It renders the older `DashboardComponent`, which survives
   alongside `portal/overview`. Don't mistake it for the screen users see.
2. **The generated entity screens are routed but not in the menu.** `entities/entity.routes.ts` now
   registers address, condition, medication, stat and the rest; `entity-navbar-items.ts` is still an
   empty array, so nothing under `entities/patientMS/` appears in a menu. Don't delete those screens as
   "dead" — decision 2 in `patient-web.md` covers routing versus retiring them.

Also: `entities/patientMS/hc-credential` and `hc-pay-option` still use the pre-rename entity names; the backend calls them `PersonalDocument` and `PaymentOption` (and hasn't generated those endpoints yet).

## Onboarding, and acting for another patient (2026-08-19)

`docs/onboarding.md` is the plan of record; §16 is the contract.

- **`/onboarding`** is five steps on `AuthShellComponent` behind `UserRouteAccessService`, not in the portal shell. A patient there has a token but no record: the shell injects `PortalDataService` and subscribes to their emergencies on load, which would fire patient-scoped fetches for a patient who does not exist, behind a sidebar of destinations that would all be empty. Each step saves before the next, because the backend has no transaction to wrap the journey in.
- **Two guards, not one.** `onboardingGuard` keeps an un-onboarded patient out of the portal; `onboardingCompleteGuard` keeps a finished one out of the wizard. Without the second they disagree and it is a redirect loop. The first also has a third branch that is easy to delete by accident: somebody with no record but a *pending nomination* goes to `/invitations`, not to the wizard — being a care angel does not make you a patient, and without it they are asked to create a patient record purely to answer somebody else's nomination.
- **The acting-as banner in the shell is a safety control.** Every screen behind it is showing a record that is not the signed-in person's, and the failure it prevents is somebody reading a blood group believing it is their own. Switching records must reload `PortalDataService`, or the previous patient's data stays on screen under the new patient's name.

Two things that will bite anyone touching the portal's data layer:

- `PatientContextService.profile$` narrows its `catchError` to **404 only**. It used to swallow everything, which was harmless while nothing read it and is not now that a route guard does — a network blip would throw a fully onboarded patient into the wizard, and a 401 would look like a brand-new account. **Do not widen it back.**
- `Profile.address` is an `IAddress` document, not a string. Interpolating it directly prints `[object Object]`; `formatAddress` in `portal/data/portal-format.ts` is the one way to render it.

## Constraints

- Keep `jhipster-needle-*` markers, generated entity CRUD patterns, account/admin/auth flows, and i18n key structure intact — refactor around these seams.
- No `any`, `Observable<any>`, or `HttpResponse<any>` in new code; type API payloads explicitly.
- Standalone-first for new work; don't rewrite the whole app to one style in a single pass, and don't run a repo-wide `jhi-*` → `hpd-*` selector migration unless that is the task.
- Every user-visible string needs a key in all three i18n bundles.
- Indentation is 2 spaces everywhere (`.editorconfig` root `indent_size = 2`; its `[*.md]` section only disables trailing-whitespace trimming), and lint-staged runs Prettier on commit.
- Cypress is configured in `.yo-rc.json` with a skeleton under `src/test/javascript/cypress/`, but it is not installed and has no npm script — e2e cannot run today.
- This repo no longer packages or deploys itself: `nginx.conf`, the Dockerfile, `docker-compose*.yml` and the `docker:*:tag`/`deploy:*` scripts moved to `hc-patient/deploy/` (repo `kojoampia/hc-patient-ci`). Change the image, its nginx config, or the deploy there, not here. The generated `src/main/docker/*.yml` helpers stay — they are local dev services, not deployment.
- `patient-db.log` is output from the workspace-level `start-patient.sh` helper.
