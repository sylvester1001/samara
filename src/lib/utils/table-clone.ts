import type { Cell, RuleSegment, TableData } from '$lib/types';

export function cloneCell(cell: Cell): Cell {
	return {
		content: cell.content ?? '',
		colspan: cell.colspan ?? 1,
		rowspan: cell.rowspan ?? 1,
		align: cell.align,
		backgroundColor: cell.backgroundColor,
		textColor: cell.textColor,
		isBold: cell.isBold,
		isItalic: cell.isItalic,
		isMerged: cell.isMerged ?? false
	};
}

export function cloneRow(row: Cell[]): Cell[] {
	const out = new Array(row.length);
	for (let i = 0; i < row.length; i++) out[i] = cloneCell(row[i]);
	return out;
}

export function cloneSegments(segments: RuleSegment[]): RuleSegment[] {
	const src = segments ?? [];
	const out = new Array(src.length);
	for (let i = 0; i < src.length; i++) out[i] = { ...src[i] };
	return out;
}

/** 从代理对象上拆一份纯数据，不走 $state.snapshot 的全树反射。 */
export function cloneTableData(data: TableData): TableData {
	const src = data.rows;
	const rows = new Array(src.length);
	for (let r = 0; r < src.length; r++) rows[r] = cloneRow(src[r]);
	return {
		rows,
		columnWidths: data.columnWidths.slice(),
		rowHeights: data.rowHeights.slice(),
		headerRows: data.headerRows,
		segments: cloneSegments(data.segments)
	};
}

/**
 * 单元格级操作只拷脏行，其余行沿用上一份快照的引用。
 * 快照行绝不能和 live 代理共用对象，否则后续编辑会改写历史。
 */
export function cowCloneTable(
	prev: TableData | undefined,
	live: TableData,
	dirtyRows: ReadonlySet<number>,
	structureChanged: boolean
): TableData {
	if (
		!prev ||
		structureChanged ||
		prev.rows.length !== live.rows.length ||
		(prev.rows[0]?.length ?? 0) !== (live.rows[0]?.length ?? 0)
	) {
		return cloneTableData(live);
	}

	const rows = prev.rows.slice();
	for (const r of dirtyRows) {
		if (r < 0 || r >= live.rows.length) continue;
		rows[r] = cloneRow(live.rows[r]);
	}

	const sameCols = prev.columnWidths.length === live.columnWidths.length && prev.columnWidths.every((w, i) => w === live.columnWidths[i]);
	const sameRows = prev.rowHeights.length === live.rowHeights.length && prev.rowHeights.every((h, i) => h === live.rowHeights[i]);
	return {
		rows,
		columnWidths: sameCols ? prev.columnWidths : live.columnWidths.slice(),
		rowHeights: sameRows ? prev.rowHeights : live.rowHeights.slice(),
		headerRows: live.headerRows,
		segments: cloneSegments(live.segments)
	};
}

export function restoreCell(dst: Cell, src: Cell) {
	dst.content = src.content ?? '';
	dst.colspan = src.colspan ?? 1;
	dst.rowspan = src.rowspan ?? 1;
	dst.align = src.align;
	dst.backgroundColor = src.backgroundColor;
	dst.textColor = src.textColor;
	dst.isBold = src.isBold;
	dst.isItalic = src.isItalic;
	dst.isMerged = src.isMerged ?? false;
}

export function restoreRow(dst: Cell[], src: Cell[]) {
	const n = Math.min(dst.length, src.length);
	for (let c = 0; c < n; c++) restoreCell(dst[c], src[c]);
}

export function sameTableShape(a: TableData, b: TableData): boolean {
	return (
		a.rows.length === b.rows.length &&
		(a.rows[0]?.length ?? 0) === (b.rows[0]?.length ?? 0) &&
		a.columnWidths.length === b.columnWidths.length
	);
}

export function restoreTableInPlace(live: TableData, snap: TableData) {
	for (let r = 0; r < snap.rows.length; r++) {
		restoreRow(live.rows[r], snap.rows[r]);
	}
	for (let i = 0; i < snap.columnWidths.length; i++) {
		live.columnWidths[i] = snap.columnWidths[i];
	}
	for (let i = 0; i < snap.rowHeights.length; i++) {
		live.rowHeights[i] = snap.rowHeights[i];
	}
	live.headerRows = snap.headerRows;
	live.segments = cloneSegments(snap.segments);
}

/** 利用 COW 快照的行引用相等，只还原真正改过的行。 */
export function restoreChangedRows(live: TableData, from: TableData, to: TableData): boolean {
	if (!sameTableShape(live, to) || !sameTableShape(from, to)) return false;
	for (let r = 0; r < to.rows.length; r++) {
		if (from.rows[r] === to.rows[r]) continue;
		restoreRow(live.rows[r], to.rows[r]);
	}
	if (from.columnWidths !== to.columnWidths) {
		for (let i = 0; i < to.columnWidths.length; i++) {
			live.columnWidths[i] = to.columnWidths[i];
		}
	}
	if (from.rowHeights !== to.rowHeights) {
		for (let i = 0; i < to.rowHeights.length; i++) {
			live.rowHeights[i] = to.rowHeights[i];
		}
	}
	live.headerRows = to.headerRows;
	if (from.segments !== to.segments) {
		live.segments = cloneSegments(to.segments);
	}
	return true;
}
