import { untrack } from 'svelte';
import {
	type TableData,
	type TableStyle,
	type CanvasConfig,
	type Cell,
	type RuleSegment,
	DEFAULT_CELL,
	DEFAULT_TABLE_STYLE,
	DEFAULT_CANVAS_CONFIG
} from '$lib/types';
import {
	findSegmentIndex,
	getLineTarget,
	type LineEdge
} from '$lib/utils/table-geometry';
import {
	cloneTableData,
	cowCloneTable,
	restoreChangedRows,
	restoreRow,
	restoreTableInPlace,
	sameTableShape
} from '$lib/utils/table-clone';
import type { CellMergeRange, ImportedTableData } from '$lib/utils/import';

function createCell(content: string = ''): Cell {
	return { ...DEFAULT_CELL, content };
}

function createEmptyTable(rows: number, cols: number): TableData {
	const tableRows: Cell[][] = [];
	for (let i = 0; i < rows; i++) {
		const row: Cell[] = [];
		for (let j = 0; j < cols; j++) {
			row.push(createCell());
		}
		tableRows.push(row);
	}
	return {
		rows: tableRows,
		columnWidths: Array(cols).fill(100),
		rowHeights: Array(rows).fill(32),
		headerRows: 1,
		segments: []
	};
}

class TableStore {
	tableData = $state<TableData>(createEmptyTable(4, 4));
	tableStyle = $state<TableStyle>({ ...DEFAULT_TABLE_STYLE });
	canvasConfig = $state<CanvasConfig>({ ...DEFAULT_CANVAS_CONFIG });
	selectedCells = $state<{ row: number; col: number }[]>([]);
	lockColumnResize = $state(false);
	lockRowResize = $state(false);
	/** 快照刻意不放进 $state：否则每次操作都会把整表再代理一遍。 */
	private snapshots: TableData[] = [];
	historyIndex = $state(-1);
	historyPending = $state(false);
	/** 行列/合并变化时 +1，供窗口化派生 untrack 扫描，避免着色误伤整表。 */
	layoutRev = $state(0);
	/** 单元格文字变化时 +1，供列宽扫描，与着色解耦。 */
	contentRev = $state(0);
	private historyTimer: ReturnType<typeof setTimeout> | null = null;
	private dirtyRows = new Set<number>();
	private static readonly MAX_HISTORY = 40;
	private static readonly HISTORY_COALESCE_MS = 400;

	get history(): TableData[] {
		return this.snapshots;
	}

	constructor() {
		this.saveHistory(true);
	}

	private bumpLayout() {
		this.layoutRev += 1;
	}

	private bumpContent() {
		this.contentRev += 1;
	}

	private markDirtyRow(row: number) {
		this.dirtyRows.add(row);
	}

	private cellHasDiff(cell: Cell, updates: Partial<Cell>): boolean {
		for (const key of Object.keys(updates) as (keyof Cell)[]) {
			if (cell[key] !== updates[key]) return true;
		}
		return false;
	}

	private patchCell(row: number, col: number, updates: Partial<Cell>): boolean {
		const cell = this.tableData.rows[row]?.[col];
		if (!cell || !this.cellHasDiff(cell, updates)) return false;
		Object.assign(cell, updates);
		this.markDirtyRow(row);
		return true;
	}

	private clearHistoryTimer() {
		if (this.historyTimer) {
			clearTimeout(this.historyTimer);
			this.historyTimer = null;
		}
	}

	private resetHistory() {
		this.clearHistoryTimer();
		this.historyPending = false;
		this.dirtyRows.clear();
		this.snapshots = [];
		this.historyIndex = -1;
	}

	/** structure: 增删行列/导入等，必须整表拷贝；否则只拷脏行。 */
	private saveHistory(structure = false) {
		this.clearHistoryTimer();
		this.historyPending = false;
		const prev = this.snapshots[this.historyIndex];
		const snapshot = untrack(() =>
			cowCloneTable(prev, this.tableData, this.dirtyRows, structure)
		);
		this.dirtyRows.clear();
		this.snapshots = this.snapshots.slice(0, this.historyIndex + 1);
		this.snapshots.push(snapshot);
		if (this.snapshots.length > TableStore.MAX_HISTORY) {
			this.snapshots.splice(0, this.snapshots.length - TableStore.MAX_HISTORY);
		}
		this.historyIndex = this.snapshots.length - 1;
	}

	private scheduleHistory() {
		this.historyPending = true;
		this.clearHistoryTimer();
		this.historyTimer = setTimeout(() => {
			this.historyTimer = null;
			this.saveHistory(false);
		}, TableStore.HISTORY_COALESCE_MS);
	}

	private commitPending() {
		if (this.historyPending) this.saveHistory(false);
	}

	private applySnapshot(to: TableData, from?: TableData) {
		if (from && restoreChangedRows(this.tableData, from, to)) {
			this.bumpLayout();
			return;
		}
		if (sameTableShape(this.tableData, to)) {
			untrack(() => restoreTableInPlace(this.tableData, to));
			this.bumpLayout();
			return;
		}
		this.tableData = cloneTableData(to);
		this.bumpLayout();
	}

	/** 草稿/导出用：纯对象，避免 $state.snapshot 扫整张代理表。 */
	exportTableData(): TableData {
		return untrack(() => cloneTableData(this.tableData));
	}

	undo() {
		if (this.historyPending) {
			this.clearHistoryTimer();
			this.historyPending = false;
			const snapshot = this.snapshots[this.historyIndex];
			if (snapshot) {
				if (this.dirtyRows.size > 0 && sameTableShape(this.tableData, snapshot)) {
					for (const r of this.dirtyRows) {
						if (snapshot.rows[r] && this.tableData.rows[r]) {
							restoreRow(this.tableData.rows[r], snapshot.rows[r]);
						}
					}
					this.bumpLayout();
				} else {
					this.applySnapshot(snapshot);
				}
			}
			this.dirtyRows.clear();
			return;
		}
		if (this.historyIndex > 0) {
			const from = this.snapshots[this.historyIndex];
			this.historyIndex--;
			this.applySnapshot(this.snapshots[this.historyIndex], from);
		}
	}

	redo() {
		if (this.historyPending) return;
		if (this.historyIndex < this.snapshots.length - 1) {
			const from = this.snapshots[this.historyIndex];
			this.historyIndex++;
			this.applySnapshot(this.snapshots[this.historyIndex], from);
		}
	}

	setTableData(data: TableData) {
		this.tableData = {
			...data,
			headerRows: data.headerRows ?? 1,
			segments: data.segments ?? []
		};
		this.bumpLayout();
		this.saveHistory(true);
	}

	setHeaderRows(count: number, recordHistory = true) {
		const maxRows = this.tableData.rows.length || 1;
		const next = Math.min(Math.max(1, count), maxRows);
		if (this.tableData.headerRows === next) return;
		this.commitPending();
		this.tableData.headerRows = next;
		this.bumpLayout();
		if (recordHistory) this.saveHistory(false);
	}

	commitHistory() {
		this.saveHistory(false);
	}

	updateCell(row: number, col: number, updates: Partial<Cell>) {
		if (!this.patchCell(row, col, updates)) return;
		if (updates.content !== undefined) this.bumpContent();
		this.scheduleHistory();
	}

	setSelectedCells(cells: { row: number; col: number }[]) {
		this.selectedCells = cells;
	}

	clearSelection() {
		this.selectedCells = [];
	}

	applyToSelectedCells(updates: Partial<Cell>) {
		if (this.selectedCells.length === 0) return;
		let changed = false;
		for (const { row, col } of this.selectedCells) {
			if (this.patchCell(row, col, updates)) changed = true;
		}
		if (changed) this.scheduleHistory();
	}

	clearSelectedCellsContent() {
		if (this.selectedCells.length === 0) return;
		this.commitPending();
		let changed = false;
		for (const { row, col } of this.selectedCells) {
			if (this.patchCell(row, col, { content: '' })) changed = true;
		}
		if (changed) {
			this.bumpContent();
			this.saveHistory(false);
		}
	}

	toggleSelectedCells(field: 'isBold' | 'isItalic') {
		if (this.selectedCells.length === 0) return;
		const shouldEnable = this.selectedCells.some(({ row, col }) => {
			const cell = this.tableData.rows[row]?.[col];
			if (!cell) return false;
			if (field === 'isBold') {
				const isHeader = row < this.tableData.headerRows;
				const effective = cell.isBold !== undefined ? cell.isBold : isHeader;
				return !effective;
			}
			return !cell[field];
		});
		this.applyToSelectedCells({ [field]: shouldEnable } as Partial<Cell>);
	}

	private findMergeRoot(row: number, col: number) {
		for (let r = 0; r < this.tableData.rows.length; r++) {
			for (let c = 0; c < this.tableData.rows[r].length; c++) {
				const cell = this.tableData.rows[r][c];
				const rowspan = cell.rowspan ?? 1;
				const colspan = cell.colspan ?? 1;
				if (rowspan > 1 || colspan > 1) {
					if (row >= r && row < r + rowspan && col >= c && col < c + colspan) {
						return { row: r, col: c, cell };
					}
				}
			}
		}
		return null;
	}

	mergeSelectedCells() {
		if (this.selectedCells.length < 2) return;
		const rows = this.selectedCells.map((cell) => cell.row);
		const cols = this.selectedCells.map((cell) => cell.col);
		const minRow = Math.min(...rows);
		const maxRow = Math.max(...rows);
		const minCol = Math.min(...cols);
		const maxCol = Math.max(...cols);
		const expectedCount = (maxRow - minRow + 1) * (maxCol - minCol + 1);
		if (expectedCount !== this.selectedCells.length) return;

		for (const { row, col } of this.selectedCells) {
			const cell = this.tableData.rows[row]?.[col];
			if (!cell) return;
			if (cell.isMerged) return;
			if ((cell.colspan ?? 1) > 1 || (cell.rowspan ?? 1) > 1) return;
		}

		this.commitPending();

		const root = this.tableData.rows[minRow]?.[minCol];
		if (!root) return;

		root.colspan = maxCol - minCol + 1;
		root.rowspan = maxRow - minRow + 1;
		root.isMerged = false;
		this.markDirtyRow(minRow);

		for (const { row, col } of this.selectedCells) {
			if (row === minRow && col === minCol) continue;
			const cell = this.tableData.rows[row]?.[col];
			if (cell) {
				cell.isMerged = true;
				cell.colspan = 1;
				cell.rowspan = 1;
				this.markDirtyRow(row);
			}
		}

		this.selectedCells = [{ row: minRow, col: minCol }];
		this.bumpLayout();
		this.saveHistory(false);
	}

	unmergeSelectedCells() {
		if (this.selectedCells.length === 0) return;

		let target: { row: number; col: number; cell: Cell } | null = null;
		for (const { row, col } of this.selectedCells) {
			const cell = this.tableData.rows[row]?.[col];
			if (!cell) continue;
			if ((cell.colspan ?? 1) > 1 || (cell.rowspan ?? 1) > 1) {
				target = { row, col, cell };
				break;
			}
		}

		if (!target) {
			const probe = this.selectedCells[0];
			target = this.findMergeRoot(probe.row, probe.col);
		}

		if (!target) return;

		this.commitPending();

		const rowspan = target.cell.rowspan ?? 1;
		const colspan = target.cell.colspan ?? 1;
		for (let r = target.row; r < target.row + rowspan; r++) {
			this.markDirtyRow(r);
			for (let c = target.col; c < target.col + colspan; c++) {
				const cell = this.tableData.rows[r]?.[c];
				if (cell) {
					cell.isMerged = false;
					cell.rowspan = 1;
					cell.colspan = 1;
				}
			}
		}
		this.bumpLayout();
		this.saveHistory(false);
	}

	addRow(index?: number) {
		this.commitPending();
		const cols = this.tableData.rows[0]?.length || 4;
		const newRow = Array(cols).fill(null).map(() => createCell());
		const idx = index ?? this.tableData.rows.length;
		const defaultHeight = this.lockRowResize ? this.tableData.rowHeights[0] ?? 32 : 32;
		this.tableData.rows.splice(idx, 0, newRow);
		this.tableData.rowHeights.splice(idx, 0, defaultHeight);
		this.tableData.segments = this.tableData.segments.map((segment) => ({
			...segment,
			atRow: segment.atRow >= idx ? segment.atRow + 1 : segment.atRow
		}));
		if (this.selectedCells.length > 0) {
			this.selectedCells = this.selectedCells.map((c) => ({
				...c,
				row: c.row >= idx ? c.row + 1 : c.row
			}));
		}
		this.bumpLayout();
		this.saveHistory(true);
	}

	deleteRows(indices: number[]) {
		const validIndices = Array.from(new Set(indices))
			.filter((idx) => idx >= 0 && idx < this.tableData.rows.length)
			.sort((a, b) => b - a);

		if (validIndices.length === 0) return;
		if (this.tableData.rows.length - validIndices.length < 1) return;

		this.commitPending();

		const removedSet = new Set(validIndices);

		for (const idx of validIndices) {
			this.tableData.rows.splice(idx, 1);
			this.tableData.rowHeights.splice(idx, 1);
		}

		this.tableData.headerRows = Math.min(
			Math.max(1, this.tableData.headerRows),
			this.tableData.rows.length
		);

		const maxRow = this.tableData.rows.length - 1;
		this.tableData.segments = this.tableData.segments
			.map((segment) => {
				const shift = validIndices.filter((idx) => idx <= segment.atRow).length;
				const shifted = segment.atRow - shift;
				return { ...segment, atRow: Math.min(Math.max(-1, shifted), maxRow) };
			})
			.filter((segment) => segment.atRow <= maxRow);

		if (this.selectedCells.length > 0) {
			this.selectedCells = this.selectedCells
				.filter((c) => !removedSet.has(c.row))
				.map((c) => {
					const shift = validIndices.filter((idx) => idx < c.row).length;
					return {
						...c,
						row: c.row - shift
					};
				});
		}

		if (this.selectedCells.length === 0 && this.tableData.rows.length > 0) {
			const minRemoved = validIndices[validIndices.length - 1];
			const targetRow = Math.min(minRemoved, this.tableData.rows.length - 1);
			this.selectedCells = [{ row: targetRow, col: 0 }];
		}

		this.bumpLayout();
		this.saveHistory(true);
	}

	deleteRow(index: number) {
		this.deleteRows([index]);
	}

	addColumn(index?: number) {
		this.commitPending();
		const idx = index ?? (this.tableData.rows[0]?.length || 0);
		const defaultWidth = this.lockColumnResize ? this.tableData.columnWidths[0] ?? 100 : 100;
		this.tableData.rows.forEach((row) => {
			row.splice(idx, 0, createCell());
		});
		this.tableData.columnWidths.splice(idx, 0, defaultWidth);
		this.tableData.segments = this.tableData.segments.map((segment) => {
			if (segment.startCol >= idx) {
				return {
					...segment,
					startCol: segment.startCol + 1,
					endCol: segment.endCol + 1
				};
			}
			if (segment.endCol >= idx) {
				return {
					...segment,
					endCol: segment.endCol + 1
				};
			}
			return segment;
		});
		if (this.selectedCells.length > 0) {
			this.selectedCells = this.selectedCells.map((c) => ({
				...c,
				col: c.col >= idx ? c.col + 1 : c.col
			}));
		}
		this.bumpLayout();
		this.saveHistory(true);
	}

	deleteColumns(indices: number[]) {
		const validIndices = Array.from(new Set(indices))
			.filter((idx) => idx >= 0 && idx < this.tableData.columnWidths.length)
			.sort((a, b) => b - a);

		if (validIndices.length === 0) return;
		if (this.tableData.columnWidths.length - validIndices.length < 1) return;

		this.commitPending();

		const removedSet = new Set(validIndices);

		for (const idx of validIndices) {
			this.tableData.rows.forEach((row) => row.splice(idx, 1));
			this.tableData.columnWidths.splice(idx, 1);
		}

		for (const idx of validIndices) {
			this.tableData.segments = this.tableData.segments
				.map((segment) => {
					if (idx < segment.startCol) {
						return {
							...segment,
							startCol: segment.startCol - 1,
							endCol: segment.endCol - 1
						};
					}
					if (idx <= segment.endCol) {
						return {
							...segment,
							endCol: segment.endCol - 1
						};
					}
					return segment;
				})
				.filter((segment) => segment.endCol >= segment.startCol);
		}

		if (this.selectedCells.length > 0) {
			this.selectedCells = this.selectedCells
				.filter((c) => !removedSet.has(c.col))
				.map((c) => {
					const shift = validIndices.filter((idx) => idx < c.col).length;
					return {
						...c,
						col: c.col - shift
					};
				});
		}

		if (this.selectedCells.length === 0 && this.tableData.columnWidths.length > 0) {
			const minRemoved = validIndices[validIndices.length - 1];
			const targetCol = Math.min(minRemoved, this.tableData.columnWidths.length - 1);
			this.selectedCells = [{ row: 0, col: targetCol }];
		}

		this.bumpLayout();
		this.saveHistory(true);
	}

	deleteColumn(index: number) {
		this.deleteColumns([index]);
	}

	addSegment(segment: RuleSegment) {
		const rowCount = this.tableData.rows.length;
		const colCount = this.tableData.columnWidths.length;
		if (rowCount === 0 || colCount === 0) return -1;

		this.commitPending();

		const startCol = Math.max(0, Math.min(segment.startCol, colCount - 1));
		const endCol = Math.max(startCol, Math.min(segment.endCol, colCount - 1));
		const atRow = Math.max(-1, Math.min(segment.atRow, rowCount - 1));

		this.tableData.segments = [
			...this.tableData.segments,
			{
				...segment,
				atRow,
				startCol,
				endCol
			}
		];
		this.saveHistory(true);
		return this.tableData.segments.length - 1;
	}

	addLineFromSelection(edge: LineEdge, shorter: boolean): number | null {
		const target = getLineTarget(this.tableData, this.selectedCells, edge);
		if (!target) return null;
		const existing = findSegmentIndex(
			this.tableData.segments,
			target.atRow,
			target.startCol,
			target.endCol
		);
		if (existing >= 0) return existing;
		const trim = shorter ? 'short' : 'none';
		const index = this.addSegment({
			atRow: target.atRow,
			startCol: target.startCol,
			endCol: target.endCol,
			trimLeft: trim,
			trimRight: trim,
			style: 'thin'
		});
		return index >= 0 ? index : null;
	}

	findLineIndexFromSelection(edge: LineEdge): number | null {
		const target = getLineTarget(this.tableData, this.selectedCells, edge);
		if (!target) return null;
		const index = findSegmentIndex(
			this.tableData.segments,
			target.atRow,
			target.startCol,
			target.endCol
		);
		return index >= 0 ? index : null;
	}

	setSegmentTrim(index: number, shorter: boolean) {
		const segment = this.tableData.segments[index];
		if (!segment) return;
		const trim = shorter ? 'short' : 'none';
		if (segment.trimLeft === trim && segment.trimRight === trim) return;
		this.tableData.segments = this.tableData.segments.map((item, i) =>
			i === index ? { ...item, trimLeft: trim, trimRight: trim } : item
		);
		this.saveHistory(true);
	}

	removeSegment(index: number) {
		if (index < 0 || index >= this.tableData.segments.length) return;
		this.tableData.segments = this.tableData.segments.filter((_, i) => i !== index);
		this.saveHistory(true);
	}

	clearSegments() {
		if (this.tableData.segments.length === 0) return;
		this.tableData.segments = [];
		this.saveHistory(true);
	}

	setColumnWidth(index: number, width: number) {
		if (this.tableData.columnWidths[index] !== undefined) {
			if (this.lockColumnResize) {
				this.tableData.columnWidths = this.tableData.columnWidths.map(() => width);
			} else {
				this.tableData.columnWidths[index] = width;
			}
		}
	}

	setRowHeight(index: number, height: number) {
		if (this.tableData.rowHeights[index] !== undefined) {
			if (this.lockRowResize) {
				this.tableData.rowHeights = this.tableData.rowHeights.map(() => height);
			} else {
				this.tableData.rowHeights[index] = height;
			}
		}
	}

	setPreset(preset: TableStyle['preset']) {
		this.tableStyle.preset = preset;
		switch (preset) {
			case 'booktabs':
				this.tableStyle.borders = {
					top: 'thick',
					bottom: 'thick',
					headerBottom: 'thin',
					vertical: 'none',
					horizontal: 'none'
				};
				break;
			case 'bordered':
				this.tableStyle.borders = {
					top: 'thin',
					bottom: 'thin',
					headerBottom: 'thin',
					vertical: 'thin',
					horizontal: 'thin'
				};
				break;
			case 'minimal':
				this.tableStyle.borders = {
					top: 'none',
					bottom: 'none',
					headerBottom: 'none',
					vertical: 'none',
					horizontal: 'none'
				};
				break;
		}
	}

	restoreDraft(draft: { tableData: TableData; tableStyle?: TableStyle; canvasConfig?: CanvasConfig }) {
		// TODO: 大表草稿会在启动时同步还原整表，窗口可能很久打不开（优先度低于编辑卡死）
		this.tableData = draft.tableData;
		if (draft.tableStyle) {
			this.tableStyle = draft.tableStyle;
		}
		if (draft.canvasConfig) {
			this.canvasConfig = draft.canvasConfig;
		}
		this.resetHistory();
		this.selectedCells = [];
		this.bumpLayout();
		this.bumpContent();
		this.saveHistory(true);
	}

	createNewTable(rows: number, cols: number) {
		this.tableData = createEmptyTable(rows, cols);
		this.resetHistory();
		this.selectedCells = [];
		this.bumpLayout();
		this.bumpContent();
		this.saveHistory(true);
	}

	resizeTable(newRows: number, newCols: number) {
		this.commitPending();
		const currentRows = this.tableData.rows.length;
		const currentCols = this.tableData.columnWidths.length;

		// Adjust columns
		if (newCols > currentCols) {
			const colsToAdd = newCols - currentCols;
			for (let i = 0; i < colsToAdd; i++) {
				this.tableData.columnWidths.push(100);
			}
			for (const row of this.tableData.rows) {
				for (let i = 0; i < colsToAdd; i++) {
					row.push(createCell());
				}
			}
		} else if (newCols < currentCols) {
			this.tableData.columnWidths = this.tableData.columnWidths.slice(0, newCols);
			for (const row of this.tableData.rows) {
				row.splice(newCols);
			}
		}

		// Adjust rows
		if (newRows > currentRows) {
			const rowsToAdd = newRows - currentRows;
			for (let i = 0; i < rowsToAdd; i++) {
				const newRow = Array(newCols).fill(null).map(() => createCell());
				this.tableData.rows.push(newRow);
				this.tableData.rowHeights.push(32);
			}
		} else if (newRows < currentRows) {
			this.tableData.rows = this.tableData.rows.slice(0, newRows);
			this.tableData.rowHeights = this.tableData.rowHeights.slice(0, newRows);
		}

		// Adjust headerRows if needed
		this.tableData.headerRows = Math.min(this.tableData.headerRows, newRows);

		// Clear selection
		this.selectedCells = [];
		this.bumpLayout();
		this.saveHistory(true);
	}

	private applyMergeRanges(merges: CellMergeRange[]) {
		const rowCount = this.tableData.rows.length;
		const colCount = this.tableData.columnWidths.length;
		if (rowCount === 0 || colCount === 0 || merges.length === 0) return;

		// 若表头起始行存在多行表头纵向合并（如 2~4 行复合表头），自动适配 headerRows，避免跨 thead/tbody 造成 HTML 表格错位
		let headerRows = this.tableData.headerRows;
		for (const m of merges) {
			if (m.row < headerRows && m.row + m.rowspan > headerRows) {
				const endRow = m.row + m.rowspan;
				if (endRow <= Math.min(4, rowCount - 1)) {
					headerRows = endRow;
				}
			}
		}
		this.tableData.headerRows = headerRows;

		// 对仍跨越 headerRows 边界的超长纵向合并，在边界处安全切分以保证 thead 与 tbody 网格闭合
		const safeMerges: CellMergeRange[] = [];
		for (const m of merges) {
			if (m.row < headerRows && m.row + m.rowspan > headerRows) {
				const topSpan = headerRows - m.row;
				const bottomSpan = m.row + m.rowspan - headerRows;
				if (topSpan > 1 || m.colspan > 1) {
					safeMerges.push({ row: m.row, col: m.col, rowspan: topSpan, colspan: m.colspan });
				}
				if (bottomSpan > 1 || m.colspan > 1) {
					safeMerges.push({ row: headerRows, col: m.col, rowspan: bottomSpan, colspan: m.colspan });
				}
			} else {
				safeMerges.push(m);
			}
		}

		for (const m of safeMerges) {
			const maxR = Math.min(rowCount, m.row + m.rowspan);
			const maxC = Math.min(colCount, m.col + m.colspan);
			const rowspan = maxR - m.row;
			const colspan = maxC - m.col;
			if (m.row < 0 || m.col < 0 || (rowspan <= 1 && colspan <= 1)) continue;

			const root = this.tableData.rows[m.row]?.[m.col];
			if (!root || root.isMerged) continue;

			root.rowspan = rowspan;
			root.colspan = colspan;
			root.isMerged = false;
			this.markDirtyRow(m.row);

			for (let r = m.row; r < maxR; r++) {
				this.markDirtyRow(r);
				for (let c = m.col; c < maxC; c++) {
					if (r === m.row && c === m.col) continue;
					const cell = this.tableData.rows[r]?.[c];
					if (cell) {
						cell.isMerged = true;
						cell.rowspan = 1;
						cell.colspan = 1;
						cell.content = '';
					}
				}
			}
		}
	}

	/**
	 * 根据当前表格各列内容长度比例与预览区可用宽度，智能自适应列宽：
	 * - 当各列单行理想总宽 <= 预览区目标总宽时：先保证每列完整容纳单行内容（零换行），再将富余空间按内容权重比例分配
	 * - 当各列单行理想总宽 > 预览区目标总宽时：短列最高不超过自身单行所需宽度（不浪费空间），剩余宽度按长列权重比例分配以最小化换行
	 */
	autoFitColumnWidths(availableWidth?: number) {
		const rows = this.tableData.rows;
		const colCount = this.tableData.columnWidths.length;
		if (colCount === 0 || rows.length === 0) return;

		const MIN_COL_WIDTH = 64;
		const MAX_SINGLE_COL_CAP = 320;
		const fallbackAvailable = Math.max(480, colCount * 140);
		const rawAvail = availableWidth && availableWidth > 0 ? availableWidth : fallbackAvailable;
		const targetTotalWidth = Math.max(
			colCount * MIN_COL_WIDTH,
			Math.min(rawAvail, colCount * MAX_SINGLE_COL_CAP)
		);

		if (this.lockColumnResize) {
			const uniformWidth = Math.max(MIN_COL_WIDTH, Math.round(targetTotalWidth / colCount));
			this.tableData.columnWidths = Array(colCount).fill(uniformWidth);
			return;
		}

		const fontSizePt = this.tableStyle.fontSize || 10.5;
		const fontSizePx = fontSizePt * (96 / 72);
		const padPx =
			typeof this.tableStyle.padding === 'number'
				? this.tableStyle.padding
				: this.tableStyle.padding === 'compact'
					? 4
					: this.tableStyle.padding === 'loose'
						? 16
						: 8;
		const cellExtraPx = padPx * 2 + 16;

		const scanLimit = Math.min(rows.length, 250);
		const idealWidths = new Array<number>(colCount).fill(MIN_COL_WIDTH);

		for (let r = 0; r < scanLimit; r++) {
			const row = rows[r];
			if (!row) continue;
			for (let c = 0; c < colCount; c++) {
				const cell = row[c];
				if (!cell || cell.isMerged) continue;
				const content = cell.content ?? '';
				if (!content) continue;

				const lines = content.split(/\r?\n/);
				let maxLinePx = 0;
				for (const line of lines) {
					let px = 0;
					for (let i = 0; i < line.length; i++) {
						px += line.charCodeAt(i) > 255 ? fontSizePx * 1.02 : fontSizePx * 0.58;
					}
					if (px > maxLinePx) maxLinePx = px;
				}

				const totalCellPx = Math.ceil(maxLinePx + cellExtraPx);
				const colspan = Math.max(1, Math.min(cell.colspan ?? 1, colCount - c));
				const perColPx = Math.ceil(totalCellPx / colspan);

				for (let s = 0; s < colspan; s++) {
					if (perColPx > idealWidths[c + s]) {
						idealWidths[c + s] = perColPx;
					}
				}
			}
		}

		const idealSum = idealWidths.reduce((acc, w) => acc + w, 0);
		const weights = idealWidths.map((w) => Math.pow(Math.min(w, 520), 0.85));
		const weightSum = weights.reduce((acc, w) => acc + w, 0) || colCount;

		if (idealSum <= targetTotalWidth) {
			const extra = targetTotalWidth - idealSum;
			this.tableData.columnWidths = idealWidths.map((ideal, c) =>
				Math.max(MIN_COL_WIDTH, Math.round(ideal + extra * (weights[c] / weightSum)))
			);
			return;
		}

		const allocated = new Array<number>(colCount).fill(0);
		const fixed = new Array<boolean>(colCount).fill(false);
		let remainingBudget = targetTotalWidth;

		for (let iter = 0; iter < colCount; iter++) {
			let activeWeightSum = 0;
			for (let c = 0; c < colCount; c++) {
				if (!fixed[c]) activeWeightSum += weights[c];
			}
			if (activeWeightSum <= 0) break;

			let clampedAny = false;
			for (let c = 0; c < colCount; c++) {
				if (fixed[c]) continue;
				const share = (weights[c] / activeWeightSum) * remainingBudget;
				if (share < MIN_COL_WIDTH) {
					allocated[c] = MIN_COL_WIDTH;
					fixed[c] = true;
					remainingBudget -= MIN_COL_WIDTH;
					clampedAny = true;
				} else if (share > idealWidths[c]) {
					allocated[c] = idealWidths[c];
					fixed[c] = true;
					remainingBudget -= idealWidths[c];
					clampedAny = true;
				} else {
					allocated[c] = share;
				}
			}
			if (!clampedAny) break;
		}

		this.tableData.columnWidths = allocated.map((w) => Math.max(MIN_COL_WIDTH, Math.round(w)));
	}

	importData(input: string[][] | ImportedTableData, availableWidth?: number) {
		const data = Array.isArray(input) ? input : input.rows;
		const merges = Array.isArray(input) ? [] : (input.merges ?? []);
		if (!data || data.length === 0 || !data[0] || data[0].length === 0) {
			return;
		}

		// 必须先清空选区，防止 Svelte 5 的 $derived 状态在响应 tableData 变动时访问旧坐标抛出越界崩溃
		this.selectedCells = [];
		this.resetHistory();

		const colCount = Math.max(...data.map((r) => r.length), 1);
		const rows: Cell[][] = data.map((row) =>
			Array(colCount)
				.fill(null)
				.map((_, colIdx) => createCell(row[colIdx] ?? ''))
		);

		this.tableData = {
			rows,
			columnWidths: Array(colCount).fill(100),
			rowHeights: Array(data.length).fill(32),
			headerRows: 1,
			segments: []
		};
		if (merges.length > 0) {
			this.applyMergeRanges(merges);
		}
		this.autoFitColumnWidths(availableWidth);
		this.bumpLayout();
		this.bumpContent();
		this.saveHistory(true);
	}

	pasteAtSelection(input: string[][] | ImportedTableData, availableWidth?: number) {
		const data = Array.isArray(input) ? input : input.rows;
		const merges = Array.isArray(input) ? [] : (input.merges ?? []);
		if (data.length === 0 || data[0].length === 0) return;
		this.commitPending();

		// Determine paste start position from selection, default to (0, 0)
		let startRow = 0;
		let startCol = 0;
		if (this.selectedCells.length > 0) {
			startRow = Math.min(...this.selectedCells.map((c) => c.row));
			startCol = Math.min(...this.selectedCells.map((c) => c.col));
		}

		const pasteRows = data.length;
		const pasteCols = data[0].length;
		const requiredRows = startRow + pasteRows;
		const requiredCols = startCol + pasteCols;
		const startRowCount = this.tableData.rows.length;
		const startColCount = this.tableData.columnWidths.length;

		// Expand rows if needed
		while (this.tableData.rows.length < requiredRows) {
			const cols = this.tableData.columnWidths.length;
			const newRow = Array(cols).fill(null).map(() => createCell());
			this.tableData.rows.push(newRow);
			this.tableData.rowHeights.push(32);
		}

		// Expand columns if needed
		const currentCols = this.tableData.columnWidths.length;
		if (currentCols < requiredCols) {
			const colsToAdd = requiredCols - currentCols;
			for (let i = 0; i < colsToAdd; i++) {
				this.tableData.columnWidths.push(100);
			}
			for (const row of this.tableData.rows) {
				for (let i = 0; i < colsToAdd; i++) {
					row.push(createCell());
				}
			}
		}

		let structure =
			this.tableData.rows.length !== startRowCount ||
			this.tableData.columnWidths.length !== startColCount;

		// 若目标粘贴区域内原本存在旧的合并单元格，先解开重叠的合并范围以免残留脏状态
		for (let r = 0; r < this.tableData.rows.length; r++) {
			for (let c = 0; c < this.tableData.rows[r].length; c++) {
				const cell = this.tableData.rows[r][c];
				const rs = cell.rowspan ?? 1;
				const cs = cell.colspan ?? 1;
				if (rs > 1 || cs > 1) {
					const overlapsRow = r < requiredRows && r + rs > startRow;
					const overlapsCol = c < requiredCols && c + cs > startCol;
					if (overlapsRow && overlapsCol) {
						for (let rr = r; rr < r + rs && rr < this.tableData.rows.length; rr++) {
							this.markDirtyRow(rr);
							for (let cc = c; cc < c + cs && cc < this.tableData.rows[rr].length; cc++) {
								const target = this.tableData.rows[rr][cc];
								target.isMerged = false;
								target.rowspan = 1;
								target.colspan = 1;
							}
						}
						structure = true;
					}
				}
			}
		}

		// Paste data at the target position
		for (let r = 0; r < pasteRows; r++) {
			for (let c = 0; c < pasteCols; c++) {
				const targetRow = startRow + r;
				const targetCol = startCol + c;
				const content = data[r][c] ?? '';
				const cell = this.tableData.rows[targetRow]?.[targetCol];
				if (cell) {
					cell.content = content;
					cell.isMerged = false;
					cell.rowspan = 1;
					cell.colspan = 1;
					this.markDirtyRow(targetRow);
				}
			}
		}

		// 还原剪贴板中携带的合并单元格结构
		if (merges.length > 0) {
			const offsetMerges = merges.map((m) => ({
				row: startRow + m.row,
				col: startCol + m.col,
				rowspan: m.rowspan,
				colspan: m.colspan
			}));
			this.applyMergeRanges(offsetMerges);
			structure = true;
		}

		this.autoFitColumnWidths(availableWidth);
		this.bumpLayout();
		this.bumpContent();
		this.saveHistory(true);
	}
}

export const tableStore = new TableStore();
