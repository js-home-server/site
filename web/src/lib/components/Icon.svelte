<script>
	import { icons } from '$lib/icons.js';

	/* 1em, same contract as Logo.svelte. Decorative — always paired with words. */
	let { name } = $props();
</script>

{#if icons[name]}<span class="icon" aria-hidden="true">{@html icons[name]}</span>{/if}

<style>
	.icon {
		display: inline-flex;
		flex: none;
		width: 1em;
		height: 1em;
	}

	.icon :global(svg) {
		width: 100%;
		height: 100%;
		stroke: currentcolor;
	}
</style>
