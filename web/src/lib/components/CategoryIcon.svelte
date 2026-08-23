<script>
	import { categoryIcons } from '$lib/icons.js';

	/* A category's mark, sized to fill whatever box it is put in. Decorative —
	   the category is named beside it — and nothing is drawn for one with no
	   mark to draw. */
	let { category } = $props();
</script>

{#if categoryIcons[category]}
	<svg viewBox="0 0 24 24" aria-hidden="true">
		{#each categoryIcons[category] as { d, fillRule } (d)}
			<path {d} fill-rule={fillRule} clip-rule={fillRule} />
		{/each}
	</svg>
{/if}

<style>
	svg {
		flex: none;
		width: 100%;
		height: 100%;
		fill: currentcolor;
	}
</style>
