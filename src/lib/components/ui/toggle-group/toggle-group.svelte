<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const toggleGroupVariants = tv({
		base: "inline-flex items-center justify-center",
		variants: {
			variant: {
				default: "",
				outline: ""
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	export type ToggleGroupVariant = VariantProps<typeof toggleGroupVariants>["variant"];
</script>

<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { setContext, type Snippet } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		variant = "default",
		class: className,
		children,
		...restProps
	}: ToggleGroupPrimitive.RootProps & {
		variant?: ToggleGroupVariant;
		children?: Snippet;
	} = $props();

	setContext("toggleGroupVariant", () => variant);
</script>

<ToggleGroupPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="toggle-group"
	class={cn(toggleGroupVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</ToggleGroupPrimitive.Root>
