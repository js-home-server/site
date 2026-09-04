<script>
	// Generated: `make site` in ../asciiArt rewrites AsciiBull.svelte.
	import AsciiBull from '$lib/components/AsciiBull.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	// Used to be three routes — now one scroll, nav is anchors not tabs.
	import About from '$lib/sections/About.svelte';
	import Projects from '$lib/sections/Projects.svelte';
	import Contact from '$lib/sections/Contact.svelte';
	import ActionLink from '$lib/components/ActionLink.svelte';
</script>

<svelte:head>
	<title>Joshua Smith — Data Engineer</title>
</svelte:head>

<div class="landing" id="home">
	<div class="wrap">
		<!-- Decorative — the heading below says the same thing, this is tens of thousands of digits to a screen reader. -->
		<div class="bull" aria-hidden="true">
			<AsciiBull />
		</div>

		<div class="identity">
			<h1>Joshua Smith</h1>
			<p class="tagline">Data Engineer focused on real-time, scientific, and ML systems.<br />I turn numbers into models, decisions and the occasional bull.</p>
			<ActionLink variant="cta" direction="site" href="#projects" class="hero-cta">View my work</ActionLink>
		</div>
	</div>

	<StatusBar />
</div>

<Projects />
<About />
<Contact />

<style>
	.landing {
		/* --- hero tuning knobs -------------------------------------------
		   The art is a fixed 160x112 character grid, so its whole size reduces to
		   one number: the cell size. Everything below is written in cells to keep
		   proportion at any viewport. JetBrains Mono advances 0.6021em/char at
		   line-height 0.72, so the art is 96.34 x 80.64 cells.

		   --art-fill: share of viewport height the bull takes, 0.78, measured off a
		     1728x993 reference screenshot (art was 774px tall there).
		   --tuck: how far the faded tail overlaps the cards before fading to page colour.
		   --sky: minimum clear band between nav and horn tips.
		   --bar-reserve: estimated card height, just to stop collisions on short viewports. */
		--art-fill: 0.78;
		--tuck: 4rem;
		--sky: 2rem;
		/* Cards + their bottom gap — same gap every section on the site keeps (.page, app.css). */
		--bar-reserve: calc(8.5rem + clamp(0.75rem, 1.5vh, 1.25rem));

		/* Smallest of three limits wins, no breakpoints: width cap, height-share cap,
		   sky cap. Normal screens hit the height cap; extremes hit the others. The
		   floor (width) never lets the bull shrink small enough to crop its own horns —
		   below that, the hero just scrolls (see the max-height query at the foot). */
		--cell: min(
			(100vw - 2 * var(--gutter)) / 96.34,
			max(
				4px,
				min(
					var(--art-fill) * 100svh / 80.64,
					(100svh - var(--header-height) - var(--bar-reserve) + var(--tuck) - var(--sky)) /
						80.64
				)
			)
		);

		display: grid;
		/* The generator crops art to its ink bounding box, so the box's width is
		   horn tip to tip. min-content hands that exact width to the status bar. */
		grid-template-columns: min-content;
		grid-template-rows: minmax(0, 1fr) auto;
		justify-content: center;
		/* Definite height, so the row above the bar gets the leftover space, not the bull's natural height. */
		height: calc(100svh - var(--header-height));
	}

	.wrap {
		position: relative;
		/* Centred between nav and cards so slack splits evenly instead of piling up under the bull on tall portrait screens. */
		align-self: end;
		margin-bottom: calc(-1 * var(--tuck));
	}

	/* Overlay, not a mask — a mask clips to the box, slicing the horn tips since line-height 0.72 makes glyphs taller than their line box. */
	.wrap::after {
		position: absolute;
		inset: 72% 0 -0.5rem;
		background: linear-gradient(to bottom, transparent, var(--color-background) 92%);
		content: '';
		pointer-events: none;
	}

	/* A rasterised image now (F11), not a character grid — sized in the same
	   96.34 x 80.64 cell units, width from --cell, height from its own baked-in aspect ratio. */
	.bull :global(img) {
		display: block;
		/* Overrides the global max-width: 100% img reset (app.css) — that cap would
		   collapse to nothing since .wrap's own size comes FROM this image's width. */
		max-width: none;
		width: calc(var(--cell) * 96.34);
		height: auto;
	}

	.identity {
		position: absolute;
		/* Eyes sit ~44% down the source photo — name hangs just under the eye line, not centred on the face. */
		top: calc(45% + 0.75rem);
		left: 50%;
		z-index: 1;
		width: min(100vw - 2 * var(--gutter), 90rem);
		text-align: center;
		transform: translateX(-50%);
	}

	/* Buys contrast back from the art behind the name, without a panel that would read as a box. */
	.identity::before {
		position: absolute;
		inset: -4rem -8rem;
		z-index: -1;
		background: radial-gradient(
			ellipse,
			var(--color-background) 0%,
			color-mix(in srgb, var(--color-background) 62%, transparent) 48%,
			transparent 78%
		);
		content: '';
		pointer-events: none;
	}

	/* Global type scale, not measured in cells — every font-size on the site reads one of these tokens. */
	h1 {
		margin: 0;
		color: var(--color-foreground);
		font-size: var(--fs-h1);
		font-weight: 700;
		letter-spacing: -0.05em;
		line-height: 0.95;
	}

	/* Sentence case, not a job title — reads as something said. Measured in cells so the identity scales as one thing. */
	.tagline {
		margin: clamp(0.6rem, 1.8 * var(--cell), 1.4rem) 0 0;
		color: var(--color-foreground);
		font-size: var(--fs-subhead);
		font-weight: 400;
		letter-spacing: -0.01em;
		line-height: 1.35;
		text-wrap: balance;
	}

	/* Named .hero-cta not .cta — every cta link already wears a literal "cta" class, and :global(.cta) here would override all of them. */
	:global(.hero-cta) {
		margin-top: clamp(0.8rem, 2.2 * var(--cell), 1.6rem);
		--cta-size: var(--fs-base);
	}


	/* Portrait, not a size breakpoint — past roughly square the art goes
	   width-bound and can't reach the cards, so pinning it there piles all the
	   slack into a void above the horns. Centring splits that slack instead. */
	@media (max-aspect-ratio: 19 / 20) {
		.wrap {
			align-self: center;
			margin-bottom: 0;
		}
	}

	/* Phone tier (app.css) — page chrome reacts at device width, not a dashboard component's container. */
	@media (max-width: 48rem) {
		.identity::before {
			inset-inline: -1rem;
		}
	}

	/* Too short for the composition even at the floor — keep proportions, let the rest scroll into view. */
	@media (max-height: 40rem) {
		.landing {
			height: auto;
			min-height: calc(100svh - var(--header-height));
		}
	}
</style>
