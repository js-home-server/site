<script>
	/* A labelled block. Every titled part of a dashboard section is one of these:
	   the title is written once, what goes under it is the caller's business, and
	   `tone` is the colour that reading is drawn in throughout — set here rather
	   than on each mark inside, so a panel has one colour and nothing in it has to
	   be told twice. */
	let { label, tone, children } = $props();
</script>

<div class="panel" style:color={tone}>
	{#if label}<h3>{label}</h3>{/if}
	{@render children()}
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* What this box is, set to be read at a glance: a step under the section
	   heading above it and a step over the labels on the readings inside it.
	   A panel nested in another is a part of it rather than a peer, so the panel
	   around it turns this down with --title-size and --title-color. */
	h3 {
		margin: 0;
		color: var(--title-color, var(--color-foreground));
		font-size: var(--title-size, 0.88rem);
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
</style>
