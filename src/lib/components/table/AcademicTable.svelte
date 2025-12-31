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

	const fontFamilyMap: Record<string, string> = {
		'computer-modern': '"CMU Serif", serif',
		times: '"Times New Roman", Times, serif',
		arial: 'Arial, Helvetica, sans-serif'
	};

	const paddingMap: Record<string, number> = {
		compact: 4,
		normal: 8,
		loose: 16
	};

	const borderWidthMap: Record<string, number> = {
		none: 0,
		thin: 1,
		thick: 2,
		double: 3
	};

	const fontFamily = $derived(fontFamilyMap[tableStyle.fontFamily]);

	const cellPadding = $derived(
		typeof tableStyle.padding === 'number' ? tableStyle.padding : paddingMap[tableStyle.padding]
	);

	const tableClass = $derived(`academic-table preset-${tableStyle.preset}`);

	const tableWidth = $derived(tableData.columnWidths.reduce((sum, w) => sum + w, 0));

	function handleColumnResize(colIndex: number, delta: number) {
		const currentWidth = tableData.columnWidths[colIndex] || 100;
		const newWidth = Math.max(40, currentWidth + delta);
		onColumnResize?.(colIndex, newWidth);
	}

	function handleRowResize(rowIndex: number, delta: number) {
		const currentHeight = tableData.rowHeights[rowIndex] || 32;
		const newHeight = Math.max(24, currentHeight + delta);
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
				<tr style:height="{tableData.rowHeights[0] || 32}px">
					{#each tableData.rows[0] as cell, colIndex}
						<th
							class="table-cell resizable-cell"
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
							<ColumnResizer onResize={(delta) => handleColumnResize(colIndex, delta)} />
							{#if colIndex === tableData.rows[0].length - 1}
								<RowResizer onResize={(delta) => handleRowResize(0, delta)} />
							{/if}
						</th>
					{/each}
				</tr>
			{/if}
		</thead>
		<tbody>
			{#each tableData.rows.slice(1) as row, rowIndex}
				<tr style:height="{tableData.rowHeights[rowIndex + 1] || 32}px">
					{#each row as cell, colIndex}
						<td
							class="table-cell resizable-cell"
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
							<ColumnResizer onResize={(delta) => handleColumnResize(colIndex, delta)} />
							{#if colIndex === row.length - 1}
								<RowResizer onResize={(delta) => handleRowResize(rowIndex + 1, delta)} />
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
