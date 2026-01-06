<script lang="ts">
	import { Pane } from "paneforge";
	import type { ComponentProps } from "svelte";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		class: className,
		children,
		...restProps
	}: WithoutChild<ComponentProps<typeof Pane>> = $props();
</script>

<Pane
	data-slot="resizable-pane"
	class={cn("min-h-0 min-w-0", className)}
	{...restProps}
>
	{@render children?.()}
</Pane>
