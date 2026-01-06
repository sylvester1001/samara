<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Undo2, Redo2, FilePlus, Download } from 'lucide-svelte';
	import type { TableStyle } from '$lib/types';

	interface Props {
		onImport?: () => void;
		onNewTable?: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
		preset: TableStyle['preset'];
		onPresetChange?: (preset: TableStyle['preset']) => void;
		canUndo?: boolean;
		canRedo?: boolean;
	}

	let {
		onImport,
		onNewTable,
		onUndo,
		onRedo,
		preset,
		onPresetChange,
		canUndo = false,
		canRedo = false
	}: Props = $props();

	const presetOptions = [
		{ value: 'booktabs', label: 'Booktabs' },
		{ value: 'bordered', label: 'Bordered' },
		{ value: 'minimal', label: 'Minimal' }
	];

	function handlePresetChange(value: string | undefined) {
		if (value) {
			onPresetChange?.(value as TableStyle['preset']);
		}
	}
</script>

<div class="flex items-center h-16 px-4 py-2 border-b border-border bg-white dark:bg-[#09090b] dark:border-[#27272a] gap-4 overflow-hidden w-full box-border">
	<div class="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
		<div class="flex items-center gap-2 min-w-0">
			<Button variant="outline" size="sm" onclick={onImport}>
				<Download class="shrink-0 w-4 h-4" />
				<span class="hidden min-[1200px]:inline whitespace-nowrap">Import</span>
			</Button>
			<Button variant="outline" size="sm" onclick={onNewTable}>
				<FilePlus class="shrink-0 w-4 h-4" />
				<span class="hidden min-[1200px]:inline whitespace-nowrap">New</span>
			</Button>
			<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-1"></div>
			<Button variant="ghost" size="icon" onclick={onUndo} disabled={!canUndo}>
				<Undo2 class="w-4 h-4" />
			</Button>
			<Button variant="ghost" size="icon" onclick={onRedo} disabled={!canRedo}>
				<Redo2 class="w-4 h-4" />
			</Button>
		</div>

		<div class="flex items-center gap-2 min-w-0 flex-[0_0_200px] min-w-[200px]">
			<Select.Root type="single" value={preset} onValueChange={handlePresetChange}>
				<Select.Trigger class="w-full min-w-0">
					<span class="whitespace-nowrap overflow-visible">
						{presetOptions.find(o => o.value === preset)?.label || 'Select style'}
					</span>
				</Select.Trigger>
				<Select.Content>
					{#each presetOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>
</div>
