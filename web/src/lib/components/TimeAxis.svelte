<script>
	import { RANGE } from '$lib/server.svelte.js';

	/* The x axis every graph on the dashboard shares: the far end of the window on
	   the left, the present on the right, which is the direction they are read in,
	   and the halfway mark between them. The span comes from the same constant the
	   request uses, and the mark is counted off it, so no chart can label a window
	   the request did not make or spell one two ways. */
	let { range = RANGE } = $props();

	let stops = $derived.by(() => {
		const [, size, unit] = range.match(/^(\d+)(\w+)$/) ?? [];
		if (!size) return [range, 'Now'];

		return [`${size}${unit} ago`, `${Math.round(size / 2)}${unit}`, 'Now'];
	});
</script>

<span class="window">
	{#each stops as stop (stop)}<span>{stop}</span>{/each}
</span>

<style>
	.window {
		display: flex;
		justify-content: space-between;
		color: var(--text-faint);
		font-size: var(--fs-3xs);
		font-weight: 500;
		letter-spacing: 0.12em;
		line-height: 1;
		text-transform: uppercase;
	}

	/* The three stops measure 91px of text; under a box that can hold them with air
	   between, they run together into one word and the axis stops being readable at
	   all. It falls back to its two ends, which is what it has to say. No chart on
	   the dashboard is currently this narrow — this is here because the axis is
	   shared and a caller can put it in a box of any width. */
	@container (max-width: 7rem) {
		.window span:not(:first-child):not(:last-child) {
			display: none;
		}
	}
</style>
