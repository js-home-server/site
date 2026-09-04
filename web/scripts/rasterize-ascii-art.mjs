#!/usr/bin/env node
/* Flattens the three landing-page ASCII art components (bull, astronaut,
   radio dish) from a few thousand colour spans each into one <img> apiece --
   see the F11 defect log entry. Not part of `npm run build`: this is a dev
   tool you run by hand, same footing as ../asciiArt's own Makefile, and it
   only has anything to do when one of those three files still holds the
   span-per-run markup `make site` (in ../asciiArt) regenerates it back to.

   Usage:  npx --yes -p playwright node scripts/rasterize-ascii-art.mjs
   Needs:  Chromium via Playwright (the npx line above fetches it into a
           temp cache, not a project dependency) and `cwebp` on PATH
           (brew install webp) -- falls back to PNG if cwebp is missing.

   What it does, per component:
     1. Skip if the file has already been rasterised (no <pre> left in it).
     2. Otherwise pull its <style> and <div class="ascii-art"><pre>...</pre>
        markup out, load them in a headless page at a fixed font-size with
        the exact production font (so glyph metrics match), and screenshot
        just the <pre> -- that's the "render it once" the fix calls for.
     3. Re-encode to WebP (falls back to PNG) and drop the asset in
        lib/assets/ascii/, then overwrite the component with the tiny
        img-based version, carrying forward its natural width/height so
        the aspect ratio survives without another render pass. */

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const COMPONENTS = path.join(ROOT, 'src/lib/components');
const ASSETS = path.join(ROOT, 'src/lib/assets/ascii');
const FONT = path.join(
	ROOT,
	'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'
);

// The font-size the art is rasterised at, before the 2x device-scale factor
// below doubles it again. Chosen so the output comfortably out-resolves the
// biggest the art is ever displayed at (see each page's own --cell / cqw
// sizing) without generating an image many times bigger than it needs to be.
const RENDER_PX = 12;
const DEVICE_SCALE = 2;
const WEBP_QUALITY = 85;

const TARGETS = [
	{ name: 'AsciiBull', asset: 'bull' },
	{ name: 'AsciiAstronaut', asset: 'astronaut' },
	{ name: 'AsciiRadioDish', asset: 'radio-dish' }
];

function hasCwebp() {
	try {
		execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

async function rasterise(browser, fontB64, name) {
	const srcPath = path.join(COMPONENTS, `${name}.svelte`);
	const src = readFileSync(srcPath, 'utf8');

	if (!src.includes('<pre>')) {
		console.log(`${name}: already rasterised, skipping`);
		return;
	}

	const m = src.match(/<style>([\s\S]*?)<\/style>\s*(<div class="ascii-art">[\s\S]*<\/div>)\s*$/);
	if (!m) throw new Error(`${name}: couldn't find the <style>/<pre> markup to rasterise`);
	const [, style, markup] = m;

	const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {
  font-family: "JetBrains Mono";
  src: url(data:font/woff2;base64,${fontB64}) format("woff2");
  font-weight: 400;
  font-style: normal;
}
html, body { margin: 0; padding: 0; background: transparent; }
.ascii-art { display: inline-block; }
${style}
.ascii-art pre { font-size: ${RENDER_PX}px !important; }
</style></head><body>${markup}</body></html>`;

	const page = await browser.newPage({
		viewport: { width: 4000, height: 4000 },
		deviceScaleFactor: DEVICE_SCALE
	});
	await page.setContent(html);
	await page.evaluate(() => document.fonts.ready);

	const pre = page.locator('.ascii-art pre');
	mkdirSync(ASSETS, { recursive: true });
	const asset = TARGETS.find((t) => t.name === name).asset;
	const pngPath = path.join(ASSETS, `${asset}.png`);
	await pre.screenshot({ path: pngPath, omitBackground: true });
	await page.close();

	// PNG width/height live at fixed offsets in the IHDR chunk (bytes 16-23),
	// read directly rather than shelling out to a platform-specific tool.
	const head = readFileSync(pngPath).subarray(16, 24);
	const width = head.readUInt32BE(0);
	const height = head.readUInt32BE(4);

	let assetFile = `${asset}.png`;
	if (hasCwebp()) {
		const webpPath = path.join(ASSETS, `${asset}.webp`);
		execFileSync('cwebp', [
			'-q', String(WEBP_QUALITY),
			'-alpha_q', '100',
			'-m', '6',
			pngPath,
			'-o', webpPath
		]);
		execFileSync('rm', [pngPath]);
		assetFile = `${asset}.webp`;
	} else {
		console.warn(`${name}: cwebp not found on PATH -- keeping ${asset}.png (brew install webp for smaller output)`);
	}

	const component = `<script>
	/* Rasterised by scripts/rasterize-ascii-art.mjs -- see F11 in the defect
	   log. Was a few thousand one-character <span>s; this file's job now is
	   just to hand the page a single image and its natural size, so whatever
	   sizing formula the page already has (font-size/cqw tricks replaced by
	   plain width/height or aspect-ratio) keeps working unchanged.
	   Regenerate if ../asciiArt's \`make site\` (or the matching single
	   target) overwrites this file back to span markup: rerun the script
	   above, which detects that and redoes the raster automatically. */
	import art from '$lib/assets/ascii/${assetFile}';
</script>

<div class="ascii-art"><img src={art} width="${width}" height="${height}" alt="" /></div>
`;
	writeFileSync(srcPath, component);
	console.log(`${name}: -> ${assetFile} (${width}x${height})`);
}

const browser = await chromium.launch(
	process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {}
);
const fontB64 = readFileSync(FONT).toString('base64');
for (const { name } of TARGETS) {
	await rasterise(browser, fontB64, name);
}
await browser.close();
