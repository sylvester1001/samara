import type { Cell, TableData } from '$lib/types';

export interface ResolvedCell {
	/** 原始单元格引用 */
	raw: Cell;
	/** 物理坐标 */
	rowIndex: number;
	colIndex: number;
	/** 是否属于表头区域 */
	isHeader: boolean;
	/** 最终生效的加粗状态（显式指定 > 表头默认加粗） */
	effectiveBold: boolean;
	/** 最终生效的斜体状态 */
	effectiveItalic: boolean;
	/** 最终生效的对齐方式 */
	effectiveAlign: 'left' | 'center' | 'right' | 'decimal';
	/** 是否显式设置了自定义背景色 */
	hasCustomBg: boolean;
	/** 背景颜色（如果有） */
	backgroundColor?: string;
	/** 是否显式设置了文字颜色 */
	hasCustomTextColor: boolean;
	/** 文字颜色（如果有） */
	textColor?: string;
	/** 跨行数 */
	rowspan: number;
	/** 跨列数 */
	colspan: number;
	/** 是否为被合并隐藏的单元格 */
	isMerged: boolean;
	/** 单元格内容 */
	content: string;
}

export interface TableProfile {
	/** 总行数 */
	rowCount: number;
	/** 总列数 */
	colCount: number;
	/** 表头行数 */
	headerRowCount: number;
	/** 是否有单元格设置了背景色 */
	hasCellColors: boolean;
	/** 是否有单元格设置了文字颜色 */
	hasTextColors: boolean;
	/** 是否存在跨行合并 */
	hasRowspans: boolean;
	/** 是否存在跨列合并 */
	hasColspans: boolean;
	/** 是否存在包含换行符的单元格 */
	hasMultilineCells: boolean;
}

/**
 * 将单个 Cell 和位置上下文解析为计算完备的 ResolvedCell
 */
export function resolveCell(
	cell: Cell,
	rowIndex: number,
	colIndex: number,
	headerRows: number = 1
): ResolvedCell {
	const isHeader = rowIndex < headerRows;
	// 显式设置优先于继承：若显式设置了 isBold 则遵循；否则如果是表头则默认加粗，普通行默认不加粗
	const effectiveBold = cell.isBold !== undefined ? cell.isBold : isHeader;
	const effectiveItalic = cell.isItalic ?? false;
	const effectiveAlign = cell.align ?? (isHeader ? 'center' : 'center');
	const hasCustomBg = Boolean(cell.backgroundColor && cell.backgroundColor.trim() !== '');
	const hasCustomTextColor = Boolean(cell.textColor && cell.textColor.trim() !== '');

	return {
		raw: cell,
		rowIndex,
		colIndex,
		isHeader,
		effectiveBold,
		effectiveItalic,
		effectiveAlign,
		hasCustomBg,
		backgroundColor: hasCustomBg ? cell.backgroundColor : undefined,
		hasCustomTextColor,
		textColor: hasCustomTextColor ? cell.textColor : undefined,
		rowspan: cell.rowspan ?? 1,
		colspan: cell.colspan ?? 1,
		isMerged: Boolean(cell.isMerged),
		content: cell.content ?? ''
	};
}

/**
 * 解析整个表格矩阵为 ResolvedCell[][]
 */
export function resolveTableMatrix(tableData: TableData): ResolvedCell[][] {
	const headerRows = Math.min(
		Math.max(1, tableData.headerRows ?? 1),
		tableData.rows.length || 1
	);
	return tableData.rows.map((row, r) =>
		row.map((cell, c) => resolveCell(cell, r, c, headerRows))
	);
}

/**
 * 萃取表格级特征画像
 */
export function analyzeTableProfile(tableData: TableData): TableProfile {
	const rowCount = tableData.rows.length;
	const colCount = tableData.columnWidths.length || tableData.rows[0]?.length || 0;
	const headerRowCount = Math.min(
		Math.max(1, tableData.headerRows ?? 1),
		rowCount || 1
	);

	let hasCellColors = false;
	let hasTextColors = false;
	let hasRowspans = false;
	let hasColspans = false;
	let hasMultilineCells = false;

	for (let r = 0; r < rowCount; r++) {
		const row = tableData.rows[r];
		for (let c = 0; c < row.length; c++) {
			const cell = row[c];
			if (cell.backgroundColor && cell.backgroundColor.trim() !== '') {
				hasCellColors = true;
			}
			if (cell.textColor && cell.textColor.trim() !== '') {
				hasTextColors = true;
			}
			if ((cell.rowspan ?? 1) > 1) {
				hasRowspans = true;
			}
			if ((cell.colspan ?? 1) > 1) {
				hasColspans = true;
			}
			if (cell.content && cell.content.includes('\n')) {
				hasMultilineCells = true;
			}
		}
	}

	return {
		rowCount,
		colCount,
		headerRowCount,
		hasCellColors,
		hasTextColors,
		hasRowspans,
		hasColspans,
		hasMultilineCells
	};
}
