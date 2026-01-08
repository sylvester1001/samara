<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import TableSizeSelector from './TableSizeSelector.svelte';
	import { Plus } from 'lucide-svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import type { Cell } from '$lib/types';

	interface Props {
		rows: Cell[][];
		selectedCells: { row: number; col: number }[];
		onSelectionChange: (cells: { row: number; col: number }[]) => void;
		onCellChange: (row: number, col: number, content: string) => void;
		onAddRow: (index?: number) => void;
		onAddColumn: (index?: number) => void;
		onDeleteRow: (index: number) => void;
		onDeleteColumn: (index: number) => void;
		onClearSelectedCells?: () => void;
		onResizeTable?: (rows: number, cols: number) => void;
	}

	let {
		rows,
		selectedCells,
		onSelectionChange,
		onCellChange,
		onAddRow,
		onAddColumn,
		onDeleteRow,
		onDeleteColumn,
		onClearSelectedCells,
		onResizeTable
	}: Props = $props();

	const rowCount = $derived(rows.length);
	const colCount = $derived(rows[0]?.length || 0);
	const selectedSet = $derived(new Set(selectedCells.map((cell) => `${cell.row}:${cell.col}`)));
	let selectionAnchor = $state<{ row: number; col: number } | null>(null);
	let isDragging = $state(false);
	const inputPaddingXRem = 1.25;
	let contextCell = $state<{ row: number; col: number } | null>(null);

	const wideCharPattern =
		/[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/;

	function getDisplayLength(value: string) {
		let length = 0;
		for (const char of value) {
			length += wideCharPattern.test(char) ? 2 : 1;
		}
		return length;
	}

	const columnCharWidths = $derived.by(() => {
		const columns = rows[0]?.length || 0;
		const widths = Array(columns).fill(1);
		for (let r = 0; r < rows.length; r++) {
			const row = rows[r] ?? [];
			for (let c = 0; c < columns; c++) {
				const cell = row[c];
				if (!cell || cell.isMerged) continue;
				const content = cell.content ?? '';
				const length = Math.max(1, getDisplayLength(content));
				const colspan = Math.max(1, cell.colspan ?? 1);
				const perColumn = Math.ceil(length / colspan);
				for (let span = 0; span < colspan && c + span < columns; span++) {
					if (perColumn > widths[c + span]) {
						widths[c + span] = perColumn;
					}
				}
			}
		}
		return widths;
	});

	function getColumnWidthStyle(chars: number) {
		return `calc(${chars}ch + ${inputPaddingXRem}rem)`;
	}

	const contextTarget = $derived.by(() => {
		if (contextCell) return contextCell;
		if (selectedCells.length > 0) return selectedCells[0];
		return null;
	});
	const canInsertAtTarget = $derived(!!contextTarget);
	const canDeleteRow = $derived(!!contextTarget && rowCount > 1);
	const canDeleteColumn = $derived(!!contextTarget && colCount > 1);

	function handleCellInput(value: string, rowIndex: number, colIndex: number) {
		onCellChange(rowIndex, colIndex, value);
	}

	function handleContextMenu(e: MouseEvent) {
		const target = (e.target as HTMLElement | null)?.closest('[data-row][data-col]');
		if (!target) return;
		const row = Number(target.getAttribute('data-row'));
		const col = Number(target.getAttribute('data-col'));
		if (Number.isNaN(row) || Number.isNaN(col)) return;
		contextCell = { row, col };
		const key = `${row}:${col}`;
		if (!selectedSet.has(key)) {
			onSelectionChange([{ row, col }]);
		}
	}

	function handleInsertRowAbove() {
		if (!contextTarget) return;
		onAddRow(contextTarget.row);
	}

	function handleInsertRowBelow() {
		if (!contextTarget) return;
		onAddRow(contextTarget.row + 1);
	}

	function handleInsertColumnLeft() {
		if (!contextTarget) return;
		onAddColumn(contextTarget.col);
	}

	function handleInsertColumnRight() {
		if (!contextTarget) return;
		onAddColumn(contextTarget.col + 1);
	}

	function handleDeleteRowContext() {
		if (!contextTarget) return;
		onDeleteRow(contextTarget.row);
	}

	function handleDeleteColumnContext() {
		if (!contextTarget) return;
		onDeleteColumn(contextTarget.col);
	}

	function handleKeyDown(e: KeyboardEvent, rowIndex: number, colIndex: number) {
		// Handle delete/backspace for multi-cell selection
		if ((e.key === 'Backspace' || e.key === 'Delete') && selectedCells.length > 1) {
			e.preventDefault();
			onClearSelectedCells?.();
			return;
		}

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

	function handleEditorClick(e: MouseEvent) {
		if (selectedCells.length === 0) return;
		const target = e.target as HTMLElement;
		// Only clear if clicking on the editor background, not on table cells or inputs
		if (target.closest('table') || target.closest('button') || target.tagName === 'INPUT') {
			return;
		}
		onSelectionChange([]);
		selectionAnchor = null;
	}
</script>

<div class="table-editor flex flex-col h-full bg-white dark:bg-[#18181b] rounded-lg border border-border dark:border-[#27272a] overflow-hidden" onmousedown={handleEditorClick} onmouseup={handleMouseUp} onmouseleave={handleMouseUp}>
	<div class="flex justify-between items-center px-4 py-3 bg-[#fafafa] dark:bg-[#0a0a0a] border-b border-border dark:border-[#27272a] shrink-0 relative z-0">
		<div class="flex items-center gap-2">
			<TableSizeSelector
				currentRows={rowCount}
				currentCols={colCount}
				onSizeChange={(r, c) => onResizeTable?.(r, c)}
			/>
			<span class="text-[13px] text-muted-foreground font-medium">{rowCount} x {colCount}</span>
		</div>
		<div class="flex gap-2">
			<button class="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-foreground bg-white dark:bg-[#27272a] border border-border dark:border-[#3f3f46] rounded-md cursor-pointer transition-all hover:bg-[#f4f4f5] dark:hover:bg-[#3f3f46]" onclick={() => onAddRow()} title="Add Row">
				<Plus class="w-3.5 h-3.5" />
				Row
			</button>
			<button class="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-foreground bg-white dark:bg-[#27272a] border border-border dark:border-[#3f3f46] rounded-md cursor-pointer transition-all hover:bg-[#f4f4f5] dark:hover:bg-[#3f3f46]" onclick={() => onAddColumn()} title="Add Column">
				<Plus class="w-3.5 h-3.5" />
				Col
			</button>
		</div>
	</div>

	<ScrollArea class="flex-1 min-h-0 relative z-10" orientation="both">
		<div class="p-4">
			<ContextMenu.Root>
				<ContextMenu.Trigger class="inline-block" oncontextmenu={handleContextMenu}>
					<table class="border-collapse min-w-max table-auto">
						<colgroup>
							<col style="width: 2.5rem;" />
							{#each columnCharWidths as width}
								<col style:width={getColumnWidthStyle(width)} />
							{/each}
						</colgroup>
						<thead>
							<tr>
								<th class="w-10 min-w-10 bg-[#f4f4f5] dark:bg-[#27272a]"></th>
								{#each rows[0] || [] as _, colIndex}
									<th class="relative px-3 py-2 bg-[#f4f4f5] dark:bg-[#27272a] border border-border dark:border-[#3f3f46] text-xs font-semibold text-muted-foreground text-center group">
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
												data-row={rowIndex}
												data-col={colIndex}
												onmousedown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
												onmouseenter={() => handleCellMouseEnter(rowIndex, colIndex)}
											>
												<input
													type="text"
													class="w-full px-2.5 py-2 text-sm bg-transparent border-none outline-none text-inherit font-inherit"
													class:text-left={cell.align === 'left'}
													class:text-center={cell.align === 'center' || !cell.align}
													class:text-right={cell.align === 'right' || cell.align === 'decimal'}
													value={cell.content}
													data-row={rowIndex}
													data-col={colIndex}
													oninput={(e) => handleCellInput((e.target as HTMLInputElement).value, rowIndex, colIndex)}
													oncompositionupdate={(e) =>
														handleCellInput((e.target as HTMLInputElement).value, rowIndex, colIndex)
													}
													onkeydown={(e) => handleKeyDown(e, rowIndex, colIndex)}
												/>
											</td>
										{/if}
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="w-56">
					<ContextMenu.Sub>
						<ContextMenu.SubTrigger inset>Insert</ContextMenu.SubTrigger>
						<ContextMenu.SubContent class="w-56">
							<ContextMenu.Item inset disabled={!canInsertAtTarget} onclick={handleInsertRowAbove}>
								Insert Row Above
							</ContextMenu.Item>
							<ContextMenu.Item inset disabled={!canInsertAtTarget} onclick={handleInsertRowBelow}>
								Insert Row Below
							</ContextMenu.Item>
							<ContextMenu.Separator />
							<ContextMenu.Item inset disabled={!canInsertAtTarget} onclick={handleInsertColumnLeft}>
								Insert Column Left
							</ContextMenu.Item>
							<ContextMenu.Item inset disabled={!canInsertAtTarget} onclick={handleInsertColumnRight}>
								Insert Column Right
							</ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Sub>
					<ContextMenu.Separator />
					<ContextMenu.Item inset variant="destructive" disabled={!canDeleteRow} onclick={handleDeleteRowContext}>
						Delete Row
					</ContextMenu.Item>
					<ContextMenu.Item inset variant="destructive" disabled={!canDeleteColumn} onclick={handleDeleteColumnContext}>
						Delete Column
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</div>
	</ScrollArea>
</div>
