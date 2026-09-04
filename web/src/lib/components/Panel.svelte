<script>
	/* A labelled block. Every titled part of a dashboard section is one of these:
	   the title is written once, what goes under it is the caller's business, and
	   `tone` is the colour that reading is drawn in throughout — set here rather
	   than on each mark inside, so a panel has one colour and nothing in it has to
	   be told twice.

	   `level` is the heading this panel's own label renders as, in document
	   terms rather than visual ones — every /server route sits it directly under
	   the route's own h2, which is what h3 (the default) is right for. A study's
	   own sections are h2 as well (StudyPage.svelte renders the project name as
	   the h1 above them), so a panel nested in one lands on the same h3. A panel
	   sitting a document level deeper than that passes the level down instead, so
	   the outline stays unbroken however deep the panel sits. The visual size is
	   unaffected either way: --title-size/--title-color already carry that, set
	   by whichever ancestor turns a nested panel down. */
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

	/* What this box is, set to be read at a glance: a step under the section
	   heading above it and a step over the labels on the readings inside it.
	   A panel nested in another is a part of it rather than a peer, so the panel
	   around it turns this down with --title-size and --title-color. Three
	   selectors, not one: `level` (script) picks which heading tag actually
	   renders, and the visual size stays the same whichever it is. */
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
