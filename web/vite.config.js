import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 5199,
		proxy: {
			/* Production CORS allows js195.co.uk; local development stays same-origin. */
			'/api': {
				target: 'https://status-api.js195.co.uk',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '/api/v1')
			}
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			/* Content-Security-Policy, baked into each prerendered page as a <meta>.
			   `hash` mode: this is a static site with no per-request server, so Kit
			   hashes its own inline bootstrap script/styles at build time — no
			   'unsafe-inline' for scripts. Only the origins the page actually LOADS
			   from or CONNECTS to are listed; the many <a href> links elsewhere aren't
			   fetches and need no entry. Fonts are self-hosted (@fontsource), so
			   font-src is 'self' only.

			   NOT here (a <meta> CSP can't carry them — they're set as real response
			   headers at the edge/Caddy, see docs/security-headers.md): frame-ancestors,
			   HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. */
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					// web3forms client script + the hCaptcha it injects
					'script-src': ['self', 'https://web3forms.com', 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
					'style-src': ['self', 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
					// 6 inline style="" attributes (e.g. app.html's display:contents). Attributes
					// can't run script, and hashes don't cover attributes, so this is the one place
					// 'unsafe-inline' is unavoidable — scoped to attributes only, not <style>/<script>.
					'style-src-attr': ['unsafe-inline'],
					'img-src': ['self', 'data:'],
					'font-src': ['self'],
					// form POST, live dashboard, hCaptcha verification
					'connect-src': ['self', 'https://api.web3forms.com', 'https://status-api.js195.co.uk', 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
					// ancestree demo embed + hCaptcha challenge iframe
					'frame-src': ['https://js195.github.io', 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
					'object-src': ['none'],
					'base-uri': ['none'],
					'form-action': ['self']
				}
			}
		})
	]
});
