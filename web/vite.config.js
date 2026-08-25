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
			adapter: adapter()
		})
	]
});
