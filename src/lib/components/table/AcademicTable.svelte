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
		double: 3
	};
    const paddingMap: Record<string, number> = {
		compact: 4,
		normal: 8,
		loose: 16
	};

	const fontFamily = $derived(fontFamilyMap[tableStyle.fontFamily]);
	const cellPadding = $derived(
		typeof tableStyle.padding === 'number' ? tableStyle.padding : paddingMap[tableStyle.padding]
	);
	const tableClass = $derived(`academic-table preset-${tableStyle.preset}`);
	// 1. 创建一个状态数组来直接绑定每一行在浏览器中的真实渲染高度
	let domRowHeights: number[] = $state([]);

	const tableWidth = $derived(tableData.columnWidths.reduce((sum, w) => sum + w, 0));
	const tableHeight = $derived.by(() => {
		let total = 0;
		for (let i = 0; i < tableData.rowHeights.length; i++) {
			total += domRowHeights[i] ?? tableData.rowHeights[i] ?? 32;
		}
		return total;
	});
	const scaledTableWidth = $derived(tableWidth * tableStyle.scale);
	const scaledTableHeight = $derived(tableHeight * tableStyle.scale);
	const canvasWidth = $derived(
		canvasConfig.width === 'auto' ? scaledTableWidth : canvasConfig.width
	);
	const canvasHeight = $derived(
		canvasConfig.height === 'auto' ? scaledTableHeight : canvasConfig.height
	);

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
	const scaledRowResizerPositions = $derived.by(() =>
		rowResizerPositions.map((pos) => pos * tableStyle.scale)
	);
	const scaledColResizerPositions = $derived.by(() =>
		colResizerPositions.map((pos) => pos * tableStyle.scale)
	);

	function handleColumnResize(colIndex: number, delta: number) {
		const currentWidth = tableData.columnWidths[colIndex] || 100;
		const adjustedDelta = delta / tableStyle.scale;
		const newWidth = Math.max(40, currentWidth + adjustedDelta); // 最小宽度保护
		onColumnResize?.(colIndex, newWidth);
	}

	function handleRowResize(rowIndex: number, delta: number) {
		const currentSetting = tableData.rowHeights[rowIndex] || 32;
		// 只需要修改数据高度，DOM会自动响应
		// 如果内容很高，tr height 变小不会有视觉变化（被内容撑住），但 Resizer 会正确吸附在底部
		const adjustedDelta = delta / tableStyle.scale;
		const newHeight = Math.max(32, currentSetting + adjustedDelta);
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

		nextWidth = Math.max(200, Math.round(nextWidth));
		nextHeight = Math.max(200, Math.round(nextHeight));
		onCanvasResize?.({ width: nextWidth, height: nextHeight });
	}

	function handleCanvasResizeEnd() {
		isCanvasResizing = false;
		resizeCorner = null;
		document.removeEventListener('mousemove', handleCanvasResizeMove);
		document.removeEventListener('mouseup', handleCanvasResizeEnd);
	}
</script>

<div
	class="canvas-wrapper"
	style:padding="{canvasConfig.padding}px"
	style:background-color={canvasConfig.backgroundColor}
	style:width="{canvasConfig.width === 'auto' ? `${canvasWidth}px` : `${canvasConfig.width}px`}"
	style:height="{canvasConfig.height === 'auto' ? `${canvasHeight}px` : `${canvasConfig.height}px`}"
>
	<div class="table-container" style:width="{scaledTableWidth}px" style:height="{scaledTableHeight}px">
		<div class="table-scale" style:transform="scale({tableStyle.scale})">
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
			>
				<colgroup>
					{#each tableData.columnWidths as width}
						<col style:width="{width}px" />
					{/each}
				</colgroup>
			
			<thead>
				{#if tableData.rows[0]}
					<tr 
						style:height="{tableData.rowHeights[0] || 32}px"
						bind:clientHeight={domRowHeights[0]} 
					>
						{#each tableData.rows[0] as cell, colIndex}
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
									colspan={cell.colspan}
									rowspan={cell.rowspan}
								>
									<TableCell
										{cell}
										isHeader={true}
										onupdate={(content) => onCellUpdate?.(0, colIndex, content)}
									/>
								</th>
							{/if}
						{/each}
					</tr>
				{/if}
			</thead>

			<tbody>
				{#each tableData.rows.slice(1) as row, rowIndex}
					<tr 
						style:height="{tableData.rowHeights[rowIndex + 1] || 32}px"
						bind:clientHeight={domRowHeights[rowIndex + 1]}
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
									colspan={cell.colspan}
									rowspan={cell.rowspan}
								>
									<TableCell
										{cell}
										onupdate={(content) => onCellUpdate?.(rowIndex + 1, colIndex, content)}
									/>
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
			</table>
		</div>

		{#each scaledColResizerPositions as left, colIndex}
			<ColumnResizer 
				onResize={(delta) => handleColumnResize(colIndex, delta)} 
				style="left: {left}px"
			/>
		{/each}

		{#each scaledRowResizerPositions as top, rowIndex}
			<RowResizer 
				onResize={(delta) => handleRowResize(rowIndex, delta)} 
				style="top: {top}px"
			/>
		{/each}
	</div>

	<div class="canvas-resizer nw" onmousedown={(e) => handleCanvasResizeStart(e, 'nw')}></div>
	<div class="canvas-resizer ne" onmousedown={(e) => handleCanvasResizeStart(e, 'ne')}></div>
	<div class="canvas-resizer sw" onmousedown={(e) => handleCanvasResizeStart(e, 'sw')}></div>
	<div class="canvas-resizer se" onmousedown={(e) => handleCanvasResizeStart(e, 'se')}></div>
</div>
