<script lang="ts">
	import type { TableData, TableStyle, CanvasConfig } from '$lib/types';
	import TableCell from './TableCell.svelte';
	import ColumnResizer from './ColumnResizer.svelte';
	import RowResizer from './RowResizer.svelte';

	interface Props {
		tableData: TableData;
		tableStyle: TableStyle;
		canvasConfig: CanvasConfig;
		onCellUpdate?: (row: number, col: number, content: string) => void;
		onColumnResize?: (colIndex: number, width: number) => void;
		onRowResize?: (rowIndex: number, height: number) => void;
		onCanvasResize?: (config: Partial<CanvasConfig>) => void;
		canvasRef?: (el: HTMLElement | null) => void;
	}

	let { tableData, tableStyle, canvasConfig, onCellUpdate, onColumnResize, onRowResize, onCanvasResize, canvasRef }: Props = $props();

	let canvasElement: HTMLElement | null = $state(null);
	let contentElement: HTMLElement | null = $state(null);

	$effect(() => {
		canvasRef?.(canvasElement);
	});

	// ========== Constants ==========
	const FONT_FAMILY_MAP: Record<string, string> = {
		'computer-modern': '"CMU Serif", var(--font-cjk-serif), serif',
		times: '"Times New Roman", Times, var(--font-cjk-serif), serif',
		arial: 'Arial, Helvetica, var(--font-cjk), sans-serif'
	};

	const PADDING_MAP: Record<string, number> = {
		compact: 4,
		normal: 8,
		loose: 16
	};

	const BORDER_WIDTH_MAP: Record<string, number> = {
		none: 0,
		thin: 1,
		thick: 2,
		double: 3,
		'thick-thin': 0,
		'thin-thick': 0
	};

	const BORDER_STYLE_MAP: Record<string, string> = {
		none: 'none',
		thin: 'solid',
		thick: 'solid',
		double: 'double',
		'thick-thin': 'none',
		'thin-thick': 'none'
	};

	const SEGMENT_WIDTH_MAP: Record<string, number> = {
		thin: 1,
		thick: 2,
		double: 3
	};

	const SEGMENT_STYLE_MAP: Record<string, string> = {
		thin: 'solid',
		thick: 'solid',
		double: 'double'
	};

	const SEGMENT_TRIM_PX = 8;
	const DOUBLE_LINE_HEIGHT = 5;
	// Extend amount for cell background to prevent white lines during export
	const CELL_BG_EXTEND_PX = 0.5;

	// ========== Helper: Cell Background Extension ==========
	// Generates box-shadow to extend background color slightly, preventing gaps between adjacent colored cells
	// isFirst/isLast: whether this cell is at the left/right edge of the table (to avoid overflow)
	function getCellBgExtendStyle(bgColor: string | undefined, isFirst: boolean, isLast: boolean): string | undefined {
		if (!bgColor) return undefined;
		const shadows: string[] = [];
		if (!isFirst) {
			shadows.push(`${-CELL_BG_EXTEND_PX}px 0 0 0 ${bgColor}`);
		}
		if (!isLast) {
			shadows.push(`${CELL_BG_EXTEND_PX}px 0 0 0 ${bgColor}`);
		}
		return shadows.length > 0 ? shadows.join(', ') : undefined;
	}

	// ========== Derived: Style Values ==========
	const fontFamily = $derived(FONT_FAMILY_MAP[tableStyle.fontFamily]);
	const cellPadding = $derived(
		typeof tableStyle.padding === 'number' ? tableStyle.padding : PADDING_MAP[tableStyle.padding]
	);

	const headerRowCount = $derived.by(() => {
		const requested = tableData.headerRows ?? 1;
		return Math.min(Math.max(1, requested), tableData.rows.length);
	});

	// ========== Derived: Border Config ==========
	const isBooktabs = $derived(tableStyle.preset === 'booktabs');
	const topBorderType = $derived(tableStyle.borders.top);
	const bottomBorderType = $derived(tableStyle.borders.bottom);
	
	const needsTopDoubleLine = $derived(
		isBooktabs && topBorderType === 'thick-thin'
	);
	const needsBottomDoubleLine = $derived(
		isBooktabs && bottomBorderType === 'thin-thick'
	);

	// ========== Derived: Table Dimensions ==========
	const tableWidth = $derived(tableData.columnWidths.reduce((sum, w) => sum + w, 0));

	let domRowHeights: number[] = $state([]);
	let domContentWidth = $state(0);
	let domContentHeight = $state(0);

	// ========== Derived: Canvas Dimensions ==========
	const actualContentWidth = $derived(domContentWidth || tableWidth);
	const actualContentHeight = $derived(domContentHeight || 100);

	const requestedCanvasWidth = $derived(
		canvasConfig.width === 'auto'
			? Math.ceil(actualContentWidth + canvasConfig.padding * 2)
			: canvasConfig.width
	);
	const requestedCanvasHeight = $derived(
		canvasConfig.height === 'auto'
			? Math.ceil(actualContentHeight + canvasConfig.padding * 2)
			: canvasConfig.height
	);

	const minCanvasWidth = $derived(actualContentWidth);
	const minCanvasHeight = $derived(actualContentHeight);
	
	// 当 canvas 尺寸接近最小值时，精确匹配内容尺寸
	const canvasWidth = $derived.by(() => {
		if (requestedCanvasWidth <= minCanvasWidth + 1) {
			return minCanvasWidth;
		}
		return Math.max(requestedCanvasWidth, minCanvasWidth);
	});
	const canvasHeight = $derived.by(() => {
		if (requestedCanvasHeight <= minCanvasHeight + 1) {
			return minCanvasHeight;
		}
		return Math.max(requestedCanvasHeight, minCanvasHeight);
	});

	// ========== Derived: Resizer Positions ==========
	const rowResizerPositions = $derived.by(() => {
		const positions: number[] = [];
		let currentTop = needsTopDoubleLine ? DOUBLE_LINE_HEIGHT : 0;
		for (let i = 0; i < tableData.rowHeights.length; i++) {
			const height = domRowHeights[i] ?? tableData.rowHeights[i] ?? 32;
			currentTop += height;
			positions.push(currentTop);
		}
		return positions;
	});

	const colResizerPositions = $derived.by(() => {
		const positions: number[] = [];
		let currentLeft = 0;
		for (const width of tableData.columnWidths) {
			currentLeft += width;
			positions.push(currentLeft);
		}
		return positions;
	});

	const colOffsets = $derived.by(() => {
		const offsets: number[] = [0];
		let currentLeft = 0;
		for (const width of tableData.columnWidths) {
			currentLeft += width;
			offsets.push(currentLeft);
		}
		return offsets;
	});

	// ========== Derived: Segment Lines ==========
	const segmentLines = $derived.by(() => {
		const lines: { id: number; left: number; top: number; width: number; borderWidth: number; borderStyle: string }[] = [];
		const rowCount = tableData.rows.length;
		const colCount = tableData.columnWidths.length;
		if (rowCount === 0 || colCount === 0) return lines;

		const segments = tableData.segments ?? [];
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const atRow = Math.max(-1, Math.min(segment.atRow, rowCount - 1));
			const startCol = Math.max(0, Math.min(segment.startCol, colCount - 1));
			const endCol = Math.max(startCol, Math.min(segment.endCol, colCount - 1));
			const left = colOffsets[startCol] ?? 0;
			const right = colOffsets[endCol + 1] ?? left;
			const trimLeft = segment.trimLeft === 'short' ? SEGMENT_TRIM_PX : 0;
			const trimRight = segment.trimRight === 'short' ? SEGMENT_TRIM_PX : 0;
			const width = Math.max(0, right - left - trimLeft - trimRight);
			if (width <= 0) continue;
			const rawTop =
				atRow < 0
					? needsTopDoubleLine
						? DOUBLE_LINE_HEIGHT
						: 0
					: (rowResizerPositions[atRow] ?? 0);
			const styleKey = segment.style ?? 'thin';
			lines.push({
				id: i,
				left: left + trimLeft,
				top: rawTop - (needsTopDoubleLine ? DOUBLE_LINE_HEIGHT : 0),
				width,
				borderWidth: SEGMENT_WIDTH_MAP[styleKey] ?? 1,
				borderStyle: SEGMENT_STYLE_MAP[styleKey] ?? 'solid'
			});
		}
		return lines;
	});

	// ========== Event Handlers ==========
	function handleColumnResize(colIndex: number, delta: number) {
		const currentWidth = tableData.columnWidths[colIndex] || 100;
		const newWidth = Math.max(40, currentWidth + delta);
		onColumnResize?.(colIndex, newWidth);
	}

	function handleRowResize(rowIndex: number, delta: number) {
		const currentSetting = tableData.rowHeights[rowIndex] || 32;
		const newHeight = Math.max(32, currentSetting + delta);
		onRowResize?.(rowIndex, newHeight);
	}

	// ========== Canvas Resize ==========
	let isCanvasResizing = $state(false);
	let resizeCorner = $state<'nw' | 'ne' | 'sw' | 'se' | null>(null);
	let startX = 0;
	let startY = 0;
	let startWidth = 0;
	let startHeight = 0;

	function handleCanvasResizeStart(e: MouseEvent, corner: 'nw' | 'ne' | 'sw' | 'se') {
		e.preventDefault();
		isCanvasResizing = true;
		resizeCorner = corner;
		startX = e.clientX;
		startY = e.clientY;
		startWidth = canvasWidth;
		startHeight = canvasHeight;
		document.addEventListener('mousemove', handleCanvasResizeMove);
		document.addEventListener('mouseup', handleCanvasResizeEnd);
	}

	function handleCanvasResizeMove(e: MouseEvent) {
		if (!isCanvasResizing || !resizeCorner) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		let nextWidth = startWidth;
		let nextHeight = startHeight;

		if (resizeCorner === 'se') { nextWidth = startWidth + dx; nextHeight = startHeight + dy; }
		else if (resizeCorner === 'sw') { nextWidth = startWidth - dx; nextHeight = startHeight + dy; }
		else if (resizeCorner === 'ne') { nextWidth = startWidth + dx; nextHeight = startHeight - dy; }
		else if (resizeCorner === 'nw') { nextWidth = startWidth - dx; nextHeight = startHeight - dy; }

		nextWidth = Math.max(minCanvasWidth, Math.round(nextWidth));
		nextHeight = Math.max(minCanvasHeight, Math.round(nextHeight));
		onCanvasResize?.({ width: nextWidth, height: nextHeight });
	}

	function handleCanvasResizeEnd() {
		isCanvasResizing = false;
		resizeCorner = null;
		document.removeEventListener('mousemove', handleCanvasResizeMove);
		document.removeEventListener('mouseup', handleCanvasResizeEnd);
	}

	$effect(() => {
		if (canvasConfig.width !== 'auto' && canvasConfig.width < minCanvasWidth) {
			onCanvasResize?.({ width: minCanvasWidth });
		}
		if (canvasConfig.height !== 'auto' && canvasConfig.height < minCanvasHeight) {
			onCanvasResize?.({ height: minCanvasHeight });
		}
	});
</script>

<!-- Canvas: the exportable area -->
<div
	class="canvas-wrapper"
	bind:this={canvasElement}
	style:background-color={canvasConfig.backgroundColor}
	style:width="{canvasWidth}px"
	style:height="{canvasHeight}px"
>
	<!-- Content: table + double lines, used for size measurement -->
	<div 
		class="table-content"
		bind:this={contentElement}
		bind:clientWidth={domContentWidth}
		bind:clientHeight={domContentHeight}
	>
		<!-- Top double line (if needed) -->
		{#if needsTopDoubleLine}
			<div 
				class="double-line double-line-top {topBorderType}"
				style:width="{tableWidth}px"
			></div>
		{/if}

		<!-- Table wrapper for segment lines overlay -->
		<div class="table-wrapper" style:width="{tableWidth}px">
			<!-- Segment lines layer -->
			<div class="segment-layer">
				{#each segmentLines as segment}
					<div
						class="segment-line"
						style:left="{segment.left}px"
						style:top="{segment.top}px"
						style:width="{segment.width}px"
						style:--segment-width="{segment.borderWidth}px"
						style:--segment-style={segment.borderStyle}
					></div>
				{/each}
			</div>

			<!-- The actual table -->
			<table
				class="academic-table preset-{tableStyle.preset}"
				style:width="{tableWidth}px"
				style:font-family={fontFamily}
				style:font-size="{tableStyle.fontSize}pt"
				style:--cell-padding="{cellPadding}px"
				style:--border-top="{BORDER_WIDTH_MAP[topBorderType]}px"
				style:--border-bottom="{BORDER_WIDTH_MAP[bottomBorderType]}px"
				style:--border-header="{BORDER_WIDTH_MAP[tableStyle.borders.headerBottom]}px"
				style:--border-top-style={BORDER_STYLE_MAP[topBorderType]}
				style:--border-bottom-style={BORDER_STYLE_MAP[bottomBorderType]}
				style:--border-header-style={BORDER_STYLE_MAP[tableStyle.borders.headerBottom]}
			>
				<colgroup>
					{#each tableData.columnWidths as width}
						<col style:width="{width}px" />
					{/each}
				</colgroup>

				<thead>
					{#each tableData.rows.slice(0, headerRowCount) as row, rowIndex}
						{@const visibleCells = row.map((c, i) => ({ cell: c, colIndex: i })).filter(x => !x.cell.isMerged)}
						<tr 
							style:height="{tableData.rowHeights[rowIndex] || 32}px"
							bind:clientHeight={domRowHeights[rowIndex]}
						>
							{#each row as cell, colIndex}
								{#if !cell.isMerged}
									{@const isFirstCell = visibleCells[0]?.colIndex === colIndex}
									{@const lastVisibleIdx = visibleCells[visibleCells.length - 1]?.colIndex ?? -1}
									{@const cellEndCol = colIndex + (cell.colspan && cell.colspan > 1 ? cell.colspan - 1 : 0)}
									{@const isLastCell = cellEndCol >= row.length - 1 || cellEndCol >= lastVisibleIdx + (row[lastVisibleIdx]?.colspan ?? 1) - 1}
									<th
										class="table-cell"
										class:text-left={cell.align === 'left'}
										class:text-center={cell.align === 'center' || !cell.align}
										class:text-right={cell.align === 'right' || cell.align === 'decimal'}
										class:font-bold={cell.isBold}
										class:italic={cell.isItalic}
										style:background-color={cell.backgroundColor}
										style:box-shadow={getCellBgExtendStyle(cell.backgroundColor, isFirstCell, isLastCell)}
										style:color={cell.textColor}
										colspan={cell.colspan && cell.colspan > 1 ? cell.colspan : undefined}
										rowspan={cell.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
									>
										<TableCell {cell} isHeader={true} onupdate={(content) => onCellUpdate?.(rowIndex, colIndex, content)} />
									</th>
								{/if}
							{/each}
						</tr>
					{/each}
				</thead>

				<tbody>
					{#each tableData.rows.slice(headerRowCount) as row, rowIndex}
						{@const visibleCells = row.map((c, i) => ({ cell: c, colIndex: i })).filter(x => !x.cell.isMerged)}
						<tr 
							style:height="{tableData.rowHeights[rowIndex + headerRowCount] || 32}px"
							bind:clientHeight={domRowHeights[rowIndex + headerRowCount]}
						>
							{#each row as cell, colIndex}
								{#if !cell.isMerged}
									{@const isFirstCell = visibleCells[0]?.colIndex === colIndex}
									{@const lastVisibleIdx = visibleCells[visibleCells.length - 1]?.colIndex ?? -1}
									{@const cellEndCol = colIndex + (cell.colspan && cell.colspan > 1 ? cell.colspan - 1 : 0)}
									{@const isLastCell = cellEndCol >= row.length - 1 || cellEndCol >= lastVisibleIdx + (row[lastVisibleIdx]?.colspan ?? 1) - 1}
									<td
										class="table-cell"
										class:text-left={cell.align === 'left'}
										class:text-center={cell.align === 'center' || !cell.align}
										class:text-right={cell.align === 'right' || cell.align === 'decimal'}
										class:font-bold={cell.isBold}
										class:italic={cell.isItalic}
										style:background-color={cell.backgroundColor}
										style:box-shadow={getCellBgExtendStyle(cell.backgroundColor, isFirstCell, isLastCell)}
										style:color={cell.textColor}
										colspan={cell.colspan && cell.colspan > 1 ? cell.colspan : undefined}
										rowspan={cell.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
									>
										<TableCell {cell} onupdate={(content) => onCellUpdate?.(rowIndex + headerRowCount, colIndex, content)} />
									</td>
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Bottom double line (if needed) -->
		{#if needsBottomDoubleLine}
			<div 
				class="double-line double-line-bottom {bottomBorderType}"
				style:width="{tableWidth}px"
			></div>
		{/if}

		<!-- Resizers layer (inside table-content for correct positioning) -->
		<div class="resizers-layer">
			{#each colResizerPositions as left, colIndex}
				<ColumnResizer onResize={(delta) => handleColumnResize(colIndex, delta)} style="left: {left}px" />
			{/each}
			{#each rowResizerPositions as top, rowIndex}
				<RowResizer onResize={(delta) => handleRowResize(rowIndex, delta)} style="top: {top}px" />
			{/each}
		</div>
	</div>

	<!-- Canvas resize handles -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer nw" onmousedown={(e) => handleCanvasResizeStart(e, 'nw')}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer ne" onmousedown={(e) => handleCanvasResizeStart(e, 'ne')}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer sw" onmousedown={(e) => handleCanvasResizeStart(e, 'sw')}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer se" onmousedown={(e) => handleCanvasResizeStart(e, 'se')}></div>
</div>
