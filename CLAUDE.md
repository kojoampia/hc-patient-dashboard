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
browser → this app (ng serve :4200, webpack proxy) → hc-patient-gateway :5503
                                                       /services/hcpatientservice/** → hc-patient-service :8081
```

- Always build URLs with `ApplicationConfigService.getEndpointFor(api, microservice?)` — pass `'hcpatientservice'` for microservice calls so the gateway's routing applies. Never hardcode a host, port, or `/services/...` prefix.
- The gateway issues the JWT; `core/interceptor` attaches it. Route protection uses `UserRouteAccessService` with `data.authorities`.
- `webpack/proxy.conf.js` forwards `/api`, `/services`, `/management`, `/v3/api-docs`, `/auth`, `/health` to **`http://localhost:5505`**, while the gateway's dev port is `5503` and `docker-compose.yml` says `5501`. These three disagree — see decision 1 in `patient-web.md` before debugging "API unreachable".
- The `Authority` enum knows only `ROLE_ADMIN` and `ROLE_USER`; no `PATIENT`/`ANGEL` role exists anywhere in the subsystem yet.

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

Do **not** run `./mvnw` here: there is nothing to compile, and `pom.xml` sets `java.version` 26 while its Enforcer rule allows only `[17,26)`, so Maven goals fail on the installed JDK. The pom survives solely because CI scrapes the image version from its first `<version>`.

Angular CLI rejects camelCase Jest flags (`--testPathPattern` → `Unknown arguments`), so pass kebab-case through `ng test`. Calling `npx jest` directly does not work: `jest.conf.js` carries no transform, since the Angular preset comes from the builder.

`npx ng test` passes (145 suites, 677 tests). `npm test` runs ESLint first and still fails there on 160 pre-existing rule violations — mostly `jhi-*` selectors against the `hpd` rule — so prefer `npx ng test` while working. `patient-web.md` Phase A tracks the remainder; don't read those lint errors as something you caused.

## Layout

Source root is `src/main/webapp` (`angular.json` `sourceRoot`).

```
src/main/webapp/app/
  core/          auth, interceptors, ApplicationConfigService, request utilities
  shared/        shared module, i18n helpers, alerts, common UI plumbing
  config/        constants, authorities, dayjs/datepicker configuration
  layouts/       navbar, footer, main shell, profile info, error pages
  home/          landing route — renders DashboardComponent
  dashboard/     dashboard component/service + metric-panel, status-panel
  features/      modal wrappers: temperature, blood pressure, heart rate, sugar, allergies, emergency
  widgets/       d3 visualizations (linechart, piechart, heatmap, treemap, histogram, tilebox, …)
  entities/      user/ plus patientMS/** generated CRUD
  account/ admin/ login/   standard JHipster surfaces
```

Two wiring facts that surprise people:

1. **The dashboard has no route.** `HomeComponent` imports and renders `DashboardComponent` at `/`.
2. **The generated entity screens are unreachable.** `entities/entity.routes.ts` and `entities/entity-navbar-items.ts` contain only the JHipster needles / an empty array, so nothing under `entities/patientMS/` is routed or in the menu. Don't delete those screens as "dead" — decision 2 in `patient-web.md` covers routing versus retiring them.

Also: `entities/patientMS/hc-credential` and `hc-pay-option` still use the pre-rename entity names; the backend calls them `PersonalDocument` and `PaymentOption` (and hasn't generated those endpoints yet).

## Constraints

- Keep `jhipster-needle-*` markers, generated entity CRUD patterns, account/admin/auth flows, and i18n key structure intact — refactor around these seams.
- No `any`, `Observable<any>`, or `HttpResponse<any>` in new code; type API payloads explicitly.
- Standalone-first for new work; don't rewrite the whole app to one style in a single pass, and don't run a repo-wide `jhi-*` → `hpd-*` selector migration unless that is the task.
- Every user-visible string needs a key in all three i18n bundles.
- Indentation is 2 spaces everywhere (`.editorconfig` root `indent_size = 2`; its `[*.md]` section only disables trailing-whitespace trimming), and lint-staged runs Prettier on commit.
- Cypress is configured in `.yo-rc.json` with a skeleton under `src/test/javascript/cypress/`, but it is not installed and has no npm script — e2e cannot run today.
- `docker-compose-prod.yml` is currently invalid (network key mismatch) and the `docker:*:tag`/`deploy:*` scripts reference an image name the compose files don't build — Phase C of `patient-web.md`.
- `patient-db.log` is output from the workspace-level `start-patient.sh` helper.
