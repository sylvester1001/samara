<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import type { TableStyle, CanvasConfig, BorderStyle, TableData, RuleSegment, SegmentStyle } from '$lib/types';

	interface Props {
		tableStyle: TableStyle;
		canvasConfig: CanvasConfig;
		tableData: TableData;
		selectedCells: { row: number; col: number }[];
		headerRows: number;
		maxHeaderRows: number;
		onHeaderRowsChange?: (count: number) => void;
		onStyleChange?: (style: Partial<TableStyle>) => void;
		onCanvasChange?: (config: Partial<CanvasConfig>) => void;
		lockColumnResize?: boolean;
		lockRowResize?: boolean;
		onLockColumnResizeChange?: (locked: boolean) => void;
		onLockRowResizeChange?: (locked: boolean) => void;
		onAddSegment?: (segment: RuleSegment) => void;
		onRemoveSegment?: (index: number) => void;
		onClearSegments?: () => void;
	}

	let {
		tableStyle,
		canvasConfig,
		tableData,
		selectedCells,
		headerRows = 1,
		maxHeaderRows = 1,
		onHeaderRowsChange,
		onStyleChange,
		onCanvasChange,
		lockColumnResize = false,
		lockRowResize = false,
		onLockColumnResizeChange,
		onLockRowResizeChange,
		onAddSegment,
		onRemoveSegment,
		onClearSegments
	}: Props = $props();

	const fontOptions = [
		{ value: 'computer-modern', label: 'Computer Modern' },
		{ value: 'times', label: 'Times New Roman' },
		{ value: 'arial', label: 'Arial' }
	];

	const paddingOptions = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'loose', label: 'Loose' }
	];

	const canvasPresets = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'ppt', label: 'PPT 16:9 (1920 x 1080)' },
		{ value: 'a4', label: 'A4 (794 x 1123)' },
		{ value: 'custom', label: 'Custom' }
	];

	const borderOptions: { value: BorderStyle; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'thin', label: 'Thin' },
		{ value: 'thick', label: 'Thick' },
		{ value: 'double', label: 'Double' }
	];
	const doubleBorderOptions: { value: BorderStyle; label: string }[] = [
		...borderOptions,
		{ value: 'thick-thin', label: 'Thick-Thin' },
		{ value: 'thin-thick', label: 'Thin-Thick' }
	];

	const headerRowOptions = $derived.by(() => {
		const max = Math.max(1, maxHeaderRows);
		return Array.from({ length: max }, (_, index) => {
			const value = index + 1;
			return { value: String(value), label: `${value} Row${value === 1 ? '' : 's'}` };
		});
	});

	let canvasPreset = $state('auto');
	let customWidth = $state(800);
	let customHeight = $state(600);
	let segmentRow = $state(1);
	let segmentStartCol = $state(1);
	let segmentEndCol = $state(1);
	let segmentTrimLeft = $state(false);
	let segmentTrimRight = $state(false);
	let segmentStyle = $state<SegmentStyle>('thin');
	let lastSelectionKey = $state('');

	// Initialize custom dimensions from canvasConfig
	$effect(() => {
		if (typeof canvasConfig.width === 'number') {
			customWidth = canvasConfig.width;
		}
		if (typeof canvasConfig.height === 'number') {
			customHeight = canvasConfig.height;
		}
	});

	const presetSizes: Record<string, { width: number; height: number }> = {
		ppt: { width: 1920, height: 1080 },
		a4: { width: 794, height: 1123 }
	};

	function handleFontChange(value: string | undefined) {
		if (value) {
			onStyleChange?.({ fontFamily: value as TableStyle['fontFamily'] });
		}
	}

	function handlePaddingChange(value: string | undefined) {
		if (value) {
			onStyleChange?.({ padding: value as 'compact' | 'normal' | 'loose' });
		}
	}

	function handleHeaderRowsChange(value: string | undefined) {
		if (!value) return;
		const parsed = parseInt(value);
		if (!Number.isNaN(parsed)) {
			onHeaderRowsChange?.(parsed);
		}
	}

	function handleFontSizeChange(value: number) {
		onStyleChange?.({ fontSize: value });
	}

	function handleScaleChange(value: number) {
		onStyleChange?.({ scale: value / 100 });
	}

	function inferPreset(config: CanvasConfig) {
		if (config.width === 'auto' && config.height === 'auto') return 'auto';
		if (config.width === presetSizes.ppt.width && config.height === presetSizes.ppt.height) return 'ppt';
		if (config.width === presetSizes.a4.width && config.height === presetSizes.a4.height) return 'a4';
		return 'custom';
	}

	$effect(() => {
		canvasPreset = inferPreset(canvasConfig);
	});

	$effect(() => {
		const maxRow = Math.max(1, tableData.rows.length);
		const maxCol = Math.max(1, tableData.columnWidths.length);
		segmentRow = Math.min(Math.max(1, segmentRow), maxRow);
		segmentStartCol = Math.min(Math.max(1, segmentStartCol), maxCol);
		segmentEndCol = Math.min(Math.max(1, segmentEndCol), maxCol);
		if (segmentStartCol > segmentEndCol) {
			const nextStart = segmentEndCol;
			segmentEndCol = segmentStartCol;
			segmentStartCol = nextStart;
		}
	});

	$effect(() => {
		const key = selectedCells
			.map((cell) => `${cell.row}:${cell.col}`)
			.sort()
			.join('|');
		if (key !== lastSelectionKey) {
			lastSelectionKey = key;
			if (selectedCells.length) {
				const range = getSelectionRange();
				if (range) {
					segmentRow = range.row;
					segmentStartCol = range.startCol;
					segmentEndCol = range.endCol;
				}
			}
		}
	});

	function handleCanvasPresetChange(value: string | undefined) {
		if (!value) return;
		canvasPreset = value;
		if (value === 'auto') {
			onCanvasChange?.({ width: 'auto', height: 'auto' });
			return;
		}
		if (value === 'custom') {
			onCanvasChange?.({ width: customWidth, height: customHeight });
			return;
		}
		const preset = presetSizes[value];
		if (preset) {
			onCanvasChange?.({ width: preset.width, height: preset.height });
		}
	}

	function handleCustomWidthChange(e: Event) {
		const target = e.target as HTMLInputElement;
		customWidth = parseInt(target.value) || 800;
		if (canvasPreset === 'custom') {
			onCanvasChange?.({ width: customWidth });
		}
	}

	function handleCustomHeightChange(e: Event) {
		const target = e.target as HTMLInputElement;
		customHeight = parseInt(target.value) || 600;
		if (canvasPreset === 'custom') {
			onCanvasChange?.({ height: customHeight });
		}
	}

	function handlePaddingValueChange(value: number) {
		onCanvasChange?.({ padding: value });
	}

	function handleBgColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onCanvasChange?.({ backgroundColor: target.value });
	}

	function handleBorderChange(key: keyof TableStyle['borders'], value: string | undefined) {
		if (!value) return;
		onStyleChange?.({
			borders: { ...tableStyle.borders, [key]: value as BorderStyle }
		});
	}

	function getBorderLabel(value: BorderStyle) {
		return doubleBorderOptions.find((option) => option.value === value)?.label ?? value;
	}

	function handleLockColumnChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onLockColumnResizeChange?.(target.checked);
	}

	function handleLockRowChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onLockRowResizeChange?.(target.checked);
	}

	function handleSegmentStartColChange(e: Event) {
		const target = e.target as HTMLInputElement;
		segmentStartCol = parseInt(target.value) || 1;
	}

	function handleSegmentEndColChange(e: Event) {
		const target = e.target as HTMLInputElement;
		segmentEndCol = parseInt(target.value) || 1;
	}

	function handleSegmentRowChange(e: Event) {
		const target = e.target as HTMLInputElement;
		segmentRow = parseInt(target.value) || 1;
	}

	function getCellRange(row: number, col: number) {
		const cell = tableData.rows[row]?.[col];
		if (cell && !cell.isMerged) {
			const rowspan = cell.rowspan ?? 1;
			const colspan = cell.colspan ?? 1;
			return {
				rowStart: row,
				rowEnd: row + rowspan - 1,
				colStart: col,
				colEnd: col + colspan - 1
			};
		}
		for (let r = 0; r < tableData.rows.length; r++) {
			for (let c = 0; c < tableData.rows[r].length; c++) {
				const candidate = tableData.rows[r][c];
				const rowspan = candidate.rowspan ?? 1;
				const colspan = candidate.colspan ?? 1;
				if (rowspan <= 1 && colspan <= 1) continue;
				if (row >= r && row < r + rowspan && col >= c && col < c + colspan) {
					return {
						rowStart: r,
						rowEnd: r + rowspan - 1,
						colStart: c,
						colEnd: c + colspan - 1
					};
				}
			}
		}
		return { rowStart: row, rowEnd: row, colStart: col, colEnd: col };
	}

	function getSelectionBounds() {
		if (!selectedCells.length) return null;
		let rowStart = Number.POSITIVE_INFINITY;
		let rowEnd = -Infinity;
		let colStart = Number.POSITIVE_INFINITY;
		let colEnd = -Infinity;
		for (const cell of selectedCells) {
			const range = getCellRange(cell.row, cell.col);
			rowStart = Math.min(rowStart, range.rowStart);
			rowEnd = Math.max(rowEnd, range.rowEnd);
			colStart = Math.min(colStart, range.colStart);
			colEnd = Math.max(colEnd, range.colEnd);
		}
		return { rowStart, rowEnd, colStart, colEnd };
	}

	function getSelectionRange() {
		const bounds = getSelectionBounds();
		if (!bounds) return null;
		return {
			row: bounds.rowEnd + 1,
			startCol: bounds.colStart + 1,
			endCol: bounds.colEnd + 1
		};
	}

	function handleAddSegment() {
		const nextRow = segmentRow;
		const nextStartCol = segmentStartCol;
		const nextEndCol = segmentEndCol;
		onAddSegment?.({
			atRow: nextRow - 1,
			startCol: nextStartCol - 1,
			endCol: nextEndCol - 1,
			trimLeft: segmentTrimLeft ? 'short' : 'none',
			trimRight: segmentTrimRight ? 'short' : 'none',
			style: segmentStyle
		});
	}
</script>

<div class="settings-panel space-y-4">
	<Card.Root class="p-4 gap-1">
		<Card.Header class="p-0 pb-2">
			<Card.Title class="text-sm">Structure</Card.Title>
		</Card.Header>
		<Card.Content class="p-0 space-y-5">
			<div class="space-y-3">
				<Label>Header Rows</Label>
				<Select.Root type="single" value={String(headerRows)} onValueChange={handleHeaderRowsChange}>
					<Select.Trigger class="w-full">
						{headerRowOptions.find(o => o.value === String(headerRows))?.label || `${headerRows} Rows`}
					</Select.Trigger>
					<Select.Content>
						{#each headerRowOptions as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-4">
				<Label>Segments</Label>
				<div class="space-y-3">
					<div class="grid grid-cols-[1fr_2fr] gap-3">
						<div class="flex flex-col gap-1.5">
							<span class="text-xs text-muted-foreground">Row</span>
							<Input
								type="number"
								value={segmentRow}
								min={1}
								max={tableData.rows.length}
								onchange={handleSegmentRowChange}
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex flex-col gap-1.5">
								<span class="text-xs text-muted-foreground">Col Start</span>
								<Input
									type="number"
									value={segmentStartCol}
									min={1}
									max={tableData.columnWidths.length}
									onchange={handleSegmentStartColChange}
								/>
							</div>
							<div class="flex flex-col gap-1.5">
								<span class="text-xs text-muted-foreground">Col End</span>
								<Input
									type="number"
									value={segmentEndCol}
									min={1}
									max={tableData.columnWidths.length}
									onchange={handleSegmentEndColChange}
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">Trim Left</span>
						<Switch checked={segmentTrimLeft} onCheckedChange={(v) => segmentTrimLeft = v} />
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">Trim Right</span>
						<Switch checked={segmentTrimRight} onCheckedChange={(v) => segmentTrimRight = v} />
					</div>
				</div>

				<div class="space-y-3">
					<Label>Line Style</Label>
					<ToggleGroup.Root variant="outline" type="single" value={segmentStyle} onValueChange={(v) => v && (segmentStyle = v as SegmentStyle)} class="w-full">
						<ToggleGroup.Item value="thin" aria-label="Thin" class="flex-1">Thin</ToggleGroup.Item>
						<ToggleGroup.Item value="thick" aria-label="Thick" class="flex-1">Thick</ToggleGroup.Item>
						<ToggleGroup.Item value="double" aria-label="Double" class="flex-1">Double</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>

				<div class="flex items-center justify-between">
					<Button size="sm" onclick={handleAddSegment} disabled={!tableData.columnWidths.length}>
						Add Segment
					</Button>
					<Button size="sm" variant="ghost" onclick={onClearSegments} disabled={!tableData.segments.length}>
						Clear All
					</Button>
				</div>

				{#if tableData.segments.length}
					<div class="space-y-3">
						{#each tableData.segments as segment, index}
							<div class="flex items-center justify-between text-xs rounded-md border border-border dark:border-[#27272a] px-2.5 py-2.5">
								<span>
									Row {segment.atRow + 1}, Col {segment.startCol + 1}-{segment.endCol + 1}
								</span>
								<Button size="sm" variant="ghost" onclick={() => onRemoveSegment?.(index)}>
									Remove
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-3 pt-3 border-t border-border/60 dark:border-[#27272a]">
				<Label>Resize Lock</Label>
				<div class="space-y-4">
					<label class="flex items-center justify-between text-[13px] text-foreground dark:text-muted-foreground cursor-pointer">
						<span>Lock Column Widths</span>
						<input
							type="checkbox"
							class="w-4 h-4 accent-primary cursor-pointer"
							checked={lockColumnResize}
							onchange={handleLockColumnChange}
						/>
					</label>
					<label class="flex items-center justify-between text-[13px] text-foreground dark:text-muted-foreground cursor-pointer">
						<span>Lock Row Heights</span>
						<input
							type="checkbox"
							class="w-4 h-4 accent-primary cursor-pointer"
							checked={lockRowResize}
							onchange={handleLockRowChange}
						/>
					</label>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="p-4 gap-1">
		<Card.Header class="p-0 pb-2">
			<Card.Title class="text-sm">Table Style</Card.Title>
		</Card.Header>
		<Card.Content class="p-0 space-y-5">
			<div class="space-y-3">
				<Label>Font</Label>
				<Select.Root type="single" value={tableStyle.fontFamily} onValueChange={handleFontChange}>
					<Select.Trigger class="w-full">
						{fontOptions.find(o => o.value === tableStyle.fontFamily)?.label || 'Select font'}
					</Select.Trigger>
					<Select.Content>
						{#each fontOptions as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-3">
				<Label>Font Size: {tableStyle.fontSize}pt</Label>
				<Slider
					type="single"
					value={tableStyle.fontSize}
					min={8}
					max={16}
					step={1}
					onValueChange={handleFontSizeChange}
				/>
			</div>

			<div class="space-y-3">
				<Label>Scale: {Math.round(tableStyle.scale * 100)}%</Label>
				<Slider
					type="single"
					value={tableStyle.scale * 100}
					min={50}
					max={150}
					step={5}
					onValueChange={handleScaleChange}
				/>
			</div>

			<div class="space-y-3">
				<Label>Cell Padding</Label>
				<Select.Root 
					type="single" 
					value={typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'} 
					onValueChange={handlePaddingChange}
				>
					<Select.Trigger class="w-full">
						{paddingOptions.find(o => o.value === (typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'))?.label || 'Normal'}
					</Select.Trigger>
					<Select.Content>
						{#each paddingOptions as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-3">
				<Label>Table Borders</Label>
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Top</span>
						<Select.Root type="single" value={tableStyle.borders.top} onValueChange={(v) => handleBorderChange('top', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.top)}</Select.Trigger>
							<Select.Content>
								{#each doubleBorderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Bottom</span>
						<Select.Root type="single" value={tableStyle.borders.bottom} onValueChange={(v) => handleBorderChange('bottom', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.bottom)}</Select.Trigger>
							<Select.Content>
								{#each doubleBorderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Header</span>
						<Select.Root type="single" value={tableStyle.borders.headerBottom} onValueChange={(v) => handleBorderChange('headerBottom', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.headerBottom)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Vertical</span>
						<Select.Root type="single" value={tableStyle.borders.vertical} onValueChange={(v) => handleBorderChange('vertical', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.vertical)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Horizontal</span>
						<Select.Root type="single" value={tableStyle.borders.horizontal} onValueChange={(v) => handleBorderChange('horizontal', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.horizontal)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="p-4 gap-1">
		<Card.Header class="p-0 pb-2">
			<Card.Title class="text-sm">Canvas</Card.Title>
		</Card.Header>
		<Card.Content class="p-0 space-y-5">
			<div class="space-y-3">
				<Label>Size Preset</Label>
				<Select.Root type="single" value={canvasPreset} onValueChange={handleCanvasPresetChange}>
					<Select.Trigger class="w-full">
						{canvasPresets.find(o => o.value === canvasPreset)?.label || 'Auto'}
					</Select.Trigger>
					<Select.Content>
						{#each canvasPresets as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			{#if canvasPreset === 'custom'}
				<div class="space-y-3">
					<Label>Custom Width (px)</Label>
					<Input
						type="number"
						value={customWidth}
						onchange={handleCustomWidthChange}
						min={200}
						max={4000}
					/>
				</div>
				<div class="space-y-3">
					<Label>Custom Height (px)</Label>
					<Input
						type="number"
						value={customHeight}
						onchange={handleCustomHeightChange}
						min={200}
						max={4000}
					/>
				</div>
			{/if}

			<div class="space-y-3">
				<Label>Padding: {canvasConfig.padding}px</Label>
				<Slider
					type="single"
					value={canvasConfig.padding}
					min={0}
					max={60}
					step={4}
					onValueChange={handlePaddingValueChange}
				/>
			</div>

			<div class="space-y-3">
				<Label>Background</Label>
				<input
					type="color"
					class="w-full h-9 border border-border dark:border-[#27272a] rounded-md cursor-pointer p-0.5"
					value={canvasConfig.backgroundColor}
					onchange={handleBgColorChange}
				/>
			</div>
		</Card.Content>
	</Card.Root>
</div>
