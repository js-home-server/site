<script>
	import { RANGE } from '$lib/server.svelte.js';

	/* The x axis every graph on the dashboard shares: the far end of the window on
	   the left, the present on the right, which is the direction they are read in.
	   The span comes from the same constant the request uses. */
	let { range = RANGE } = $props();
</script>

<span class="window"><span>{range}</span><span>Now</span></span>

<style>
	.window {
		display: flex;
		justify-content: space-between;
		color: var(--text-faint);
		font-size: 0.55rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		line-height: 1;
		text-transform: uppercase;
	}
</style>
