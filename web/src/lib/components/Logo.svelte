<script>
	import { logos } from '$lib/logos.js';

	/* Decorative — the name is written beside it. Nothing drawn if there's no mark. */
	let { name } = $props();
</script>

{#if logos[name]}
	<svg viewBox="0 0 24 24" aria-hidden="true"><path d={logos[name]} /></svg>
{/if}

<style>
	svg {
		flex: none;
		width: 1em;
		height: 1em;
		fill: currentcolor;
	}
</style>
