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

function createCell(content: string = ''): Cell {
	return { ...DEFAULT_CELL, content };
}

function createEmptyTable(rows: number, cols: number): TableData {
	const tableRows: Cell[][] = [];
	for (let i = 0; i < rows; i++) {
		const row: Cell[] = [];
		for (let j = 0; j < cols; j++) {
			row.push(createCell(i === 0 ? `Col ${j + 1}` : ''));
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
	history = $state<TableData[]>([]);
	historyIndex = $state(-1);

	constructor() {
		this.saveHistory();
	}

	private saveHistory() {
		const snapshot = JSON.parse(JSON.stringify(this.tableData));
		this.history = this.history.slice(0, this.historyIndex + 1);
		this.history.push(snapshot);
		this.historyIndex = this.history.length - 1;
	}

	undo() {
		if (this.historyIndex > 0) {
			this.historyIndex--;
			this.tableData = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
		}
	}

	redo() {
		if (this.historyIndex < this.history.length - 1) {
			this.historyIndex++;
			this.tableData = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
		}
	}

	setTableData(data: TableData) {
		this.tableData = {
			...data,
			headerRows: data.headerRows ?? 1,
			segments: data.segments ?? []
		};
		this.saveHistory();
	}

	setHeaderRows(count: number) {
		const maxRows = this.tableData.rows.length || 1;
		const next = Math.min(Math.max(1, count), maxRows);
		this.tableData.headerRows = next;
		this.saveHistory();
	}

	updateCell(row: number, col: number, updates: Partial<Cell>) {
		if (this.tableData.rows[row]?.[col]) {
			this.tableData.rows[row][col] = { ...this.tableData.rows[row][col], ...updates };
			this.saveHistory();
		}
	}

	setSelectedCells(cells: { row: number; col: number }[]) {
		this.selectedCells = cells;
	}

	clearSelection() {
		this.selectedCells = [];
	}

	applyToSelectedCells(updates: Partial<Cell>) {
		if (this.selectedCells.length === 0) return;
		for (const { row, col } of this.selectedCells) {
			const cell = this.tableData.rows[row]?.[col];
			if (cell) {
				this.tableData.rows[row][col] = { ...cell, ...updates };
			}
		}
		this.saveHistory();
	}

	clearSelectedCellsContent() {
		if (this.selectedCells.length === 0) return;
		for (const { row, col } of this.selectedCells) {
			const cell = this.tableData.rows[row]?.[col];
			if (cell) {
				this.tableData.rows[row][col] = { ...cell, content: '' };
			}
		}
		this.saveHistory();
	}

	toggleSelectedCells(field: 'isBold' | 'isItalic') {
		if (this.selectedCells.length === 0) return;
		const shouldEnable = this.selectedCells.some(({ row, col }) => {
			const cell = this.tableData.rows[row]?.[col];
			return cell ? !cell[field] : false;
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

		const root = this.tableData.rows[minRow]?.[minCol];
		if (!root) return;

		root.colspan = maxCol - minCol + 1;
		root.rowspan = maxRow - minRow + 1;
		root.isMerged = false;

		for (const { row, col } of this.selectedCells) {
			if (row === minRow && col === minCol) continue;
			const cell = this.tableData.rows[row]?.[col];
			if (cell) {
				cell.isMerged = true;
				cell.colspan = 1;
				cell.rowspan = 1;
			}
		}

		this.selectedCells = [{ row: minRow, col: minCol }];
		this.saveHistory();
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

		const rowspan = target.cell.rowspan ?? 1;
		const colspan = target.cell.colspan ?? 1;
		for (let r = target.row; r < target.row + rowspan; r++) {
			for (let c = target.col; c < target.col + colspan; c++) {
				const cell = this.tableData.rows[r]?.[c];
				if (cell) {
					cell.isMerged = false;
					cell.rowspan = 1;
					cell.colspan = 1;
				}
			}
		}
		this.saveHistory();
	}

	addRow(index?: number) {
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
		this.saveHistory();
	}

	deleteRow(index: number) {
		if (this.tableData.rows.length > 1) {
			this.tableData.rows.splice(index, 1);
			this.tableData.rowHeights.splice(index, 1);
			this.tableData.headerRows = Math.min(
				Math.max(1, this.tableData.headerRows),
				this.tableData.rows.length
			);
			const maxRow = this.tableData.rows.length - 1;
			this.tableData.segments = this.tableData.segments.map((segment) => {
				const shifted = segment.atRow >= index ? segment.atRow - 1 : segment.atRow;
				return { ...segment, atRow: Math.min(Math.max(0, shifted), maxRow) };
			});
			this.saveHistory();
		}
	}

	addColumn(index?: number) {
		const idx = index ?? (this.tableData.rows[0]?.length || 0);
		const defaultWidth = this.lockColumnResize ? this.tableData.columnWidths[0] ?? 100 : 100;
		this.tableData.rows.forEach((row, i) => {
			row.splice(idx, 0, createCell(i === 0 ? `Col ${idx + 1}` : ''));
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
		this.saveHistory();
	}

	deleteColumn(index: number) {
		if (this.tableData.columnWidths.length > 1) {
			this.tableData.rows.forEach((row) => row.splice(index, 1));
			this.tableData.columnWidths.splice(index, 1);
			this.tableData.segments = this.tableData.segments
				.map((segment) => {
					if (index < segment.startCol) {
						return {
							...segment,
							startCol: segment.startCol - 1,
							endCol: segment.endCol - 1
						};
					}
					if (index <= segment.endCol) {
						return {
							...segment,
							endCol: segment.endCol - 1
						};
					}
					return segment;
				})
				.filter((segment) => segment.endCol >= segment.startCol);
			this.saveHistory();
		}
	}

	addSegment(segment: RuleSegment) {
		const rowCount = this.tableData.rows.length;
		const colCount = this.tableData.columnWidths.length;
		if (rowCount === 0 || colCount === 0) return;

		const startCol = Math.max(0, Math.min(segment.startCol, colCount - 1));
		const endCol = Math.max(startCol, Math.min(segment.endCol, colCount - 1));
		const atRow = Math.max(0, Math.min(segment.atRow, rowCount - 1));

		this.tableData.segments = [
			...this.tableData.segments,
			{
				...segment,
				atRow,
				startCol,
				endCol
			}
		];
		this.saveHistory();
	}

	removeSegment(index: number) {
		if (index < 0 || index >= this.tableData.segments.length) return;
		this.tableData.segments = this.tableData.segments.filter((_, i) => i !== index);
		this.saveHistory();
	}

	clearSegments() {
		if (this.tableData.segments.length === 0) return;
		this.tableData.segments = [];
		this.saveHistory();
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

	createNewTable(rows: number, cols: number) {
		this.tableData = createEmptyTable(rows, cols);
		this.history = [];
		this.historyIndex = -1;
		this.selectedCells = [];
		this.saveHistory();
	}

	resizeTable(newRows: number, newCols: number) {
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
		this.saveHistory();
	}

	importData(data: string[][]) {
		const rows: Cell[][] = data.map((row, i) =>
			row.map((content) => createCell(content))
		);
		this.tableData = {
			rows,
			columnWidths: Array(data[0]?.length || 1).fill(100),
			rowHeights: Array(data.length).fill(32),
			headerRows: 1,
			segments: []
		};
		this.history = [];
		this.historyIndex = -1;
		this.selectedCells = [];
		this.saveHistory();
	}

	pasteAtSelection(data: string[][]) {
		if (data.length === 0 || data[0].length === 0) return;

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

		// Paste data at the target position
		for (let r = 0; r < pasteRows; r++) {
			for (let c = 0; c < pasteCols; c++) {
				const targetRow = startRow + r;
				const targetCol = startCol + c;
				const content = data[r][c] ?? '';
				if (this.tableData.rows[targetRow]?.[targetCol]) {
					this.tableData.rows[targetRow][targetCol] = {
						...this.tableData.rows[targetRow][targetCol],
						content
					};
				}
			}
		}

		this.saveHistory();
	}
}

export const tableStore = new TableStore();
