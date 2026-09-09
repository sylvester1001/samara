<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import TableSizeSelector from './TableSizeSelector.svelte';
	import AppTooltip from '$lib/components/AppTooltip.svelte';
	import { tick } from 'svelte';
	import {
		Plus,
		X,
		TableCellsMerge,
		TableCellsSplit,
		Minus,
		ArrowUpToLine,
		ArrowDownToLine,
		ArrowLeftToLine,
		ArrowRightToLine,
		Trash2
	} from 'lucide-svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import type { Cell } from '$lib/types';
	import type { LineEdge } from '$lib/utils/table-geometry';
	import { resolveCell } from '$lib/utils/table-semantics';
	import { uiTheme, themeFeatures } from '$lib/stores/ui-theme.svelte.js';
	import CellReticle from './effects/CellReticle.svelte';
	import LineSlice from './effects/LineSlice.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		rows: Cell[][];
		selectedCells: { row: number; col: number }[];
		onSelectionChange: (cells: { row: number; col: number }[]) => void;
		onCellChange: (row: number, col: number, content: string) => void;
		onAddRow: (index?: number) => void;
		onAddColumn: (index?: number) => void;
		onDeleteRow: (index: number) => void;
		onDeleteColumn: (index: number) => void;
		onDeleteRows?: (indices: number[]) => void;
		onDeleteColumns?: (indices: number[]) => void;
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
		draftStatus?: 'saved' | 'saving';
		savePulseKey?: number;
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
		onDeleteRows,
		onDeleteColumns,
		onClearSelectedCells,
		onResizeTable,
		headerRows = 1,
		headerAdjustMode = false,
		onHeaderRowsChange,
		onHeaderRowsCommit,
		onHeaderAdjustModeChange,
		onMergeCells,
		onUnmergeCells,
		onAddLine,
		draftStatus = 'saved',
		savePulseKey = 0
	}: Props = $props();

	const rowCount = $derived(rows.length);
	const colCount = $derived(rows[0]?.length || 0);
	const selectedSet = $derived(new Set(selectedCells.map((cell) => `${cell.row}:${cell.col}`)));

	const textEncoder = new TextEncoder();
	const currentBufferBytes = $derived.by(() => {
		if (!selectedCells || selectedCells.length === 0) {
			return 0;
		}
		let total = 0;
		for (const { row, col } of selectedCells) {
			const cell = rows[row]?.[col];
			if (cell?.content) {
				total += textEncoder.encode(cell.content).length;
			}
		}
		return total;
	});

	const selectionBounds = $derived.by(() => {
		if (!selectedCells || selectedCells.length === 0) return null;
		let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
		for (const c of selectedCells) {
			if (c.row < minR) minR = c.row;
			if (c.row > maxR) maxR = c.row;
			if (c.col < minC) minC = c.col;
			if (c.col > maxC) maxC = c.col;
		}
		return { minR, maxR, minC, maxC };
	});

	const posDisplay = $derived.by(() => {
		if (!selectedCells || selectedCells.length === 0 || !selectionBounds) {
			return 'STANDBY';
		}
		if (selectedCells.length === 1) {
			const { row, col } = selectedCells[0];
			const colLetter = String.fromCharCode(65 + col);
			return `${colLetter}${row + 1}`;
		}
		const { minR: minRow, maxR: maxRow, minC: minCol, maxC: maxCol } = selectionBounds;
		const start = `${String.fromCharCode(65 + minCol)}${minRow + 1}`;
		const end = `${String.fromCharCode(65 + maxCol)}${maxRow + 1}`;
		return `${start}:${end} (${selectedCells.length})`;
	});
	let selectionAnchor = $state<{ row: number; col: number } | null>(null);
	let isDragging = $state(false);
	let dragStartCell = $state<{ row: number; col: number } | null>(null);
	let tableElement: HTMLTableElement | null = $state(null);
	let cachedColBounds: { left: number; right: number }[] | null = null;
	let cachedRowBounds: { top: number; bottom: number }[] | null = null;
	let lastHoverRow: number | null = null;
	let lastHoverCol: number | null = null;
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

	const rowGutterWidth = $derived.by(() => {
		const digits = Math.max(String(Math.max(rowCount, 1)).length, 2);
		return `calc(${digits}ch + 1rem)`;
	});
	const dataColWidth = $derived(
		colCount > 0 ? `calc((100% - ${rowGutterWidth}) / ${colCount})` : 'auto'
	);

	const contextTarget = $derived.by(() => {
		if (contextCell) return contextCell;
		if (selectedCells.length > 0) return selectedCells[0];
		return null;
	});
	const canInsertAtTarget = $derived(!!contextTarget);

	const selectedRowIndices = $derived.by(() => {
		if (selectedCells.length > 0) {
			return Array.from(new Set(selectedCells.map((c) => c.row))).sort((a, b) => a - b);
		}
		if (contextCell) {
			return [contextCell.row];
		}
		return [];
	});

	const selectedColIndices = $derived.by(() => {
		if (selectedCells.length > 0) {
			return Array.from(new Set(selectedCells.map((c) => c.col))).sort((a, b) => a - b);
		}
		if (contextCell) {
			return [contextCell.col];
		}
		return [];
	});

	const canDeleteRows = $derived(
		selectedRowIndices.length > 0 && rowCount > selectedRowIndices.length
	);
	const canDeleteColumns = $derived(
		selectedColIndices.length > 0 && colCount > selectedColIndices.length
	);
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

	interface LaserSlice {
		type: 'row' | 'col';
		top: number;
		left: number;
		width: number;
		height: number;
		headerW: number;
		headerH: number;
		key: number;
	}

	const LINE_SLICE_MS = 360;

	let activeLaser = $state<LaserSlice | null>(null);
	let activeLaserTimer: ReturnType<typeof setTimeout> | null = null;

	function armLaser(slice: LaserSlice) {
		if (activeLaserTimer) clearTimeout(activeLaserTimer);
		activeLaser = slice;
		activeLaserTimer = setTimeout(() => {
			activeLaser = null;
		}, LINE_SLICE_MS);
	}

	async function executeAddRow(index?: number) {
		const targetIndex = index ?? (selectionBounds ? selectionBounds.maxR + 1 : rowCount);
		onAddRow(targetIndex);

		if (!themeFeatures[uiTheme.theme]?.lineSliceTransition || !gridWrap) return;
		await tick();

		const rowEl = gridWrap.querySelector<HTMLElement>(`tr[data-table-row="${targetIndex}"]`);
		const wrapRect = gridWrap.getBoundingClientRect();
		if (!rowEl) return;
		const rowRect = rowEl.getBoundingClientRect();
		const gutterEl = rowEl.querySelector<HTMLElement>('td:first-child');
		const gutterRect = gutterEl?.getBoundingClientRect();

		armLaser({
			type: 'row',
			top: rowRect.top - wrapRect.top,
			left: rowRect.left - wrapRect.left,
			width: rowRect.width,
			height: rowRect.height,
			headerW: gutterRect?.width ?? rowRect.height,
			headerH: gutterRect?.height ?? rowRect.height,
			key: Date.now()
		});
	}

	async function executeAddColumn(index?: number) {
		const targetIndex = index ?? (selectionBounds ? selectionBounds.maxC + 1 : colCount);
		onAddColumn(targetIndex);

		if (!themeFeatures[uiTheme.theme]?.lineSliceTransition || !gridWrap) return;
		await tick();

		const colHeader = gridWrap.querySelector<HTMLElement>(`thead th:nth-child(${targetIndex + 2})`);
		const tableEl = gridWrap.querySelector<HTMLElement>('table');
		const wrapRect = gridWrap.getBoundingClientRect();
		if (!colHeader || !tableEl) return;

		const colRect = colHeader.getBoundingClientRect();
		const tableRect = tableEl.getBoundingClientRect();

		armLaser({
			type: 'col',
			top: tableRect.top - wrapRect.top,
			left: colRect.left - wrapRect.left,
			width: colRect.width,
			height: tableRect.height,
			headerW: colRect.width,
			headerH: colRect.height,
			key: Date.now()
		});
	}

	function handleInsertRowAbove() {
		if (!contextTarget) return;
		executeAddRow(contextTarget.row);
	}

	function handleInsertRowBelow() {
		if (!contextTarget) return;
		executeAddRow(contextTarget.row + 1);
	}

	function handleInsertColumnLeft() {
		if (!contextTarget) return;
		executeAddColumn(contextTarget.col);
	}

	function handleInsertColumnRight() {
		if (!contextTarget) return;
		executeAddColumn(contextTarget.col + 1);
	}

	function handleDeleteRowsContext() {
		if (selectedRowIndices.length === 0) return;
		if (onDeleteRows) {
			onDeleteRows(selectedRowIndices);
		} else {
			selectedRowIndices.slice().reverse().forEach((r) => onDeleteRow(r));
		}
	}

	function handleDeleteColumnsContext() {
		if (selectedColIndices.length === 0) return;
		if (onDeleteColumns) {
			onDeleteColumns(selectedColIndices);
		} else {
			selectedColIndices.slice().reverse().forEach((c) => onDeleteColumn(c));
		}
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
		if (e.button !== 0) {
			if (e.button === 2) {
				contextCell = { row: rowIndex, col: colIndex };
				const key = `${rowIndex}:${colIndex}`;
				if (!selectedSet.has(key)) {
					onSelectionChange([{ row: rowIndex, col: colIndex }]);
				}
			}
			return;
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
		dragStartCell = { row: rowIndex, col: colIndex };
		selectionAnchor = { row: rowIndex, col: colIndex };
		lastHoverRow = rowIndex;
		lastHoverCol = colIndex;
		measureTableGrid();

		if (!isSelected(rowIndex, colIndex) || selectedCells.length > 1) {
			onSelectionChange([{ row: rowIndex, col: colIndex }]);
		}
	}

	function measureTableGrid() {
		if (!tableElement) return;
		const tableRect = tableElement.getBoundingClientRect();
		const ths = tableElement.querySelectorAll<HTMLTableCellElement>('thead tr th[data-col]');
		const colBounds: { left: number; right: number }[] = [];
		ths.forEach((th) => {
			const rect = th.getBoundingClientRect();
			colBounds.push({
				left: rect.left - tableRect.left,
				right: rect.right - tableRect.left
			});
		});

		const trs = tableElement.querySelectorAll<HTMLTableRowElement>('tbody tr[data-table-row]');
		const rowBounds: { top: number; bottom: number }[] = [];
		trs.forEach((tr) => {
			const rect = tr.getBoundingClientRect();
			rowBounds.push({
				top: rect.top - tableRect.top,
				bottom: rect.bottom - tableRect.top
			});
		});

		cachedColBounds = colBounds;
		cachedRowBounds = rowBounds;
	}

	function handleWindowMouseMove(e: MouseEvent) {
		if (e.buttons === 0 && (dragStartCell || isDragging)) {
			handleWindowMouseUp();
			return;
		}
		if (!dragStartCell || !cachedColBounds || !cachedRowBounds || !tableElement) return;

		const tableRect = tableElement.getBoundingClientRect();
		const mouseX = e.clientX - tableRect.left;
		const mouseY = e.clientY - tableRect.top;

		let targetCol = cachedColBounds.length - 1;
		for (let c = 0; c < cachedColBounds.length; c++) {
			if (mouseX < cachedColBounds[c].right) {
				targetCol = c;
				break;
			}
		}
		if (mouseX < cachedColBounds[0].left) targetCol = 0;

		let targetRow = cachedRowBounds.length - 1;
		for (let r = 0; r < cachedRowBounds.length; r++) {
			if (mouseY < cachedRowBounds[r].bottom) {
				targetRow = r;
				break;
			}
		}
		if (mouseY < cachedRowBounds[0].top) targetRow = 0;

		if (!isDragging) {
			if (targetRow === dragStartCell.row && targetCol === dragStartCell.col) {
				return;
			}
			isDragging = true;
			window.getSelection()?.removeAllRanges();
			(document.activeElement as HTMLElement)?.blur();
		}

		if (targetRow === lastHoverRow && targetCol === lastHoverCol) {
			return;
		}

		lastHoverRow = targetRow;
		lastHoverCol = targetCol;

		if (selectionAnchor) {
			onSelectionChange(buildRange(selectionAnchor, { row: targetRow, col: targetCol }));
		}
	}

	function handleWindowMouseUp() {
		isDragging = false;
		dragStartCell = null;
		lastHoverRow = null;
		lastHoverCol = null;
		cachedColBounds = null;
		cachedRowBounds = null;
	}

	function isSelected(rowIndex: number, colIndex: number) {
		return selectedSet.has(`${rowIndex}:${colIndex}`);
	}

	const isAllSelected = $derived(
		rowCount > 0 && colCount > 0 && selectedCells.length === rowCount * colCount
	);

	function handleSelectAll() {
		if (rowCount === 0 || colCount === 0) return;
		if (isAllSelected) {
			onSelectionChange([]);
			selectionAnchor = null;
		} else {
			const cells: { row: number; col: number }[] = [];
			for (let r = 0; r < rowCount; r++) {
				for (let c = 0; c < colCount; c++) {
					cells.push({ row: r, col: c });
				}
			}
			selectionAnchor = { row: 0, col: 0 };
			onSelectionChange(cells);
		}
	}

	function handleSelectColumn(colIndex: number) {
		const cells: { row: number; col: number }[] = [];
		for (let r = 0; r < rowCount; r++) {
			cells.push({ row: r, col: colIndex });
		}
		selectionAnchor = { row: 0, col: colIndex };
		onSelectionChange(cells);
	}

	function handleSelectRow(rowIndex: number) {
		const cells: { row: number; col: number }[] = [];
		for (let c = 0; c < colCount; c++) {
			cells.push({ row: rowIndex, col: c });
		}
		selectionAnchor = { row: rowIndex, col: 0 };
		onSelectionChange(cells);
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

<svelte:window onmousemove={handleWindowMouseMove} onmouseup={handleWindowMouseUp} onpointerup={handleWindowMouseUp} onkeydown={handleHeaderAdjustKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="table-editor tech-corners flex flex-col h-full bg-background rounded-[var(--radius)] border border-border" onmousedown={handleEditorClick}>
	<div class="flex justify-between items-center px-4 py-2 bg-muted/25 border-b border-border shrink-0 relative z-0">
		<div class="flex items-center gap-2.5">
			<TableSizeSelector
				currentRows={rowCount}
				currentCols={colCount}
				onSizeChange={(r, c) => onResizeTable?.(r, c)}
			/>
			<span class="text-[11px] font-terminal text-muted-foreground uppercase tracking-widest">{rowCount} × {colCount}</span>
		</div>
		<div class="flex gap-1.5">
			<AppTooltip text={t('table.addRow')} onclick={() => executeAddRow()}>
				{#snippet children({ props })}
					<button class="flex items-center gap-1 px-2.5 py-1 text-[11px] font-terminal font-semibold uppercase tracking-wider text-foreground bg-background border border-border rounded-[2px] cursor-pointer transition-all hover:bg-foreground hover:text-background" {...props} onclick={() => executeAddRow()}>
						<Plus class="w-3 h-3" />
						{t('table.row')}
					</button>
				{/snippet}
			</AppTooltip>
			<AppTooltip text={t('table.addColumn')} onclick={() => executeAddColumn()}>
				{#snippet children({ props })}
					<button class="flex items-center gap-1 px-2.5 py-1 text-[11px] font-terminal font-semibold uppercase tracking-wider text-foreground bg-background border border-border rounded-[2px] cursor-pointer transition-all hover:bg-foreground hover:text-background" {...props} onclick={() => executeAddColumn()}>
						<Plus class="w-3 h-3" />
						{t('table.col')}
					</button>
				{/snippet}
			</AppTooltip>
		</div>
	</div>

	<ScrollArea class="flex-1 min-h-0 relative z-10" orientation="both">
		<div class="p-4 w-full">
			<ContextMenu.Root>
				<ContextMenu.Trigger class="block w-full select-none" oncontextmenu={handleContextMenu}>
					<div class="relative w-full select-none" bind:this={gridWrap}>
					<table bind:this={tableElement} class="w-full border-collapse table-fixed select-none">
						<colgroup>
							<col style="width: {rowGutterWidth};" />
							{#each columnCharWidths as width}
								<col style="width: {dataColWidth}; min-width: {getColumnWidthStyle(width)};" />
							{/each}
						</colgroup>
						<thead>
							<tr>
								<th
									class="origin-cell relative box-border p-0 border border-zinc-200 dark:border-zinc-800 text-center select-none transition-colors {isAllSelected ? (uiTheme.theme === 'avant-garde' ? 'bg-[var(--cobalt-subtle)] text-[var(--cobalt)]' : 'bg-muted/60 text-foreground') : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
									style="width: {rowGutterWidth}; min-width: {rowGutterWidth}; max-width: {rowGutterWidth};"
								>
									<AppTooltip text={isAllSelected ? t('table.clearSelection') : t('table.selectAll')}>
										{#snippet children({ props })}
											<button
												type="button"
												class="origin-cell-btn w-full h-full min-h-[26px] flex items-center justify-center cursor-pointer outline-none bg-transparent border-none p-0 text-inherit transition-all group"
												{...props}
												onclick={handleSelectAll}
												aria-label={isAllSelected ? t('table.clearSelection') : t('table.selectAll')}
											>
												<svg class="size-3.5 transition-transform duration-150 group-active:scale-90" viewBox="0 0 16 16" fill="currentColor">
													<g transform="rotate(45 8 8)">
														<rect x="4.2" y="4.2" width="3.2" height="3.2" class="nier-diamond-tl" />
														<rect x="8.6" y="4.2" width="3.2" height="3.2" class="nier-diamond-tr" />
														<rect x="4.2" y="8.6" width="3.2" height="3.2" class="nier-diamond-bl" />
														<rect x="8.6" y="8.6" width="3.2" height="3.2" class="nier-diamond-br" />
													</g>
												</svg>
											</button>
										{/snippet}
									</AppTooltip>
								</th>
								{#each rows[0] || [] as _, colIndex}
									<th
										data-col={colIndex}
										class="relative px-2 py-1.5 bg-muted/30 hover:bg-muted/60 border border-zinc-200 dark:border-zinc-800 text-[11px] font-terminal font-semibold text-muted-foreground text-center group select-none cursor-pointer transition-colors"
										onclick={() => handleSelectColumn(colIndex)}
									>
										<span class="block">{String.fromCharCode(65 + colIndex)}</span>
										{#if colCount > 1}
											<AppTooltip text={t('table.deleteColumn', { col: String.fromCharCode(65 + colIndex) })}>
												{#snippet children({ props })}
													<button 
														type="button"
														class="header-delete-btn absolute top-1/2 -translate-y-1/2 right-1 size-4 flex items-center justify-center rounded-[2px] text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 opacity-0 transition-all cursor-pointer pointer-events-none hover:pointer-events-auto" 
														{...props}
														onclick={(e) => {
															e.stopPropagation();
															onDeleteColumn(colIndex);
														}}
													>
														<X class="size-2.5 stroke-[2.2]" />
													</button>
												{/snippet}
											</AppTooltip>
										{/if}
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each rows as row, rowIndex}
								<tr
									data-table-row={rowIndex}
									class={rowIndex < headerRows ? (uiTheme.theme === 'avant-garde' ? 'bg-[var(--cobalt-subtle)]' : 'bg-muted/40') : ''}
								>
									<td
										class="relative box-border px-0.5 py-1 border border-zinc-200 dark:border-zinc-800 text-[11px] font-terminal font-semibold tabular-nums text-muted-foreground text-center group select-none cursor-pointer hover:bg-muted/50 transition-colors {rowIndex < headerRows ? (uiTheme.theme === 'avant-garde' ? 'bg-[var(--cobalt-subtle)] text-[var(--cobalt)] font-bold' : 'bg-muted/50 text-foreground font-bold') : 'bg-muted/30'}"
										style="width: {rowGutterWidth}; min-width: {rowGutterWidth}; max-width: {rowGutterWidth};"
										onclick={() => handleSelectRow(rowIndex)}
									>
										<span class="row-header-num block leading-none transition-opacity">{rowIndex + 1}</span>
										{#if rowCount > 1}
											<AppTooltip text={t('table.deleteRow', { n: rowIndex + 1 })}>
												{#snippet children({ props })}
													<button 
														type="button"
														class="header-delete-btn absolute inset-0 m-auto size-4 flex items-center justify-center rounded-[2px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 opacity-0 transition-all cursor-pointer pointer-events-none hover:pointer-events-auto" 
														{...props}
														onclick={(e) => {
															e.stopPropagation();
															onDeleteRow(rowIndex);
														}}
													>
														<X class="size-2.5 stroke-[2.2]" />
													</button>
												{/snippet}
											</AppTooltip>
										{/if}
									</td>
									{#each row as rawCell, colIndex}
										{@const cell = resolveCell(rawCell, rowIndex, colIndex, headerRows)}
										{#if !cell.isMerged}
											<td
												class="p-0 relative align-middle {isSelected(rowIndex, colIndex) ? 'bg-blue-50/90 dark:bg-[#1e3a5f]/80 border border-blue-200/90 dark:border-[#2d5282]' : 'border border-zinc-200 dark:border-zinc-800'}"
												class:font-bold={cell.effectiveBold}
												class:italic={cell.effectiveItalic}
												style:background-color={!isSelected(rowIndex, colIndex) ? cell.backgroundColor : undefined}
												style:color={cell.textColor}
												colspan={cell.colspan > 1 ? cell.colspan : undefined}
												rowspan={cell.rowspan > 1 ? cell.rowspan : undefined}
												data-row={rowIndex}
												data-col={colIndex}
												onmousedown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
											>
												{#if themeFeatures[uiTheme.theme]?.reticleCorners && selectionBounds && isSelected(rowIndex, colIndex)}
													{@const isTL = rowIndex === selectionBounds.minR && colIndex === selectionBounds.minC}
													{@const isTR = rowIndex === selectionBounds.minR && (colIndex + (cell.colspan || 1) - 1) === selectionBounds.maxC}
													{@const isBL = (rowIndex + (cell.rowspan || 1) - 1) === selectionBounds.maxR && colIndex === selectionBounds.minC}
													{@const isBR = (rowIndex + (cell.rowspan || 1) - 1) === selectionBounds.maxR && (colIndex + (cell.colspan || 1) - 1) === selectionBounds.maxC}
													{#if isTL || isTR || isBL || isBR}
														<CellReticle tl={isTL} tr={isTR} bl={isBL} br={isBR} />
													{/if}
												{/if}
												<textarea
													rows="1"
													cols="1"
													class="w-full min-w-0 px-2 py-1.5 text-xs bg-transparent border-none outline-none text-inherit font-inherit resize-none overflow-hidden select-text {cell.effectiveBold ? 'font-bold' : ''}"
													class:pointer-events-none={isDragging}
													class:select-none={isDragging}
													style="vertical-align: middle; min-height: 1.5em; user-select: text; -webkit-user-select: text;"
													class:text-left={cell.effectiveAlign === 'left'}
													class:text-center={cell.effectiveAlign === 'center'}
													class:text-right={cell.effectiveAlign === 'right' || cell.effectiveAlign === 'decimal'}
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
					{#if activeLaser}
						{#key activeLaser.key}
							<div
								class="pointer-events-none absolute z-30 overflow-visible select-none"
								style:top="{activeLaser.top}px"
								style:left="{activeLaser.left}px"
								style:width="{activeLaser.width}px"
								style:height="{activeLaser.height}px"
								aria-hidden="true"
							>
								<LineSlice
									type={activeLaser.type}
									headerW={activeLaser.headerW}
									headerH={activeLaser.headerH}
								/>
							</div>
						{/key}
					{/if}
					{#if headerAdjustMode}
						<div
							data-header-adjust
							class="pointer-events-none absolute z-20 rounded-[1px] border-2 {uiTheme.theme === 'avant-garde' ? 'border-[var(--cobalt)] bg-[var(--cobalt-subtle)]' : 'border-foreground bg-foreground/10'}"
							style:top="{headerBox.top}px"
							style:left="{headerBox.left}px"
							style:width="{headerBox.width}px"
							style:height="{headerBox.height}px"
						>
							<span class="absolute top-1 left-1 rounded-[1px] select-none {uiTheme.theme === 'avant-garde' ? 'bg-[var(--cobalt)] text-white' : 'bg-foreground text-background'} px-1.5 py-0.5 text-[9px] font-terminal uppercase tracking-widest" unselectable="on">
								{t('table.header')}
							</span>
							<button
								type="button"
								class="pointer-events-auto absolute bottom-0 left-1/2 z-30 h-2 w-8 -translate-x-1/2 translate-y-1/2 cursor-ns-resize rounded-[1px] border border-white {uiTheme.theme === 'avant-garde' ? 'bg-[var(--cobalt)]' : 'bg-foreground'} shadow-sm"
								aria-label={t('a11y.resizeHeader')}
								onmousedown={handleHeaderDragStart}
							></button>
						</div>
					{/if}
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="w-60 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}">
					{#if uiTheme.theme === 'avant-garde'}
						<!-- Terminal Header -->
						<div class="px-2.5 py-1 mb-1 border-b border-border/80 flex items-center justify-between text-[9px] font-terminal tracking-wider text-muted-foreground/70 uppercase select-none">
							<span class="flex items-center gap-1.5">
								<span class="inline-block size-1.5 bg-primary"></span>
								<span>CMD // GRID_OPS</span>
							</span>
							<span class="font-mono text-[8.5px] opacity-60">0x01</span>
						</div>
					{/if}

					<ContextMenu.Group>
						<ContextMenu.Item disabled={!canMerge} onclick={onMergeCells} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
							<span class="flex items-center justify-center size-2.5 shrink-0">
								<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
									<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
								</svg>
							</span>
							<TableCellsMerge class="size-3.5 shrink-0" />
							<span class="flex-1 font-medium">{t('edit.mergeCells')}</span>
						</ContextMenu.Item>
						<ContextMenu.Item disabled={!canUnmerge} onclick={onUnmergeCells} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
							<span class="flex items-center justify-center size-2.5 shrink-0">
								<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
									<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
								</svg>
							</span>
							<TableCellsSplit class="size-3.5 shrink-0" />
							<span class="flex-1 font-medium">{t('edit.unmergeCells')}</span>
						</ContextMenu.Item>
					</ContextMenu.Group>

					<ContextMenu.Separator />

					<ContextMenu.Group>
						<ContextMenu.Item disabled={!canAddLine} onclick={() => onAddLine?.('below')} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
							<span class="flex items-center justify-center size-2.5 shrink-0">
								<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
									<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
								</svg>
							</span>
							<ArrowDownToLine class="size-3.5 shrink-0" />
							<span class="flex-1 font-medium">{t('table.lineBelow')}</span>
						</ContextMenu.Item>
						<ContextMenu.Item disabled={!canAddLine} onclick={() => onAddLine?.('above')} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
							<span class="flex items-center justify-center size-2.5 shrink-0">
								<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
									<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
								</svg>
							</span>
							<ArrowUpToLine class="size-3.5 shrink-0" />
							<span class="flex-1 font-medium">{t('table.lineAbove')}</span>
						</ContextMenu.Item>
					</ContextMenu.Group>

					<ContextMenu.Separator />

					<ContextMenu.Sub>
						<ContextMenu.SubTrigger class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
							<span class="flex items-center justify-center size-2.5 shrink-0">
								<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
									<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
								</svg>
							</span>
							<Plus class="size-3.5 shrink-0" />
							<span class="flex-1 font-medium">{t('table.insert')}</span>
						</ContextMenu.SubTrigger>
						<ContextMenu.SubContent class="w-56 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}">
							{#if uiTheme.theme === 'avant-garde'}
								<!-- Terminal Header -->
								<div class="px-2.5 py-1 mb-1 border-b border-border/80 flex items-center justify-between text-[9px] font-terminal tracking-wider text-muted-foreground/70 uppercase select-none">
									<span class="flex items-center gap-1.5">
										<span class="inline-block size-1.5 bg-primary"></span>
										<span>CMD // INSERT</span>
									</span>
									<span class="font-mono text-[8.5px] opacity-60">0x02</span>
								</div>
							{/if}
							<ContextMenu.Item disabled={!canInsertAtTarget} onclick={handleInsertRowAbove} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
								<span class="flex items-center justify-center size-2.5 shrink-0">
									<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
										<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
									</svg>
								</span>
								<ArrowUpToLine class="size-3.5 shrink-0" />
								<span class="flex-1 font-medium">{t('table.insertRowAbove')}</span>
							</ContextMenu.Item>
							<ContextMenu.Item disabled={!canInsertAtTarget} onclick={handleInsertRowBelow} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
								<span class="flex items-center justify-center size-2.5 shrink-0">
									<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
										<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
									</svg>
								</span>
								<ArrowDownToLine class="size-3.5 shrink-0" />
								<span class="flex-1 font-medium">{t('table.insertRowBelow')}</span>
							</ContextMenu.Item>
							<ContextMenu.Separator />
							<ContextMenu.Item disabled={!canInsertAtTarget} onclick={handleInsertColumnLeft} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
								<span class="flex items-center justify-center size-2.5 shrink-0">
									<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
										<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
									</svg>
								</span>
								<ArrowLeftToLine class="size-3.5 shrink-0" />
								<span class="flex-1 font-medium">{t('table.insertColumnLeft')}</span>
							</ContextMenu.Item>
							<ContextMenu.Item disabled={!canInsertAtTarget} onclick={handleInsertColumnRight} class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer">
								<span class="flex items-center justify-center size-2.5 shrink-0">
									<svg class="size-2 transition-transform" viewBox="0 0 8 8" fill="currentColor">
										<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
									</svg>
								</span>
								<ArrowRightToLine class="size-3.5 shrink-0" />
								<span class="flex-1 font-medium">{t('table.insertColumnRight')}</span>
							</ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Sub>

					<ContextMenu.Separator />

					<ContextMenu.Item
						variant="destructive"
						disabled={!canDeleteRows}
						onclick={handleDeleteRowsContext}
						class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer"
					>
						<span class="flex items-center justify-center size-2.5 shrink-0">
							<svg class="size-2 transition-transform text-destructive" viewBox="0 0 8 8" fill="currentColor">
								<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
							</svg>
						</span>
						<Trash2 class="size-3.5 shrink-0 text-destructive" />
						<span class="flex-1 font-medium">
							{#if selectedRowIndices.length > 1}
								{t('table.deleteSelectedRows', { n: selectedRowIndices.length })}
							{:else}
								{t('table.deleteRowItem')}
							{/if}
						</span>
					</ContextMenu.Item>
					<ContextMenu.Item
						variant="destructive"
						disabled={!canDeleteColumns}
						onclick={handleDeleteColumnsContext}
						class="group/item font-terminal text-[11px] gap-2 px-2 py-1.5 cursor-pointer"
					>
						<span class="flex items-center justify-center size-2.5 shrink-0">
							<svg class="size-2 transition-transform text-destructive" viewBox="0 0 8 8" fill="currentColor">
								<rect x="2.5" y="2.5" width="3" height="3" transform="rotate(45 4 4)" />
							</svg>
						</span>
						<Trash2 class="size-3.5 shrink-0 text-destructive" />
						<span class="flex-1 font-medium">
							{#if selectedColIndices.length > 1}
								{t('table.deleteSelectedColumns', { n: selectedColIndices.length })}
							{:else}
								{t('table.deleteColumnItem')}
							{/if}
						</span>
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</div>
	</ScrollArea>

	<!-- HUD Telemetry Bar -->
	<div
		class="hud-telemetry flex items-center justify-between px-3 h-[25px] bg-muted/20 border-t border-border shrink-0 select-none font-terminal text-[10px] uppercase tracking-wider text-muted-foreground/80 overflow-hidden whitespace-nowrap"
	>
		<div class="flex items-center gap-2.5 min-w-0 shrink-0">
			<span class="flex items-center gap-1 shrink-0">
				<span class="text-muted-foreground/50">POS:</span>
				<span class="font-bold text-foreground tracking-normal">{posDisplay}</span>
			</span>
			<span class="text-border shrink-0">/</span>
			<span class="flex items-center gap-1 shrink-0">
				<span class="text-muted-foreground/50">GRID:</span>
				<span class="font-semibold text-foreground/90 tracking-normal">{rowCount}×{colCount}</span>
			</span>
			<span class="hud-item-buf flex items-center gap-2.5 shrink-0">
				<span class="text-border">/</span>
				<span class="flex items-center gap-1">
					<span class="text-muted-foreground/50">BUF:</span>
					<span class="font-semibold text-foreground/90 tracking-normal">{currentBufferBytes} B</span>
				</span>
			</span>
		</div>
		<div class="flex items-center gap-2.5 shrink-0">
			<span class="hud-item-engine flex items-center gap-2.5 shrink-0">
				<span class="flex items-center gap-1 text-[9.5px] tracking-widest text-muted-foreground/60">
					<span>ENGINE:</span>
					<span class="text-foreground/80 font-medium">NICEMATRIX</span>
				</span>
				<span class="text-border">/</span>
			</span>
			<span class="flex items-center gap-1.5 text-[9.5px] font-semibold shrink-0">
				{#if draftStatus === 'saving'}
					<span class="relative flex size-1.5 shrink-0">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
						<span class="relative inline-flex size-1.5 rounded-full bg-amber-500"></span>
					</span>
					<span class="text-amber-500 font-semibold transition-colors">SYNCING</span>
				{:else}
					<span class="relative flex size-1.5 shrink-0">
						{#key savePulseKey}
							<span class="absolute inline-flex h-full w-full animate-ping-once rounded-full bg-[#0202f1]"></span>
						{/key}
						<span class="relative inline-flex size-1.5 rounded-full bg-[#0202f1]"></span>
					</span>
					<span class="text-[#0202f1] font-semibold transition-colors">SYNCED</span>
				{/if}
			</span>
		</div>
	</div>
</div>

<style>
	.hud-telemetry {
		container-type: inline-size;
	}
	@container (max-width: 480px) {
		.hud-item-engine {
			display: none;
		}
	}
	@container (max-width: 380px) {
		.hud-item-buf {
			display: none;
		}
	}
	:global(.table-editor th:hover .header-delete-btn),
	:global(.table-editor td:hover .header-delete-btn) {
		opacity: 1 !important;
		pointer-events: auto !important;
	}
	:global(.table-editor td:hover .row-header-num) {
		opacity: 0 !important;
	}

	.nier-diamond-tl,
	.nier-diamond-tr,
	.nier-diamond-bl,
	.nier-diamond-br {
		transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
		transform: translate(0, 0);
	}

	:global(.origin-cell:hover) .nier-diamond-tl,
	:global(.origin-cell-btn:hover) .nier-diamond-tl {
		transform: translate(-0.55px, -0.55px);
	}
	:global(.origin-cell:hover) .nier-diamond-tr,
	:global(.origin-cell-btn:hover) .nier-diamond-tr {
		transform: translate(0.55px, -0.55px);
	}
	:global(.origin-cell:hover) .nier-diamond-bl,
	:global(.origin-cell-btn:hover) .nier-diamond-bl {
		transform: translate(-0.55px, 0.55px);
	}
	:global(.origin-cell:hover) .nier-diamond-br,
	:global(.origin-cell-btn:hover) .nier-diamond-br {
		transform: translate(0.55px, 0.55px);
	}
</style>
