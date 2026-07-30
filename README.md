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

> The gateway's own dev port is **5503**, and `docker-compose.yml` sets `SERVER_API_URL=http://localhost:5501/`. These three values disagree; confirm where the gateway is actually listening and align the proxy target before debugging "API unreachable" errors.

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
npx jest --config jest.conf.js --testPathPattern dashboard   # bypass the Angular builder
```

Flags reach Jest through `@angular-builders/jest`, so they must be passed in **kebab-case** (`--test-path-pattern`). Angular CLI rejects the camelCase Jest spellings with `Unknown arguments`; use the direct `npx jest` form if you want raw Jest CLI syntax.

There are no Spring Boot tests in this repo — ignore any generated instruction to run `./mvnw verify` here.

**Cypress e2e is not runnable as checked in:** `.yo-rc.json` lists `cypress` and `src/test/javascript/cypress/e2e/` exists, but Cypress is not a dependency in `package.json` and there is no `e2e` script. Reinstate both before writing e2e specs.

## Building for production

```
npm run webapp:prod          # → target/classes/static/
```

Serve those static files behind any web server; the images in this repo use nginx with [nginx.conf](nginx.conf) (SPA fallback to `index.html`, gzip on, listening on port 80).

### Docker

| File                             | API base baked in                            | Build script run                   |
| -------------------------------- | -------------------------------------------- | ---------------------------------- |
| `Dockerfile.dev`                 | `https://patient-dashboard.jojoaddison.net/` | `npm run webapp:build` (dev build) |
| `Dockerfile.prod` / `Dockerfile` | `https://patient-dashboard.abofonsa.com/`    | `npm run webapp:prod`              |

```
npm run docker:build:dev     # docker compose build (Dockerfile.dev)
npm run docker:dev:up        # run on 127.0.0.1:5500 → container :80
npm run docker:dev:logs
npm run docker:build:prod    # docker compose -f docker-compose-prod.yml build
```

Both compose files expect an **external** Docker network (`devnet` for dev, `hcnet` for prod) to exist already. See `patient-web.md` (Phase C) for the open issues in these files, including the prod compose network mismatch that makes `docker-compose-prod.yml` invalid and the image-name mismatch between `docker-compose*.yml` and the `docker:*:tag`/`deploy:*` scripts — the tag/push scripts do not currently line up with the images the compose files build.

## Continuous Integration

[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) builds the image and publishes it to **GHCR** (`ghcr.io/<owner>/<repo>`) on pushes to `main`, on PRs, and on manual dispatch. The version tag is scraped from the first `<version>` in `pom.xml` (currently `0.0.1`), which is the one thing `pom.xml` is still used for — keep it in sync with `package.json`'s version.

## Repository docs

- `patient-web.md` — **plan of record**: open decisions, wiring fixes, refactoring order and hotspots, deployment/packaging findings, blocked blueprint features.
- `CLAUDE.md` — verified stack, layout, wiring facts, and constraints.
- `AGENTS.md` — code quality / architecture / security expectations for the frontend.
- `.github/copilot-instructions.md` — condensed conventions.
  `AGENT.md`, `code-review.md`, `HC - Patient Blueprint.md`, `HC - Patient Checklist.md`, `.github/todo.md`, and `.github/patient_plan.md` were removed when the plans were consolidated; look in `patient-web.md` (or the sibling repos' plans for backend/mobile work).

Sibling plans: `hc-patient-service/patient-api.md`, `hc-patient-gateway/patient-gateway.md`.

## References

- [JHipster 8.1.0 documentation archive](https://www.jhipster.tech/documentation-archive/v8.1.0)
- [Angular CLI](https://angular.io/cli) · [Jest](https://jestjs.io/) · [Webpack](https://webpack.js.org/)
