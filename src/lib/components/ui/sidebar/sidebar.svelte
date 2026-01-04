<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	class={cn(
		"bg-sidebar text-sidebar-foreground flex h-svh w-[280px] flex-col shrink-0",
		className
	)}
	bind:this={ref}
	{...restProps}
>
	{@render children?.()}
</div>
