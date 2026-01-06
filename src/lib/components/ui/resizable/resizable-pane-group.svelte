<script lang="ts">
	import { PaneGroup } from "paneforge";
	import type { ComponentProps } from "svelte";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		class: className,
		children,
		...restProps
	}: WithoutChild<ComponentProps<typeof PaneGroup>> = $props();
</script>

<PaneGroup
	data-slot="resizable-pane-group"
		class={cn(
			"flex h-full w-full data-[direction=vertical]:flex-col",
			className
		)}
	{...restProps}
>
	{@render children?.()}
</PaneGroup>
