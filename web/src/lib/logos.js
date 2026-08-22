import {
	siCplusplus,
	siDocker,
	siGit,
	siJavascript,
	siLinux,
	siNumpy,
	siNvidia,
	siPandas,
	siPlotly,
	siPolars,
	siPytorch,
	siPython,
	siScikitlearn,
	siSvelte,
	siTensorflow
} from 'simple-icons';

/* The mark that goes in front of a tool's name. The brand ones come from
   simple-icons, which ships each as a single 24x24 path meant to be filled in
   one colour — which is what a monochrome page wants anyway.

   The four below are drawn here because no brand mark exists to use: a stack
   of bars for SQL, which is a language rather than a product, a flattened
   silhouette of the folded-ribbon/peak MathWorks logo for MATLAB (whose real
   mark is a full-colour gradient render no single-colour path can match), a
   bar-chart pyramid standing in for Slurm's rounded-square skyline, and a
   plain ring for anything else without one. */
const TABLE = 'M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z';
const MATLAB = 'M2 17 L7 12 L7 20 Z M8 20 L11 5 L13 10 L16 2 L20 12 L22 8 L19 20 L16 12 L13 20 L10 13 Z';
const SLURM =
	'M1 22H4V16H1Z M5.5 22H8.5V11H5.5Z M10 22H14V6H10Z M15 22H18V11H15Z M19.5 22H22.5V16H19.5Z';
const RING = 'M4 4h16v16H4zM7 17h10V7H7z';

export const logos = {
	'C++': siCplusplus.path,
	CUDA: siNvidia.path,
	Docker: siDocker.path,
	Git: siGit.path,
	JavaScript: siJavascript.path,
	Linux: siLinux.path,
	MATLAB,
	NumPy: siNumpy.path,
	Pandas: siPandas.path,
	Plotly: siPlotly.path,
	Polars: siPolars.path,
	PyTorch: siPytorch.path,
	Python: siPython.path,
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
	CUDA: `#${siNvidia.hex}`,
	Docker: `#${siDocker.hex}`,
	Git: `#${siGit.hex}`,
	JavaScript: `#${siJavascript.hex}`,
	Linux: `#${siLinux.hex}`,
	MATLAB: '#E36C24',
	NumPy: `#${siNumpy.hex}`,
	Pandas: `#${siPandas.hex}`,
	Plotly: `#${siPlotly.hex}`,
	Polars: `#${siPolars.hex}`,
	PyTorch: `#${siPytorch.hex}`,
	Python: `#${siPython.hex}`,
	Slurm: '#3399CC',
	Svelte: `#${siSvelte.hex}`,
	TensorFlow: `#${siTensorflow.hex}`,
	'scikit-learn': `#${siScikitlearn.hex}`
};

/* Where a click on the pill should land. */
export const websites = {
	'C++': 'https://isocpp.org',
	CUDA: 'https://developer.nvidia.com/cuda-zone',
	Docker: 'https://www.docker.com',
	Git: 'https://git-scm.com',
	JavaScript: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
	Linux: 'https://www.kernel.org',
	MATLAB: 'https://www.mathworks.com/products/matlab.html',
	NumPy: 'https://numpy.org',
	Pandas: 'https://pandas.pydata.org',
	Plotly: 'https://plotly.com',
	Polars: 'https://pola.rs',
	PyTorch: 'https://pytorch.org',
	Python: 'https://www.python.org',
	SQL: 'https://en.wikipedia.org/wiki/SQL',
	Slurm: 'https://slurm.schedmd.com',
	Svelte: 'https://svelte.dev',
	TensorFlow: 'https://www.tensorflow.org',
	'scikit-learn': 'https://scikit-learn.org'
};
