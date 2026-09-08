<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { cn } from '$lib/utils.js';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import BorderTrace from '$lib/components/effects/BorderTrace.svelte';
	import type { TableStyle } from '$lib/types';
	import { t } from '$lib/i18n';

	interface Props {
		value: TableStyle['preset'];
		onValueChange?: (preset: TableStyle['preset']) => void;
	}

	let { value, onValueChange }: Props = $props();

	const presets = $derived([
		{ value: 'booktabs' as TableStyle['preset'], label: t('preset.booktabs') },
		{ value: 'bordered' as TableStyle['preset'], label: t('preset.bordered') },
		{ value: 'minimal' as TableStyle['preset'], label: t('preset.minimal') }
	]);

	function handleChange(next: string | undefined) {
		if (next === 'booktabs' || next === 'bordered' || next === 'minimal') {
			onValueChange?.(next);
		}
	}
</script>

<ToggleGroup.Root
	type="single"
	{value}
	onValueChange={handleChange}
	class="grid w-full grid-cols-3 gap-2 p-0.5"
>
	{#each presets as preset}
		<ToggleGroup.Item
			value={preset.value}
			aria-label={preset.label}
			class={cn(
				'relative ml-0 flex h-auto min-w-0 flex-col gap-1.5 border border-border bg-background p-1.5 shadow-none transition-all',
				'first:ml-0',
				'hover:border-foreground/40 hover:text-foreground',
				uiTheme.theme === 'avant-garde'
					? 'rounded-none first:rounded-none last:rounded-none data-[state=on]:border-transparent data-[state=on]:bg-[var(--cobalt-subtle)]/30 data-[state=on]:text-[var(--cobalt)]'
					: 'rounded-[2px] first:rounded-[2px] last:rounded-[2px] data-[state=on]:border-foreground data-[state=on]:shadow-[inset_0_0_0_1.5px_currentColor] data-[state=on]:bg-muted/60 data-[state=on]:text-foreground'
			)}
		>
			<BorderTrace active={value === preset.value} />
			<div class={cn(
				'flex aspect-[5/4] w-full items-center justify-center overflow-hidden bg-muted/40 p-1.5',
				uiTheme.theme === 'avant-garde' ? 'rounded-none' : 'rounded-[1px]'
			)}>
				{#if preset.value === 'booktabs'}
					<div class="flex h-full w-full flex-col justify-between py-0.5">
						<div class="h-0.5 rounded-full bg-foreground"></div>
						<div class="grid grid-cols-3 gap-1 px-0.5">
							<div class="h-1 rounded-sm bg-foreground/70"></div>
							<div class="h-1 rounded-sm bg-foreground/70"></div>
							<div class="h-1 rounded-sm bg-foreground/70"></div>
						</div>
						<div class="h-px bg-foreground/80"></div>
						<div class="grid grid-cols-3 gap-1 px-0.5">
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
						</div>
						<div class="grid grid-cols-3 gap-1 px-0.5">
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
						</div>
						<div class="h-0.5 rounded-full bg-foreground"></div>
					</div>
				{:else if preset.value === 'bordered'}
					<div class="grid h-full w-full grid-cols-3 grid-rows-3 border border-foreground/80">
						{#each Array(9) as _}
							<div class="border border-foreground/50"></div>
						{/each}
					</div>
				{:else}
					<div class="flex h-full w-full flex-col justify-center gap-1.5 px-0.5">
						<div class="grid grid-cols-3 gap-1">
							<div class="h-1 rounded-sm bg-foreground/60"></div>
							<div class="h-1 rounded-sm bg-foreground/60"></div>
							<div class="h-1 rounded-sm bg-foreground/60"></div>
						</div>
						<div class="grid grid-cols-3 gap-1">
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
						</div>
						<div class="grid grid-cols-3 gap-1">
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
						</div>
					</div>
				{/if}
			</div>
			<span class="text-[10px] font-terminal uppercase tracking-widest font-semibold leading-none">{preset.label}</span>
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
