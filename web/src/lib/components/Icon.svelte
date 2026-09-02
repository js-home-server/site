<script>
	import { icons } from '$lib/icons.js';

	/* A generic outline mark, set at the size of whatever it stands in — 1em,
	   the same contract Logo.svelte has for brand marks. Decorative: everything
	   one of these sits beside is also written out in words. */
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
