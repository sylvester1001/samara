<script lang="ts">
	import type { TableData, TableStyle } from '$lib/types';
	import { resolveCell } from '$lib/utils/table-semantics';
	import { renderLatex, hasLatex } from '$lib/utils/katex';
	import type { WindowRange } from '$lib/utils/table-window';
	import { rangeIndices } from '$lib/utils/table-window';

	interface Props {
		tableData: TableData;
		tableStyle: TableStyle;
		headerRowCount: number;
		rowHeights: number[];
		bodyWindow: WindowRange;
		colWindow: WindowRange;
		interactive?: boolean;
		editingCell?: { row: number; col: number } | null;
		editValue?: string;
		onEditValue?: (value: string) => void;
		onStartEdit?: (row: number, col: number, content: string) => void;
		onFinishEdit?: () => void;
		onEditKeydown?: (e: KeyboardEvent) => void;
		tableEl?: HTMLTableElement | null;
		tbodyEl?: HTMLTableSectionElement | null;
		textareaEl?: HTMLTextAreaElement | null;
	}

	let {
		tableData,
		tableStyle,
		headerRowCount,
		rowHeights,
		bodyWindow,
		colWindow,
		interactive = false,
		editingCell = null,
		editValue = '',
		onEditValue,
		onStartEdit,
		onFinishEdit,
		onEditKeydown,
		tableEl = $bindable(null),
		tbodyEl = $bindable(null),
		textareaEl = $bindable(null)
	}: Props = $props();

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

	const CELL_BG_EXTEND_PX = 0.5;

	const fontFamily = $derived(FONT_FAMILY_MAP[tableStyle.fontFamily]);
	const cellPadding = $derived(
		typeof tableStyle.padding === 'number' ? tableStyle.padding : PADDING_MAP[tableStyle.padding]
	);
	const tableWidth = $derived(tableData.columnWidths.reduce((sum, w) => sum + w, 0));
	const topBorderType = $derived(tableStyle.borders.top);
	const bottomBorderType = $derived(tableStyle.borders.bottom);

	const headerIndices = $derived(rangeIndices(0, headerRowCount));
	const bodyIndices = $derived(rangeIndices(bodyWindow.start, bodyWindow.end));
	const colIndices = $derived(rangeIndices(colWindow.start, colWindow.end));
	const showColPadStart = $derived(colWindow.padStart > 0);
	const showColPadEnd = $derived(colWindow.padEnd > 0);
	const colgroupCount = $derived(
		colIndices.length + (showColPadStart ? 1 : 0) + (showColPadEnd ? 1 : 0)
	);

	function alignClass(align: string | undefined): string {
		if (align === 'left') return 'text-left';
		if (align === 'right' || align === 'decimal') return 'text-right';
		return 'text-center';
	}

	function bgExtend(
		bgColor: string | undefined,
		row: { backgroundColor?: string }[],
		colIndex: number
	): string | undefined {
		if (!bgColor || tableStyle.preset === 'bordered') return undefined;
		const shadows: string[] = [];
		if (colIndex > 0 && row[colIndex - 1]?.backgroundColor) {
			shadows.push(`${-CELL_BG_EXTEND_PX}px 0 0 0 ${bgColor}`);
		}
		if (colIndex < row.length - 1 && row[colIndex + 1]?.backgroundColor) {
			shadows.push(`${CELL_BG_EXTEND_PX}px 0 0 0 ${bgColor}`);
		}
		return shadows.length > 0 ? shadows.join(', ') : undefined;
	}

	function handleDoubleClick(e: MouseEvent) {
		if (!interactive || !onStartEdit) return;
		const target = (e.target as HTMLElement | null)?.closest('[data-row][data-col]');
		if (!target) return;
		const row = Number(target.getAttribute('data-row'));
		const col = Number(target.getAttribute('data-col'));
		if (Number.isNaN(row) || Number.isNaN(col)) return;
		const content = tableData.rows[row]?.[col]?.content ?? '';
		onStartEdit(row, col, content);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<table
	bind:this={tableEl}
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
	ondblclick={handleDoubleClick}
>
	<colgroup>
		{#if showColPadStart}
			<col style:width="{colWindow.padStart}px" />
		{/if}
		{#each colIndices as colIndex (colIndex)}
			<col style:width="{tableData.columnWidths[colIndex]}px" />
		{/each}
		{#if showColPadEnd}
			<col style:width="{colWindow.padEnd}px" />
		{/if}
	</colgroup>

	<thead>
		{#each headerIndices as rowIndex (rowIndex)}
			{@const row = tableData.rows[rowIndex] ?? []}
			<tr data-table-row={rowIndex} style:height="{rowHeights[rowIndex] || 32}px">
				{#if showColPadStart}
					<th class="virtual-spacer" aria-hidden="true"></th>
				{/if}
				{#each colIndices as colIndex (colIndex)}
					{@const raw = row[colIndex]}
					{#if raw && !raw.isMerged}
						{@const cell = resolveCell(raw, rowIndex, colIndex, headerRowCount)}
						<th
							class="table-cell {alignClass(cell.effectiveAlign)}"
							class:font-bold={cell.effectiveBold}
							class:font-normal={!cell.effectiveBold}
							class:italic={cell.effectiveItalic}
							style:background-color={cell.backgroundColor}
							style:box-shadow={bgExtend(cell.backgroundColor, row, colIndex)}
							style:color={cell.textColor}
							colspan={cell.colspan > 1 ? cell.colspan : undefined}
							rowspan={cell.rowspan > 1 ? cell.rowspan : undefined}
							data-row={rowIndex}
							data-col={colIndex}
						>
							{#if interactive && editingCell?.row === rowIndex && editingCell?.col === colIndex}
								<textarea
									class="w-full h-full p-0 border-none outline-none font-inherit text-inherit resize-none overflow-hidden bg-transparent"
									bind:this={textareaEl}
									value={editValue}
									oninput={(e) => onEditValue?.((e.currentTarget as HTMLTextAreaElement).value)}
									onblur={onFinishEdit}
									onkeydown={onEditKeydown}
								></textarea>
							{:else if hasLatex(cell.content)}
								{@html renderLatex(cell.content)}
							{:else}
								{cell.content}
							{/if}
						</th>
					{/if}
				{/each}
				{#if showColPadEnd}
					<th class="virtual-spacer" aria-hidden="true"></th>
				{/if}
			</tr>
		{/each}
	</thead>

	<tbody bind:this={tbodyEl}>
		{#if bodyWindow.padStart > 0}
			<tr class="virtual-spacer" aria-hidden="true">
				<td colspan={colgroupCount} style:height="{bodyWindow.padStart}px"></td>
			</tr>
		{/if}
		{#each bodyIndices as rowIndex (rowIndex)}
			{@const row = tableData.rows[rowIndex] ?? []}
			<tr data-table-row={rowIndex} style:height="{rowHeights[rowIndex] || 32}px">
				{#if showColPadStart}
					<td class="virtual-spacer" aria-hidden="true"></td>
				{/if}
				{#each colIndices as colIndex (colIndex)}
					{@const raw = row[colIndex]}
					{#if raw && !raw.isMerged}
						{@const cell = resolveCell(raw, rowIndex, colIndex, headerRowCount)}
						<td
							class="table-cell {alignClass(cell.effectiveAlign)}"
							class:font-bold={cell.effectiveBold}
							class:italic={cell.effectiveItalic}
							style:background-color={cell.backgroundColor}
							style:box-shadow={bgExtend(cell.backgroundColor, row, colIndex)}
							style:color={cell.textColor}
							colspan={cell.colspan > 1 ? cell.colspan : undefined}
							rowspan={cell.rowspan > 1 ? cell.rowspan : undefined}
							data-row={rowIndex}
							data-col={colIndex}
						>
							{#if interactive && editingCell?.row === rowIndex && editingCell?.col === colIndex}
								<textarea
									class="w-full h-full p-0 border-none outline-none font-inherit text-inherit resize-none overflow-hidden bg-transparent"
									bind:this={textareaEl}
									value={editValue}
									oninput={(e) => onEditValue?.((e.currentTarget as HTMLTextAreaElement).value)}
									onblur={onFinishEdit}
									onkeydown={onEditKeydown}
								></textarea>
							{:else if hasLatex(cell.content)}
								{@html renderLatex(cell.content)}
							{:else}
								{cell.content}
							{/if}
						</td>
					{/if}
				{/each}
				{#if showColPadEnd}
					<td class="virtual-spacer" aria-hidden="true"></td>
				{/if}
			</tr>
		{/each}
		{#if bodyWindow.padEnd > 0}
			<tr class="virtual-spacer" aria-hidden="true">
				<td colspan={colgroupCount} style:height="{bodyWindow.padEnd}px"></td>
			</tr>
		{/if}
	</tbody>
</table>
