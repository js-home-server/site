/* Heroicons' 24px outline marks, imported as their own files rather than
   re-typed as paths the way logos.js has to carry them: these are stroke
   drawings of two or three subpaths each, not a single fillable path, so the
   whole <svg> is what gets used. Everything here is a generic mark — a clock,
   a globe, a warning — brand marks stay in logos.js. */
import adjustments from 'heroicons/24/outline/adjustments-horizontal.svg?raw';
import book from 'heroicons/24/outline/book-open.svg?raw';
import chart from 'heroicons/24/outline/chart-bar-square.svg?raw';
import clock from 'heroicons/24/outline/clock.svg?raw';
import code from 'heroicons/24/outline/code-bracket.svg?raw';
import cube from 'heroicons/24/outline/cube.svg?raw';
import cubes from 'heroicons/24/outline/square-3-stack-3d.svg?raw';
import database from 'heroicons/24/outline/circle-stack.svg?raw';
import exporters from 'heroicons/24/outline/clipboard-document-list.svg?raw';
import external from 'heroicons/24/outline/arrow-top-right-on-square.svg?raw';
import globe from 'heroicons/24/outline/globe-alt.svg?raw';
import hexagon from 'heroicons/24/outline/cube-transparent.svg?raw';
import machine from 'heroicons/24/outline/server-stack.svg?raw';
import pin from 'heroicons/24/outline/map-pin.svg?raw';
import pulse from 'heroicons/24/outline/heart.svg?raw';
import rocket from 'heroicons/24/outline/rocket-launch.svg?raw';
import shield from 'heroicons/24/outline/shield-check.svg?raw';
import star from 'heroicons/24/outline/star.svg?raw';
import target from 'heroicons/24/outline/viewfinder-circle.svg?raw';
import warning from 'heroicons/24/outline/exclamation-triangle.svg?raw';
import window_ from 'heroicons/24/outline/window.svg?raw';
import wrench from 'heroicons/24/outline/wrench-screwdriver.svg?raw';

export const icons = {
	adjustments,
	book,
	chart,
	clock,
	code,
	cube,
	cubes,
	database,
	exporters,
	external,
	globe,
	hexagon,
	machine,
	pin,
	pulse,
	rocket,
	shield,
	star,
	target,
	warning,
	window: window_,
	wrench
};
