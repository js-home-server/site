<script>
	import '../app.css';
	import { page } from '$app/state';
	import interWoff2 from '@fontsource/inter/files/inter-latin-400-normal.woff2?url';
	import jetbrainsMonoWoff2 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';

	let { children } = $props();

	const SITE_URL = 'https://js195.co.uk';
	const DESCRIPTION =
		'Joshua Smith — data engineer building real-time, scientific, and ML systems. Case studies, projects, and a home server lab.';

	/* One canonical/og:url per route, worked out here rather than repeated on
	   every page — page.url.pathname already carries the trailing slash (or
	   lack of one) SvelteKit resolved the route to. */
	let canonical = $derived(SITE_URL + page.url.pathname);
	let ogImage = $derived(SITE_URL + '/og-image.png');
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
	<link rel="preload" href={interWoff2} as="font" type="font/woff2" crossorigin="anonymous" />
	<link
		rel="preload"
		href={jetbrainsMonoWoff2}
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<meta name="description" content={DESCRIPTION} />
	<link rel="canonical" href={canonical} />
	<meta property="og:site_name" content="Joshua Smith" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Joshua Smith — Data Engineer" />
	<meta property="og:description" content={DESCRIPTION} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Joshua Smith — Data Engineer" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Joshua Smith — Data Engineer" />
	<meta name="twitter:description" content={DESCRIPTION} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

{@render children()}
