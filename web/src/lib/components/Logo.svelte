<script>
	import { logos } from '$lib/logos.js';

	/* A tool's mark, set at the size of the type it stands in front of. Decorative
	   — the name is written beside it — and nothing is drawn for a tool with no
	   mark to draw. */
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
