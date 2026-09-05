import {
	siC,
	siCloudflare,
	siDocker,
	siGit,
	siGithub,
	siJavascript,
	siLinux,
	siMake,
	siNumpy,
	siNvidia,
	siPandas,
	siPlotly,
	siPolars,
	siPrometheus,
	siPython,
	siScikitlearn,
	siSvelte
} from 'simple-icons';

/* The mark in front of a tool's name. Brand ones are simple-icons' single
   24x24 monochrome paths. Five are hand-drawn because no usable mark exists:
   SQL (a bar stack, it's a language not a product), MATLAB (flattened
   silhouette — the real mark is a gradient render), Slurm (a bar-chart
   pyramid), LinkedIn (simple-icons' own last-published path, kept as a
   literal since the package dropped it after a takedown), and Email/CV (Heroicons paths, concatenated to one path each). */
const TABLE = 'M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z';
const MATLAB = 'M2 17 L7 12 L7 20 Z M8 20 L11 5 L13 10 L16 2 L20 12 L22 8 L19 20 L16 12 L13 20 L10 13 Z';
const SLURM =
	'M1 22H4V16H1Z M5.5 22H8.5V11H5.5Z M10 22H14V6H10Z M15 22H18V11H15Z M19.5 22H22.5V16H19.5Z';
const LINKEDIN =
	'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';
const ENVELOPE =
	'M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z ' +
	'M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z';
const CV =
	'M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm5.845 17.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V12a.75.75 0 0 0-1.5 0v4.19l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z ' +
	'M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z';

export const logos = {
	C: siC.path,
	Cloudflare: siCloudflare.path,
	CUDA: siNvidia.path,
	CV,
	Docker: siDocker.path,
	Email: ENVELOPE,
	Git: siGit.path,
	GitHub: siGithub.path,
	JavaScript: siJavascript.path,
	LinkedIn: LINKEDIN,
	Linux: siLinux.path,
	MATLAB,
	Make: siMake.path,
	NumPy: siNumpy.path,
	Pandas: siPandas.path,
	Plotly: siPlotly.path,
	Polars: siPolars.path,
	Prometheus: siPrometheus.path,
	Python: siPython.path,
	SQL: TABLE,
	Slurm: SLURM,
	Svelte: siSvelte.path,
	'scikit-learn': siScikitlearn.path
};

/* Real-world colour for hover only — grey the rest of the time so the row reads as one system. Hand-drawn marks with no brand colour are omitted. */
export const brandColors = {
	C: `#${siC.hex}`,
	Cloudflare: `#${siCloudflare.hex}`,
	CUDA: `#${siNvidia.hex}`,
	Docker: `#${siDocker.hex}`,
	Git: `#${siGit.hex}`,
	JavaScript: `#${siJavascript.hex}`,
	Linux: `#${siLinux.hex}`,
	MATLAB: '#E36C24',
	Make: `#${siMake.hex}`,
	NumPy: `#${siNumpy.hex}`,
	Pandas: `#${siPandas.hex}`,
	Plotly: `#${siPlotly.hex}`,
	Polars: `#${siPolars.hex}`,
	Prometheus: `#${siPrometheus.hex}`,
	Python: `#${siPython.hex}`,
	Slurm: '#3399CC',
	Svelte: `#${siSvelte.hex}`,
	'scikit-learn': `#${siScikitlearn.hex}`
};
