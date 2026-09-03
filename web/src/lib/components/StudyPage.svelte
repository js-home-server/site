<script>
	/* The frame every case-study route shares: the light "datasheet" ground
	   the studies were built against (Projects.svelte shadows the same tokens
	   for the accordion this content used to live in), and the one way back. */
	import ActionLink from './ActionLink.svelte';

	let { title, children } = $props();
</script>

<svelte:head>
	<title>{title} — Joshua Smith</title>
</svelte:head>

<section class="page study-page">
	<div class="surface-box projects">
		<ActionLink direction="back" href="/#projects">All projects</ActionLink>
		{@render children()}
	</div>
</section>

<style>
	.study-page {
		padding-top: clamp(1.5rem, 4vh, 3rem);
	}

	/* Copied from Projects.svelte's own .projects shadow rather than shared,
	   since a scoped rule cannot reach across components — this is the one
	   other place a study's tokens need to resolve the same way. */
	.projects {
		--color-foreground: #0b0b0b;
		--color-border: #c9c8c0;
		--text-dim: #55544f;
		--text-faint: #6b6a64;
		--focus-ring: var(--mint-ink);

		border-color: #e1e0d9;
		background: #f9f9f7;
		color: var(--color-foreground);
	}

	/* ActionLink's own hover/focus reads --focus-ring, already shadowed to
	   --mint-ink by .projects above. */
	:global(.action-link.back) {
		margin-bottom: 1.25rem;
	}
</style>
