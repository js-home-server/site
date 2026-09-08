# syntax=docker/dockerfile:1

# ---- build the static site ----
FROM node:22-alpine AS build
WORKDIR /app
# Install deps against the lockfile first for layer caching.
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# PUBLIC_* is baked into the client bundle at build time (public by design).
ARG PUBLIC_WEB3FORMS_KEY=""
ENV PUBLIC_WEB3FORMS_KEY=$PUBLIC_WEB3FORMS_KEY
RUN npm run build

# ---- serve it (same hardened Caddy as the hand-rolled container) ----
FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /srv/js195/build
EXPOSE 8081
