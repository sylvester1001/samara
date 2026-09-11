<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import TacticalPointer from '$lib/components/effects/TacticalPointer.svelte';

	interface Props extends HTMLButtonAttributes {
		variant?: 'default' | 'outline' | 'ghost';
		hasPointer?: boolean;
		active?: boolean;
		pointerColor?: string;
		children?: Snippet;
		ref?: HTMLButtonElement | null;
	}

	let {
		variant = 'default',
		hasPointer = true,
		active = false,
		pointerColor = 'var(--cobalt, #0202f1)',
		class: className = '',
		disabled = false,
		onclick,
		children,
		ref = $bindable(null),
		...restProps
	}: Props = $props();

	let isHovered = $state(false);
	const isAvantGarde = $derived(uiTheme.theme === 'avant-garde');
	const isHighlighted = $derived(active || isHovered);
</script>

<div
	class="tactical-button-wrapper group relative inline-flex items-center select-none"
	data-active={active ? 'true' : undefined}
>
	<!-- 战术标定指针（inset-y-0 flex 严格垂直绝对居中，对齐按钮 50% 中心线） -->
	{#if hasPointer && isAvantGarde}
		<div class="pointer-slot absolute right-full mr-2 inset-y-0 flex items-center justify-center pointer-events-none z-30">
			<TacticalPointer active={isHighlighted} color={pointerColor} />
		</div>
	{/if}

	<button
		bind:this={ref}
		type="button"
		class={cn(
			"tactical-button relative inline-flex items-center justify-center gap-2 h-9 px-3.5 min-w-0 shrink-0 w-[150px]",
			"bg-background text-foreground border border-border transition-all duration-100 cursor-pointer select-none",
			"text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
			"disabled:opacity-40 disabled:pointer-events-none",
			/* 先锋主题样式：直角、等宽大写、字距 */
			isAvantGarde && "font-terminal uppercase tracking-[0.14em] font-semibold",
			/* 和 Toolbar import 按钮行为严格一致：平时纯白底黑字无阴影，hover 或 active 后填蓝底纯白字 */
			isAvantGarde
				? "hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1] active:bg-[#0202f1]/90"
				: "hover:bg-muted active:bg-muted/80",
			active && isAvantGarde && "bg-[#0202f1] text-white border-[#0202f1]",
			className
		)}
		{disabled}
		onmouseenter={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
		{onclick}
		{...restProps}
	>
		{@render children?.()}
	</button>
</div>

<style>
	/* 保证直角几何约束与等宽字体 */
	:global(html[data-theme="avant-garde"]) .tactical-button {
		border-radius: 0px !important;
		font-family: "JetBrains Mono", var(--font-cjk), monospace !important;
	}

	/* 确保 hover / active 态下文字与图标 100% 变白，背景变先锋钴蓝 */
	:global(html[data-theme="avant-garde"]) :global(.group:hover) .tactical-button,
	:global(html[data-theme="avant-garde"]) :global(.group[data-active="true"]) .tactical-button {
		background-color: var(--cobalt, #0202f1) !important;
		color: #ffffff !important;
		border-color: var(--cobalt, #0202f1) !important;
	}
</style>
