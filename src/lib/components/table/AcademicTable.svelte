<script lang="ts">
	import type { TableData, TableStyle, CanvasConfig } from '$lib/types';
	import TableCell from './TableCell.svelte';

	interface Props {
		tableData: TableData;
		tableStyle: TableStyle;
		canvasConfig: CanvasConfig;
		onCellUpdate?: (row: number, col: number, content: string) => void;
	}

	let { tableData, tableStyle, canvasConfig, onCellUpdate }: Props = $props();

	const fontFamilyMap = {
		'computer-modern': '"Computer Modern Serif", "CMU Serif", serif',
		times: '"Times New Roman", Times, serif',
		arial: 'Arial, Helvetica, sans-serif'
	};

	const paddingMap = {
		compact: 4,
		normal: 8,
		loose: 16
	};

	const borderWidthMap = {
		none: 0,
		thin: 1,
		thick: 2,
		double: 3
	};

	const cellPadding = $derived(
		typeof tableStyle.padding === 'number' ? tableStyle.padding : paddingMap[tableStyle.padding]
	);

	const tableClass = $derived(`academic-table preset-${tableStyle.preset}`);
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
		style:font-family={fontFamilyMap[tableStyle.fontFamily]}
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
		<thead>
			{#if tableData.rows[0]}
				<tr>
					{#each tableData.rows[0] as cell, colIndex}
						<TableCell
							{cell}
							isHeader={true}
							onupdate={(content) => onCellUpdate?.(0, colIndex, content)}
						/>
					{/each}
				</tr>
			{/if}
		</thead>
		<tbody>
			{#each tableData.rows.slice(1) as row, rowIndex}
				<tr>
					{#each row as cell, colIndex}
						<TableCell
							{cell}
							onupdate={(content) => onCellUpdate?.(rowIndex + 1, colIndex, content)}
						/>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
