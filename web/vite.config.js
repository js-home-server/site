import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 5199,
		proxy: {
			/* The API sends no Access-Control-Allow-Origin, so the browser can only
			   reach it same-origin. Everything under /api goes through here. */
			'/api': {
				target: 'https://status-api.js195.co.uk',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
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
			adapter: adapter()
		})
	]
});
