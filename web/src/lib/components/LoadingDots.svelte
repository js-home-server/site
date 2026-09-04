<!-- Three dots bobbing in sequence — pure decoration next to "Checking…"-style text, so it's aria-hidden and the words alone carry the meaning. -->
<span class="loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>

<style>
	.loading-dots {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.2em;
		height: 1em;
	}

	.loading-dots i {
		display: block;
		width: 0.25em;
		height: 0.25em;
		border-radius: 50%;
		background: currentcolor;
		animation: bob 1s ease-in-out infinite;
	}

	.loading-dots i:nth-child(2) {
		animation-delay: 0.15s;
	}

	.loading-dots i:nth-child(3) {
		animation-delay: 0.3s;
	}

	@keyframes bob {
		0%,
		80%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-0.3em);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading-dots i {
			animation: none;
		}
	}
</style>
