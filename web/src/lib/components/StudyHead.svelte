<script>
	/* Kicker/title/lede every study section opens on — used to be redeclared in
	   all four study files, differing only in the tag class (.kicker, .flag, .track). */
	let { label, title, lede, tagClass = 'kicker', tagModifier } = $props();
</script>

<div class="lede">
	<span class={tagModifier ? `${tagClass} ${tagModifier}` : tagClass}>{label}</span>
	<h2>{title}</h2>
	{#if lede}<p class="prose">{lede}</p>{/if}
</div>
