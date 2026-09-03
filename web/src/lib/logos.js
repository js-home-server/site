import {
	siCloudflare,
	siCplusplus,
	siDocker,
	siGrafana,
	siGit,
	siGithub,
	siJavascript,
	siLinux,
	siNumpy,
	siNvidia,
	siPandas,
	siPlotly,
	siPolars,
	siPrometheus,
	siPytorch,
	siPython,
	siScikitlearn,
	siSvelte,
	siTensorflow
} from 'simple-icons';

/* The mark that goes in front of a tool's name. The brand ones come from
   simple-icons, which ships each as a single 24x24 path meant to be filled in
   one colour — which is what a monochrome page wants anyway.

   The five below are drawn here because no brand mark exists to use: a stack
   of bars for SQL, which is a language rather than a product, a flattened
   silhouette of the folded-ribbon/peak MathWorks logo for MATLAB (whose real
   mark is a full-colour gradient render no single-colour path can match), a
   bar-chart pyramid standing in for Slurm's rounded-square skyline, a plain
   ring for anything else without one, LinkedIn's own badge -- carried here as
   a literal path rather than a package import because simple-icons dropped
   the mark after a takedown request; this is simple-icons' own last
   published 24x24 LinkedIn path (MIT-licensed), not a redrawing -- and a
   plain envelope for email, Heroicons' 24px solid mark (already a dependency
   for the about page's category icons), concatenated from its two subpaths
   since this component takes a single path -- and a document with a download
   arrow for the CV, the same Heroicons set's document-arrow-down, also
   concatenated from its two subpaths. */
const TABLE = 'M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z';
const MATLAB = 'M2 17 L7 12 L7 20 Z M8 20 L11 5 L13 10 L16 2 L20 12 L22 8 L19 20 L16 12 L13 20 L10 13 Z';
const SLURM =
	'M1 22H4V16H1Z M5.5 22H8.5V11H5.5Z M10 22H14V6H10Z M15 22H18V11H15Z M19.5 22H22.5V16H19.5Z';
const RING = 'M4 4h16v16H4zM7 17h10V7H7z';
const LINKEDIN =
	'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';
const ENVELOPE =
	'M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z ' +
	'M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z';
const CV =
	'M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm5.845 17.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V12a.75.75 0 0 0-1.5 0v4.19l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z ' +
	'M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z';
/* The three system cards under "This server" (Projects.svelte). Heroicons'
   solid 24px signal, server-stack and globe-alt marks, concatenated the same
   way CV and ENVELOPE above are — this component takes one path, and a mark
   drawn as two only needs both wound the way the source SVG had them. */
const SIGNAL =
	'M5.636 4.575a.75.75 0 0 1 0 1.061 9 9 0 0 0 0 12.728.75.75 0 1 1-1.06 1.06c-4.101-4.1-4.101-10.748 0-14.849a.75.75 0 0 1 1.06 0Zm12.728 0a.75.75 0 0 1 1.06 0c4.101 4.1 4.101 10.75 0 14.85a.75.75 0 1 1-1.06-1.061 9 9 0 0 0 0-12.728.75.75 0 0 1 0-1.06ZM7.757 6.697a.75.75 0 0 1 0 1.06 6 6 0 0 0 0 8.486.75.75 0 0 1-1.06 1.06 7.5 7.5 0 0 1 0-10.606.75.75 0 0 1 1.06 0Zm8.486 0a.75.75 0 0 1 1.06 0 7.5 7.5 0 0 1 0 10.606.75.75 0 0 1-1.06-1.06 6 6 0 0 0 0-8.486.75.75 0 0 1 0-1.06ZM9.879 8.818a.75.75 0 0 1 0 1.06 3 3 0 0 0 0 4.243.75.75 0 1 1-1.061 1.061 4.5 4.5 0 0 1 0-6.364.75.75 0 0 1 1.06 0Zm4.242 0a.75.75 0 0 1 1.061 0 4.5 4.5 0 0 1 0 6.364.75.75 0 0 1-1.06-1.06 3 3 0 0 0 0-4.243.75.75 0 0 1 0-1.061ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z';
const SERVER_STACK =
	'M5.507 4.048A3 3 0 0 1 7.785 3h8.43a3 3 0 0 1 2.278 1.048l1.722 2.008A4.533 4.533 0 0 0 19.5 6h-15c-.243 0-.482.02-.715.056l1.722-2.008Z ' +
	'M1.5 10.5a3 3 0 0 1 3-3h15a3 3 0 1 1 0 6h-15a3 3 0 0 1-3-3Zm15 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm2.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.5 15a3 3 0 1 0 0 6h15a3 3 0 1 0 0-6h-15Zm11.25 3.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM19.5 18a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z';
const GLOBE =
	'M21.721 12.752a9.711 9.711 0 0 0-.945-5.003 12.754 12.754 0 0 1-4.339 2.708 18.991 18.991 0 0 1-.214 4.772 17.165 17.165 0 0 0 5.498-2.477ZM14.634 15.55a17.324 17.324 0 0 0 .332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 0 0 .332 4.647 17.385 17.385 0 0 0 5.268 0ZM9.772 17.119a18.963 18.963 0 0 0 4.456 0A17.182 17.182 0 0 1 12 21.724a17.18 17.18 0 0 1-2.228-4.605ZM7.777 15.23a18.87 18.87 0 0 1-.214-4.774 12.753 12.753 0 0 1-4.34-2.708 9.711 9.711 0 0 0-.944 5.004 17.165 17.165 0 0 0 5.498 2.477ZM21.356 14.752a9.765 9.765 0 0 1-7.478 6.817 18.64 18.64 0 0 0 1.988-4.718 18.627 18.627 0 0 0 5.49-2.098ZM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 0 0 1.988 4.718 9.765 9.765 0 0 1-7.478-6.816ZM13.878 2.43a9.755 9.755 0 0 1 6.116 3.986 11.267 11.267 0 0 1-3.746 2.504 18.63 18.63 0 0 0-2.37-6.49ZM12 2.276a17.152 17.152 0 0 1 2.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0 1 12 2.276ZM10.122 2.43a18.629 18.629 0 0 0-2.37 6.49 11.266 11.266 0 0 1-3.746-2.504 9.754 9.754 0 0 1 6.116-3.985Z';

export const logos = {
	'C++': siCplusplus.path,
	Cloudflare: siCloudflare.path,
	CUDA: siNvidia.path,
	CV,
	Docker: siDocker.path,
	Email: ENVELOPE,
	Git: siGit.path,
	GitHub: siGithub.path,
	Globe: GLOBE,
	Grafana: siGrafana.path,
	JavaScript: siJavascript.path,
	LinkedIn: LINKEDIN,
	Linux: siLinux.path,
	MATLAB,
	NumPy: siNumpy.path,
	Pandas: siPandas.path,
	Plotly: siPlotly.path,
	Polars: siPolars.path,
	Prometheus: siPrometheus.path,
	PyTorch: siPytorch.path,
	Python: siPython.path,
	Server: SERVER_STACK,
	Signal: SIGNAL,
	SQL: TABLE,
	Slurm: SLURM,
	Svelte: siSvelte.path,
	TensorFlow: siTensorflow.path,
	'scikit-learn': siScikitlearn.path
};

/* Each mark's real-world colour, for the hover state — grey the rest of the
   time so the row reads as one system, brand-coloured only under the
   pointer. The two hand-drawn marks have no brand colour to switch to. */
export const brandColors = {
	'C++': `#${siCplusplus.hex}`,
	Cloudflare: `#${siCloudflare.hex}`,
	CUDA: `#${siNvidia.hex}`,
	Docker: `#${siDocker.hex}`,
	Git: `#${siGit.hex}`,
	Grafana: `#${siGrafana.hex}`,
	JavaScript: `#${siJavascript.hex}`,
	Linux: `#${siLinux.hex}`,
	MATLAB: '#E36C24',
	NumPy: `#${siNumpy.hex}`,
	Pandas: `#${siPandas.hex}`,
	Plotly: `#${siPlotly.hex}`,
	Polars: `#${siPolars.hex}`,
	Prometheus: `#${siPrometheus.hex}`,
	PyTorch: `#${siPytorch.hex}`,
	Python: `#${siPython.hex}`,
	Slurm: '#3399CC',
	Svelte: `#${siSvelte.hex}`,
	TensorFlow: `#${siTensorflow.hex}`,
	'scikit-learn': `#${siScikitlearn.hex}`
};
