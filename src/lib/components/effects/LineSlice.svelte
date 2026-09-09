<script lang="ts">
	const SLICE_MS = 560;
	const EASE_OUT_CIRC = 'cubic-bezier(0, 0.55, 0.45, 1)';

	interface Props {
		type: 'row' | 'col';
		headerW: number;
		headerH: number;
		travelW: number;
		travelH: number;
	}

	let { type, headerW, headerH, travelW, travelH }: Props = $props();

	let fillEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const fill = fillEl;
		if (!fill || travelW <= 0 || travelH <= 0) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const isRow = type === 'row';
		// inset() 四个值必须带同一单位，否则 Blink 会拒绝插值、直接跳变
		const clipHidden = isRow
			? `inset(0px ${travelW}px 0px 0px)`
			: `inset(0px 0px ${travelH}px 0px)`;
		const clipShown = 'inset(0px 0px 0px 0px)';

		fill.style.opacity = '0';
		fill.style.clipPath = clipHidden;

		const fillAnim = fill.animate(
			[
				{ clipPath: clipHidden, opacity: 0, offset: 0, easing: 'ease' },
				{ clipPath: clipHidden, opacity: 1, offset: 0.08, easing: EASE_OUT_CIRC },
				{ clipPath: clipShown, opacity: 1, offset: 0.68, easing: 'ease' },
				{ clipPath: clipShown, opacity: 0, offset: 1 }
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
		overflow: hidden;
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
			slice-mark-out 120ms 430ms ease-in forwards;
	}

	.slice-mark-tr {
		top: -1px;
		right: -1px;
		border-top: 1.5px solid var(--slice-c);
		border-right: 1.5px solid var(--slice-c);
		animation:
			slice-mark-in-tr 80ms 16ms cubic-bezier(0.16, 1, 0.3, 1) both,
			slice-mark-out 120ms 430ms ease-in forwards;
	}

	.slice-mark-bl {
		bottom: -1px;
		left: -1px;
		border-bottom: 1.5px solid var(--slice-c);
		border-left: 1.5px solid var(--slice-c);
		animation:
			slice-mark-in-bl 80ms 8ms cubic-bezier(0.16, 1, 0.3, 1) both,
			slice-mark-out 120ms 430ms ease-in forwards;
	}

	.slice-mark-br {
		bottom: -1px;
		right: -1px;
		border-bottom: 1.5px solid var(--slice-c);
		border-right: 1.5px solid var(--slice-c);
		animation:
			slice-mark-in-br 80ms 24ms cubic-bezier(0.16, 1, 0.3, 1) both,
			slice-mark-out 120ms 430ms ease-in forwards;
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
