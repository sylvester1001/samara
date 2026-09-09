<script lang="ts">
	interface Props {
		tl?: boolean;
		tr?: boolean;
		bl?: boolean;
		br?: boolean;
		color?: string;
	}

	let {
		tl = true,
		tr = true,
		bl = true,
		br = true,
		color = 'var(--cobalt, #0202f1)'
	}: Props = $props();
</script>

<div class="pointer-events-none absolute inset-0 z-10 overflow-visible select-none" aria-hidden="true">
	{#if tl}
		<span class="reticle-corner reticle-tl" style:--reticle-color={color}></span>
	{/if}
	{#if tr}
		<span class="reticle-corner reticle-tr" style:--reticle-color={color}></span>
	{/if}
	{#if bl}
		<span class="reticle-corner reticle-bl" style:--reticle-color={color}></span>
	{/if}
	{#if br}
		<span class="reticle-corner reticle-br" style:--reticle-color={color}></span>
	{/if}
</div>

<style>
	.reticle-corner {
		position: absolute;
		width: 5px;
		height: 5px;
		box-sizing: border-box;
		pointer-events: none;
		will-change: transform;
	}

	.reticle-tl {
		top: -1px;
		left: -1px;
		border-top: 1.5px solid var(--reticle-color, #0202f1);
		border-left: 1.5px solid var(--reticle-color, #0202f1);
		animation: reticle-snap-tl 90ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.reticle-tr {
		top: -1px;
		right: -1px;
		border-top: 1.5px solid var(--reticle-color, #0202f1);
		border-right: 1.5px solid var(--reticle-color, #0202f1);
		animation: reticle-snap-tr 90ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.reticle-bl {
		bottom: -1px;
		left: -1px;
		border-bottom: 1.5px solid var(--reticle-color, #0202f1);
		border-left: 1.5px solid var(--reticle-color, #0202f1);
		animation: reticle-snap-bl 90ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.reticle-br {
		bottom: -1px;
		right: -1px;
		border-bottom: 1.5px solid var(--reticle-color, #0202f1);
		border-right: 1.5px solid var(--reticle-color, #0202f1);
		animation: reticle-snap-br 90ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes reticle-snap-tl {
		0% {
			transform: translate(-3px, -3px);
			opacity: 0.2;
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
		}
	}

	@keyframes reticle-snap-tr {
		0% {
			transform: translate(3px, -3px);
			opacity: 0.2;
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
		}
	}

	@keyframes reticle-snap-bl {
		0% {
			transform: translate(-3px, 3px);
			opacity: 0.2;
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
		}
	}

	@keyframes reticle-snap-br {
		0% {
			transform: translate(3px, 3px);
			opacity: 0.2;
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
		}
	}
</style>
