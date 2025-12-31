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
	}

	let { tableData, tableStyle, canvasConfig, onCellUpdate, onColumnResize, onRowResize }: Props = $props();

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
	const tableWidth = $derived(tableData.columnWidths.reduce((sum, w) => sum + w, 0));

	// -----------------------------------------------------------------------
	// 修改核心逻辑
	// -----------------------------------------------------------------------

	// 1. 创建一个状态数组来直接绑定每一行在浏览器中的真实渲染高度
	let domRowHeights: number[] = $state([]);

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

	function handleColumnResize(colIndex: number, delta: number) {
		const currentWidth = tableData.columnWidths[colIndex] || 100;
		const newWidth = Math.max(40, currentWidth + delta); // 最小宽度保护
		onColumnResize?.(colIndex, newWidth);
	}

	function handleRowResize(rowIndex: number, delta: number) {
		const currentSetting = tableData.rowHeights[rowIndex] || 32;
		// 只需要修改数据高度，DOM会自动响应
		// 如果内容很高，tr height 变小不会有视觉变化（被内容撑住），但 Resizer 会正确吸附在底部
		const newHeight = Math.max(32, currentSetting + delta);
		onRowResize?.(rowIndex, newHeight);
	}
</script>

<div
	class="canvas-wrapper"
	style:padding="{canvasConfig.padding}px"
	style:background-color={canvasConfig.backgroundColor}
	style:width={canvasConfig.width === 'auto' ? 'fit-content' : `${canvasConfig.width}px`}
	style:height={canvasConfig.height === 'auto' ? 'fit-content' : `${canvasConfig.height}px`}
>
	<div class="table-container">
		<table
			class={tableClass}
			style:width="{tableWidth}px"
			style:font-family={fontFamily}
			style:font-size="{tableStyle.fontSize}pt"
			style:transform="scale({tableStyle.scale})"
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
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>

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
</div>