<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mergeProps } from 'bits-ui';
	import type { ComponentProps, Snippet } from 'svelte';
	import type { WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		text,
		childProps,
		contentProps,
		delayDuration = 200,
		children,
		...triggerProps
	}: {
		text: string;
		childProps?: Record<string, unknown>;
		contentProps?: WithoutChildrenOrChild<ComponentProps<typeof Tooltip.Content>>;
		delayDuration?: number;
		children?: Snippet<[{ props: Record<string, unknown> }]>;
	} & Record<string, unknown> = $props();
</script>

<Tooltip.Root {delayDuration} ignoreNonKeyboardFocus={true} disableHoverableContent={true}>
	<Tooltip.Trigger {...triggerProps}>
		{#snippet child({ props })}
			{@const mergedProps = childProps ? mergeProps(props, childProps) : props}
			{@render children?.({ props: mergedProps })}
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content {...contentProps}>
		<p>{text}</p>
	</Tooltip.Content>
</Tooltip.Root>
