# AGENT.md

## Purpose

This file guides agents refactoring the **Health Connect Patient Dashboard** safely and incrementally.

The repo is a **JHipster 8 gateway application** with an **Angular 17 frontend** under `src/main/webapp` and Maven/JHipster infrastructure at the root. In this checkout, the code that is clearly present and refactorable is primarily the **frontend**.

## Current architecture snapshot

### Frontend

- `src/main/webapp/app/core`
    - auth, request utilities, interceptors, application config
- `src/main/webapp/app/shared`
    - shared Angular module, translation helpers, alerts, common UI plumbing
- `src/main/webapp/app/layouts`
    - navbar, footer, main shell, profile info, error pages
- `src/main/webapp/app/dashboard`
    - main logged-in dashboard and dashboard service
- `src/main/webapp/app/features`
    - modal-style feature views such as temperature, blood pressure, heart rate, sugar, allergies, emergency
- `src/main/webapp/app/widgets`
    - custom visualization and reusable dashboard widgets
- `src/main/webapp/app/entities/patientMS`
    - JHipster-style CRUD areas for patient-domain entities such as profile, address, membership, condition, medication, report, stat, task, team, metadata, hc-credential, hc-pay-option
- `src/main/webapp/app/account` and `src/main/webapp/app/admin`
    - standard JHipster account/admin surfaces

### Platform conventions already in use

- Angular standalone components exist alongside NgModules.
- Shared HTTP URLs should be built through `ApplicationConfigService.getEndpointFor(...)`.
- Entity services follow generated JHipster patterns and are strongly typed.
- Formatting and linting are driven by Prettier + ESLint.

### Important reality checks

1. `app.routes.ts` lazy-loads `./entities/entity.routes`, but `src/main/webapp/app/entities/entity.routes.ts` is currently empty.
2. The entity navbar items file is also empty.
3. `DashboardComponent` currently mixes UI state, hardcoded card definitions, modal orchestration, session storage, account logic, and API calls.
4. Several custom dashboard paths use weak typing such as `Observable<any>`, `HttpResponse<any>`, and `any[]`.
5. The codebase mixes generated JHipster structures with hand-written dashboard/features/widgets code.
6. The checkout appears to lack `src/main/java` sources even though Maven/JHipster backend configuration is present. Treat backend contracts as external unless Java sources are added to the checkout.

## Refactoring goals

Refactors should move the app toward:

- clearer module and route boundaries
- stronger typing at API and component boundaries
- thinner components and better separation of orchestration vs presentation
- less duplication across modal/feature wrappers
- safer reuse of generated entity services and shared utilities
- compatibility with JHipster regeneration points and conventions

## Refactoring priorities

### 1. Fix route topology before broad cleanup

The entity area contains real route files under `entities/patientMS/**`, but the top-level aggregator route file is empty.

Before large refactors:

- decide whether entity pages are meant to be reachable directly
- centralize entity route registration in `entities/entity.routes.ts`
- wire the navbar/menu only after route ownership is clear
- avoid deleting entity code just because it currently looks unreachable

### 2. Break up `DashboardComponent`

`src/main/webapp/app/dashboard/dashboard.component.ts` is a high-value refactor target.

Split it along these lines:

- a typed view model for dashboard cards and selected page state
- a dedicated modal launcher or mapping layer for metric actions
- a typed facade/service for profile summary loading
- presentational child components where the template has repeated card or panel logic

Do not keep expanding the existing `switch` statement and untyped card objects.

### 3. Standardize feature composition

The `features/` area currently acts as modal wrappers around entity/list components.

Prefer one of these directions:

1. keep feature wrappers, but make them thin, typed, and consistent
2. remove redundant wrappers and open the real target components directly

Do not leave nearly identical wrappers with ad hoc naming and lifecycle patterns.

### 4. Tighten HTTP and domain typing

Generated entity services are mostly typed; custom services are not.

Refactor custom services to:

- replace `any` and `HttpResponse<any>` with explicit interfaces
- keep DTO transformation close to the service layer
- reuse entity models where appropriate instead of duplicating shapes
- preserve `ApplicationConfigService.getEndpointFor(...)` for all endpoints

### 5. Normalize Angular style deliberately

This codebase mixes standalone components and NgModules.

Preferred direction for new refactor work: **standalone-first**, unless a module still provides meaningful grouping or third-party configuration.

When refactoring:

- do not churn files only to switch styles
- migrate vertical slices when touching them anyway
- keep imports local and explicit
- remove dead NgModules only when all consumers have moved

### 6. Preserve JHipster-managed seams

Be careful around:

- `jhipster-needle-*` markers
- generated entity CRUD patterns
- account/admin/auth flows
- translation keys and i18n JSON structure
- gateway endpoint construction and microservice routing

Refactor around these seams, not through them, unless the task explicitly includes regeneration-aware changes.

## Rules for agents working here

### Do

- make incremental, vertical-slice refactors
- prefer extracting typed helpers/facades over adding more conditionals
- preserve behavior unless the task explicitly changes UX
- keep route changes paired with navigation/menu updates
- reuse generated entity services and request utilities
- keep feature-specific code inside `dashboard`, `features`, `widgets`, or `entities` rather than moving everything into `shared`

### Do not

- hardcode API base URLs
- replace typed generated entity services with generic helpers
- delete apparently unused entity modules before checking route/menu wiring
- rewrite the whole app to standalone or NgModule style in one pass
- rename selectors or translation keys broadly without updating all call sites

## Known hotspots and recommendations

### `src/main/webapp/app/dashboard/dashboard.component.ts`

- extract card config constants
- remove `any[]`
- replace modal `switch` with a typed route-to-component map
- move `sessionStorage` access behind a small state helper if it grows

### `src/main/webapp/app/dashboard/dashboard.service.ts`

- replace `Observable<any>` with a typed profile-summary response
- keep microservice endpoint construction through `getEndpointFor`
- consider aligning its model with the existing profile entity if the payload actually matches

### `src/main/webapp/app/features/*`

- standardize modal wrappers
- remove dead lifecycle code
- pass typed inputs into modal components

### `src/main/webapp/app/entities/patientMS/*`

- preserve generated CRUD service patterns
- prefer refactoring repeated view/update/list scaffolding with shared helpers only if the abstraction remains obvious
- keep date conversion logic in services, not components

### `src/main/webapp/app/shared/shared.module.ts`

- keep it focused on broadly reused primitives
- do not turn `shared` into a dumping ground for feature-specific abstractions

## Testing and validation

Use existing scripts before and after meaningful refactors:

```bash
npm run lint
npm test
npm run webapp:build:dev
```

If backend sources are present in the checkout and the change touches backend-integrated behavior, also use:

```bash
./mvnw verify
```

## Refactor workflow

1. Identify a vertical slice and its ownership boundaries.
2. Confirm route, menu, service, and template wiring.
3. Add or preserve characterization coverage where behavior is subtle.
4. Refactor types and data flow first.
5. Refactor templates and component composition second.
6. Remove dead code only after all callers are updated.

## Suggested first refactors

If no narrower task is given, start in this order:

1. restore and document entity route aggregation in `entities/entity.routes.ts`
2. extract typed dashboard card models and modal mapping from `DashboardComponent`
3. type `DashboardService` and remove `any` usage from dashboard flows
4. unify the modal wrapper components under `features/`
5. review `widgets/` for duplicated visualization inputs and inconsistent APIs

## Notes on naming and conventions

- The ESLint config expects `hpd` selectors, but existing components still use `jhi-*` selectors in several places. Do not trigger a repo-wide selector migration unless that is the explicit task.
- Markdown uses 4-space indentation per `.editorconfig`; TS/HTML/SCSS/JSON use 2 spaces.
- Prefer existing npm scripts from `package.json` over ad hoc commands.
