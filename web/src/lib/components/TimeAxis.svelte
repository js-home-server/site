<script>
	import { RANGE } from '$lib/server.svelte.js';

	/* Shared x axis: window start, midpoint, now. Span comes from the same constant the request uses, so no chart can label a window it didn't get. */
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
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.12em;
		line-height: 1;
		text-transform: uppercase;
	}

	/* The three stops need ~91px of air; below that they run together into one
	   word. Falls back to the two ends. Nothing on the dashboard is this narrow yet, but the axis is shared and any caller could be. */
	@container (max-width: 7rem) {
		.window span:not(:first-child):not(:last-child) {
			display: none;
		}
	}
</style>
