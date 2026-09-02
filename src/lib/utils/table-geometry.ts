import type { RuleSegment, TableData } from '$lib/types';

export type LineEdge = 'above' | 'below';

export interface CellRange {
	rowStart: number;
	rowEnd: number;
	colStart: number;
	colEnd: number;
}

export function getCellRange(tableData: TableData, row: number, col: number): CellRange {
	const cell = tableData.rows[row]?.[col];
	if (cell && !cell.isMerged) {
		const rowspan = cell.rowspan ?? 1;
		const colspan = cell.colspan ?? 1;
		return {
			rowStart: row,
			rowEnd: row + rowspan - 1,
			colStart: col,
			colEnd: col + colspan - 1
		};
	}
	for (let r = 0; r < tableData.rows.length; r++) {
		for (let c = 0; c < tableData.rows[r].length; c++) {
			const candidate = tableData.rows[r][c];
			const rowspan = candidate.rowspan ?? 1;
			const colspan = candidate.colspan ?? 1;
			if (rowspan <= 1 && colspan <= 1) continue;
			if (row >= r && row < r + rowspan && col >= c && col < c + colspan) {
				return {
					rowStart: r,
					rowEnd: r + rowspan - 1,
					colStart: c,
					colEnd: c + colspan - 1
				};
			}
		}
	}
	return { rowStart: row, rowEnd: row, colStart: col, colEnd: col };
}

export function getSelectionBounds(
	tableData: TableData,
	selectedCells: { row: number; col: number }[]
): CellRange | null {
	if (!selectedCells.length) return null;
	let rowStart = Number.POSITIVE_INFINITY;
	let rowEnd = -Infinity;
	let colStart = Number.POSITIVE_INFINITY;
	let colEnd = -Infinity;
	for (const cell of selectedCells) {
		const range = getCellRange(tableData, cell.row, cell.col);
		rowStart = Math.min(rowStart, range.rowStart);
		rowEnd = Math.max(rowEnd, range.rowEnd);
		colStart = Math.min(colStart, range.colStart);
		colEnd = Math.max(colEnd, range.colEnd);
	}
	return { rowStart, rowEnd, colStart, colEnd };
}

export function getLineTarget(
	tableData: TableData,
	selectedCells: { row: number; col: number }[],
	edge: LineEdge
): { atRow: number; startCol: number; endCol: number } | null {
	const bounds = getSelectionBounds(tableData, selectedCells);
	if (!bounds) return null;
	return {
		atRow: edge === 'below' ? bounds.rowEnd : bounds.rowStart - 1,
		startCol: bounds.colStart,
		endCol: bounds.colEnd
	};
}

export function findSegmentIndex(
	segments: RuleSegment[],
	atRow: number,
	startCol: number,
	endCol: number
): number {
	return segments.findIndex(
		(segment) =>
			segment.atRow === atRow && segment.startCol === startCol && segment.endCol === endCol
	);
}

export function isSegmentTrimmed(segment: RuleSegment | undefined): boolean {
	if (!segment) return true;
	return segment.trimLeft !== 'none' && segment.trimRight !== 'none';
}

export function getSegmentLabel(tableData: TableData, segment: RuleSegment): string {
	const belowRow = segment.atRow + 1;
	const cellBelow = tableData.rows[belowRow]?.[segment.startCol];
	const cellAbove = segment.atRow >= 0 ? tableData.rows[segment.atRow]?.[segment.startCol] : null;
	const raw = (cellBelow?.content || cellAbove?.content || '').trim();
	const text = raw.replace(/^\$|\$$/g, '').slice(0, 24);
	if (text) return text;

	const start = String.fromCharCode(65 + segment.startCol);
	const end = String.fromCharCode(65 + segment.endCol);
	return start === end ? start : `${start}–${end}`;
}
