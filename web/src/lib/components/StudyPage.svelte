<script>
	/* The frame every case-study route shares: the light "datasheet" ground
	   the studies were built against (app.css's .projects, the same shadow the
	   projects box wears), the page's own title, and the one way back.

	   The title is rendered, not only stamped into <head>: a study reached from
	   search or a shared link used to open on a back-link and a thesis, with the
	   project's name nowhere on the page. It is also the document's h1 — the
	   studies' own section headings hang off it at h2, so the outline starts at
	   the top rather than at level four. */
	import ActionLink from './ActionLink.svelte';

	let { title, year, children } = $props();
</script>

<svelte:head>
	<title>{title} — Joshua Smith</title>
</svelte:head>

<section class="page study-page">
	<div class="surface-box projects">
		<header class="study-head">
			<ActionLink direction="back" href="/#projects">All projects</ActionLink>
			<h1>{title}</h1>
			{#if year}<p class="year">{year}</p>{/if}
		</header>
		{@render children()}
	</div>
</section>

<style>
	.study-page {
		padding-top: clamp(1.5rem, 4vh, 3rem);
	}

	/* The back link on its own line, then the name with its year sat on the
	   same baseline off to the right — the pair the project card leads with
	   (Projects.svelte's own .identity), read here as the page's masthead. */
	.study-head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 0.9rem 1rem;
		margin-bottom: 1.25rem;
	}

	/* The .projects paper shadow this wears is app.css's, shared with the
	   projects box these studies open out of.

	   ActionLink's own hover/focus reads --focus-ring, which that shadows to
	   --mint-ink. The gap above is what sets it off the name now, in place of
	   the margin this used to carry — a global rule that reached every back
	   link on the page rather than this one. */
	.study-head :global(.action-link.back) {
		grid-column: 1 / -1;
	}

	/* The size the site's own section headings are set at (.section-title,
	   app.css): this is the page's title, and a study's sections read one step
	   under it. */
	h1 {
		margin: 0;
		color: var(--color-foreground);
		font-size: var(--fs-h2);
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.1;
		text-wrap: balance;
	}

	/* Same voice as the card's own meta line. */
	.year {
		margin: 0;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		letter-spacing: 0.12em;
	}
</style>
