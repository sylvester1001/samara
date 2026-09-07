import type { TableData, TableStyle, CanvasConfig, Cell } from '$lib/types';
import { DEFAULT_TABLE_STYLE, DEFAULT_CANVAS_CONFIG, DEFAULT_CELL } from '$lib/types';

export interface TableDraft {
	version: number;
	tableData: TableData;
	tableStyle: TableStyle;
	canvasConfig: CanvasConfig;
	updatedAt: number;
}

const STORAGE_KEY = 'samara-table-draft-v1';

export function saveDraft(draft: {
	tableData: TableData;
	tableStyle: TableStyle;
	canvasConfig: CanvasConfig;
}): void {
	if (typeof window === 'undefined' || !window.localStorage) return;
	try {
		const payload: TableDraft = {
			version: 1,
			tableData: draft.tableData,
			tableStyle: draft.tableStyle,
			canvasConfig: draft.canvasConfig,
			updatedAt: Date.now()
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch (e) {
		console.warn('Failed to save table draft to localStorage:', e);
	}
}

export function loadDraft(): TableDraft | null {
	if (typeof window === 'undefined' || !window.localStorage) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed || !parsed.tableData || !Array.isArray(parsed.tableData.rows) || parsed.tableData.rows.length === 0) {
			return null;
		}

		// 字段健壮性校验与默认值兜底
		const rows: Cell[][] = parsed.tableData.rows.map((row: unknown) => {
			if (!Array.isArray(row)) return [];
			return row.map((cell: unknown) => ({
				...DEFAULT_CELL,
				...(typeof cell === 'object' && cell !== null ? cell : {})
			}));
		});

		if (rows.length === 0 || rows[0].length === 0) {
			return null;
		}

		const colsCount = rows[0].length;
		const rowsCount = rows.length;

		const tableData: TableData = {
			rows,
			columnWidths:
				Array.isArray(parsed.tableData.columnWidths) && parsed.tableData.columnWidths.length === colsCount
					? parsed.tableData.columnWidths
					: Array(colsCount).fill(100),
			rowHeights:
				Array.isArray(parsed.tableData.rowHeights) && parsed.tableData.rowHeights.length === rowsCount
					? parsed.tableData.rowHeights
					: Array(rowsCount).fill(32),
			headerRows: typeof parsed.tableData.headerRows === 'number' ? parsed.tableData.headerRows : 1,
			segments: Array.isArray(parsed.tableData.segments) ? parsed.tableData.segments : []
		};

		const tableStyle: TableStyle = {
			...DEFAULT_TABLE_STYLE,
			...(parsed.tableStyle || {}),
			borders: {
				...DEFAULT_TABLE_STYLE.borders,
				...(parsed.tableStyle?.borders || {})
			}
		};

		const canvasConfig: CanvasConfig = {
			...DEFAULT_CANVAS_CONFIG,
			...(parsed.canvasConfig || {})
		};

		return {
			version: parsed.version || 1,
			tableData,
			tableStyle,
			canvasConfig,
			updatedAt: parsed.updatedAt || Date.now()
		};
	} catch (e) {
		console.warn('Failed to load table draft from localStorage:', e);
		return null;
	}
}

export function clearDraft(): void {
	if (typeof window === 'undefined' || !window.localStorage) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.warn('Failed to clear table draft:', e);
	}
}
