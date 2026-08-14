# js195.co.uk — build brief

## What this is

A personal site for Josh, hosted on his own home server (`phobos`), reachable
publicly at `js195.co.uk` via a Cloudflare Tunnel (outbound-only, no inbound
ports opened on the home network). It replaces nothing that exists today —
the domain currently 404s on every path.

The site has four parts:

1. **Portfolio** — static content about Josh.
2. **Server dashboard** — CPU/mem/disk etc. for the box the site itself runs
   on, sourced from an existing Prometheus + Grafana stack.
3. **Live trade view** — a live-updating view of crypto trades/orderflow
   being collected by a separate, already-running data pipeline on the same
   box, plus a chart of the collected bars.
4. **Trading bot info** — status/stats for a trading bot that does not exist
   yet. Stub only; do not build this now.

This brief is the plan to hand to a fresh build session. It is a decision
record, not an implementation — nothing below has been built yet except the
two infra fixes noted in "Already done."

## Project instructions

These govern every decision in this brief and every decision made while
building, not just the parts below.

- **Fewest lines of code, physically possible.** Nothing exists without a
  concrete purpose it serves right now — no scaffolding "for later," no
  unused abstractions, no config for a value that never changes, no
  interface with one implementation.
- **This is active development, not a stable product.** Pursue correctness,
  not backwards compatibility. Prefer a breaking change over a compatibility
  shim — there is no old client anywhere that needs to keep working.
- **Flag structural wins.** If restructuring something would mean better
  performance or less code, say so explicitly rather than quietly keeping
  the status quo — even mid-build, even if it means revisiting a decision
  already made in this brief.
- **Reuse existing infrastructure before building new.** The Cloudflare
  Tunnel, Grafana, Prometheus, the `data-gatherer` archive, and the
  TradingView implementation already at `/Users/js/coding-projects/charting`
  are all existing infrastructure to build on top of, not patterns to
  reimplement from scratch.

## Decisions already made (do not re-litigate without a reason)

- **Backend: FastAPI (Python).** Reason: least lines of code for this
  person — they have deep Python/data-science experience and near-zero web
  experience, and want to read the same Parquet/WAL files the collector
  already writes without a second implementation in a second language.
  FastAPI's native async WebSocket support also covers the live trade
  ticker with no extra library.
- **Frontend: SvelteKit.** Reason: of React/Vue/Svelte, it stays closest to
  plain HTML/CSS/JS (which the user already knows), least ceremony, small
  output. Explicitly re-examine rung 1 of the "does this need to exist"
  ladder before adding it: a full SPA framework is more than a static
  portfolio needs on its own, but the live ticker + TradingView chart +
  Grafana embed genuinely need client-side state across pages, so it's
  earning its place, not being cargo-culted in.
- **Server metrics: embed existing Grafana panels**, not a custom
  Prometheus-querying UI. Reason: Grafana already does this; rebuilding it
  is waste. This requires Grafana to not be reachable unauthenticated
  first — see "Already done."
- **Trade chart: TradingView Charting Library + a custom datafeed**, not
  the free Advanced Chart widget. Reason: the free widget only shows
  TradingView's own market data. The whole point of this page is to chart
  *this user's own collected bars*, which requires implementing a small
  UDF-protocol HTTP API (`/config`, `/symbols`, `/history`) backed by the
  archive's compacted Parquet + the still-open hour's WAL. This needs a
  free TradingView access request (GitHub account, their approval process,
  can be slow) — submit that early, it's the one dependency outside this
  repo's control.
- **Code reuse across repos — UNRESOLVED, pick one before building the
  datafeed:**
  (a) pip-install the `archive` package from a pinned git ref of the
  `data-gatherer` repo at Docker build time, or
  (b) duplicate the handful of read functions the site needs (reading
  compacted Parquet + tailing a WAL file) directly into this repo.
  (a) stays single-source-of-truth but adds a packaging/version-pinning
  step; (b) is fewer moving parts but can silently drift if the on-disk
  WAL/Parquet format changes upstream. No strong reason to prefer one yet —
  decide when starting phase 3/4 below, not before.

## Already done (infra, ahead of any app code)

- **Grafana's default `admin/admin` credential has been reset** to a random
  password via `grafana-cli`/`grafana cli admin reset-admin-password` run
  inside the container (the HTTP API path requires the *old* password and
  wasn't usable — the production instance was never actually on the
  default, an earlier report's `admin/admin` finding was against a
  disposable throwaway instance spun up for a pen-test demo and destroyed
  same-day, not this one). New password is in the operator's hands, not
  in this repo.
- **Cloudflare Tunnel ingress no longer points `js195.co.uk` at Grafana.**
  It previously routed the whole domain straight to Grafana's root on
  `localhost:8080` — meaning the first thing anyone hitting the domain got
  was a Grafana login page. The ingress is now just a catch-all 404 until
  real app content exists. When the site is ready to deploy, its ingress
  rule replaces the 404, and Grafana panels are reached only via the
  site's own embed (scoped credentials/anonymous-viewer role restricted to
  specific dashboards — not the admin login), never as a directly-routed
  hostname.
- Grafana + Prometheus containers were found stopped (8 days idle, predates
  this work) and were briefly started only to perform the password reset,
  then stopped again afterward.

## What does NOT exist yet and should not be assumed

- No website code, no repo, no Docker image exists yet for the site.
- No scoped/anonymous Grafana viewer role for embedding — currently only
  the full-admin account exists. Must be created before any public embed.
- No UDF datafeed implementation, but currently there exists a tradingview implementation in /Users/js/coding-porjects/charting.

## Build order

Ship in this order; each phase should be independently deployable.

1. **Skeleton portfolio.** Static SvelteKit pages, FastAPI serving it (or
   SvelteKit's own adapter — decide based on whichever is fewer moving
   parts once you're in the repo), wired into a Cloudflare Tunnel ingress
   rule replacing the current 404. Prove hosting end-to-end with near-zero
   content before building anything dynamic.
2. **Grafana embed.** Requires: creating a scoped Grafana viewer
   role/service account restricted to the specific dashboards being shown
   (not the admin account reset above), then embedding those panels.
3. **Live trade WebSocket ticker.** FastAPI WebSocket tailing the current
   shard's WAL file(s) already being written to disk by the collector — no
   new message broker, no polling API, just tailing an append-only file
   already there. Proves the WS path before the harder TradingView piece.
4. **TradingView chart.** Get the Charting Library access request in early
   (see above). Implement the UDF datafeed against the archive's Parquet +
   open WAL. Resolve the cross-repo code-reuse decision here, not before —
   you'll know more once you're actually writing the reader.
5. **Trading bot page.** Only once the bot exists. Stub or skip until then.

## Constraints worth restating so they don't get silently violated

- The site's backend should bind loopback-only and reach the world only
  through the existing Cloudflare Tunnel — same pattern Grafana already
  uses. No container should publish a port to `0.0.0.0`.
- Prometheus has no auth at all — it must never be reachable through
  anything public, including indirectly. Only Grafana (itself now gated)
  or the site backend querying it over the internal Docker network should
  ever touch it.
- Don't rebuild what Grafana already does. Don't build a generic metrics
  framework "for later" — this is a fixed, small set of panels for one
  server.
