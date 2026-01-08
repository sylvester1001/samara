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
	}

	let { tableData, tableStyle, canvasConfig, onCellUpdate, onColumnResize, onRowResize, onCanvasResize }: Props = $props();

	// ... (FontFamilyMap, PaddingMap 等常量保持不变，省略以节省空间) ...
    const fontFamilyMap: Record<string, string> = {
		'computer-modern': '"CMU Serif", serif',
		times: '"Times New Roman", Times, serif',
		arial: 'Arial, Helvetica, sans-serif'
	};
    // ... 其他常量 ...
    const borderWidthMap: Record<string, number> = {
		none: 0,
		thin: 1,
		thick: 2,
		double: 3,
		'thick-thin': 3,
		'thin-thick': 3
	};
	const borderStyleMap: Record<string, string> = {
		none: 'none',
		thin: 'solid',
		thick: 'solid',
		double: 'double',
		'thick-thin': 'double',
		'thin-thick': 'double'
	};
	const segmentWidthMap: Record<string, number> = {
		thin: 1,
		thick: 2,
		double: 3
	};
	const segmentStyleMap: Record<string, string> = {
		thin: 'solid',
		thick: 'solid',
		double: 'double'
	};
    const paddingMap: Record<string, number> = {
		compact: 4,
		normal: 8,
		loose: 16
	};
	const segmentTrimPx = 8;

	const fontFamily = $derived(fontFamilyMap[tableStyle.fontFamily]);
	const cellPadding = $derived(
		typeof tableStyle.padding === 'number' ? tableStyle.padding : paddingMap[tableStyle.padding]
	);
	const tableClass = $derived.by(() => {
		const classes = ['academic-table', `preset-${tableStyle.preset}`];
		if (tableStyle.preset === 'booktabs') {
			if (tableStyle.borders.top === 'thick-thin') {
				classes.push('border-top-thick-thin');
			} else if (tableStyle.borders.top === 'thin-thick') {
				classes.push('border-top-thin-thick');
			}
			if (tableStyle.borders.bottom === 'thick-thin') {
				classes.push('border-bottom-thick-thin');
			} else if (tableStyle.borders.bottom === 'thin-thick') {
				classes.push('border-bottom-thin-thick');
			}
		}
		return classes.join(' ');
	});
	const headerRowCount = $derived.by(() => {
		const requested = tableData.headerRows ?? 1;
		return Math.min(Math.max(1, requested), tableData.rows.length);
	});
	// 1. 创建一个状态数组来直接绑定每一行在浏览器中的真实渲染高度
	let domRowHeights: number[] = $state([]);
	let domTableWidth = $state(0);
	let domTableHeight = $state(0);

	const tableWidth = $derived(tableData.columnWidths.reduce((sum, w) => sum + w, 0));
	const tableHeight = $derived.by(() => {
		let total = 0;
		for (let i = 0; i < tableData.rowHeights.length; i++) {
			total += domRowHeights[i] ?? tableData.rowHeights[i] ?? 32;
		}
		return total;
	});
	// 用真实 DOM 尺寸计算最小画布尺寸，避免精度问题
	const actualTableWidth = $derived(domTableWidth || tableWidth);
	const actualTableHeight = $derived(domTableHeight || tableHeight);
	const requestedCanvasWidth = $derived(
		canvasConfig.width === 'auto'
			? Math.ceil(actualTableWidth + canvasConfig.padding * 2)
			: canvasConfig.width
	);
	const requestedCanvasHeight = $derived(
		canvasConfig.height === 'auto'
			? Math.ceil(actualTableHeight + canvasConfig.padding * 2)
			: canvasConfig.height
	);
	const minCanvasWidth = $derived(actualTableWidth);
	const minCanvasHeight = $derived(actualTableHeight);
	const canvasWidth = $derived(Math.max(requestedCanvasWidth, minCanvasWidth));
	const canvasHeight = $derived(Math.max(requestedCanvasHeight, minCanvasHeight));

	// -----------------------------------------------------------------------
	// 修改核心逻辑
	// -----------------------------------------------------------------------

	// 2. 计算累计位置 (Top值)，用于定位 Resizer
	// 这里依赖 domRowHeights 的实时变化
	const rowResizerPositions = $derived.by(() => {
		const positions: number[] = [];
		let currentTop = 0;
		
		// 遍历所有行配置
		for (let i = 0; i < tableData.rowHeights.length; i++) {
			// 优先取真实渲染高度(domRowHeights)，如果还没渲染出来，取设定高度，再不行取默认值
			const height = domRowHeights[i] ?? tableData.rowHeights[i] ?? 32;
			currentTop += height;
			positions.push(currentTop);
		}
		return positions;
	});

	// 3. 计算列宽位置 (Left值)
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
	const segmentLines = $derived.by(() => {
		const lines: {
			id: number;
			left: number;
			top: number;
			width: number;
			borderWidth: number;
			borderStyle: string;
		}[] = [];
		const rowCount = tableData.rows.length;
		const colCount = tableData.columnWidths.length;
		if (rowCount === 0 || colCount === 0) return lines;

		const segments = tableData.segments ?? [];
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const atRow = Math.max(0, Math.min(segment.atRow, rowCount - 1));
			const startCol = Math.max(0, Math.min(segment.startCol, colCount - 1));
			const endCol = Math.max(startCol, Math.min(segment.endCol, colCount - 1));
			const left = colOffsets[startCol] ?? 0;
			const right = colOffsets[endCol + 1] ?? left;
			const trimLeft = segment.trimLeft === 'short' ? segmentTrimPx : 0;
			const trimRight = segment.trimRight === 'short' ? segmentTrimPx : 0;
			const width = Math.max(0, right - left - trimLeft - trimRight);
			if (width <= 0) continue;
			const top = rowResizerPositions[atRow] ?? 0;
			const styleKey = segment.style ?? 'thin';
			lines.push({
				id: i,
				left: left + trimLeft,
				top,
				width,
				borderWidth: segmentWidthMap[styleKey] ?? 1,
				borderStyle: segmentStyleMap[styleKey] ?? 'solid'
			});
		}
		return lines;
	});

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

		if (resizeCorner === 'se') {
			nextWidth = startWidth + dx;
			nextHeight = startHeight + dy;
		} else if (resizeCorner === 'sw') {
			nextWidth = startWidth - dx;
			nextHeight = startHeight + dy;
		} else if (resizeCorner === 'ne') {
			nextWidth = startWidth + dx;
			nextHeight = startHeight - dy;
		} else if (resizeCorner === 'nw') {
			nextWidth = startWidth - dx;
			nextHeight = startHeight - dy;
		}

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

<div
	class="canvas-wrapper"
	style:background-color={canvasConfig.backgroundColor}
	style:width="{canvasWidth}px"
	style:height="{canvasHeight}px"
>
	<div class="table-container" bind:clientWidth={domTableWidth} bind:clientHeight={domTableHeight}>
		<div class="table-inner">
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
			<table
				class={tableClass}
				style:width="{tableWidth}px"
				style:font-family={fontFamily}
				style:font-size="{tableStyle.fontSize}pt"
				style:transform-origin="top left"
				style:--cell-padding="{cellPadding}px"
				style:--border-top="{borderWidthMap[tableStyle.borders.top]}px"
				style:--border-bottom="{borderWidthMap[tableStyle.borders.bottom]}px"
				style:--border-header="{borderWidthMap[tableStyle.borders.headerBottom]}px"
				style:--border-vertical="{borderWidthMap[tableStyle.borders.vertical]}px"
				style:--border-horizontal="{borderWidthMap[tableStyle.borders.horizontal]}px"
				style:--border-top-style={borderStyleMap[tableStyle.borders.top]}
				style:--border-bottom-style={borderStyleMap[tableStyle.borders.bottom]}
				style:--border-header-style={borderStyleMap[tableStyle.borders.headerBottom]}
				style:--border-vertical-style={borderStyleMap[tableStyle.borders.vertical]}
				style:--border-horizontal-style={borderStyleMap[tableStyle.borders.horizontal]}
			>
				<colgroup>
					{#each tableData.columnWidths as width}
						<col style:width="{width}px" />
					{/each}
				</colgroup>
			
			<thead>
				{#each tableData.rows.slice(0, headerRowCount) as row, rowIndex}
					<tr 
						style:height="{tableData.rowHeights[rowIndex] || 32}px"
						bind:clientHeight={domRowHeights[rowIndex]} 
					>
						{#each row as cell, colIndex}
							{#if !cell.isMerged}
								<th
									class="table-cell"
									class:text-left={cell.align === 'left'}
									class:text-center={cell.align === 'center' || !cell.align}
									class:text-right={cell.align === 'right' || cell.align === 'decimal'}
									class:font-bold={cell.isBold}
									class:italic={cell.isItalic}
									style:background-color={cell.backgroundColor}
									style:color={cell.textColor}
									colspan={cell.colspan && cell.colspan > 1 ? cell.colspan : undefined}
									rowspan={cell.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
								>
									<TableCell
										{cell}
										isHeader={true}
										onupdate={(content) => onCellUpdate?.(rowIndex, colIndex, content)}
									/>
								</th>
							{/if}
						{/each}
					</tr>
				{/each}
			</thead>

			<tbody>
				{#each tableData.rows.slice(headerRowCount) as row, rowIndex}
					<tr 
						style:height="{tableData.rowHeights[rowIndex + headerRowCount] || 32}px"
						bind:clientHeight={domRowHeights[rowIndex + headerRowCount]}
					>
						{#each row as cell, colIndex}
							{#if !cell.isMerged}
								<td
									class="table-cell"
									class:text-left={cell.align === 'left'}
									class:text-center={cell.align === 'center' || !cell.align}
									class:text-right={cell.align === 'right' || cell.align === 'decimal'}
									class:font-bold={cell.isBold}
									class:italic={cell.isItalic}
									style:background-color={cell.backgroundColor}
									style:color={cell.textColor}
									colspan={cell.colspan && cell.colspan > 1 ? cell.colspan : undefined}
									rowspan={cell.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
								>
									<TableCell
										{cell}
										onupdate={(content) => onCellUpdate?.(rowIndex + headerRowCount, colIndex, content)}
									/>
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
			</table>
		</div>

		{#each colResizerPositions as left, colIndex}
			<ColumnResizer 
				onResize={(delta) => handleColumnResize(colIndex, delta)} 
				style="left: {left}px"
			/>
		{/each}

		{#each rowResizerPositions as top, rowIndex}
			<RowResizer 
				onResize={(delta) => handleRowResize(rowIndex, delta)} 
				style="top: {top}px"
			/>
		{/each}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer nw" onmousedown={(e) => handleCanvasResizeStart(e, 'nw')}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer ne" onmousedown={(e) => handleCanvasResizeStart(e, 'ne')}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer sw" onmousedown={(e) => handleCanvasResizeStart(e, 'sw')}></div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas-resizer se" onmousedown={(e) => handleCanvasResizeStart(e, 'se')}></div>
</div>
