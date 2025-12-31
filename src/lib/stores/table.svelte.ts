import {
	type TableData,
	type TableStyle,
	type CanvasConfig,
	type Cell,
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
		rowHeights: Array(rows).fill(32)
	};
}

class TableStore {
	tableData = $state<TableData>(createEmptyTable(4, 4));
	tableStyle = $state<TableStyle>({ ...DEFAULT_TABLE_STYLE });
	canvasConfig = $state<CanvasConfig>({ ...DEFAULT_CANVAS_CONFIG });
	selectedCells = $state<{ row: number; col: number }[]>([]);
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
		this.tableData = data;
		this.saveHistory();
	}

	updateCell(row: number, col: number, updates: Partial<Cell>) {
		if (this.tableData.rows[row]?.[col]) {
			this.tableData.rows[row][col] = { ...this.tableData.rows[row][col], ...updates };
			this.saveHistory();
		}
	}

	addRow(index?: number) {
		const cols = this.tableData.rows[0]?.length || 4;
		const newRow = Array(cols).fill(null).map(() => createCell());
		const idx = index ?? this.tableData.rows.length;
		this.tableData.rows.splice(idx, 0, newRow);
		this.tableData.rowHeights.splice(idx, 0, 32);
		this.saveHistory();
	}

	deleteRow(index: number) {
		if (this.tableData.rows.length > 1) {
			this.tableData.rows.splice(index, 1);
			this.tableData.rowHeights.splice(index, 1);
			this.saveHistory();
		}
	}

	addColumn(index?: number) {
		const idx = index ?? (this.tableData.rows[0]?.length || 0);
		this.tableData.rows.forEach((row, i) => {
			row.splice(idx, 0, createCell(i === 0 ? `Col ${idx + 1}` : ''));
		});
		this.tableData.columnWidths.splice(idx, 0, 100);
		this.saveHistory();
	}

	deleteColumn(index: number) {
		if (this.tableData.columnWidths.length > 1) {
			this.tableData.rows.forEach((row) => row.splice(index, 1));
			this.tableData.columnWidths.splice(index, 1);
			this.saveHistory();
		}
	}

	setColumnWidth(index: number, width: number) {
		if (this.tableData.columnWidths[index] !== undefined) {
			this.tableData.columnWidths[index] = width;
		}
	}

	setRowHeight(index: number, height: number) {
		if (this.tableData.rowHeights[index] !== undefined) {
			this.tableData.rowHeights[index] = height;
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
		this.saveHistory();
	}

	importData(data: string[][]) {
		const rows: Cell[][] = data.map((row, i) =>
			row.map((content) => createCell(content))
		);
		this.tableData = {
			rows,
			columnWidths: Array(data[0]?.length || 1).fill(100),
			rowHeights: Array(data.length).fill(32)
		};
		this.history = [];
		this.historyIndex = -1;
		this.saveHistory();
	}
}

export const tableStore = new TableStore();
