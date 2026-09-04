<script>
	/* `lines` roughly matches the real thing's height, so the wireframe holds shape. Dashed, so nothing reads as finished work. */
	let { note, lines = 1 } = $props();
</script>

<div class="placeholder" style="--lines: {lines}"><span>{note}</span></div>

<style>
	/* Four dotted edges, not a dotted border — a 1px dotted border just reads as a line. */
	.placeholder {
		display: grid;
		place-items: center;
		min-height: calc(var(--lines) * 1.4rem);
		color: var(--color-border);
		background-color: color-mix(in srgb, var(--color-foreground) 2%, transparent);
		background-image: var(--dot-row), var(--dot-row), var(--dot-column), var(--dot-column);
		background-position: 0 0, 0 100%, 0 0, 100% 0;
		background-repeat: no-repeat;
		background-size: 100% 1px, 100% 1px, 1px 100%, 1px 100%;
	}

	/* No opacity on top — --text-faint already clears AA, dimming further would fail it. */
	span {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.1em;
	}
</style>
