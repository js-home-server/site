<script>
	import Icon from '$lib/components/Icon.svelte';

	/* The executive brief a project card opens onto, drawn as an engineering
	   sheet: graph ground, a primary drawing frame, a title
	   block, and the work read in four bands — the premise, one figure of the
	   thing actually running, and the mechanisms under it dimensioned like parts.

	   It is deliberately not the case study. The full write-ups run 10-14k
	   characters and live at /projects/<name>; this is what a reader who opened
	   the fold gets in twenty seconds, and every figure on it is one they can
	   chase into the study behind it.

	   Content is data (data/briefs.js). FIG. 01 is whichever of these the
	   project actually has, in this order of preference: a `figure` snippet from
	   the caller, an `embed` (the thing running), an `image`, or `columns` —
	   a chart, for the two whose proof is a measurement rather than a screen. */
	let { brief, figure } = $props();

	/* The chart's own scale. Only ever one series, and the tallest column is the
	   full height of the plate. */
	const tallest = Math.max(...(brief.figure.columns ?? []).map((c) => c.value), 1);

	/* Values are written above the columns only where there is room for them —
	   past a handful they collide, and the caption carries the reading instead. */
	const sparse = (brief.figure.columns?.length ?? 0) <= 6;
</script>

<div class="sheet">
	<div class="drawing">
		<!-- One primary frame with a single circled focal junction. -->
		<div class="frame" aria-hidden="true"></div>
		<i class="focal-junction" aria-hidden="true"></i>

		<!-- The sheet's own tab, the way a drawing set names its plates. -->
		<p class="tab">System drawing / {brief.drawing}</p>

		<div class="body">
		<!-- The premise, and the title block beside it. One row, because on a
		     real sheet the block is the top-right corner of the drawing rather
		     than a footer. -->
		<div class="band premise-band">
			<div class="premise">
				{#each brief.premise as { kicker, title, text } (kicker)}
					<section class="cell">
						<h4 class="kicker kicker-lg">{kicker}</h4>
						<p class="claim">{title}</p>
						<p class="prose">{text}</p>
					</section>
				{/each}
			</div>

			<dl class="block">
				{#each brief.block as { label, value } (label)}
					<div><dt>{label}</dt><dd>{value}</dd></div>
				{/each}
			</dl>
		</div>

		<!-- FIG. 01, and the notes annotating it down the right. -->
		<div class="band plate-band">
			<figure class="fig">
				<figcaption>
					<span class="fig-no">FIG. 01</span>
					<span class="sep" aria-hidden="true">/</span>
					<span class="caption">{brief.figure.caption}</span>
				</figcaption>

				<div class="plate" class:art={figure} class:framed={brief.figure.embed || brief.figure.image}>
					{#if figure}
						{@render figure()}
					{:else if brief.figure.embed}
						<!-- The thing itself, running. Sandboxed to scripts only: it is a
						     self-contained static page, and it has no business reaching
						     back into this one. -->
						<iframe
							src={brief.figure.embed}
							title={brief.figure.caption}
							loading="lazy"
							sandbox="allow-scripts"
						></iframe>
					{:else if brief.figure.image}
						<img src={brief.figure.image} alt={brief.figure.caption} loading="lazy" decoding="async" />
					{:else}
						<div class="chart" class:sparse style:--rows={sparse ? 4 : 5}>
							{#each brief.figure.columns as { name, value, label } (name)}
								<!-- A partition with no data is drawn as a hatched slot the
								     full height of the plate, not as an absent column: the
								     hole is the finding. -->
								<div class="column" class:void={!value} title="{name}: {label}">
									{#if sparse && value}<span class="reading">{label}</span>{/if}
									<i style="height: {(value / tallest) * 100}%"></i>
									<span class="tick-label">{name}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</figure>

			<div class="notes">
				<h4 class="notes-title kicker kicker-lg">Design points</h4>
				{#each brief.notes as { icon, term, text } (term)}
					<section class="note">
						<h4 class="note-head">
							<span class="glyph small"><Icon name={icon} /></span>
							<span class="kicker">{term}</span>
						</h4>
						<p class="prose">{text}</p>
					</section>
				{/each}
			</div>
		</div>

		<!-- The achievements, each led by the number that proves it. -->
		<div class="band">
			<h4 class="band-head kicker kicker-lg">{brief.mechanismsLabel}</h4>

			<div class="mechanisms">
				{#each brief.mechanisms as { figure, text } (figure)}
					<section class="mech">
						<p class="mech-figure">{figure}</p>
						<p class="prose">{text}</p>
					</section>
				{/each}
			</div>
		</div>
	</div>

	</div>
</div>

<style>
	/* --- the sheet --------------------------------------------------------

	   A blueprint, in the one blue this site can carry: --azure is the pastel
	   the rest of the page already uses for anything technical, and these are
	   its printing weights — a ground it is barely tinted into, a grid, a rule,
	   and an ink dark enough to read small mono on paper (7.4:1). They are
	   literal values rather than color-mix on --azure because a drawing's ink
	   has to hold its contrast whatever the accent is retuned to later. */
	.sheet {
		--paper: #f4f7fc;
		--grid: #dfe8f5;
		--line: #c2d3e9;
		--ink: #2a4b8d;
		--ink-deep: #16233c;
		--body-ink: #44536e;
		--pitch: 16px;

		padding: 0;
		color: var(--body-ink);
		background-color: var(--paper);
		background-image:
			repeating-linear-gradient(to right, var(--grid) 0 1px, transparent 1px var(--pitch)),
			repeating-linear-gradient(to bottom, var(--grid) 0 1px, transparent 1px var(--pitch));
	}

	.drawing {
		position: relative;
	}

	/* Primary lines frame major sections. All corners are square. */
	.frame {
		position: absolute;
		inset: 0.6rem;
		border: 1px solid var(--ink);
		pointer-events: none;
	}

	/* One circled + marks the composition's focal structural junction. */
	.focal-junction {
		position: absolute;
		top: calc(0.6rem - 0.45rem);
		right: calc(0.6rem - 0.45rem);
		width: 0.9rem;
		height: 0.9rem;
		color: var(--ink);
		background: var(--paper);
		border: 1px solid currentcolor;
		border-radius: 50%;
		pointer-events: none;
	}

	.focal-junction::before,
	.focal-junction::after {
		content: '';
		position: absolute;
		inset: 50% -0.3rem auto;
		height: 1px;
		background: currentcolor;
	}

	.focal-junction::after {
		inset: -0.3rem auto;
		left: 50%;
		width: 1px;
		height: calc(100% + 0.6rem);
	}

	/* The plate's name, set solid the way a drawing set tabs its sheets — the
	   one filled shape on the page, so it reads as a label stuck to it. */
	.tab {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
		margin: 0;
		padding: 0.3rem 0.85rem;
		color: var(--paper);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		background: var(--ink);
	}

	/* Inside the frame, clear of the tab. */
	.body {
		display: grid;
		gap: 0;
		padding: 2.4rem 1.9rem 0;
	}

	/* Bands are divided by a full rule, the way a drawing's zones are. */
	.band {
		padding: 1.2rem 0;
	}

	.band + .band {
		border-top: 1px solid var(--line);
	}

	/* --- shared type ------------------------------------------------------ */

	.kicker {
		display: block;
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	/* The one sentence per cell that carries the argument, in the sans — the
	   only thing on the sheet louder than mono. */
	.claim {
		margin: 0.5rem 0 0.4rem;
		color: var(--ink-deep);
		font-size: var(--fs-sm);
		font-weight: 600;
		line-height: 1.4;
		letter-spacing: -0.01em;
	}

	.prose {
		margin: 0;
		color: var(--body-ink);
		font-size: var(--fs-sm);
		line-height: 1.7;
	}

	.sep {
		color: var(--line);
	}

	/* The outline marks. Drawn large and thin in the premise, small in the
	   rails — the reference sheet's own two weights. */
	.glyph {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		flex: none;
		color: var(--ink);
	}

	.glyph :global(svg) {
		width: 100%;
		height: 100%;
		stroke-width: 1;
	}

	.glyph.small {
		width: 1.15rem;
		height: 1.15rem;
	}

	.glyph.small :global(svg) {
		stroke-width: 1.4;
	}

	/* A section title, sized up in place of the icon or number that used to
	   mark it — the label alone carries the weight now. */
	.kicker-lg {
		font-size: var(--fs-base);
		letter-spacing: 0.05em;
	}

	.band-head {
		margin: 0 0 1rem;
	}

	/* --- band 01: the premise, and the title block ------------------------ */

	.premise-band {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1.75rem;
		align-items: start;
		padding-top: 0.4rem;
	}

	.premise {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem;
	}

	.cell {
		display: grid;
		align-content: start;
		gap: 0.4rem;
	}

	.cell + .cell {
		padding-left: 1.5rem;
		border-left: 1px solid var(--line);
	}

	/* The drafting title block: ruled cells, label over value, in the corner a
	   real one is in. */
	.block {
		display: grid;
		width: 10rem;
		margin: 0;
		border: 1px solid var(--ink);
	}

	.block > div {
		padding: 0.35rem 0.6rem;
	}

	.block > div + div {
		border-top: 1px solid var(--line);
	}

	.block dt,
	.block dd {
		margin: 0;
		font-family: var(--font-mono);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.block dt {
		color: var(--ink);
		font-size: var(--fs-3xs);
		opacity: 0.75;
	}

	.block dd {
		margin-top: 0.15rem;
		color: var(--ink-deep);
		font-size: var(--fs-xs);
		letter-spacing: 0.04em;
	}

	/* --- band 02: FIG. 01 and its notes ----------------------------------- */

	/* `align-items: start` rather than the grid default of stretch — the
	   design points column is often taller than the figure, and stretching
	   would drag the plate up to match it instead of shrink-wrapping to
	   whatever is actually pinned inside it. */
	.plate-band {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		align-items: start;
		gap: 1.75rem;
	}

	.fig {
		display: grid;
		grid-template-rows: auto auto;
		gap: 0.6rem;
		margin: 0;
	}

	figcaption {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: var(--fs-base);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.fig-no {
		color: var(--ink);
		font-weight: 700;
	}

	.caption {
		color: var(--body-ink);
	}

	/* The drawing area: white, so whatever is pinned to it stops the grid. */
	/* Shrink-wrapped to whatever is actually pinned to it — an iframe's own
	   min-height, a chart's own height, a render's own size — rather than a
	   fixed height every project is forced into whether it needs it or not. */
	.plate {
		display: grid;
		padding: 1rem 1.1rem;
		background: #fff;
		border: 1px solid var(--ink);
	}

	/* A screen or a render brings its own edges and wants none of ours. */
	.plate.framed,
	.plate.art {
		place-items: center;
		padding: 0;
		overflow: hidden;
	}

	.plate.art {
		padding: 1rem;
	}

	/* The explorer needs room to be usable rather than merely present: its own
	   layout puts a filter rail, the graph and an inspector side by side, and
	   under about this height they start folding over each other. */
	.plate iframe {
		width: 100%;
		height: 100%;
		min-height: 32rem;
		border: 0;
	}

	.plate img {
		width: 100%;
		height: auto;
		display: block;
	}

	/* --- the chart -------------------------------------------------------- */

		/* Quiet solid rows give the chart a secondary reading grid. */
	/* Rows are declared here rather than left implicit: the columns' own heights
	   are percentages, and a percentage only resolves against a track the grid
	   has actually sized. Reading, column, tick — and each .column takes all
	   three as a subgrid, so every label sits on one line across the chart. */
	.chart {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 3px;
		height: 15rem;
		padding-top: 1rem;
		background-image: repeating-linear-gradient(
			to bottom,
			var(--line) 0 1px,
			transparent 1px calc((100% - 1.5rem) / var(--rows))
		);
		background-size: 100% calc(100% - 1.5rem);
		background-repeat: no-repeat;
	}

	/* A handful of readings do not become a wider chart, they become a narrower
	   one: four columns spread over the full plate read as slabs, not as bars. */
	.chart.sparse {
		grid-auto-columns: minmax(0, 4.5rem);
		justify-content: center;
		gap: 2.5rem;
	}

	.column {
		display: grid;
		grid-row: 1 / -1;
		grid-template-rows: subgrid;
		gap: 0.3rem;
		align-items: end;
	}

	.column i {
		grid-row: 2;
		width: 100%;
		align-self: end;
		background: color-mix(in srgb, var(--ink) 62%, #fff);
		border: 1px solid var(--ink);
	}

	.column .tick-label {
		grid-row: 3;
	}

	/* A quiet outline keeps an empty partition present without decorative hatch. */
	.column.void i {
		height: 100% !important;
		background: color-mix(in srgb, var(--coral-ink) 8%, #fff);
		border: 1px solid color-mix(in srgb, var(--coral-ink) 45%, var(--line));
	}

	.reading,
	.tick-label {
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.reading {
		grid-row: 1;
		font-weight: 700;
		margin-bottom: 0.2rem;
	}

	.tick-label {
		color: var(--body-ink);
		font-size: var(--fs-3xs);
	}

	/* --- the notes rail --------------------------------------------------- */

	.notes {
		display: grid;
		align-content: start;
		gap: 1rem;
		padding-left: 1.5rem;
		border-left: 1px solid var(--line);
	}

	.notes-title {
		margin: 0;
	}

	.note + .note {
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}

	.note-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.5rem;
	}

	/* --- band 03: the achievements ----------------------------------------- */

	/* Plain cards, side by side — no diagram, since none of these is actually a
	   sequential process worth drawing as one. */
	.mechanisms {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.mech {
		display: grid;
		align-content: start;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		background: #fff;
		border: 1px solid var(--ink);
	}

	/* The number leads — the same headline-figure weight the rest of the site
	   gives a proven claim — and the sentence earning it sits underneath. */
	.mech-figure {
		margin: 0;
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: var(--fs-lg);
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
	}

	/* --- narrow ----------------------------------------------------------- */

	@media (max-width: 62rem) {
		.premise-band,
		.plate-band,
		.premise,
		.mechanisms {
			grid-template-columns: minmax(0, 1fr);
		}

		.cell + .cell {
			padding: 1.1rem 0 0;
			border-left: 0;
			border-top: 1px solid var(--line);
		}

		.notes {
			padding: 1.2rem 0 0;
			border-left: 0;
			border-top: 1px solid var(--line);
		}

		.block {
			grid-auto-flow: column;
			width: auto;
		}

		.block > div + div {
			border-top: 0;
			border-left: 1px solid var(--line);
		}

	}

	@media (max-width: 40rem) {
		.body {
			padding: 2.4rem 1.1rem 0;
		}

		/* The frame and focal junction are drafting furniture, and there is no room
		   left for furniture at this width. */
		.frame,
		.focal-junction {
			display: none;
		}

		.tab {
			top: 0;
			left: 0;
		}

		.block {
			grid-auto-flow: row;
		}

		.block > div + div {
			border-left: 0;
			border-top: 1px solid var(--line);
		}

		/* The explorer is somebody else's page and its own layout folds over
		   itself below about this width. Rather than show it broken, the plate
		   becomes a viewport onto it at the width it was drawn for. */
		.plate.framed {
			overflow-x: auto;
		}

		.plate iframe {
			min-width: 40rem;
		}
	}
</style>
