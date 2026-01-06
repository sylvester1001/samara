<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { getContext, type Snippet } from "svelte";
	import { type ToggleGroupVariant } from "./toggle-group.svelte";
	import { tv } from "tailwind-variants";

	const toggleGroupItemVariants = tv({
		base: "ring-offset-background hover:bg-muted hover:text-muted-foreground focus-visible:ring-ring data-[state=on]:bg-accent data-[state=on]:text-accent-foreground inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 first:rounded-l-md last:rounded-r-md",
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "border border-input bg-transparent -ml-px first:ml-0"
			},
			size: {
				default: "h-9 px-3",
				sm: "h-8 px-2.5",
				lg: "h-10 px-4"
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	});

	let {
		ref = $bindable(null),
		value,
		class: className,
		size = "default",
		children,
		...restProps
	}: ToggleGroupPrimitive.ItemProps & {
		size?: "default" | "sm" | "lg";
		children?: Snippet;
	} = $props();

	const getVariant = getContext<() => ToggleGroupVariant>("toggleGroupVariant");
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	{value}
	data-slot="toggle-group-item"
	class={cn(toggleGroupItemVariants({ variant: getVariant?.(), size }), className)}
	{...restProps}
>
	{@render children?.()}
</ToggleGroupPrimitive.Item>
