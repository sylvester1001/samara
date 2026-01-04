<script lang="ts">
	import type { Cell } from '$lib/types';

	interface Props {
		rows: Cell[][];
		selectedCells: { row: number; col: number }[];
		onSelectionChange: (cells: { row: number; col: number }[]) => void;
		onCellChange: (row: number, col: number, content: string) => void;
		onAddRow: () => void;
		onAddColumn: () => void;
		onDeleteRow: (index: number) => void;
		onDeleteColumn: (index: number) => void;
	}

	let {
		rows,
		selectedCells,
		onSelectionChange,
		onCellChange,
		onAddRow,
		onAddColumn,
		onDeleteRow,
		onDeleteColumn
	}: Props = $props();

	const rowCount = $derived(rows.length);
	const colCount = $derived(rows[0]?.length || 0);
	const selectedSet = $derived(new Set(selectedCells.map((cell) => `${cell.row}:${cell.col}`)));
	let selectionAnchor = $state<{ row: number; col: number } | null>(null);

	function handleCellInput(e: Event, rowIndex: number, colIndex: number) {
		const target = e.target as HTMLInputElement;
		onCellChange(rowIndex, colIndex, target.value);
	}

	function handleKeyDown(e: KeyboardEvent, rowIndex: number, colIndex: number) {
		if (e.key === 'Tab') {
			e.preventDefault();
			const nextCol = e.shiftKey ? colIndex - 1 : colIndex + 1;
			const nextRow = e.shiftKey 
				? (nextCol < 0 ? rowIndex - 1 : rowIndex)
				: (nextCol >= colCount ? rowIndex + 1 : rowIndex);
			const finalCol = e.shiftKey
				? (nextCol < 0 ? colCount - 1 : nextCol)
				: (nextCol >= colCount ? 0 : nextCol);
			
			if (nextRow >= 0 && nextRow < rowCount) {
				const nextInput = document.querySelector(
					`[data-row="${nextRow}"][data-col="${finalCol}"]`
				) as HTMLInputElement;
				nextInput?.focus();
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const nextRow = rowIndex + 1;
			if (nextRow < rowCount) {
				const nextInput = document.querySelector(
					`[data-row="${nextRow}"][data-col="${colIndex}"]`
				) as HTMLInputElement;
				nextInput?.focus();
			}
		} else if (e.key === 'ArrowDown') {
			const nextRow = rowIndex + 1;
			if (nextRow < rowCount) {
				const nextInput = document.querySelector(
					`[data-row="${nextRow}"][data-col="${colIndex}"]`
				) as HTMLInputElement;
				nextInput?.focus();
			}
		} else if (e.key === 'ArrowUp') {
			const prevRow = rowIndex - 1;
			if (prevRow >= 0) {
				const prevInput = document.querySelector(
					`[data-row="${prevRow}"][data-col="${colIndex}"]`
				) as HTMLInputElement;
				prevInput?.focus();
			}
		}
	}

	function buildRange(start: { row: number; col: number }, end: { row: number; col: number }) {
		const minRow = Math.min(start.row, end.row);
		const maxRow = Math.max(start.row, end.row);
		const minCol = Math.min(start.col, end.col);
		const maxCol = Math.max(start.col, end.col);
		const cells: { row: number; col: number }[] = [];
		for (let r = minRow; r <= maxRow; r++) {
			for (let c = minCol; c <= maxCol; c++) {
				cells.push({ row: r, col: c });
			}
		}
		return cells;
	}

	function handleCellMouseDown(e: MouseEvent, rowIndex: number, colIndex: number) {
		const key = `${rowIndex}:${colIndex}`;
		if (e.shiftKey && selectionAnchor) {
			onSelectionChange(buildRange(selectionAnchor, { row: rowIndex, col: colIndex }));
			return;
		}
		if (e.metaKey || e.ctrlKey) {
			const next = new Set(selectedSet);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			onSelectionChange(
				Array.from(next).map((item) => {
					const [row, col] = item.split(':').map(Number);
					return { row, col };
				})
			);
			return;
		}
		selectionAnchor = { row: rowIndex, col: colIndex };
		onSelectionChange([{ row: rowIndex, col: colIndex }]);
	}

	function isSelected(rowIndex: number, colIndex: number) {
		return selectedSet.has(`${rowIndex}:${colIndex}`);
	}
</script>

<div class="table-editor">
	<div class="editor-toolbar">
		<div class="size-info">{rowCount} x {colCount}</div>
		<div class="toolbar-actions">
			<button class="editor-btn" onclick={onAddRow} title="Add Row">+ Row</button>
			<button class="editor-btn" onclick={onAddColumn} title="Add Column">+ Col</button>
		</div>
	</div>

	<div class="editor-grid-wrapper">
		<table class="editor-grid">
			<thead>
				<tr>
					<th class="corner-cell"></th>
					{#each rows[0] || [] as _, colIndex}
						<th class="col-header">
							<span class="col-label">{String.fromCharCode(65 + colIndex)}</span>
							<button 
								class="delete-btn" 
								onclick={() => onDeleteColumn(colIndex)}
								title="Delete Column"
							>x</button>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row, rowIndex}
					<tr>
						<td class="row-header">
							<span class="row-label">{rowIndex + 1}</span>
							<button 
								class="delete-btn" 
								onclick={() => onDeleteRow(rowIndex)}
								title="Delete Row"
							>x</button>
						</td>
						{#each row as cell, colIndex}
							{#if !cell.isMerged}
								<td
									class="editor-cell"
									class:selected={isSelected(rowIndex, colIndex)}
									class:text-left={cell.align === 'left'}
									class:text-center={cell.align === 'center' || !cell.align}
									class:text-right={cell.align === 'right' || cell.align === 'decimal'}
									class:font-bold={cell.isBold}
									class:italic={cell.isItalic}
									style:background-color={cell.backgroundColor}
									style:color={cell.textColor}
									colspan={cell.colspan}
									rowspan={cell.rowspan}
									onmousedown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
								>
									<input
										type="text"
										class="cell-input"
										value={cell.content}
										data-row={rowIndex}
										data-col={colIndex}
										oninput={(e) => handleCellInput(e, rowIndex, colIndex)}
										onkeydown={(e) => handleKeyDown(e, rowIndex, colIndex)}
									/>
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
