<script>
	/* A live clock drawn the way the rest of this project's art is drawn: JetBrains
	   Mono, one ink colour, digits doing the work. The other pieces are sampled
	   off a photograph; this one has no photograph behind it, so its digits are
	   generated straight from a seven-segment font instead -- each segment a
	   block of the same '8' the photo-derived art treats as full ink.

	   a..g name the segments the standard way: top, top-right, bottom-right,
	   bottom, bottom-left, top-left, middle. */
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

	/* Where each segment's ink falls on a 3-wide x 5-tall grid, as [row, col]
	   cells rather than a row of its own: a corner is one cell, not two, so the
	   top bar's end cell IS the top-left vertical's first cell, not a separate
	   row above it. Three cells down a side (rows 0-2 or 2-4) reads as the same
	   weight of stroke as three along a bar -- which is what 1, 4 and 7 collapsed
	   out of when the sides were one cell tall instead of sharing the corner. */
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

	// Built server-side with no clock to read; the real time takes over once
	// this runs in a browser.
	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(id);
	});

	let timeFormat = $derived(
		new Intl.DateTimeFormat('en-GB', {
			timeZone,
			hour: '2-digit',
			minute: '2-digit',
			second: seconds ? '2-digit' : undefined,
			hour12: false
		})
	);

	let chars = $derived(timeFormat.format(now).split(''));
	/* One text row per glyph row, every character's row of its own glyph joined
	   side by side with a one-space gutter. */
	let lines = $derived(
		Array.from({ length: ROWS }, (_, row) => chars.map((c) => glyph(c)[row]).join(' ')).join('\n')
	);

	/* Three columns a glyph, one gutter between them, no trailing gutter: the
	   same "how wide is one cell" sum every other piece of art on the site
	   works from, just counted from the character string here instead of
	   measured off a generated grid. */
	let cols = $derived(chars.length * 4 - 1);
</script>

<div class="ascii-clock-frame" style="--cols: {cols}">
	<pre class="ascii-clock">{lines}</pre>
</div>

<style>
	/* Sized off the box it sits in exactly like the photo-derived pieces: a
	   character grid has one size, and that size is this container's own width
	   divided by how many of the 0.6021em JetBrains Mono advances span it. */
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
