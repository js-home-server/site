<script>
	/* Rasterised by scripts/rasterize-ascii-art.mjs -- see F11 in the defect
	   log. Was a few thousand one-character <span>s; this file's job now is
	   just to hand the page a single image and its natural size, so whatever
	   sizing formula the page already has (font-size/cqw tricks replaced by
	   plain width/height or aspect-ratio) keeps working unchanged.
	   Regenerate if ../asciiArt's `make site` (or the matching single
	   target) overwrites this file back to span markup: rerun the script
	   above, which detects that and redoes the raster automatically. */
	import art from '$lib/assets/ascii/astronaut.webp';
</script>

<div class="ascii-art"><img src={art} width="880" height="1984" alt="" /></div>
