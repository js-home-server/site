<script>
	/* Shared frame for every case-study route: the light "datasheet" ground
	   (app.css's .projects), the title, and the way back. Title is rendered, not
	   just stamped into <head> — a study opened from search used to show no
	   project name on the page at all. Also the doc's h1, so study sections hang off it at h2. */
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

	/* Back link on its own line, name + year on a shared baseline — the same pair the project card leads with (Projects.svelte's .identity). */
	.study-head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 0.9rem 1rem;
		margin-bottom: 1.25rem;
	}

	/* The gap above sets this off from the name, replacing a margin that used to be a global rule hitting every back link on the page. */
	.study-head :global(.action-link.back) {
		grid-column: 1 / -1;
	}

	/* Same size as .section-title (app.css) — this is the page title, sections read one step under it. */
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
