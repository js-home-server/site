# js195.co.uk

My portfolio site. Static SvelteKit, served by Caddy in a container on my own
hardware, reached through a Cloudflare tunnel — no inbound ports open.

Four things live here: the portfolio itself, a dashboard for the box the site
runs on, and write-ups of an orderflow collector and an ASCII art renderer. The
dashboard reads a separate status API; everything else is static.

## Running it

```sh
cd web
npm ci
npm run dev
```

`npm run build` writes the static bundle to `web/build`. Built against Node 22.

## Deploying

CI builds an image and pushes it to GHCR on a version tag:

```sh
git tag v1.0.1 && git push origin v1.0.1
```

`deploy/compose.yml` is the desired state on the server. Set `SITE_TAG` in `.env`
to the version *without* its `v` prefix — the tag pattern strips it — then pull
and bring it up.

The container runs read-only as a non-root user with every capability dropped,
bound to loopback. `deploy/Caddyfile` sets the response headers a `<meta>` CSP
cannot carry; `web/docs/security-headers.md` covers which ones and why.

## Layout

```
web/         SvelteKit app
deploy/      Caddyfile and production compose
Dockerfile   builds the site, serves it from caddy:2-alpine
```

## Licence

All rights reserved — see [LICENSE](LICENSE). The source is here to be read,
not reused.
