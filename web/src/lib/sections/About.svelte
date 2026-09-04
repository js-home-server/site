<script>
	// Generated: `make site` in ../asciiArt rewrites AsciiAstronaut.svelte.
	import AsciiAstronaut from '$lib/components/AsciiAstronaut.svelte';
	import ToolPills from '$lib/components/ToolPills.svelte';

	/* Rail stops, most recent first. No `points` = a single line of prose. */
	const MILESTONES = [
		{
			period: '2024 — Present',
			title: 'Graduate Engineer, AWE',
			points: [
				{
					text: 'Implemented a signal-processing pipeline synchronising 9 geographically distributed RF sensors to microsecond precision resolving discrepancies between internal crystal clock and GPS time. I performed data cleaning, denoising, and unsupervised anomaly detection. I then performed time-difference-of-arrival (TDOA) localisation using multi-objective optimisation and cross-correlation on the waveforms to obtain a 3 km median error globally.',
					tools: ['Linux', 'Slurm', 'Git', 'Python', 'scikit-learn', 'Plotly', 'NumPy']
				},
				{
					text: 'Designed an onboard navigation system using radar-based terrain imaging. With the Sentinel-1 satellite constellation as a case study, I obtained a 325 m median location accuracy, at 700 km range, at a velocity of 7.5 km/s. I built the preprocessing pipeline for the incoming radar data, and designed an optimisation-based solver to determine location, with a machine-learning-based optimal candidate selection. Achieved on a tight hardware budget of 8 GB RAM, a consumer CPU with a 4-second end-to-end latency.',
					tools: ['MATLAB']
				},
				{
					text: 'Worked on a novel multi-objective optimisation for computationally expensive black-box simulators using surrogate modelling. Working closely with a professor of statistics, I collaborated with the method design, and translated their ideas into code. I designed and implemented the stopping conditions. Leveraging CUDA, I cut wall time on my original implementation by 26×. The project overall was a success cutting 150,000 function evaluations down to 20,000, deployed company-wide as a multi-purpose tool.',
					tools: ['Python', 'Git', 'Slurm', 'CUDA', 'Pandas', 'Linux']
				}
			]
		},
		{
			period: '2020 — 2023',
			title: 'BEng Engineering Mathematics',
			detail: 'University of Bristol, 2:1. Modelling, statistics and scientific computing.'
		}
	];
</script>

<span id="about" aria-hidden="true"></span>
<section id="experience" class="page experience-page">
	<section class="surface-box experience">
		<!-- Decorative — the stops beside it carry the meaning, this is thousands of digits to a screen reader. -->
		<div class="visual" aria-hidden="true">
			<div class="bracket-frame"><div class="portrait"><AsciiAstronaut /></div></div>
		</div>

		<div class="timeline">
			<div class="timeline-head">
				<h2 class="section-title">Experience</h2>
			</div>
			{#each MILESTONES as { period, title, detail, points } (title)}
				<div class="milestone">
					<p class="period">{period}</p>
					<h3 class="title">{title}</h3>
					{#if detail}<p class="detail">{detail}</p>{/if}
					{#if points}
						<ul>
							{#each points as { text, tools } (text)}
								<li>
									{text}
									<ToolPills {tools} />
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

	/* Pinned tracks, not default auto — an auto track sizes to the portrait's own intrinsic width, blowing past the frame instead of letting it crop evenly. */
	.visual :global(.bracket-frame) {
		place-items: center;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		min-height: 0;
		overflow: hidden;
	}

	/* Rasterised now (F11), no cell grid left to size by — height-driven since
	   the box is tall enough that height is fixed and .bracket-frame clips the
	   overflowing width evenly. 61:115 is the astronaut's own column/row count. */
	.portrait {
		width: auto;
		height: 100%;
		aspect-ratio: calc((61 * 0.6021) / (115 * 0.72));
		/* Crop is centred, but the suit's brighter left side reads as off-centre — nudged right to compensate. */
		transform: translateX(3%);
	}

	.portrait :global(img) {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* The rail, in the same dots every measuring line on the site uses. */
	.timeline {
		display: grid;
		gap: 1rem;
		align-content: start;
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
</style>
