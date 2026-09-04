<script>
	/* A labelled block. `tone` sets the colour once here, not on each mark inside.
	   `level` is the heading tag in document terms, not visual ones — h3 default
	   fits directly under a route/study's h2; a deeper panel passes a higher
	   level down to keep the outline unbroken. Visual size is unaffected either way (--title-size/--title-color). */
	let { label, tone, level = 3, children } = $props();
</script>

<div class="panel" style:color={tone}>
	{#if label}<svelte:element this={`h${level}`}>{label}</svelte:element>{/if}
	{@render children()}
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* A step under the section heading, a step over the reading labels inside.
	   Three selectors since `level` (script) picks which heading tag renders — visual size stays the same regardless. */
	h3,
	h4,
	h5 {
		margin: 0;
		color: var(--title-color, var(--color-foreground));
		font-family: var(--font-mono);
		font-size: var(--title-size, var(--fs-xs));
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
</style>
