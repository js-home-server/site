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

   The two below are drawn here because no brand mark exists to use: a stack of
   bars for SQL, which is a language rather than a product, and a plain ring for
   anything else without one. */
const TABLE = 'M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z';
const RING = 'M4 4h16v16H4zM7 17h10V7H7z';

export const logos = {
	'C++': siCplusplus.path,
	CUDA: siNvidia.path,
	Docker: siDocker.path,
	Git: siGit.path,
	JavaScript: siJavascript.path,
	Linux: siLinux.path,
	MATLAB: RING,
	NumPy: siNumpy.path,
	Pandas: siPandas.path,
	Plotly: siPlotly.path,
	Polars: siPolars.path,
	PyTorch: siPytorch.path,
	Python: siPython.path,
	SQL: TABLE,
	Slurm: RING,
	Svelte: siSvelte.path,
	TensorFlow: siTensorflow.path,
	'scikit-learn': siScikitlearn.path
};
