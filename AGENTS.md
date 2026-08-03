# Project Overview

Standing guidelines for `hc-patient-dashboard` — the **Angular 17 frontend** of the Health Connect patient subsystem. This repo has no backend code (`skipServer: true`).

Read in this order: `CLAUDE.md` for the verified stack, layout, and wiring facts; `patient-web.md` for the plan of record (open decisions, wiring fixes, refactoring order, deployment findings); then this file for the standing expectations. `README.md` covers commands, ports, Docker, and CI.

> Earlier versions of this file described a Spring Boot / PostgreSQL / JPA / Liquibase / MinIO service with an Angular 19 client. None of that applies here: the backends are `hc-patient-gateway` (reactive, MongoDB) and `hc-patient-service` (Spring MVC, MongoDB), and this repo is client-only. Backend guidance belongs in those repos' `AGENTS.md`.

## Code Quality and Style

- Follow SOLID and clean-code practices; keep components thin and push orchestration into services/facades.
- Formatting is enforced by Prettier and ESLint: `npm run prettier:check|format`, `npm run lint|lint:fix`. `npm test` runs lint first via `pretest`.
- Indentation is 2 spaces everywhere (`.editorconfig` root `indent_size = 2`; its `[*.md]` section only disables trailing-whitespace trimming). Prettier normalizes Markdown nesting to 2 spaces on commit via lint-staged.
- ESLint requires the `hpd` selector prefix (kebab-case for components, camelCase for directives). Legacy `jhi-*` selectors still exist — rename only as part of a slice you are already touching, never repo-wide in one pass.
- Strong typing at every boundary: no `any`, no `Observable<any>`, no `HttpResponse<any>`. Declare explicit interfaces for API payloads.
- Unit-test with Jest specs colocated next to the code (`*.spec.ts`); use `TestBed` + `HttpTestingController` as the existing specs do.
- Prefer existing npm scripts over ad-hoc commands.

## Architecture and Design

- Source root `src/main/webapp`. Keep responsibilities inside the established folders: `core` (auth, interceptors, `ApplicationConfigService`), `shared` (broadly reused primitives only), `config`, `layouts`, `home`, `dashboard`, `features`, `widgets`, `entities`, `account`, `admin`, `login`.
- Do not turn `shared` into a dumping ground — feature-specific code stays in its feature folder.
- **All HTTP URLs go through `ApplicationConfigService.getEndpointFor(api, microservice?)`.** Cross-service calls name the microservice (`'hcpatientservice'`) so the gateway's `/services/{serviceId}/**` routing applies; nothing hardcodes a host or port.
- Standalone-first for new work; existing NgModules (`features.module.ts`, `widgets.module.ts`, `shared.module.ts`) stay until all consumers move.
- Route changes must be paired with navbar/menu updates. Note `entities/entity.routes.ts` and `entities/entity-navbar-items.ts` are currently empty, so `entities/patientMS/**` is unreachable — resolve route ownership before treating that code as dead or live.
- The dashboard is rendered by `HomeComponent` at `/`, not by its own route.
- Keep DTO/date conversion in services (as the generated entity services do), not in components.
- Reuse the generated, strongly typed entity services instead of writing generic HTTP helpers.
- RxJS: reuse the Observable patterns already used in `core/auth` and the entity services; unsubscribe or use `takeUntilDestroyed`/`async` pipe rather than leaking subscriptions.

## Security Considerations

- Auth is JWT-based and owned by the gateway. The token is attached by the interceptors in `core/interceptor` — do not add ad-hoc header handling.
- Guard privileged routes with `UserRouteAccessService` plus `data.authorities` (see `admin` route) rather than hiding UI only.
- Never persist tokens or PII beyond what the existing auth session service does; treat `sessionStorage`/`localStorage` writes in dashboard code as something to consolidate behind a small state helper, not to spread further.
- Rely on Angular's built-in escaping; avoid `innerHTML`/`bypassSecurityTrust*` for any server- or user-provided content.
- Health data means GDPR/HIPAA-style obligations: no PII in `console.log`, analytics, or error messages surfaced to third parties.
- Requests must reach the backend over HTTPS in deployed environments (the Docker images bake an `https://` `SERVER_API_URL`); the dev proxy is plain HTTP against localhost only.
- Keep dependencies patched; `npm install --legacy-peer-deps` is required by the Docker builds, so audit changes to peer ranges carefully.

## Performance

- Lazy-load feature areas via `loadChildren` (already done for `admin`, `account`, `entities`).
- Paginate/filter server-side for entity lists; do not fetch whole collections to filter in the browser.
- Keep d3-based widgets in `widgets/` cheap: avoid recomputing scales on every change-detection pass, and prefer `OnPush` for presentational components.
- The service worker (PWA) is registered but disabled in `app.config.ts` — enabling it is a deliberate release decision, not a performance tweak.
- Production builds go through `npm run webapp:prod`; check bundle impact before adding heavyweight dependencies.

## i18n

Translation is enabled for `en`, `fr`, `de` (`src/main/webapp/i18n`). Every user-visible string needs a key in all three bundles, and renaming keys means updating all call sites — check `shared/language` helpers first.

## Technology Stack

- Angular 17.0.6, TypeScript 5.2.2, RxJS 7.8
- ng-bootstrap 16 + Bootstrap/SCSS, d3 7 for custom visualizations
- Angular CLI 17 with `@angular-builders/custom-webpack` (config in `webpack/`)
- Jest 29 via `@angular-builders/jest` (`jest.conf.js`); Cypress is configured in `.yo-rc.json` but **not installed and has no npm script**
- Dev server on 4200; API proxied to `http://localhost:5505` by `webpack/proxy.conf.js`
- Docker: not here — the nginx image is built and shipped by `hc-patient/deploy` (repo `kojoampia/hc-patient-ci`); this repo only produces the bundle
- CI: `.github/workflows/docker-publish.yml` targets GHCR but has been **failing on every push since 2026-07-30** (it builds a `Dockerfile.prod` that no longer exists), so nothing here is gated — see `patient-web.md` Phase C
- `pom.xml`/`mvnw` are generator leftovers — there are no Java sources for Maven to build. Its `java.version` is 25, which its Enforcer range `[17,26)` allows; the two used to contradict each other
