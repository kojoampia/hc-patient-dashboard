# Project Guidelines

## Code Style

- This project is an Angular 17 dashboard generated with JHipster 8.1.0 as a **client-only** app (`skipServer: true`) — there is no Java code here.
- Indentation is 2 spaces for all file types (`.editorconfig` root sets `indent_size = 2`; the `[*.md]` section only turns off trailing-whitespace trimming). Prettier runs on commit through lint-staged and normalizes Markdown to match.
- Follow ESLint selector conventions from `.eslintrc.json`:
  - Component selector prefix: `hpd` with kebab-case.
  - Directive selector prefix: `hpd` with camelCase.
  - Legacy `jhi-*` selectors still exist; migrate only within slices you are already editing.
- Use Prettier for formatting:
  - `npm run prettier:check`
  - `npm run prettier:format`
- Avoid `any`, `Observable<any>`, and `HttpResponse<any>` — declare explicit interfaces for API payloads.

## Architecture

- Frontend source root is `src/main/webapp` (configured in `angular.json`); build output is `target/classes/static/`.
- Keep responsibilities separated by existing folders under `src/main/webapp/app`:
  - `core`: authentication, interceptors, `ApplicationConfigService`, low-level utilities.
  - `shared`: reusable UI helpers, pipes, shared module pieces.
  - `entities`: entity models/services and CRUD UI (`entities/patientMS/**`).
  - `dashboard`, `features`, `widgets`: hand-written dashboard, modal feature wrappers, visualizations.
  - `layouts`: shell/layout components.
- Routing is standalone-style: top-level routes live in `src/main/webapp/app/app.routes.ts` (there is **no** `app-routing.module.ts`), with lazy `loadChildren` for `admin`, `account`, and `entities`. Providers live in `app.config.ts`.
- `entities/entity.routes.ts` and `entities/entity-navbar-items.ts` are currently empty, so `entities/patientMS/**` is not reachable from the router or menu. Pair any route change with the navbar update.
- `DashboardComponent` is rendered inside `HomeComponent` at `/`; it has no route of its own.
- Build API URLs through `ApplicationConfigService.getEndpointFor(api, microservice?)` — pass `'hcpatientservice'` for microservice calls so gateway routing applies. Never hardcode hosts, ports, or `/services/...` prefixes.
- Prefer standalone components for new code; NgModules (`shared`, `features`, `widgets`) remain for legacy grouping.

## Build And Test

- Install dependencies: `npm install`
- Development server (port 4200, HMR): `npm start`
- Production web build: `npm run webapp:prod`
- Development build: `npm run webapp:build:dev`
- Lint: `npm run lint` — auto-fix: `npm run lint:fix`
- Unit tests (Jest, `pretest` runs lint): `npm test`
- Single area: `npm test -- --test-path-pattern=dashboard` (Jest flags must be kebab-case through the Angular builder; camelCase fails with `Unknown arguments`)
- Do **not** run `./mvnw` — no Java sources, and the Enforcer range in `pom.xml` rejects the installed JDK.
- Cypress e2e is **not** runnable: it is listed in `.yo-rc.json` and a skeleton exists under `src/test/javascript/cypress/`, but Cypress is not installed and no `e2e` script exists.

## Conventions

- Prefer existing npm scripts in `package.json` over ad-hoc commands.
- Use the RxJS/Observable patterns already used in services and auth state management.
- Keep entity patterns consistent (model interface + class + identifier helper and typed service CRUD methods).
- Keep date/DTO conversion in services, not components.
- i18n is enabled for `en`, `fr`, `de` (`src/main/webapp/i18n`) — add every new user-visible string to all three bundles.
- Preserve `jhipster-needle-*` markers so regeneration keeps working.

## Environment Prerequisites

- Local API traffic is proxied by `webpack/proxy.conf.js` to `http://localhost:5505`, which is where the gateway listens (it moved from 5503 on 2026-08-03). Production builds same-origin, so this affects `ng serve` only.
- The backends (`hc-patient-gateway`, `hc-patient-service`) also require Consul, MongoDB, and Kafka; start them from those repos.

## Key References

- `patient-web.md` for the plan of record: open decisions, wiring fixes, refactoring priorities and hotspots, deployment findings.
- `CLAUDE.md` for the verified stack, layout, and wiring facts.
- `README.md` for stack, ports, workflows, Docker, and CI.
- `AGENTS.md` for quality/security/performance expectations.
- `package.json` for canonical scripts; `angular.json` for build/source-root configuration.
- `src/main/webapp/app/app.routes.ts` and `app.config.ts` for route/provider boundaries.
