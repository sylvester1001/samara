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
	let isDragging = $state(false);

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
		isDragging = true;
		onSelectionChange([{ row: rowIndex, col: colIndex }]);
	}

	function handleCellMouseEnter(rowIndex: number, colIndex: number) {
		if (isDragging && selectionAnchor) {
			onSelectionChange(buildRange(selectionAnchor, { row: rowIndex, col: colIndex }));
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function isSelected(rowIndex: number, colIndex: number) {
		return selectedSet.has(`${rowIndex}:${colIndex}`);
	}
</script>

<div class="flex flex-col h-full bg-white dark:bg-[#18181b] rounded-lg border border-border dark:border-[#27272a] overflow-hidden" onmouseup={handleMouseUp} onmouseleave={handleMouseUp}>
	<div class="flex justify-between items-center px-4 py-3 bg-[#fafafa] dark:bg-[#0a0a0a] border-b border-border dark:border-[#27272a] shrink-0 relative z-0">
		<div class="text-[13px] text-muted-foreground font-medium">{rowCount} x {colCount}</div>
		<div class="flex gap-2">
			<button class="px-3 py-1.5 text-[13px] font-medium text-foreground bg-white dark:bg-[#27272a] border border-border dark:border-[#3f3f46] rounded-md cursor-pointer transition-all hover:bg-[#f4f4f5] dark:hover:bg-[#3f3f46]" onclick={onAddRow} title="Add Row">+ Row</button>
			<button class="px-3 py-1.5 text-[13px] font-medium text-foreground bg-white dark:bg-[#27272a] border border-border dark:border-[#3f3f46] rounded-md cursor-pointer transition-all hover:bg-[#f4f4f5] dark:hover:bg-[#3f3f46]" onclick={onAddColumn} title="Add Column">+ Col</button>
		</div>
	</div>

	<div class="flex-1 overflow-auto p-4 min-h-0 relative z-10">
		<table class="border-collapse w-auto">
			<thead>
				<tr>
					<th class="w-10 min-w-10 bg-[#f4f4f5] dark:bg-[#27272a]"></th>
					{#each rows[0] || [] as _, colIndex}
						<th class="relative min-w-[100px] px-3 py-2 bg-[#f4f4f5] dark:bg-[#27272a] border border-border dark:border-[#3f3f46] text-xs font-semibold text-muted-foreground text-center group">
							<span class="block">{String.fromCharCode(65 + colIndex)}</span>
							<button 
								class="absolute top-0.5 right-0.5 w-4 h-4 p-0 text-[10px] leading-none text-muted-foreground bg-transparent border-none rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-all hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950" 
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
						<td class="relative w-10 min-w-10 px-2 py-2 bg-[#f4f4f5] dark:bg-[#27272a] border border-border dark:border-[#3f3f46] text-xs font-semibold text-muted-foreground text-center group">
							<span class="block">{rowIndex + 1}</span>
							<button 
								class="absolute top-0.5 right-0.5 w-4 h-4 p-0 text-[10px] leading-none text-muted-foreground bg-transparent border-none rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-all hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950" 
								onclick={() => onDeleteRow(rowIndex)}
								title="Delete Row"
							>x</button>
						</td>
						{#each row as cell, colIndex}
							{#if !cell.isMerged}
								<td
									class="p-0 border border-border dark:border-[#3f3f46] relative"
									class:bg-blue-50={isSelected(rowIndex, colIndex)}
									class:dark:bg-[#1e3a5f]={isSelected(rowIndex, colIndex)}
									class:font-bold={cell.isBold}
									class:italic={cell.isItalic}
									style:background-color={!isSelected(rowIndex, colIndex) ? cell.backgroundColor : undefined}
									style:color={cell.textColor}
									colspan={cell.colspan && cell.colspan > 1 ? cell.colspan : undefined}
									rowspan={cell.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
									onmousedown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
									onmouseenter={() => handleCellMouseEnter(rowIndex, colIndex)}
								>
									<input
										type="text"
										class="w-full min-w-[100px] px-2.5 py-2 text-sm bg-transparent border-none outline-none text-inherit font-inherit"
										class:text-left={cell.align === 'left'}
										class:text-center={cell.align === 'center' || !cell.align}
										class:text-right={cell.align === 'right' || cell.align === 'decimal'}
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
