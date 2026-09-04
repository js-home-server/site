#!/usr/bin/env node
/* Flattens the three landing-page ASCII art components (bull, astronaut,
   radio dish) from thousands of colour spans each into one <img> apiece (F11).
   Dev tool, not part of `npm run build` — run by hand whenever `make site` (in
   ../asciiArt) regenerates one of these back to span markup.

   Usage:  npx --yes -p playwright node scripts/rasterize-ascii-art.mjs
   Needs:  Chromium via Playwright (fetched by the npx line, not a project
           dependency) and `cwebp` on PATH (brew install webp; falls back to PNG).

   Per component: skip if already rasterised, else screenshot the <pre> at a
   fixed font-size with the production font, re-encode to WebP, and overwrite
   the component with the tiny img-based version at its natural width/height. */

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
	{ name: 'AsciiBull', asset: 'bull', imgAttrs: 'fetchpriority="high"' },
	{ name: 'AsciiAstronaut', asset: 'astronaut', imgAttrs: 'loading="lazy" decoding="async"' },
	{ name: 'AsciiRadioDish', asset: 'radio-dish', imgAttrs: 'loading="lazy" decoding="async"' }
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

	// PNG width/height live at fixed offsets in the IHDR chunk — read directly instead of shelling out.
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

	const { imgAttrs } = TARGETS.find((t) => t.name === name);
	const component = `<script>
	/* Rasterised by scripts/rasterize-ascii-art.mjs (F11) — was a few thousand
	   one-character spans. If asciiArt's \`make site\` overwrites this back to
	   span markup, rerun the script above; it detects that and re-rasterises. */
	import art from '$lib/assets/ascii/${assetFile}';
</script>

<div class="ascii-art"><img src={art} width="${width}" height="${height}" alt="" ${imgAttrs} /></div>
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
