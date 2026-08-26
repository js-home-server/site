<script>
	import Logo from '$lib/components/Logo.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import { brandColors, websites } from '$lib/logos.js';

	/* Two boxes: what I have done, and what I build with. Each is a list here and
	   a section below, so the markup stays a shape and the content stays editable
	   in one place.

	   The stops on the rail, oldest first. `points` is what was actually done in
	   that stretch; a stop without any is a single line of prose. */
	const MILESTONES = [
		{
			period: '2020 — 2023',
			title: 'BEng Engineering Mathematics',
			detail: 'University of Bristol, 2:1. Modelling, statistics and scientific computing.'
		},
		{
			period: '2024 — Present',
			title: 'Graduate Data Scientist, AWE',
			points: [
				'Signal-processing pipeline synchronising 9 distributed sensors to microsecond precision — denoising, unsupervised anomaly detection, waveform clustering and TDOA localisation.',
				'Onboard navigation system: 580 m median accuracy at 700 km range against a 7.5 km/s target, 4-second end-to-end latency, inside 8 GB of RAM on a consumer CPU.',
				'Multi-objective optimisation by surrogate modelling: 150,000 function evaluations down to 20,000, CUDA for a 26x cut in wall time, deployed company-wide.'
			]
		},
		{
			period: 'The future',
			title: 'Whatever the next hard problem is',
			detail:
				'Continuing to build systems that turn messy data into decisions, and looking for the next one worth working on.'
		}
	];
	/* What I work in, grouped by what each thing is for, and how well — a level
	   from 1 to 4, drawn as that many filled dots and read against the key
	   beside them. */
	const CATEGORIES = [
		[
			'Languages & query',
			[
				['Python', 4],
				['C++', 2],
				['SQL', 2],
				['MATLAB', 4],
				['JavaScript', 2]
			]
		],
		[
			'ML & modelling',
			[
				['PyTorch', 3],
				['TensorFlow', 3],
				['scikit-learn', 4]
			]
		],
		[
			'Data & analytics',
			[
				['NumPy', 4],
				['Pandas', 4],
				['Polars', 3],
				['Plotly', 2]
			]
		],
		[
			'Compute & HPC',
			[
				['CUDA', 2],
				['Slurm', 3],
				['Linux', 3]
			]
		],
		[
			'Tooling',
			[
				['Git', 4],
				['Docker', 3],
				['Svelte', 1]
			]
		]
	];

	/* What a filled dot is worth, most first. */
	const LEVELS = [
		[4, "I'm never getting my life back"],
		[3, 'Hundreds'],
		[2, 'Many'],
		[1, 'Some']
	];
</script>

{#snippet dots(level)}
	<span class="dots" aria-hidden="true">
		{#each { length: 4 }, i (i)}<i class:on={i < level}></i>{/each}
	</span>
{/snippet}

<section id="about" class="page about">
	<section class="surface-box journey">
		<div class="timeline">
			<h2 class="eyebrow">My journey</h2>
			{#each MILESTONES as { period, title, detail, points } (title)}
				<div class="milestone">
					<p class="period">{period}</p>
					<p class="title">{title}</p>
					{#if detail}<p class="detail">{detail}</p>{/if}
					{#if points}
						<ul>
							{#each points as point (point)}<li>{point}</li>{/each}
						</ul>
					{/if}
				</div>
			{/each}
		</div>

		<div class="visual"><Placeholder note="journey visual" lines={16} /></div>
	</section>

	<section class="surface-box tools">
		<div class="tools-head">
			<h2 class="eyebrow">Tools &amp; technicalities</h2>
			<p class="strap">
				Technologies I work with to build reliable, scalable and intelligent systems.
			</p>
		</div>

		<div class="tools-body">
			<div class="rows">
				{#each CATEGORIES as [category, tools] (category)}
					<div class="tool-row">
						<h3 class="category">{category}</h3>

						<ul class="chips">
							{#each tools as [tool, level] (tool)}
								<li style="--brand: {brandColors[tool] ?? 'currentcolor'}">
									{#if websites[tool]}
										<a href={websites[tool]} target="_blank" rel="noopener noreferrer">
											<Logo name={tool} /> {tool} {@render dots(level)}
										</a>
									{:else}
										<Logo name={tool} /> {tool} {@render dots(level)}
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			<aside class="key">
				<h3 class="eyebrow">Hours spent swearing at it</h3>

				<dl>
					{#each LEVELS as [level, name] (name)}
						<div><dt>{@render dots(level)}</dt><dd>{name}</dd></div>
					{/each}
				</dl>

				<div class="art"><Placeholder note="ascii" lines={5} /></div>
			</aside>
		</div>
	</section>
</section>

<style>
	/* The section is its two boxes and the air between them: laid out across
	   rather than read down, so it takes the dashboard's width rather than a
	   column of prose. */
	.about {
		gap: clamp(0.75rem, 1.5vh, 1.25rem);
	}

	/* --- my journey ----------------------------------------------------- */

	.journey {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
	}

	/* The two halves are divided by a rule run wall to wall, which is what the
	   negative margin and the padding put back are for. */
	.visual {
		display: grid;
		margin: calc(-1 * var(--pad)) calc(-1 * var(--pad)) calc(-1 * var(--pad)) 0;
		padding: var(--pad);
		border-left: var(--rule);
	}

	/* The rail the milestones hang off, in the dots every measuring line on the
	   site is drawn with. */
	.timeline {
		display: grid;
		gap: 1rem;
		align-content: start;
		padding-right: var(--pad);
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

	/* When it was, what it was, and what it came to. The rail is drawn in the
	   border colour, so the type on it sets its own back. */
	.period {
		margin: 0;
		color: var(--mint);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
	}

	.title {
		margin: 0.3rem 0 0;
		color: var(--color-foreground);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.detail,
	.milestone li {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		line-height: 1.7;
	}

	.detail {
		margin: 0.3rem 0 0;
	}

	.milestone ul {
		display: grid;
		gap: 0.4rem;
		margin: 0.4rem 0 0;
		padding: 0;
		list-style: none;
	}

	/* The mark stands in the gutter rather than indenting the text off it. */
	.milestone li {
		position: relative;
		padding-left: 0.9rem;
	}

	.milestone li::before {
		position: absolute;
		left: 0;
		color: var(--mint);
		content: '—';
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

	/* --- tools & technicalities ------------------------------------------ */

	.tools .eyebrow {
		display: block;
		margin-bottom: var(--pad);
	}


	/* The heading and the line under it sit on one row, the way the drawing has
	   them: what the section is on the left, what it is for beside it. */
	.tools-head {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 2rem;
		align-items: baseline;
		margin-bottom: var(--pad);
	}

	.strap {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	/* The groups take the width; the legend is a fixed column beside them. */
	.tools-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 20rem;
		gap: clamp(1.5rem, 3vw, 2.5rem);
	}

	.rows {
		display: grid;
		align-content: start;
	}

	/* A group is a line: what it is called on the left, everything in it across
	   the rest, ruled off from the group under it. */
	.tool-row {
		display: grid;
		grid-template-columns: 14rem minmax(0, 1fr);
		gap: 0rem;
		align-items: center;
		padding: 0.85rem 0;
	}

	.tool-row + .tool-row {
		border-top: var(--rule);
	}

	.category {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
	}

	/* One tool, one pill: its name and how much of it there is. */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chips li {
		position: relative;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	/* `display: contents` lays the icon/name/dots out as if they were direct
	   children of the pill; the `::after` is what actually catches the click,
	   stretched over the whole pill rather than just the text and icon. */
	.chips li > :global(a) {
		display: contents;
		color: inherit;
		text-decoration: none;
	}

	.chips li > :global(a::after) {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	.chips li:has(a):hover {
		border-color: var(--brand);
	}

	.chips li:has(a):hover :global(svg) {
		fill: var(--brand);
	}

	/* The meter: four dots, filled up to the level. Every one of them is hollow
	   until the levels are written, which is what says the ranking is not in yet
	   rather than saying everything is a 0. */
	.dots {
		display: inline-flex;
		gap: 0.22rem;
		align-items: center;
		color: var(--mint);
	}

	.dots i {
		width: 0.38rem;
		height: 0.38rem;
		border: 1px solid currentcolor;
		border-radius: 50%;
	}

	.dots i.on {
		background: currentcolor;
	}

	/* What the dots are worth, in its own box beside them. Not `.legend`: that is
	   the chart key in app.css, whose swatch paints itself in, which would fill
	   every hollow dot in here. */
	.key {
		display: grid;
		align-content: start;
		gap: 0.75rem;
		padding: var(--divide, 1rem);
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
	}

	.key dl {
		display: grid;
		gap: 0.4rem;
		margin: 0;
	}

	.key dl div {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}

	.key dd {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		white-space: nowrap;
	}

	/* The art that fills the foot of the box, once there is any. */
	.key .art {
		margin-top: auto;
	}

	/* --- narrow ---------------------------------------------------------- */

	/* Below this nothing holds its columns: the journey's halves stack, and a
	   group's tools go under its name. */
	@media (max-width: 60rem) {
		.journey {
			grid-template-columns: minmax(0, 1fr);
		}

		.visual {
			margin: 0 calc(-1 * var(--pad)) calc(-1 * var(--pad));
			border-top: var(--rule);
			border-left: 0;
		}

		.timeline {
			padding-right: 0;
			padding-bottom: var(--pad);
		}

		/* The legend has nowhere to stand beside the groups: it goes under them. */
		.tools-body {
			grid-template-columns: minmax(0, 1fr);
		}

		/* And a group's name goes above what is in it rather than beside it. */
		.tool-row {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.6rem;
		}
	}
</style>
