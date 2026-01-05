<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ArrowRightFromLine, PencilLine, Import, Undo2, Redo2, Upload, FilePlus, Download, TextAlignStart, TextAlignCenter, TextAlignEnd, Bold, Italic, TableCellsMerge, ChevronDown, Wrench } from 'lucide-svelte';
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

	<!-- Format tools - visible when width >= 1460px -->
	<div class="hidden min-[1460px]:flex items-center gap-2">
		<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('left')} disabled={!hasSelection} title="Align Left">
			<TextAlignStart class="w-4 h-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('center')} disabled={!hasSelection} title="Align Center">
			<TextAlignCenter class="w-4 h-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('right')} disabled={!hasSelection} title="Align Right">
			<TextAlignEnd class="w-4 h-4" />
		</Button>
		<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-1"></div>
		<Button variant="ghost" size="icon" onclick={onToggleBold} disabled={!hasSelection} title="Bold">
			<Bold class="w-4 h-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={onToggleItalic} disabled={!hasSelection} title="Italic">
			<Italic class="w-4 h-4" />
		</Button>
		<input
			type="color"
			class="w-7 h-7 border border-border dark:border-[#27272a] rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]"
			disabled={!hasSelection}
			title="Text Color"
			onchange={handleTextColorChange}
		/>
		<input
			type="color"
			class="w-7 h-7 border border-border dark:border-[#27272a] rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]"
			disabled={!hasSelection}
			title="Cell Background"
			onchange={handleBackgroundColorChange}
		/>
		<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-1"></div>
		<Button variant="outline" size="sm" onclick={onMergeCells} disabled={!hasSelection}>
			<TableCellsMerge class="w-4 h-4 mr-1" />
			Merge
		</Button>
		<Button variant="outline" size="sm" onclick={onUnmergeCells} disabled={!hasSelection}>
			Unmerge
		</Button>
	</div>

	<div class="flex items-center gap-2 shrink-0">
		<!-- Format tools popover - visible when width < 1460px -->
		<div class="flex min-[1460px]:hidden items-center">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
					<Button variant="outline" size="sm" {...props}>
						<PencilLine class="shrink-0 w-4 h-4" />
						<span class="hidden min-[1200px]:inline whitespace-nowrap">Tools</span>
					</Button>
				{/snippet}
			</Popover.Trigger>
				<Popover.Content class="w-auto p-2">
					<div class="flex items-center gap-1">
						<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onAlignChange?.('left'); }} disabled={!hasSelection} title="Align Left">
							<TextAlignStart class="w-4 h-4" />
						</Button>
						<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onAlignChange?.('center'); }} disabled={!hasSelection} title="Align Center">
							<TextAlignCenter class="w-4 h-4" />
						</Button>
						<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onAlignChange?.('right'); }} disabled={!hasSelection} title="Align Right">
							<TextAlignEnd class="w-4 h-4" />
						</Button>
						<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-1"></div>
						<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onToggleBold?.(); }} disabled={!hasSelection} title="Bold">
							<Bold class="w-4 h-4" />
						</Button>
						<Button variant="ghost" size="icon" onclick={(e) => { e.stopPropagation(); onToggleItalic?.(); }} disabled={!hasSelection} title="Italic">
							<Italic class="w-4 h-4" />
						</Button>
						<input
							type="color"
							class="w-7 h-7 border border-border dark:border-[#27272a] rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]"
							disabled={!hasSelection}
							title="Text Color"
							onchange={handleTextColorChange}
						/>
						<input
							type="color"
							class="w-7 h-7 border border-border dark:border-[#27272a] rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]"
							disabled={!hasSelection}
							title="Cell Background"
							onchange={handleBackgroundColorChange}
						/>
						<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-1"></div>
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
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button size="sm" {...props}>
						<ArrowRightFromLine  class="shrink-0 w-4 h-4" />
						<span class="hidden min-[1200px]:inline whitespace-nowrap">Export</span>
						<ChevronDown class="shrink-0 hidden min-[1200px]:block w-3 h-3" />
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
