# Patient Dashboard

Angular web dashboard for the Health Connect **patient** subsystem. Originally generated with JHipster 8.1.0 as a client-only application (`skipServer: true` in `.yo-rc.json`), so **this repository contains no Java sources** — all APIs are consumed from the sibling backend repos:

| Repo                 | Role                                                                                                                       | Dev port |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| `hc-patient-gateway` | reactive Spring Cloud Gateway; authentication, account/user management, routes `/services/{serviceId}/**` to microservices | 5503     |
| `hc-patient-service` | patient data microservice (`hcpatientservice`), MongoDB + Kafka                                                            | 8081     |

The browser never talks to the microservice directly: requests go to the gateway, which relays the JWT downstream. Build URLs with `ApplicationConfigService.getEndpointFor('api/profiles', 'hcpatientservice')` — never hardcode a host or the `/services/...` prefix.

## Stack

|                  |                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Framework        | Angular 17.0.6 (standalone components + some legacy NgModules)                                                        |
| Language         | TypeScript 5.2.2                                                                                                      |
| UI               | ng-bootstrap 16, Bootstrap, SCSS, d3 7 for the custom widgets                                                         |
| Tests            | Jest 29 via `@angular-builders/jest`                                                                                  |
| Build            | Angular CLI 17 with `@angular-builders/custom-webpack` (see `webpack/`)                                               |
| i18n             | enabled — `en`, `fr`, `de` under `src/main/webapp/i18n`                                                               |
| Component prefix | ESLint requires `hpd` (`jhiPrefix`); `angular.json` still says `jhi` and older components still use `jhi-*` selectors |

`pom.xml`, `mvnw`, and `npmw` are leftovers from the JHipster generator. There is nothing for Maven to compile, and `pom.xml` sets `java.version` 26 while its Enforcer rule only allows `[17,26)`, so Maven goals fail outright on a JDK 26 toolchain. **Use npm for everything in this repo.**

## Project layout

Frontend source root is `src/main/webapp` (`angular.json` `sourceRoot`); production output goes to `target/classes/static/`.

```
src/main/webapp/app/
  core/          auth, interceptors, ApplicationConfigService, low-level utilities
  shared/        shared module, i18n helpers, alerts, common UI plumbing
  config/        app-wide constants, dayjs/datepicker config, authorities
  layouts/       navbar, footer, main shell, profile info, error pages
  home/          landing route — renders DashboardComponent for logged-in users
  dashboard/     dashboard component/service plus metric-panel and status-panel
  features/      modal wrappers: temperature, blood pressure, heart rate, sugar, allergies, emergency
  widgets/       reusable visualizations (linechart, piechart, heatmap, treemap, histogram, tilebox, …)
  entities/      user/ plus patientMS/** generated CRUD for the patient entities
  account/ admin/ login/   standard JHipster surfaces
```

Two wiring facts worth knowing before you navigate the code:

1. The dashboard has **no route of its own** — `HomeComponent` imports and renders `DashboardComponent` at `/`.
2. `entities/entity.routes.ts` and `entities/entity-navbar-items.ts` are empty (only JHipster needles), so everything under `entities/patientMS/**` is currently unreachable from the router and the menu. Decide route ownership before assuming that code is dead.

Also note `entities/patientMS/hc-credential` and `entities/patientMS/hc-pay-option` target entities the backend has renamed to `PersonalDocument` and `PaymentOption`; the local `.jhipster/*.json` configs were updated but the components were not.

## Development

Install dependencies (Node 20+ recommended; the Docker builds use `node:20-alpine`):

```
npm install
```

Start the dev server with HMR on <http://localhost:4200>:

```
npm start
```

API calls are proxied by `webpack/proxy.conf.js`, which forwards `/api`, `/services`, `/management`, `/v3/api-docs`, `/auth`, and `/health` to **`http://localhost:5505`** (`DEV_SERVER_API_URL` in `webpack/environment.js`).

> The gateway's own dev port is **5503**. These two values disagree; confirm where the gateway is actually listening and align the proxy target before debugging "API unreachable" errors. Production is unaffected — the bundle is built same-origin and the web container's nginx proxies to the gateway.

Run with TLS instead (`ng serve --ssl`):

```
npm run start-tls
```

Useful scripts (`npm run` lists them all):

| Script                                       | Purpose                                         |
| -------------------------------------------- | ----------------------------------------------- |
| `npm start`                                  | dev server, HMR                                 |
| `npm run lint` / `lint:fix`                  | ESLint over `.js`/`.ts`                         |
| `npm test`                                   | Jest with coverage (`pretest` runs lint first)  |
| `npm run test:watch`                         | Jest in watch mode                              |
| `npm run webapp:build:dev`                   | development build into `target/classes/static/` |
| `npm run webapp:prod`                        | clean + production build                        |
| `npm run prettier:check` / `prettier:format` | formatting                                      |

### PWA support

The service worker is registered but disabled. To enable it, flip `enabled` in the `ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })` provider in [src/main/webapp/app/app.config.ts](src/main/webapp/app/app.config.ts).

### Managing dependencies

To add a runtime dependency, e.g. Leaflet:

```
npm install --save --save-exact leaflet
npm install --save-dev --save-exact @types/leaflet
```

Then import the JS in `src/main/webapp/app/app.config.ts` and the CSS in `src/main/webapp/content/scss/vendor.scss`.

### Using Angular CLI

```
ng generate component my-component
```

Generated files land under `src/main/webapp/app/`. Use the `hpd` selector prefix for anything new.

## Testing

Unit tests are Jest specs colocated with the code they cover: `jest.conf.js` matches `src/main/webapp/app/**/*.spec.ts` (the `src/test/javascript/` folder only holds the Cypress skeleton). Reports and coverage are written to `target/test-results/`.

```
npm test                                     # all specs + coverage (runs lint first)
npm test -- --test-path-pattern=dashboard    # one area
npm test -- --test-name-pattern="should load"
npm run test:watch
npx ng test --coverage=false                 # skip the pretest lint step
```

Flags reach Jest through `@angular-builders/jest`, so they must be passed in **kebab-case** (`--test-path-pattern`); Angular CLI rejects the camelCase Jest spellings with `Unknown arguments`. Calling `npx jest` directly does **not** work — `jest.conf.js` has no transform configured, because the builder supplies the Angular preset.

> `npx ng test` is green — 146 suites, 681 tests (~110s, measured 2026-08-03). `npm test` additionally runs ESLint first and **still fails there** on 172 pre-existing problems — 161 errors and 11 warnings across 77 files, mostly `jhi-*` selectors where the config wants `hpd` — so use `npx ng test` until those are resolved. See `patient-web.md` (Phase A).

There are no Spring Boot tests in this repo — ignore any generated instruction to run `./mvnw verify` here.

**Cypress e2e is not runnable as checked in:** `.yo-rc.json` lists `cypress` and `src/test/javascript/cypress/e2e/` exists, but Cypress is not a dependency in `package.json` and there is no `e2e` script. Reinstate both before writing e2e specs.

## Building for production

```
npm run webapp:prod          # → target/classes/static/
```

Serve those static files behind any web server. The production image serves them with nginx, but **that image is not built here** — see below.

### Docker and deployment

This repo no longer packages or ships itself. `Dockerfile`, `nginx.conf`, `docker-compose.yml`, `docker-compose-prod.yml`, `.dockerignore` and the `docker:*:tag` / `deploy:*` npm scripts were removed in `d5f0bfe`; they live in **`hc-patient/deploy/`** (repo `kojoampia/hc-patient-ci`), which builds and ships all three patient subsystem images together:

```
cd ../deploy
cp .env.example .env && docker compose up --build   # local stack: web + gateway + api + mongo
./deploy.sh                                         # production
```

The dashboard is served at `https://patient.abofonsa.com`. The image is built from `deploy/docker/web.Dockerfile` with `deploy/docker` passed as a named build context, so `web-nginx.conf` never has to live in this repo. Change the image, its nginx config, or the deploy there.

The `src/main/docker/*.yml` files that remain here are JHipster's generated **local dev services** (MongoDB, Kafka, the registry) — they are not deployment.

## Continuous Integration

`.github/workflows/docker-publish.yml` tries to build an image and publish it to GHCR on pushes to `main`, on PRs, and on manual dispatch.

> **It is broken and has failed on every push since 2026-07-30.** It builds `./Dockerfile.prod`, which was consolidated into `Dockerfile` in `ac2df38` and then removed entirely in `d5f0bfe`, so every run dies in ~25s with `open Dockerfile.prod: no such file or directory`. The workflow has not been touched since 2026-05-10.

It cannot simply be repointed — the real Dockerfile is in another repository and needs a build context this one does not have. `patient-web.md` (decision 3 and Phase C) tracks the choice between retiring it and repurposing it to run `lint` + `test` + `webapp:prod`. Until then, nothing in this repo is gated by CI.

The version tag it scrapes from the first `<version>` in `pom.xml` (currently `0.0.1`) is the only remaining use for that file; keep it in sync with `package.json` for as long as the workflow exists.

## Repository docs

- `patient-web.md` — **plan of record**: open decisions, wiring fixes, refactoring order and hotspots, the broken CI workflow, blocked blueprint features.
- `CLAUDE.md` — verified stack, layout, wiring facts, and constraints.
- `AGENTS.md` — code quality / architecture / security expectations for the frontend.
- `.github/copilot-instructions.md` — condensed conventions.
  `AGENT.md`, `code-review.md`, `HC - Patient Blueprint.md`, `HC - Patient Checklist.md`, `.github/todo.md`, and `.github/patient_plan.md` were removed when the plans were consolidated; look in `patient-web.md` (or the sibling repos' plans for backend/mobile work).

Sibling plans: `hc-patient-service/patient-api.md`, `hc-patient-gateway/patient-gateway.md`, `hc-patient/deploy/TODO.md` (packaging, the server, monitoring).

## References

- [JHipster 8.1.0 documentation archive](https://www.jhipster.tech/documentation-archive/v8.1.0)
- [Angular CLI](https://angular.io/cli) · [Jest](https://jestjs.io/) · [Webpack](https://webpack.js.org/)
