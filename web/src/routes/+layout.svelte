<script>
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/about', label: 'About' },
		{ href: '/server', label: 'Server' },
		{ href: '/contact', label: 'Contact' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="site-shell">
	<header>
		<nav aria-label="Primary navigation">
			{#each links as link (link.href)}
				<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>
	</header>

	<main>{@render children()}</main>
</div>

<style>
	.site-shell {
		/* The nav's own geometry, set as lengths and used by the rules below so
		   --header-height cannot drift from what the header actually occupies.
		   The landing page fills the space underneath it. */
		--nav-pad-top: clamp(1.75rem, 4vh, 2.5rem);
		--nav-line-height: 1.25rem;
		--nav-underhang: 1rem;
		--header-height: calc(var(--nav-pad-top) + var(--nav-line-height) + var(--nav-underhang));

		/* The one margin the whole site keeps from the viewport edge. Pages read
		   it for their columns and the hero caps the status bar with it, so
		   nothing has to restate a breathing-room number of its own. */
		--gutter: clamp(1rem, 3vw, 1.5rem);

		display: grid;
		/* minmax(0, 1fr), not 1fr: a bare 1fr takes its automatic minimum from
		   the content, so the oversized bull would widen the page instead of
		   bleeding off it. */
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto 1fr;
		min-height: 100svh;
		/* The bull is deliberately bigger than its box: let it bleed to the edges
		   of the shell instead of stretching the page around it. */
		overflow: clip;
	}

	header {
		position: relative;
		z-index: 1;
		padding: var(--nav-pad-top) var(--gutter) 0;
	}

	nav {
		display: flex;
		justify-content: center;
		gap: clamp(1.5rem, 6vw, 5rem);
	}

	a {
		position: relative;
		padding-bottom: var(--nav-underhang);
		color: var(--text-faint);
		font-size: 1rem;
		line-height: var(--nav-line-height);
		letter-spacing: 0.22em;
		text-decoration: none;
		text-transform: uppercase;
		transition: color 160ms ease;
	}

	a:hover,
	a:focus-visible {
		color: var(--color-foreground);
	}

	a[aria-current='page'] {
		color: var(--mint);
	}

	a[aria-current='page']::after {
		position: absolute;
		bottom: 0.35rem;
		left: 50%;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 0.7rem currentColor;
		content: '';
		transform: translateX(-50%);
	}

	@media (max-width: 36rem) {
		.site-shell {
			--nav-line-height: 1rem;
		}

		nav {
			justify-content: space-between;
			gap: 0.75rem;
		}

		a {
			font-size: 0.78rem;
			letter-spacing: 0.12em;
		}
	}
</style>
