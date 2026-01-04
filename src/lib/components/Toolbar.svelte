<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Undo2, Redo2, Upload, FilePlus, Download, AlignLeft, TextAlignCenter, AlignRight, Bold, Italic, TableCellsMerge, ChevronDown, Wrench } from 'lucide-svelte';
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
		hasSelection?: boolean;
		onAlignChange?: (align: 'left' | 'center' | 'right') => void;
		onToggleBold?: () => void;
		onToggleItalic?: () => void;
		onTextColorChange?: (color: string) => void;
		onBackgroundColorChange?: (color: string) => void;
		onMergeCells?: () => void;
		onUnmergeCells?: () => void;
		dpi?: number;
		onDpiChange?: (dpi: number) => void;
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
		canRedo = false,
		hasSelection = false,
		onAlignChange,
		onToggleBold,
		onToggleItalic,
		onTextColorChange,
		onBackgroundColorChange,
		onMergeCells,
		onUnmergeCells,
		dpi = 300,
		onDpiChange
	}: Props = $props();

	const presetOptions = [
		{ value: 'booktabs', label: 'Three-line Table' },
		{ value: 'bordered', label: 'Bordered' },
		{ value: 'minimal', label: 'Minimal' }
	];

	const dpiOptions = [
		{ value: 96, label: '96 DPI' },
		{ value: 150, label: '150 DPI' },
		{ value: 300, label: '300 DPI' },
		{ value: 600, label: '600 DPI' }
	];

	function handlePresetChange(value: string | undefined) {
		if (value) {
			onPresetChange?.(value as TableStyle['preset']);
		}
	}

	function handleDpiChange(value: string | undefined) {
		if (!value) return;
		const parsed = parseInt(value);
		if (!Number.isNaN(parsed)) {
			onDpiChange?.(parsed);
		}
	}

	function handleTextColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onTextColorChange?.(target.value);
	}

	function handleBackgroundColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onBackgroundColorChange?.(target.value);
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

	<!-- Format tools - visible when width >= 1460px -->
	<div class="toolbar-group toolbar-format-full">
		<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('left')} disabled={!hasSelection} title="Align Left">
			<AlignLeft class="w-4 h-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('center')} disabled={!hasSelection} title="Align Center">
			<TextAlignCenter class="w-4 h-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('right')} disabled={!hasSelection} title="Align Right">
			<AlignRight class="w-4 h-4" />
		</Button>
		<div class="toolbar-divider"></div>
		<Button variant="ghost" size="icon" onclick={onToggleBold} disabled={!hasSelection} title="Bold">
			<Bold class="w-4 h-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={onToggleItalic} disabled={!hasSelection} title="Italic">
			<Italic class="w-4 h-4" />
		</Button>
		<input
			type="color"
			class="toolbar-color-input"
			disabled={!hasSelection}
			title="Text Color"
			onchange={handleTextColorChange}
		/>
		<input
			type="color"
			class="toolbar-color-input"
			disabled={!hasSelection}
			title="Cell Background"
			onchange={handleBackgroundColorChange}
		/>
		<div class="toolbar-divider"></div>
		<Button variant="outline" size="sm" onclick={onMergeCells} disabled={!hasSelection}>
			<TableCellsMerge class="w-4 h-4 mr-1" />
			Merge
		</Button>
		<Button variant="outline" size="sm" onclick={onUnmergeCells} disabled={!hasSelection}>
			Unmerge
		</Button>
	</div>

	<!-- Format tools popover - visible when width < 1460px -->
	<div class="toolbar-group toolbar-format-compact">
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" size="sm" {...props}>
						<Wrench class="w-4 h-4 mr-1" />
						Tools
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto p-2">
				<div class="flex items-center gap-1">
					<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onAlignChange?.('left'); }} disabled={!hasSelection} title="Align Left">
						<AlignLeft class="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onAlignChange?.('center'); }} disabled={!hasSelection} title="Align Center">
						<TextAlignCenter class="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onAlignChange?.('right'); }} disabled={!hasSelection} title="Align Right">
						<AlignRight class="w-4 h-4" />
					</Button>
					<div class="toolbar-divider"></div>
					<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onToggleBold?.(); }} disabled={!hasSelection} title="Bold">
						<Bold class="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onToggleItalic?.(); }} disabled={!hasSelection} title="Italic">
						<Italic class="w-4 h-4" />
					</Button>
					<input
						type="color"
						class="toolbar-color-input"
						disabled={!hasSelection}
						title="Text Color"
						onchange={handleTextColorChange}
					/>
					<input
						type="color"
						class="toolbar-color-input"
						disabled={!hasSelection}
						title="Cell Background"
						onchange={handleBackgroundColorChange}
					/>
					<div class="toolbar-divider"></div>
					<Button variant="outline" size="sm" onclick={(e) => { e.stopPropagation(); onMergeCells?.(); }} disabled={!hasSelection}>
						<TableCellsMerge class="w-4 h-4 mr-1" />
						Merge
					</Button>
					<Button variant="outline" size="sm" onclick={(e) => { e.stopPropagation(); onUnmergeCells?.(); }} disabled={!hasSelection}>
						Unmerge
					</Button>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>

	<div class="toolbar-group">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button size="sm" {...props}>
						<Download class="w-4 h-4 mr-1" />
						Export
						<ChevronDown class="w-3 h-3 ml-1" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-48">
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>Resolution</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<DropdownMenu.RadioGroup value={String(dpi)} onValueChange={handleDpiChange}>
							{#each dpiOptions as option}
								<DropdownMenu.RadioItem value={String(option.value)}>
									{option.label}
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={onExportPng}>
					Export as PNG
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={onExportSvg}>
					Export as SVG
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
