<script lang="ts">
	import { PaneResizer } from "paneforge";
	import type { ComponentProps } from "svelte";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		class: className,
		children,
		...restProps
	}: WithoutChild<ComponentProps<typeof PaneResizer>> = $props();
</script>

<PaneResizer
	data-slot="resizable-handle"
	class={cn(
		"relative flex w-2 -mx-1 items-center justify-center bg-transparent after:absolute after:inset-y-3 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border after:transition-colors hover:after:bg-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 data-[direction=vertical]:h-2 data-[direction=vertical]:w-full data-[direction=vertical]:-my-1 data-[direction=vertical]:mx-0 data-[direction=vertical]:after:inset-x-3 data-[direction=vertical]:after:top-1/2 data-[direction=vertical]:after:h-px data-[direction=vertical]:after:w-auto data-[direction=vertical]:after:-translate-y-1/2",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</PaneResizer>
