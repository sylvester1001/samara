<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Undo2, Redo2, Upload, FilePlus, Download } from 'lucide-svelte';
	import type { TableStyle } from '$lib/types';

	interface Props {
		onImport?: () => void;
		onNewTable?: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
		onExportPng?: () => void;
		onExportSvg?: () => void;
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
		onExportPng,
		onExportSvg,
		preset,
		onPresetChange,
		canUndo = false,
		canRedo = false
	}: Props = $props();

	const presetOptions = [
		{ value: 'booktabs', label: 'Three-line Table' },
		{ value: 'bordered', label: 'Bordered' },
		{ value: 'minimal', label: 'Minimal' }
	];

	function handlePresetChange(value: string | undefined) {
		if (value) {
			onPresetChange?.(value as TableStyle['preset']);
		}
	}
</script>

<div class="toolbar">
	<div class="toolbar-group">
		<Button variant="outline" size="sm" onclick={onImport}>
			<Upload class="w-4 h-4 mr-1" />
			Import
		</Button>
		<Button variant="outline" size="sm" onclick={onNewTable}>
			<FilePlus class="w-4 h-4 mr-1" />
			New
		</Button>
		<div class="toolbar-divider"></div>
		<Button variant="ghost" size="icon" onclick={onUndo} disabled={!canUndo}>
			<Undo2 class="w-4 h-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={onRedo} disabled={!canRedo}>
			<Redo2 class="w-4 h-4" />
		</Button>
	</div>

	<div class="toolbar-group">
		<Select.Root type="single" value={preset} onValueChange={handlePresetChange}>
			<Select.Trigger class="w-40">
				{presetOptions.find(o => o.value === preset)?.label || 'Select style'}
			</Select.Trigger>
			<Select.Content>
				{#each presetOptions as option}
					<Select.Item value={option.value}>{option.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="toolbar-group">
		<Button size="sm" onclick={onExportPng}>
			<Download class="w-4 h-4 mr-1" />
			PNG
		</Button>
		<Button variant="outline" size="sm" onclick={onExportSvg}>
			<Download class="w-4 h-4 mr-1" />
			SVG
		</Button>
	</div>
</div>
