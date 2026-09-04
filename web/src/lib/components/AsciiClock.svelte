<script>
	import { ticking } from '$lib/clock.svelte.js';

	/* Same look as the rest of the site's art (JetBrains Mono, one ink colour),
	   but no photograph behind it — digits are generated from a seven-segment
	   font instead. a..g name segments the standard way: top, top-right, bottom-right, bottom, bottom-left, top-left, middle. */
	let { timeZone = 'UTC', seconds = true } = $props();

	const DIGITS = {
		0: 'abcdef',
		1: 'bc',
		2: 'abged',
		3: 'abgcd',
		4: 'fgbc',
		5: 'afgcd',
		6: 'afgecd',
		7: 'abc',
		8: 'abcdefg',
		9: 'abcdfg'
	};

	const FILL = '8';
	const ROWS = 5;
	const COLS = 3;

	/* 3x5 grid, [row, col] cells. Corners are shared, not duplicated — a bar's end
	   cell IS the vertical's first cell, so a 3-cell side reads as the same stroke weight as a 3-cell bar. */
	const SEGMENTS = {
		a: [[0, 0], [0, 1], [0, 2]],
		f: [[0, 0], [1, 0], [2, 0]],
		b: [[0, 2], [1, 2], [2, 2]],
		g: [[2, 0], [2, 1], [2, 2]],
		e: [[2, 0], [3, 0], [4, 0]],
		c: [[2, 2], [3, 2], [4, 2]],
		d: [[4, 0], [4, 1], [4, 2]]
	};

	function glyph(char) {
		const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

		if (char === ':') {
			grid[1][1] = true;
			grid[3][1] = true;
		} else {
			for (const seg of DIGITS[char] ?? '') {
				for (const [row, col] of SEGMENTS[seg]) grid[row][col] = true;
			}
		}

		return grid.map((row) => row.map((on) => (on ? FILL : ' ')).join(''));
	}

	/* Every second, since the digits below show them. */
	const clock = ticking(1000);

	let timeFormat = $derived(
		new Intl.DateTimeFormat('en-GB', {
			timeZone,
			hour: '2-digit',
			minute: '2-digit',
			second: seconds ? '2-digit' : undefined,
			hour12: false
		})
	);

	let chars = $derived(timeFormat.format(clock.now).split(''));
	/* One text row per glyph row, each character's row joined side by side with a one-space gutter. */
	let lines = $derived(
		Array.from({ length: ROWS }, (_, row) => chars.map((c) => glyph(c)[row]).join(' ')).join('\n')
	);

	/* Same "cell width" sum every other art piece uses, counted from the character string instead of a generated grid. */
	let cols = $derived(chars.length * 4 - 1);
</script>

<div class="ascii-clock-frame" style="--cols: {cols}">
	<pre class="ascii-clock">{lines}</pre>
</div>

<style>
	/* Sized like the photo-derived pieces — container width divided by how many 0.6021em advances span it. */
	.ascii-clock-frame {
		container-type: inline-size;
	}

	.ascii-clock {
		margin: 0;
		color: var(--mint);
		font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
		font-size: calc(100cqw / (var(--cols) * 0.6021));
		line-height: 1.15;
		letter-spacing: 0;
		white-space: pre;
	}
</style>
