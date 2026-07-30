# Builds the patient dashboard and serves it with nginx.
#
# One Dockerfile, not the previous Dockerfile/.dev/.prod trio: those existed only to bake a
# different SERVER_API_URL per environment, and the bundle is now built same-origin
# (webpack/webpack.custom.js), so the API base is whatever host serves the page. Nothing else
# differed between them.
#
# There is no SSR in this app. `npm run webapp:prod` emits static files into target/classes/static
# and nginx.conf serves them with an SPA fallback. The API is reached through the host nginx in
# front of this container, which routes /api and /services to the gateway (see hc-patient/deploy).

FROM node:20-alpine AS build

WORKDIR /app

# Dependencies first, so a source-only change does not re-resolve the tree. --legacy-peer-deps is
# required: several Angular 17 peers in this tree do not satisfy npm 10's strict resolution.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run webapp:prod

FROM nginx:1.27-alpine

# SPA fallback and gzip live in nginx.conf; the host nginx still owns TLS and public routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/target/classes/static/ /usr/share/nginx/html/

EXPOSE 80

# Answers "is nginx serving the app shell?" and nothing more. It deliberately does not probe the
# API: a healthcheck that failed when the gateway was down would have an orchestrator restart a
# perfectly good web container.
# 127.0.0.1, not localhost: nginx listens on IPv4 only here, and busybox wget resolves localhost to
# ::1 first, so the probe failed with "Connection refused" against a container that was serving fine.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/index.html >/dev/null || exit 1
