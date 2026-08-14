<script>
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	const tabs = [
		['/', 'Home'],
		['/about', 'About']
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	{#each tabs as [href, label]}
		<a {href} aria-current={page.url.pathname === href ? 'page' : undefined}>{label}</a>
	{/each}
</nav>

{@render children()}

<style>
	nav {
		display: flex;
		gap: 1.5rem;
		padding: 1rem;
	}
	a[aria-current='page'] {
		font-weight: bold;
	}
</style>
