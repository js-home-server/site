<script>
	import { page } from '$app/state';

	let { children } = $props();

	/* The portfolio is one scroll now, so these are stops on it rather than
	   routes, and they have to stay in the order the page puts them in: the spy
	   below reads the last one that has been passed. The server dashboard is
	   deliberately not here: it is its own app at /server, reached from the
	   projects section. */
	/* Absolute (leading /) rather than bare hashes: a project's case study is
	   also under this layout now, and a bare "#home" from there resolves
	   against its own URL instead of the landing page's. */
	const links = [
		{ href: '/#home', label: 'Home' },
		{ href: '/#projects', label: 'Projects' },
		{ href: '/#about', label: 'Experience' },
		{ href: '/#contact', label: 'Contact' }
	];

	/* How far past hidden the bar keeps counting down-scroll. That surplus is what
	   an up-scroll has to spend before the bar starts coming back, so going down
	   costs nothing and coming back costs this. */
	const REVEAL = 90;

	let height = $state(0);
	let active = $state(links[0].href);
	/* 0 is fully down, `height` fully gone; the stretch past that is the slack
	   above. Moved by the scroll rather than animated on a class — a transition
	   is a second opinion on where the bar is, and the two disagreeing is what
	   flickered. */
	let offset = $state(0);
	let last = 0;
	let queued = false;
	/* A jump from the nav is a scroll down like any other, and receding from it
	   takes the bar away at the one moment it is being used. So while a jump is
	   running the bar simply stays. scrollend ends it; the timer is for the
	   click that scrolls nowhere, on the stop already being read, which would
	   otherwise leave the bar pinned for good. */
	let jumping = $state(false);
	let backstop;

	function jump() {
		jumping = true;
		clearTimeout(backstop);
		backstop = setTimeout(() => (jumping = false), 1500);
	}

	function onScroll() {
		/* One write a frame, and nothing read back off the page: a scroll fires
		   far more often than the screen paints, and scrollY is a cached number
		   rather than a measurement. */
		if (queued) return;
		queued = true;
		requestAnimationFrame(update);
	}

	function update() {
		queued = false;
		const y = Math.max(0, window.scrollY);
		const delta = y - last;
		last = y;

		/* Over the hero the bar is simply down: nothing to recede from, and
		   letting it move there is what took it on the first flick. */
		offset = jumping || y <= height ? 0 : Math.min(height + REVEAL, Math.max(0, offset + delta));
	}

	/* The stop being read is the last one whose top has passed the upper third of
	   the viewport — near enough the reading line, and far enough down that a
	   section only claims the nav once it is actually in view. Asked of the
	   browser rather than measured for: shrinking the root to a zero-height band
	   on that line makes "crossing it" the thing an observer reports, and only
	   one section can be on the line at a time. This used to be a
	   getBoundingClientRect per section per frame, which forced a synchronous
	   layout of a page that is ~16k ascii-art spans, on every frame of every
	   scroll. */
	$effect(() => {
		/* Read so the effect reruns on every client-side navigation: the layout
		   itself never remounts between routes in this group, so without this the
		   observer keeps watching whichever section elements existed at its first
		   run — nodes a later navigation away from and back to home has since
		   thrown away — and `active` freezes on its last value forever. */
		page.url.pathname;

		const spy = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) if (entry.isIntersecting) active = `/#${entry.target.id}`;
			},
			{ rootMargin: '-33.33% 0px -66.67% 0px' }
		);

		/* Only present on the landing page itself — on a project's case study,
		   none of these exist, so the spy simply observes nothing and `active`
		   stays on its initial value. */
		for (const { href } of links) {
			const section = document.querySelector(href.slice(href.indexOf('#')));
			if (section) spy.observe(section);
		}

		return () => spy.disconnect();
	});
</script>

<svelte:window onscroll={onScroll} onscrollend={() => (jumping = false)} />

<div class="site-shell">
	<!-- Whole pixels: the bar is opaque over the page and a fractional offset
	     leaves a seam along its bottom edge. -->
	<header
		bind:clientHeight={height}
		style="--shift: {Math.round(Math.min(offset, height))}px"
	>
		<nav aria-label="Primary navigation">
			{#each links as { href, label } (href)}
				<a {href} onclick={jump} aria-current={active === href ? 'location' : undefined}>{label}</a>
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
		--nav-line-height: 1.25rem;
		--nav-underhang: 1rem;
		--header-height: calc(var(--nav-pad-top) + var(--nav-line-height) + var(--nav-underhang));

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

	/* Sticky rather than fixed: it keeps its row in the grid, so --header-height
	   still measures what the hero has to work around. Clip on the shell is not a
	   scroll container, so the viewport is still what this sticks to. */
	header {
		position: sticky;
		top: 0;
		z-index: 2;
		padding: var(--nav-pad-top) var(--gutter) 0;
		/* The page scrolls under it, so it cannot be transparent. */
		background: var(--color-background);
		/* Set by the scroll, so it is its own layer and never a repaint of the
		   page behind it. */
		transform: translate3d(0, calc(-1 * var(--shift, 0px)), 0);
		will-change: transform;
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
		font-size: var(--fs-base);
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

	a[aria-current='location'] {
		color: var(--mint);
	}

	a[aria-current='location']::after {
		position: absolute;
		bottom: 0.35rem;
		left: 50%;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 50%;
		background: currentcolor;
		box-shadow: 0 0 0.7rem currentcolor;
		content: '';
		transform: translateX(-50%);
	}

	/* Motion nobody asked for, for a viewer who has asked for none: the bar just
	   stays where it is. */
	@media (prefers-reduced-motion: reduce) {
		header {
			transform: none;
		}
	}

	/* Narrowest tier of the breakpoint scale (app.css): the nav has less room
	   to give than a content grid, so it squeezes before anything else does. */
	@media (max-width: 36rem) {
		.site-shell {
			--nav-line-height: 1rem;
		}

		nav {
			justify-content: space-between;
			gap: 0.75rem;
		}

		a {
			font-size: var(--fs-sm);
			letter-spacing: 0.12em;
		}
	}
</style>
