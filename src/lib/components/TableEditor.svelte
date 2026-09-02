<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import TableSizeSelector from './TableSizeSelector.svelte';
	import { Plus } from 'lucide-svelte';
	import { tick } from 'svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import type { Cell } from '$lib/types';
	import type { LineEdge } from '$lib/utils/table-geometry';

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
		headerRows?: number;
		headerAdjustMode?: boolean;
		onHeaderRowsChange?: (count: number, recordHistory?: boolean) => void;
		onHeaderRowsCommit?: () => void;
		onHeaderAdjustModeChange?: (open: boolean) => void;
		onMergeCells?: () => void;
		onUnmergeCells?: () => void;
		onAddLine?: (edge: LineEdge) => void;
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
		onResizeTable,
		headerRows = 1,
		headerAdjustMode = false,
		onHeaderRowsChange,
		onHeaderRowsCommit,
		onHeaderAdjustModeChange,
		onMergeCells,
		onUnmergeCells,
		onAddLine
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
	const canMerge = $derived(selectedCells.length > 1);
	const canUnmerge = $derived.by(() => {
		for (const { row, col } of selectedCells) {
			const cell = rows[row]?.[col];
			if (!cell) continue;
			if ((cell.colspan ?? 1) > 1 || (cell.rowspan ?? 1) > 1 || cell.isMerged) return true;
		}
		return false;
	});
	const canAddLine = $derived(selectedCells.length > 0);

	let gridWrap: HTMLElement | null = $state(null);
	let headerBox = $state({ top: 0, left: 0, width: 0, height: 0 });
	let headerDragStart = 1;
	let headerDragCount = 1;

	function measureHeaderBox() {
		if (!gridWrap || !headerAdjustMode) return;
		const first = gridWrap.querySelector<HTMLElement>('tr[data-table-row="0"]');
		const lastIndex = Math.max(0, headerRows - 1);
		const last = gridWrap.querySelector<HTMLElement>(`tr[data-table-row="${lastIndex}"]`);
		if (!first || !last) return;
		const wrapRect = gridWrap.getBoundingClientRect();
		const firstRect = first.getBoundingClientRect();
		const lastRect = last.getBoundingClientRect();
		headerBox = {
			top: firstRect.top - wrapRect.top,
			left: firstRect.left - wrapRect.left,
			width: firstRect.width,
			height: lastRect.bottom - firstRect.top
		};
	}

	$effect(() => {
		if (!headerAdjustMode) return;
		headerRows;
		rowCount;
		void tick().then(measureHeaderBox);
		const onScroll = () => measureHeaderBox();
		const scrollRoot = gridWrap?.closest('[data-slot="scroll-area-viewport"]') ?? gridWrap?.parentElement;
		scrollRoot?.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onScroll);
		const observer = new ResizeObserver(onScroll);
		if (gridWrap) observer.observe(gridWrap);
		return () => {
			scrollRoot?.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onScroll);
			observer.disconnect();
		};
	});

	function handleHeaderDragStart(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		headerDragStart = headerRows;
		headerDragCount = headerRows;
		const onMove = (ev: MouseEvent) => {
			if (!gridWrap) return;
			const rowEls = [...gridWrap.querySelectorAll<HTMLElement>('tr[data-table-row]')];
			let next = 1;
			for (let i = 0; i < rowEls.length; i++) {
				const rect = rowEls[i].getBoundingClientRect();
				if (ev.clientY >= rect.top + rect.height * 0.3) next = i + 1;
			}
			headerDragCount = next;
			onHeaderRowsChange?.(next, false);
		};
		const onUp = () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
			if (headerDragCount !== headerDragStart) onHeaderRowsCommit?.();
		};
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}

	function handleHeaderAdjustKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && headerAdjustMode) {
			onHeaderAdjustModeChange?.(false);
		}
	}

	function handleCellInput(value: string, rowIndex: number, colIndex: number) {
		onCellChange(rowIndex, colIndex, value);
	}

	// Auto-resize textarea height (fallback for browsers without field-sizing support)
	function autoResizeTextarea(e: Event) {
		const textarea = e.target as HTMLTextAreaElement;
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
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
					`textarea[data-row="${nextRow}"][data-col="${finalCol}"]`
				) as HTMLTextAreaElement;
				nextInput?.focus();
			}
		} else if (e.key === 'Enter') {
			if (e.shiftKey) {
				// Shift+Enter: jump to next row
				e.preventDefault();
				const nextRow = rowIndex + 1;
				if (nextRow < rowCount) {
					const nextInput = document.querySelector(
						`textarea[data-row="${nextRow}"][data-col="${colIndex}"]`
					) as HTMLTextAreaElement;
					nextInput?.focus();
				}
			}
			// Plain Enter: allow default behavior (insert newline in textarea)
		} else if (e.key === 'ArrowDown') {
			// Only navigate if cursor is at the last line of textarea
			const target = e.target as HTMLTextAreaElement;
			const cursorPos = target.selectionStart;
			const textAfterCursor = target.value.substring(cursorPos);
			if (!textAfterCursor.includes('\n')) {
				e.preventDefault();
				const nextRow = rowIndex + 1;
				if (nextRow < rowCount) {
					const nextInput = document.querySelector(
						`textarea[data-row="${nextRow}"][data-col="${colIndex}"]`
					) as HTMLTextAreaElement;
					nextInput?.focus();
				}
			}
		} else if (e.key === 'ArrowUp') {
			// Only navigate if cursor is at the first line of textarea
			const target = e.target as HTMLTextAreaElement;
			const cursorPos = target.selectionStart;
			const textBeforeCursor = target.value.substring(0, cursorPos);
			if (!textBeforeCursor.includes('\n')) {
				e.preventDefault();
				const prevRow = rowIndex - 1;
				if (prevRow >= 0) {
					const prevInput = document.querySelector(
						`textarea[data-row="${prevRow}"][data-col="${colIndex}"]`
					) as HTMLTextAreaElement;
					prevInput?.focus();
				}
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
		if (headerAdjustMode && rowIndex >= headerRows) {
			onHeaderAdjustModeChange?.(false);
		}
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
		// Only clear if clicking on the editor background, not on table cells, inputs, or color pickers
		if (target.closest('table') || target.closest('button') || target.tagName === 'INPUT' || target.closest('[type="color"]')) {
			return;
		}
		onSelectionChange([]);
		selectionAnchor = null;
	}
</script>

<svelte:window onkeydown={handleHeaderAdjustKeydown} />

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
					<div class="relative inline-block" bind:this={gridWrap}>
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
								<tr
									data-table-row={rowIndex}
									class={rowIndex < headerRows ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''}
								>
									<td class="relative w-10 min-w-10 px-2 py-2 border border-border dark:border-[#3f3f46] text-xs font-semibold text-muted-foreground text-center group {rowIndex < headerRows ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-[#f4f4f5] dark:bg-[#27272a]'}">
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
												class="p-0 border border-border dark:border-[#3f3f46] relative align-middle"
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
												<textarea
													rows="1"
													class="w-full px-2.5 py-2 text-sm bg-transparent border-none outline-none text-inherit font-inherit resize-none overflow-hidden"
													style="field-sizing: content; vertical-align: middle; min-height: 1.5em;"
													class:text-left={cell.align === 'left'}
													class:text-center={cell.align === 'center' || !cell.align}
													class:text-right={cell.align === 'right' || cell.align === 'decimal'}
													data-row={rowIndex}
													data-col={colIndex}
													oninput={(e) => {
														handleCellInput((e.target as HTMLTextAreaElement).value, rowIndex, colIndex);
														autoResizeTextarea(e);
													}}
													onfocus={autoResizeTextarea}
													oncompositionupdate={(e) =>
														handleCellInput((e.target as HTMLTextAreaElement).value, rowIndex, colIndex)
													}
													onkeydown={(e) => handleKeyDown(e, rowIndex, colIndex)}
												>{cell.content}</textarea>
											</td>
										{/if}
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
					{#if headerAdjustMode}
						<div
							data-header-adjust
							class="pointer-events-none absolute z-20 rounded-sm border-2 border-blue-500 bg-blue-500/10"
							style:top="{headerBox.top}px"
							style:left="{headerBox.left}px"
							style:width="{headerBox.width}px"
							style:height="{headerBox.height}px"
						>
							<span class="absolute top-1 left-1 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
								Header
							</span>
							<button
								type="button"
								class="pointer-events-auto absolute bottom-0 left-1/2 z-30 h-2.5 w-8 -translate-x-1/2 translate-y-1/2 cursor-ns-resize rounded-full border-2 border-white bg-blue-500 shadow"
								aria-label="Resize header rows"
								onmousedown={handleHeaderDragStart}
							></button>
						</div>
					{/if}
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="w-56">
					<ContextMenu.Group>
						<ContextMenu.Item inset disabled={!canMerge} onclick={onMergeCells}>
							Merge cells
						</ContextMenu.Item>
						<ContextMenu.Item inset disabled={!canUnmerge} onclick={onUnmergeCells}>
							Unmerge cells
						</ContextMenu.Item>
					</ContextMenu.Group>
					<ContextMenu.Separator />
					<ContextMenu.Group>
						<ContextMenu.Item inset disabled={!canAddLine} onclick={() => onAddLine?.('below')}>
							Line below
						</ContextMenu.Item>
						<ContextMenu.Item inset disabled={!canAddLine} onclick={() => onAddLine?.('above')}>
							Line above
						</ContextMenu.Item>
					</ContextMenu.Group>
					<ContextMenu.Separator />
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
