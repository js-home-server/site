# Security headers (M2)

The **Content-Security-Policy is already baked into every page** as a `<meta>` tag,
generated at build time by SvelteKit (`csp` in `vite.config.js`, `mode: 'hash'` — it
hashes the inline bootstrap script itself, so no `'unsafe-inline'` for scripts).
Validated in headless Chrome: hCaptcha (checkbox + challenge iframes) and the
`js195.github.io` demo iframe all load with **zero CSP violations**.

A `<meta>` CSP **cannot** carry `frame-ancestors`, and HSTS / `Referrer-Policy` /
`Permissions-Policy` / `X-*` are response headers by nature. Set those at whatever
serves the static build (Caddy or Cloudflare). Apply at deploy — **do NOT enable
HSTS until the site actually serves HTTPS at the hostname** (turning it on, especially
`preload`, while the host still 404s or serves HTTP can lock visitors out).

## Caddy

```caddy
js195.co.uk {
	root * /srv/js195/build
	file_server
	header {
		# Clickjacking — modern + legacy fallback (the meta CSP can't do frame-ancestors)
		Content-Security-Policy "frame-ancestors 'none'"
		X-Frame-Options "DENY"
		# Enable ONLY once HTTPS is live at this hostname
		Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
		-Server
	}
}
```

Two CSP headers (the page's `<meta>` fetch policy + this `frame-ancestors` one) coexist
per spec — each is enforced independently, so the combined effect is the union.

## Cloudflare (if served via CF instead of Caddy)

Rules → Transform Rules → **Modify Response Header**, matching `hostname eq "js195.co.uk"`,
set static headers with the same names/values as above. Add HSTS via SSL/TLS → Edge
Certificates → **HTTP Strict Transport Security** (same caveat: only once HTTPS is serving).
Optionally add a **Rate limiting** rule for `status-api.js195.co.uk` (finding L2).

## Verify on deploy day

```
curl -sSI https://js195.co.uk/ | grep -iE 'strict-transport|x-frame|frame-ancestors|x-content-type|referrer-policy|permissions-policy'
```
Then reload the site and confirm the browser console shows no CSP violation, the contact
form's hCaptcha renders, a test message actually sends (exercises `api.hcaptcha.com` +
`api.web3forms.com`, both already in `connect-src`), and the ancestree demo iframe loads.
