<script>
	import { page } from '$app/state';

	let { children } = $props();

	/* Stops on one scroll, not routes — order must match the page, since the spy
	   below reads the last one passed. /server is deliberately not here, it's its own app.
	   Absolute hrefs, not bare hashes — a case study is under this layout too, and a bare "#home" there would resolve to itself. */
	const links = [
		{ href: '/#home', label: 'Home' },
		{ href: '/#projects', label: 'Projects' },
		{ href: '/#experience', label: 'Experience' },
		{ href: '/#contact', label: 'Contact' }
	];

	/* Slack past fully-hidden that an up-scroll has to spend before the bar reappears. */
	const REVEAL = 90;

	let height = $state(0);
	let active = $state(links[0].href);
	/* A case study has none of the landing sections, so the spy has nothing to
	   observe and `active` would freeze on whatever it last saw (or the cold-load
	   default). Marked from the route instead, so /projects/* always lights Projects. */
	let current = $derived(page.url.pathname.startsWith('/projects/') ? '/#projects' : active);
	/* 0 = fully down, `height` = fully gone, past that is slack above. Driven by scroll, not a class transition — two opinions on bar position is what flickered. */
	let offset = $state(0);
	let last = 0;
	let queued = false;
	/* A nav jump is a scroll like any other, so the bar would recede mid-jump. Held still until scrollend; the timer covers a click to the stop already showing, which fires no scroll at all. */
	let jumping = $state(false);
	let backstop;

	function jump() {
		jumping = true;
		clearTimeout(backstop);
		backstop = setTimeout(() => (jumping = false), 1500);
	}

	function onScroll() {
		/* One write per frame — scroll fires way more often than paint, and scrollY is cheap to read anyway. */
		if (queued) return;
		queued = true;
		requestAnimationFrame(update);
	}

	function update() {
		queued = false;
		const y = Math.max(0, window.scrollY);
		const delta = y - last;
		last = y;

		/* Over the hero the bar stays fully down — nothing to recede from yet. */
		offset = jumping || y <= height ? 0 : Math.min(height + REVEAL, Math.max(0, offset + delta));
	}

	/* IntersectionObserver on a thin band at the upper third — "crossing
	   it" reports the active section directly. Used to be a getBoundingClientRect
	   per section per frame, forcing sync layout on a page of ~16k ascii spans.
	   Margins must leave the band real height — sum to exactly -100% and the
	   intersection rect has zero area, so isIntersecting never fires. */
	$effect(() => {
		/* Read so this reruns on client-side nav — the layout never remounts, so without this the observer keeps watching stale nodes forever. */
		page.url.pathname;

		const spy = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					active = `/#${entry.target.id}`;
					/* replaceState not pushState — a history entry per section crossed would make Back a scroll-by-scroll rewind. Only fires here, which only runs with real sections observed, i.e. the landing page. */
					history.replaceState(history.state, '', active);
				}
			},
			{ rootMargin: '-30% 0px -60% 0px' }
		);

		/* Only present on the landing page — on a case study none exist, so the spy just observes nothing. */
		for (const { href } of links) {
			const section = document.querySelector(href.slice(href.indexOf('#')));
			if (section) spy.observe(section);
		}

		return () => spy.disconnect();
	});
</script>

<svelte:window onscroll={onScroll} onscrollend={() => (jumping = false)} />

<div class="site-shell">
	<!-- Rounded to whole pixels — a fractional offset leaves a seam along the bar's bottom edge. -->
	<header
		bind:clientHeight={height}
		style="--shift: {Math.round(Math.min(offset, height))}px"
	>
		<nav aria-label="Primary navigation">
			{#each links as { href, label } (href)}
				<a {href} onclick={jump} aria-current={current === href ? 'location' : undefined}>{label}</a>
			{/each}
		</nav>
	</header>

	<main>{@render children()}</main>
</div>

<style>
	.site-shell {
		/* Nav geometry as real lengths, so --header-height can't drift from what the header actually occupies. */
		--nav-line-height: 1.25rem;
		--nav-underhang: 1rem;
		--header-height: calc(var(--nav-pad-top) + var(--nav-line-height) + var(--nav-underhang));

		display: grid;
		/* minmax(0, 1fr) not bare 1fr — else the oversized bull widens the page instead of bleeding off it. */
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto 1fr;
		min-height: 100svh;
		/* The bull is deliberately bigger than its box — let it bleed to the shell's edges. */
		overflow: clip;
	}

	/* Landing sections live in child components, so this reaches them by id — jumping to a hash would otherwise land its top flush under the sticky header instead of below it, unlike a fresh load. */
	:global(#home),
	:global(#projects),
	:global(#experience),
	:global(#contact) {
		scroll-margin-top: var(--header-height);
	}

	/* Sticky not fixed, so it keeps its grid row and --header-height stays accurate. overflow: clip on the shell doesn't make it a scroll container. */
	header {
		position: sticky;
		top: 0;
		z-index: 2;
		padding: var(--nav-pad-top) var(--gutter) 0;
		/* Page scrolls under it, so it can't be transparent. */
		background: var(--color-background);
		/* Driven by scroll, its own compositor layer, never a repaint of the page behind it. */
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
		font-family: var(--font-mono);
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

	/* Reduced motion: the bar just stays put. */
	@media (prefers-reduced-motion: reduce) {
		header {
			transform: none;
		}
	}

	/* Narrowest tier (app.css) — the nav has less room to give than a content grid, so it squeezes first. */
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
