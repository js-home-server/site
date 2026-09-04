<script>
	/* The kicker/title/lede a study's every section opens on -- previously
	   redeclared near-identically in all four study files, differing only in
	   the small tag before the title (a plain .kicker, AsciiStudy's .flag, or
	   OrderflowStudy's two-tone .track pill). .lede, .lede h2 and .prose are
	   the shared classes app.css already styles; this component only owns the
	   structure and which class the tag itself wears. */
	let { label, title, lede, tagClass = 'kicker', tagModifier } = $props();
</script>

<div class="lede">
	<span class={tagModifier ? `${tagClass} ${tagModifier}` : tagClass}>{label}</span>
	<h2>{title}</h2>
	{#if lede}<p class="prose">{lede}</p>{/if}
</div>
