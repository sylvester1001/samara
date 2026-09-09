<script lang="ts">
	const SLICE_MS = 320;

	interface Props {
		type: 'row' | 'col';
		headerW: number;
		headerH: number;
	}

	let { type, headerW, headerH }: Props = $props();

	let fillEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const fill = fillEl;
		if (!fill) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		fill.style.opacity = '1';

		const fillAnim = fill.animate(
			[
				{ opacity: 1, offset: 0, easing: 'step-end' },
				{ opacity: 1, offset: 0.42, easing: 'cubic-bezier(0, 0.55, 0.45, 1)' },
				{ opacity: 0, offset: 1 }
			],
			{ duration: SLICE_MS, fill: 'forwards' }
		);

		return () => {
			fillAnim.cancel();
		};
	});
</script>

<div
	class="slice-fx"
	class:slice-fx-row={type === 'row'}
	class:slice-fx-col={type === 'col'}
	aria-hidden="true"
>
	<div class="slice-fill" bind:this={fillEl}></div>
	<div class="slice-lock" style:width="{headerW}px" style:height="{headerH}px">
		<span class="slice-mark slice-mark-tl"></span>
		<span class="slice-mark slice-mark-tr"></span>
		<span class="slice-mark slice-mark-bl"></span>
		<span class="slice-mark slice-mark-br"></span>
	</div>
</div>

<style>
	.slice-fx {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
		--slice-c: var(--cobalt, #0202f1);
	}

	.slice-fill {
		position: absolute;
		inset: 0;
		opacity: 0;
		background: var(--cobalt-subtle, rgba(2, 2, 241, 0.08));
	}

	.slice-lock {
		position: absolute;
		top: 0;
		left: 0;
		overflow: visible;
	}

	.slice-mark {
		position: absolute;
		box-sizing: border-box;
		width: 5px;
		height: 5px;
	}

	.slice-mark-tl {
		top: -1px;
		left: -1px;
		border-top: 1.5px solid var(--slice-c);
		border-left: 1.5px solid var(--slice-c);
		animation:
			slice-mark-in-tl 80ms cubic-bezier(0.16, 1, 0.3, 1) both,
			slice-mark-out 80ms 180ms ease-in forwards;
	}

	.slice-mark-tr {
		top: -1px;
		right: -1px;
		border-top: 1.5px solid var(--slice-c);
		border-right: 1.5px solid var(--slice-c);
		animation:
			slice-mark-in-tr 80ms 16ms cubic-bezier(0.16, 1, 0.3, 1) both,
			slice-mark-out 80ms 180ms ease-in forwards;
	}

	.slice-mark-bl {
		bottom: -1px;
		left: -1px;
		border-bottom: 1.5px solid var(--slice-c);
		border-left: 1.5px solid var(--slice-c);
		animation:
			slice-mark-in-bl 80ms 8ms cubic-bezier(0.16, 1, 0.3, 1) both,
			slice-mark-out 80ms 180ms ease-in forwards;
	}

	.slice-mark-br {
		bottom: -1px;
		right: -1px;
		border-bottom: 1.5px solid var(--slice-c);
		border-right: 1.5px solid var(--slice-c);
		animation:
			slice-mark-in-br 80ms 24ms cubic-bezier(0.16, 1, 0.3, 1) both,
			slice-mark-out 80ms 180ms ease-in forwards;
	}

	@keyframes slice-mark-in-tl {
		from {
			transform: translate(-3px, -3px);
			opacity: 0.2;
		}
		to {
			transform: translate(0, 0);
			opacity: 1;
		}
	}

	@keyframes slice-mark-in-tr {
		from {
			transform: translate(3px, -3px);
			opacity: 0.2;
		}
		to {
			transform: translate(0, 0);
			opacity: 1;
		}
	}

	@keyframes slice-mark-in-bl {
		from {
			transform: translate(-3px, 3px);
			opacity: 0.2;
		}
		to {
			transform: translate(0, 0);
			opacity: 1;
		}
	}

	@keyframes slice-mark-in-br {
		from {
			transform: translate(3px, 3px);
			opacity: 0.2;
		}
		to {
			transform: translate(0, 0);
			opacity: 1;
		}
	}

	@keyframes slice-mark-out {
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slice-mark {
			animation: none;
			opacity: 0;
		}
	}
</style>
