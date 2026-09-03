<script>
	import AsciiOwlColor from '$lib/components/AsciiOwlColor.svelte';
	import AsciiOwlGray from '$lib/components/AsciiOwlGray.svelte';
	import AsciiOwlMono from '$lib/components/AsciiOwlMono.svelte';
	import Icon from '$lib/components/Icon.svelte';

	/* ascii-art's own study. The other three projects are shown through
	   screenshots and figures; this one can be shown as itself — the renders
	   below are the tool's actual HTML output, text in the page rather than a
	   picture of text, which is the whole argument for the format existing.

	   So the study is written the way the program is used: sections named as
	   flags, and the output doing the talking. Everything else on this site —
	   the bull on the landing page, the astronaut, the ship, the radio dish —
	   came out of the same binary. */

	const SPEC = [
		{ label: 'language', value: 'C11' },
		{ label: 'dependencies', value: 'stb_image, vendored' },
		{ label: 'source', value: '1,300 lines' },
		{ label: 'tests', value: '17 · 168 assertions' },
		{ label: 'warnings', value: 'clean at -Wall -Wextra -Wpedantic' }
	];

	/* The three modes, on one source, at the same width. The flags are the
	   caption: a reader should be able to reproduce any panel. */
	const MODES = [
		{
			id: 'mono',
			name: 'mono',
			rule: 'glyph from luminance, one colour',
			flags: '--mode mono --charset simple --invert',
			text: 'Ink is glyph coverage and nothing else. Ten steps of ramp, no colour anywhere. This is the version that survives a log file.'
		},
		{
			id: 'gray',
			name: 'gray',
			rule: 'glyph + quantised grey',
			flags: '--mode gray --charset safe --invert --gray-levels 16',
			text: 'Tone is expressed twice, as glyph coverage and again as foreground brightness. The two layers multiply, which is where the apparent range comes from.'
		},
		{
			id: 'color',
			name: 'color',
			rule: 'glyph + averaged source RGB',
			flags: '--mode color --saturation 0.8 --color-step 32',
			text: 'Glyph still carries luminance and only the foreground carries colour. Photographic saturation reads as noise at 6px, so it is pulled back toward grey.'
		}
	];

	/* One cell, start to finish. Every output character is this loop run once. */
	const PIPELINE = [
		{ name: 'source region', detail: 'a rectangle of pixels, tiled exactly' },
		{ name: 'average RGB', detail: 'every pixel in it, read once' },
		{ name: 'luminance', detail: 'and the tone curve on top' },
		{ name: 'ink direction', detail: 'threshold, and which end is ink' },
		{ name: 'glyph', detail: 'wanted coverage → a character' },
		{ name: 'colour', detail: 'quantised, then encoded' }
	];

	/* The modules, so the pipeline above has an address. */
	const MODULES = [
		{ file: 'image.c', role: 'loading and ownership of pixel data' },
		{ file: 'sample.c', role: 'block resampling' },
		{ file: 'color.c', role: 'luminance, tone curve, saturation, quantisation' },
		{ file: 'charset.c', role: 'ramps and glyph selection' },
		{ file: 'render.c', role: 'the pipeline: image in, grid of cells out' },
		{ file: 'output.c', role: 'encoding a finished grid as TXT / ANSI / HTML' },
		{ file: 'config.c', role: 'defaults, arguments, validation' }
	];

	/* What quantisation buys in the HTML encoder. Adjacent cells sharing a
	   foreground become one span, so coarser levels mean fewer nodes. */
	const QUANT = [
		{ knob: '--gray-levels 4', spans: '3,056', size: '95 K' },
		{ knob: '--gray-levels 8', spans: '5,313', size: '149 K' },
		{ knob: '--gray-levels 16', spans: '7,740', size: '210 K', note: 'default' },
		{ knob: '--color-step 8', spans: '11,309', size: '431 K' },
		{ knob: '--color-step 32', spans: '8,366', size: '328 K' },
		{ knob: '--color-step 64', spans: '6,283', size: '256 K' }
	];

	/* The properties that make the art a build artifact rather than a file
	   someone once made and now cannot reproduce. */
	const BUILD = [
		{ term: 'Deterministic', text: 'the same inputs produce byte-identical output. No timestamps, no ordering by hash iteration, no seed, so a regenerated component is a no-op in git unless the source or the flags changed.' },
		{ term: 'One command', text: '`make site` re-renders all five components straight into the paths the pages import. The flags for each live in the Makefile beside the reason for them.' },
		{ term: 'Checked, not piped', text: '17 test functions and 168 assertions run by `make test`, covering the pipeline stages, config validation, and the two claims most likely to rot: that downscaling averages rather than samples, and that the HTML block stays within 2% of the source’s proportions. There is no CI runner. This one is a Makefile target and honest about it.' }
	];

	const LIMITS = [
		{ term: 'The ramps are hand-ordered', text: 'glyph selection asks for wanted ink coverage in 0..1, and a Charset carries an optional measured-density table for answering it. That table is NULL today, so glyphs are assumed evenly spaced, which is the main quality ceiling in the current output. The hook and its test exist. The measurement does not.' },
		{ term: 'Alpha is ignored', text: 'channel layouts are handled explicitly, but alpha is dropped rather than composited.' },
		{ term: 'No edge awareness', text: 'a cell knows its own average and nothing about its neighbours, so a hard edge is reconstructed from tone alone rather than from a glyph that matches its direction.' },
		{ term: 'Single-threaded, no dithering', text: 'deliberately so at this size, since the whole render is 13 ms. Threading, dithering, custom palettes, animation and WebAssembly are named as out of scope rather than left implied.' }
	];
</script>

<!-- A section's name, written the way it is passed. -->
{#snippet head(flag, title, lede)}
	<div class="lede">
		<span class="flag">{flag}</span>
		<h4>{title}</h4>
		{#if lede}<p class="prose">{lede}</p>{/if}
	</div>
{/snippet}

<div class="study">
	<!-- What it is, and the command that does it. -->
	<section class="box banner">
		<div class="intro">
			<p class="thesis">
				A photograph is a grid of pixels. A terminal is a grid of characters. The
				conversion is one honest question repeated a few thousand times: what does this
				rectangle of the image weigh, and which character weighs the same?
			</p>
			<p class="prose">
				A C11 command-line renderer that answers it. Block-averaged sampling, a tone
				curve, glyph selection and encoding are separable stages, each tested on its own.
				It generates every piece of art on this site, including the bull you scrolled past
				to get here.
			</p>

			<code class="install">ascii-art photo.png --mode color --format ansi --width 160</code>

			<dl class="spec">
				{#each SPEC as item (item.label)}
					<div><dt>{item.label}</dt><dd>{item.value}</dd></div>
				{/each}
			</dl>
		</div>

		<figure class="source">
			<img src="/projects/owl-source.jpg" alt="The source photograph: a little owl on white" loading="lazy" decoding="async" />
			<figcaption>667 × 667 source. Every render below is this photograph, at 100 columns.</figcaption>
		</figure>
	</section>

	<!-- The demonstration. This is text, and that is the point. -->
	<section class="box">
		{@render head(
			'--mode',
			'Three modes, one photograph',
			'Glyph density carries luminance and foreground colour carries colour. Neither is smuggled into the other, which is why the three panels differ in exactly one thing each.'
		)}

		<div class="modes">
			{#each MODES as mode (mode.id)}
				<figure class="render">
					<div class="art">
						{#if mode.id === 'mono'}<AsciiOwlMono />{/if}
						{#if mode.id === 'gray'}<AsciiOwlGray />{/if}
						{#if mode.id === 'color'}<AsciiOwlColor />{/if}
					</div>
					<figcaption>
						<strong>{mode.name}</strong>
						<span class="rule">{mode.rule}</span>
						<code>{mode.flags}</code>
						<span class="note">{mode.text}</span>
					</figcaption>
				</figure>
			{/each}
		</div>

		<p class="foot-note">
			Select any of it and you will select characters. The HTML output is a
			<code>&lt;pre&gt;</code> of real text with adjacent same-coloured cells grouped into
			spans, rather than an image of text. That is the argument for the format existing at
			all: an ASCII render dropped into a page as a <code>.txt</code> file, with no
			<code>white-space: pre</code> and a default line height, wraps and stretches into
			nothing.
		</p>
	</section>

	<!-- The loop that produces one character. -->
	<section class="box">
		{@render head('--pipeline', 'One cell, start to finish', 'Every cell in the output grid runs the same sequence once. render.c decides everything tonal and chromatic, and output.c only encodes a grid that is already final, which is why the three formats can never disagree about content.')}

		<div class="pipeline">
			{#each PIPELINE as stage, s (stage.name)}
				{#if s}<span class="arrow" aria-hidden="true">→</span>{/if}
				<div class="stage">
					<strong>{stage.name}</strong>
					<span>{stage.detail}</span>
				</div>
			{/each}
		</div>

		<div class="modules">
			{#each MODULES as module (module.file)}
				<div class="module">
					<code>{module.file}</code>
					<span>{module.role}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- The decision the whole thing rests on. -->
	<section class="box row">
		<div>
			{@render head('--width', 'Averaging, not sampling')}
			<p class="prose">
				The naive renderer walks the image and reads one pixel per character. That throws
				away almost everything in a downscale, and it is unstable: shift the source by a
				pixel and a different set of glyphs comes out.
			</p>
			<p class="prose">
				Here the output grid is mapped back onto the source with integer arithmetic. Each
				cell's <code>x1</code> is the next cell's <code>x0</code>, so the blocks tile the
				source exactly, with no gaps, no overlap, and no rounding drift accumulating across
				a row. Every pixel in the rectangle is averaged, so cost is
				<code>O(source pixels)</code> whatever the output size.
			</p>
			<p class="foot-note">
				A four-pixel checkerboard sampled at one pixel reads as pure black or pure white.
				Averaged, it reads as the mid-grey it actually is. A test is named for exactly
				that.
			</p>
		</div>

		<pre class="code"><code>{`x0 = out_x * source_width  / output_width;
x1 = (out_x + 1) * source_width  / output_width;
y0 = out_y * source_height / output_height;
y1 = (out_y + 1) * source_height / output_height;

// tests/test_ascii.c
test_downscale_averages_not_samples();
test_sample_block();
test_html_proportions();`}</code></pre>
	</section>

	<!-- The bug that only shows up on the web. -->
	<section class="box row">
		<div>
			{@render head('--char-aspect', 'A character is not a square')}
			<p class="prose">
				In a terminal a cell is about twice as tall as it is wide, so a grid with as many
				rows as columns renders the picture stretched to double height. The row count is
				therefore derived from the source's aspect and the cell's, not from the column
				count.
			</p>
			<p class="prose">
				The two targets do not share a number. A terminal cell is about 0.5 wide over
				tall, while the emitted web CSS sets <code>line-height: 0.72</code> and measures
				3.61 × 4.31 px in Chrome, or 0.838. Using the terminal's 0.5 for HTML is what
				makes a render come out roughly 40% too short.
			</p>
			<p class="foot-note">
				The HTML default is therefore derived from the same constants that generate the
				CSS, rather than written down twice where the two could drift apart, and
				<code>test_html_proportions</code> asserts the rendered block stays within 2% of
				the source's shape.
			</p>
		</div>

		<div class="aspects">
			<div class="aspect">
				<span class="scope">terminal · txt, ansi</span>
				<strong>0.5</strong>
				<span class="note">line-height ≈ 1.2 × font-size, so the cell is about twice as tall as it is wide</span>
			</div>
			<div class="aspect">
				<span class="scope">web · html</span>
				<strong>0.83</strong>
				<span class="note">line-height 0.72 makes the cell nearly square, measured at 3.61 × 4.31 px</span>
			</div>
			<p class="foot-note">
				Two kinds of density are easy to confuse. <strong>Spatial</strong> is
				<code>--width</code>, how many cells the image is cut into.
				<strong>Tonal</strong> is <code>--charset</code>, how many ink levels the glyphs
				can express, from 10 steps for <code>simple</code> to 85 for
				<code>medium</code>. Wide output with a coarse ramp is sharp but posterised, and
				narrow output with a fine ramp has nothing to be smooth about.
			</p>
		</div>
	</section>

	<!-- What the encoder does with a finished grid. -->
	<section class="box row">
		<div>
			{@render head('--format', 'Three encodings of the same grid', 'TXT for files and logs, ANSI true-colour for terminals, and an embeddable HTML fragment. Only the foreground is ever set, so trailing blanks are invisible in all three.')}
			<p class="prose">
				The HTML encoder groups adjacent cells sharing a foreground into one
				<code>&lt;span&gt;</code> and emits spaces bare, because they show no ink. On a
				260 × 130 render that is 33,800 cells written as about 8,000 spans. Quantisation
				is what makes the grouping effective, so it decides the file size.
			</p>
			<p class="foot-note">
				Grey levels become CSS classes. Colours stay inline, because with a useful
				<code>--color-step</code> there are more distinct colours than it is worth
				emitting a class for.
			</p>
		</div>

		<table class="quant">
			<thead>
				<tr><th scope="col">knob</th><th scope="col">spans</th><th scope="col">size</th></tr>
			</thead>
			<tbody>
				{#each QUANT as row (row.knob)}
					<tr>
						<th scope="row"><code>{row.knob}</code>{#if row.note}<span class="tag">{row.note}</span>{/if}</th>
						<td>{row.spans}</td>
						<td>{row.size}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<!-- The integration, which is this website. -->
	<section class="box row">
		<div>
			{@render head('--charset safe', 'This site is the client')}
			<p class="prose">
				Every render on this site comes out of a <code>make site</code> target in the
				repo, straight into the components the pages import. They all share one ramp,
				<code>8096453271:.&nbsp;</code>, so the picture is drawn in digits rather than
				punctuation.
			</p>
			<p class="foot-note">
				Column counts are not guesses either. Each is derived from the box it lands in and
				the mono face's own advance, so a digit is the same physical size everywhere on
				the page.
			</p>
		</div>

		<div class="gotcha">
			<span class="scope">the one that cost an afternoon</span>
			<p class="prose">
				Svelte and JSX parse <code>&#123;</code> and <code>&#125;</code> as expression
				delimiters, and the <code>medium</code> and <code>full</code> ramps both contain
				them. A 260-column render carries roughly 200 of each. Pasted into a
				<code>.svelte</code> file that is a compile error rather than a rendering glitch.
			</p>
			<p class="prose">
				Hence <code>--charset safe</code>, the full ramp with the two braces removed, so
				the generated file is a valid component as-is. Importing the fragment as a raw
				string and rendering it with <code>{'{@html}'}</code> also works, but Svelte's
				scoped styles do not apply to that content, so the fragment's own style block
				leaks out as a global.
			</p>
		</div>
	</section>

	<!-- Why the art on this site is a build output rather than a keepsake. -->
	<section class="box row">
		<div>
			{@render head('make site', 'The art is a build artifact')}
			<p class="prose">
				One command regenerates every render on this site from its source photograph, and
				the output is deterministic. The art is something the build produces rather than
				something that has to be preserved because nobody could make it again.
			</p>
		</div>

		<dl class="build">
			{#each BUILD as item (item.term)}
				<div><dt>{item.term}</dt><dd>{item.text}</dd></div>
			{/each}
		</dl>
	</section>

	<!-- What it does not do. -->
	<section class="box row">
		<div>
			{@render head('--not-implemented', 'Where it stops')}
			<p class="prose">
				A 667 × 667 source at 400 columns takes about 13 ms, allocates one grid of cells
				plus the decoded image, and is byte-for-byte deterministic. The limits are in the
				rendering, not the speed.
			</p>
		</div>

		<ul class="limits">
			{#each LIMITS as limit (limit.term)}
				<li>
					<span class="mark"><Icon name="warning" /></span>
					<span><strong>{limit.term}:</strong> {limit.text}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	/* The study wears the program's own clothes: sections named as flags, the
	   page kept grey, and the renders the only colour in it. .study, .box,
	   .lede, .thesis, .prose, .foot-note, .arrow and .stage's card are shared
	   across all four studies (app.css) — nothing here needs its own accent,
	   so .study carries no local rule at all. */

	.row {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
		gap: 1.5rem;
		align-items: start;
	}

	.row > div {
		display: grid;
		align-content: start;
		gap: 0.6rem;
	}

	/* The section's name, written as the flag it is. */
	.flag {
		justify-self: start;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.note {
		display: block;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.55;
	}

	/* Same treatment as the shared .prose/.foot-note code (app.css), extended
	   to the other places this study sets code inline. */
	figcaption code,
	.module code,
	.quant code {
		padding: 0.05rem 0.25rem;
		border-radius: var(--radius-control);
		background: color-mix(in srgb, var(--color-foreground) 5%, transparent);
		font-size: 0.95em;
	}

	.mark {
		display: inline-flex;
		flex: none;
		/* -ink: this icon is on the study's light ground and plain --amber
		   measures 1.75:1 there. */
		color: var(--amber-ink);
		font-size: var(--fs-base);
		line-height: 1;
	}

	.scope {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* --- the banner ------------------------------------------------------- */

	.banner {
		grid-template-columns: minmax(0, 1fr) minmax(0, 14rem);
		gap: 1.75rem;
		align-items: start;
	}

	.intro {
		display: grid;
		gap: 0.7rem;
	}

	.install {
		justify-self: start;
		padding: 0.45rem 0.8rem;
		border-radius: var(--radius-control);
		background: var(--color-background);
		color: #d6d5cf;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.spec {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1.4rem;
		margin: 0;
	}

	.spec div {
		display: grid;
		gap: 0.1rem;
	}

	.spec dt {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.spec dd {
		margin: 0;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 600;
	}

	/* The photograph, small and beside the claim — it is the input, not the
	   work. Everything below it is what the program made of it. */
	.source {
		margin: 0;
	}

	.source img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
	}

	.source figcaption {
		margin-top: 0.4rem;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.5;
	}

	/* --- the three renders ------------------------------------------------ */

	.modes {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		align-items: start;
	}

	.render {
		display: grid;
		gap: 0.55rem;
		margin: 0;
	}

	/* The render's own box. It carries no background of its own: these are
	   inverted renders, dark glyphs on a light field, and the card is that
	   field — a panel behind them would be a second one. */
	.art {
		display: grid;
		place-items: center;
		overflow: hidden;
		padding: 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
	}

	.render figcaption {
		display: grid;
		gap: 0.25rem;
	}

	.render figcaption strong {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 700;
	}

	.rule {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	.render figcaption code {
		justify-self: start;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		line-height: 1.5;
	}

	/* --- the pipeline ----------------------------------------------------- */

	.pipeline {
		display: flex;
		flex-wrap: nowrap;
		align-items: stretch;
		gap: 0.4rem;
		overflow-x: auto;
	}

	/* Tighter than the shared card: this pipeline runs more stages in the
	   same row. */
	.stage {
		gap: 0.2rem;
		padding: 0.6rem 0.7rem;
	}

	.stage span {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		line-height: 1.45;
	}

	/* One line per translation unit: the pipeline above, with addresses. */
	.modules {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.2rem 1.5rem;
	}

	.module {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr);
		gap: 0.6rem;
		align-items: baseline;
		padding: 0.25rem 0;
		border-top: var(--rule);
	}

	.module span {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	/* --- code ------------------------------------------------------------- */

	.code {
		margin: 0;
		padding: 0.9rem 1rem;
		overflow-x: auto;
		border-radius: var(--radius-panel);
		background: var(--color-background);
		color: #d6d5cf;
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.75;
	}

	/* --- aspect ----------------------------------------------------------- */

	.aspects {
		display: grid;
		gap: 0.6rem;
	}

	.aspect {
		display: grid;
		grid-template-columns: 9rem auto minmax(0, 1fr);
		gap: 0.75rem;
		align-items: center;
		padding: 0.65rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
	}

	.aspect strong {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-base);
		font-weight: 700;
	}

	/* --- the quantisation table ------------------------------------------- */

	.quant {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	.quant th,
	.quant td {
		padding: 0.4rem 0.6rem 0.4rem 0;
		font-weight: 400;
		text-align: left;
	}

	.quant thead th {
		padding-top: 0;
		color: var(--text-faint);
		font-size: var(--fs-3xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border-bottom: 1px solid var(--color-border);
	}

	.quant tbody td {
		color: var(--color-foreground);
		text-align: right;
	}

	.quant tbody tr + tr th,
	.quant tbody tr + tr td {
		border-top: var(--rule);
	}

	.quant .tag {
		margin-left: 0.4rem;
		color: var(--text-faint);
		font-size: 0.9em;
	}

	/* --- the gotcha ------------------------------------------------------- */

	/* A war story rather than a claim: boxed, so it reads as the aside it is. */
	.gotcha {
		display: grid;
		gap: 0.5rem;
		padding: 0.85rem 0.95rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: color-mix(in srgb, var(--color-foreground) 2%, #fff);
	}

	/* --- the build list --------------------------------------------------- */

	.build {
		display: grid;
		gap: 0.55rem;
		margin: 0;
	}

	.build div {
		display: grid;
		gap: 0.15rem;
	}

	.build dt {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 600;
	}

	.build dd {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.6;
	}

	/* --- limits ----------------------------------------------------------- */

	.limits {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.limits li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.5rem;
		align-items: baseline;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.6;
	}

	.limits strong {
		color: var(--color-foreground);
		font-weight: 600;
	}

	/* --- narrow ----------------------------------------------------------- */

	@media (max-width: 60rem) {
		.row,
		.banner,
		.modules {
			grid-template-columns: minmax(0, 1fr);
		}

		/* The photograph is the input, not the exhibit: it does not get the
		   whole column just because the columns collapsed. */
		.source {
			max-width: 14rem;
		}

		.modes {
			grid-template-columns: minmax(0, 1fr);
		}

		.aspect {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.aspect .scope {
			grid-column: 1 / -1;
		}
	}
</style>
