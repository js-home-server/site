<script>
	// Generated: `make site` in ../asciiArt rewrites AsciiAstronaut.svelte.
	import AsciiAstronaut from '$lib/components/AsciiAstronaut.svelte';
	import ToolPills from '$lib/components/ToolPills.svelte';

	/* Rail stops, most recent first. No `points` = a single line of prose. */
	const MILESTONES = [
		{
			period: '2024 — Present',
			title: 'Graduate Engineer, AWE',
			detail: 'Turning noisy, high-volume signals into fast, reliable estimates.',
			tools: ['Slurm', 'Python', 'scikit-learn', 'NumPy', 'MATLAB', 'CUDA'],
			points: [
				{
					heading: '3 km median localisation error',
					text: 'Synchronised 9 geographically distributed RF sensors to microsecond precision, correcting drift between their internal clocks and GPS time. Cleaned and denoised the data, then used TDOA cross-correlation and multi-objective optimisation to localise signals to a 3 km median error worldwide.'
				},
				{
					heading: '279 m median position error at 700 km range',
					text: 'Designed a radar-based terrain-imaging navigation system, validated against recorded Sentinel-1 satellite data travelling at 7.5 km/s. Built the preprocessing pipeline and an ML-assisted optimisation solver, hitting a 279 m median position error with 4-second end-to-end latency on just 8 GB of RAM.'
				},
				{
					heading: '7.5× fewer simulations',
					text: 'Built a surrogate-modelling based multi objective optimiser for expensive black-box simulators with a professor of statistics, cutting simulations required from 150,000 to 20,000. Also designed the stopping conditions and ported it to CUDA for a further 26× speedup over the CPU version. Shipped company-wide.'
				}
			]
		},
		{
			period: '2020 — 2023',
			title: 'BEng Engineering Mathematics',
			detail: 'University of Bristol, 2:1. Modelling, statistics and scientific computing.'
		}
	];

	/* The astronaut's own aspect-ratio'd height is a genuine, definite size once
	   the column's width is known, so left unchecked it sets a floor under
	   .experience's row that CSS auto-sizing can't shrink below — trimming the
	   timeline would stop shrinking the box well before he's actually cropped.
	   Measuring the timeline directly and pinning .visual to that height gives
	   .visual an explicit (not content-derived) size instead, so it stops
	   fighting the row for space: the box is exactly as tall as the timeline,
	   and .bracket-frame's overflow: hidden crops him from the feet up
	   whenever that's shorter than he needs. (Reset to auto below 60rem,
	   where the two stack instead of sitting side by side.) */
	let timelineHeight = $state(0);
</script>

<section id="experience" class="page experience-page">
	<section class="surface-box experience">
		<!-- Decorative — the stops beside it carry the meaning, this is thousands of digits to a screen reader. -->
		<!-- + 2 * var(--pad): .visual's negative top/bottom margin (below) bleeds
		     its background to the card edge, and align-self: stretch normally
		     grows the box to absorb that automatically — but an explicit height
		     here overrides stretch, so the compensation has to be added back by
		     hand or the box (and so the crop) lands two pads short. -->
		<div
			class="visual"
			aria-hidden="true"
			style:height={timelineHeight ? `calc(${timelineHeight}px + 2 * var(--pad))` : 'auto'}
		>
			<div class="bracket-frame"><div class="portrait"><AsciiAstronaut /></div></div>
		</div>

		<div class="timeline" bind:clientHeight={timelineHeight}>
			<div class="timeline-head">
				<h2 class="section-title">Experience</h2>
			</div>
			{#each MILESTONES as { period, title, detail, tools, points } (title)}
				<div class="milestone">
					<p class="period">{period}</p>
					<h3 class="title">{title}</h3>
					{#if detail}<p class="detail">{detail}</p>{/if}
					{#if tools}<ToolPills {tools} />{/if}
					{#if points}
						<ul>
							{#each points as { heading, text } (heading)}
								<li>
									<p class="outcome">{heading}</p>
									{text}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/each}
		</div>
	</section>
</section>

<style>
	/* Laid out across, not down — takes the dashboard's width, not a column of prose. */
	.experience-page {
		gap: clamp(0.75rem, 1.5vh, 1.25rem);
	}

	/* --- experience ------------------------------------------------------ */

	/* Visual left, rail right with twice the room — the rail is what this box is for. */
	.experience {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
	}

	/* Negative margin + padding put back, so the dividing rule runs wall to wall. */
	.visual {
		display: grid;
		align-content: stretch;
		overflow: hidden;
		margin: calc(-1 * var(--pad)) 0 calc(-1 * var(--pad)) calc(-1 * var(--pad));
		padding: var(--pad);
		border-right: var(--rule);
	}

	/* Pinned tracks, not default auto — an auto track sizes to the portrait's own intrinsic width, blowing past the frame instead of letting it crop evenly.
	   Top-anchored, not centred — the timeline sets this box's height, and the
	   portrait should lose ground at his feet as that shrinks, not have his
	   head and feet clipped evenly. */
	.visual :global(.bracket-frame) {
		align-items: start;
		justify-items: center;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		min-height: 0;
		overflow: hidden;
	}

	/* Rasterised now (F11), no cell grid left to size by. Fills the frame
	   exactly in both axes — object-fit below is what keeps him from
	   distorting to match whatever shape that turns out to be. */
	.portrait {
		width: 100%;
		height: 100%;
	}

	/* AsciiAstronaut wraps the <img> in its own div, which has no height of
	   its own — the img's height: 100% below would otherwise resolve against
	   that (indefinite, auto) box rather than .portrait, and fall back to its
	   intrinsic aspect ratio instead of actually filling the frame. */
	.portrait :global(.ascii-art) {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* cover + top, not stretch: when the box is shorter than his full height
	   calls for, this crops him from the feet up instead of leaving a gap
	   under a height-only-driven image; when it's narrower than tall, it
	   crops the sides instead of distorting him. */
	.portrait :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
	}

	/* The rail, in the same dots every measuring line on the site uses. */
	.timeline {
		display: grid;
		gap: 1rem;
		align-content: start;
		/* align-self: start, not the grid-item default of stretch — stretch
		   would make .timeline's own box fill the row (whatever .visual's
		   height set that to), and bind:clientHeight measures the BOX, not
		   the content inside it. Left stretched, the "measurement" is really
		   just reading back .visual's height, a closed loop that can grow but
		   never shrink again once set. This keeps clientHeight honest: always
		   this column's own natural content height, nothing else. */
		align-self: start;
		padding-left: var(--pad);
	}

	.timeline-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.milestone {
		position: relative;
		padding-left: 1.5rem;
		color: var(--color-border);
		background-image: var(--dot-column);
		background-position: 0.2rem 0;
		background-repeat: no-repeat;
		background-size: 1px 100%;
	}

	/* Rail is drawn in the border colour, so this type has to set its own back. */
	.period {
		margin: 0;
		color: var(--mint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		letter-spacing: 0.12em;
	}

	.title {
		margin: 0.3rem 0 0;
		color: var(--color-foreground);
		font-size: var(--fs-subhead);
		font-weight: 700;
	}

	.detail,
	.milestone li {
		color: var(--text-dim);
		font-size: var(--fs-base);
		line-height: 1.7;
	}

	.detail {
		margin: 0.3rem 0 0;
	}

	/* One shared row for the role, not one per bullet — the same tools kept
	   coming up across all three points, so repeating the pills three times
	   was just noise pushing the actual outcomes further down the page. */
	.milestone > :global(.pills) {
		margin: 0.6rem 0 0;
	}

	/* The scannable part: a result up front, in the site's accent colour so it
	   reads before the two sentences under it do. */
	.outcome {
		margin: 0;
		color: var(--mint);
		font-weight: 700;
	}

	.milestone ul {
		display: grid;
		gap: 0.4rem;
		margin: 0.4rem 0 0;
		padding: 0;
		list-style: none;
	}

	/* Mark stands in the gutter, not indenting the text. Pills sit closer to their own line than to the next point, so they read as part of the entry. */
	.milestone li {
		position: relative;
		display: grid;
		gap: 0.45rem;
		padding-left: 1rem;
		padding-bottom: 0.35rem;
	}

	.milestone li::before {
		position: absolute;
		left: 0;
		color: var(--mint);
		content: '–';
	}

	/* The stop on the rail, level with the top of the entry beside it. */
	.milestone::before {
		position: absolute;
		top: 0.35rem;
		left: 0;
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: currentcolor;
		content: '';
	}

	/* --- narrow ---------------------------------------------------------- */

	/* Below this the experience's halves stack rather than standing side by side. */
	@media (max-width: 60rem) {
		.experience {
			grid-template-columns: minmax(0, 1fr);
		}

		/* Stops come first, visual after — it's decoration, and one column means reading order is the order. */
		.visual {
			order: 1;
			align-content: center;
			/* Stacked now, not side by side — matching the timeline's height no
			   longer means anything, so the inline height from the script goes. */
			height: auto !important;
			margin: 0 calc(-1 * var(--pad)) calc(-1 * var(--pad));
			border-top: var(--rule);
			border-right: 0;
		}

		.portrait {
			width: 100%;
			height: auto;
			aspect-ratio: auto;
		}

		.timeline {
			padding-left: 0;
			padding-bottom: var(--pad);
		}
	}

	/* Portrait needs real width to read — drop it rather than crop it further on a phone. */
	@media (max-width: 40rem) {
		.visual {
			display: none;
		}

		/* One indentation level, not two — the rail dot column stays, but the
		   bullet dash's own indent goes, giving narrow-screen text back the room. */
		.milestone li {
			padding-left: 0;
		}

		.milestone li::before {
			display: none;
		}
	}
</style>
