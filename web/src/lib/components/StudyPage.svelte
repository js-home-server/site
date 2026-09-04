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

	/* The .projects paper shadow this wears is app.css's, shared with the
	   projects box these studies open out of.

	   ActionLink's own hover/focus reads --focus-ring, which that shadows to
	   --mint-ink. */
	:global(.action-link.back) {
		margin-bottom: 1.25rem;
	}
</style>
