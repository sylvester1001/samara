import type { TableData, TableStyle, BorderStyle, RuleSegment } from '$lib/types';
import { escapeLatexText } from './latex-processor';
import {
	analyzeTableProfile,
	resolveTableMatrix,
	getRowUniformBgColor,
	type ResolvedCell,
	type TableProfile
} from './table-semantics';

// --- Constants ---

// 像素到 pt 的转换比例 (假设 96 DPI)
const PX_TO_PT = 0.75;

// Padding 映射 (与 AcademicTable 保持一致)
const PADDING_MAP: Record<string, number> = {
	compact: 4,
	normal: 8,
	loose: 16
};

// 默认行高（px）
const DEFAULT_ROW_HEIGHT = 32;

// --- Helpers ---

function formatColor(hex: string): string {
	return hex.replace('#', '');
}

/**
 * 将像素转换为 pt
 */
function pxToPt(px: number): number {
	return Math.round(px * PX_TO_PT);
}

/**
 * 根据 BorderStyle 生成 booktabs 的线型命令
 */
function formatPartialRule(segment: RuleSegment, isBooktabs: boolean): string {
	const start = segment.startCol + 1;
	const end = segment.endCol + 1;
	if (!isBooktabs) {
		return `\\cline{${start}-${end}}`;
	}
	const left = segment.trimLeft === 'short' ? 'l' : '';
	const right = segment.trimRight === 'short' ? 'r' : '';
	const trim = left || right ? `(${left}${right})` : '';
	return `\\cmidrule${trim}{${start}-${end}}`;
}

function getPartialRulesAt(data: TableData, atRow: number, isBooktabs: boolean): string {
	const commands = (data.segments ?? [])
		.filter((segment) => segment.atRow === atRow)
		.sort((a, b) => a.startCol - b.startCol)
		.map((segment) => formatPartialRule(segment, isBooktabs));
	return commands.join('');
}

function getBorderCommand(borderStyle: BorderStyle, position: 'top' | 'bottom' | 'header'): string {
	switch (borderStyle) {
		case 'none':
			return '';
		case 'thin':
			return position === 'header' ? '\\midrule' : (position === 'top' ? '\\toprule' : '\\bottomrule');
		case 'thick':
			return position === 'header' ? '\\midrule' : (position === 'top' ? '\\toprule' : '\\bottomrule');
		case 'double':
			return position === 'header' ? '\\midrule\\midrule' : (position === 'top' ? '\\toprule\\toprule' : '\\bottomrule\\bottomrule');
		case 'thick-thin':
			return '\\toprule\\midrule';
		case 'thin-thick':
			return '\\midrule\\bottomrule';
		default:
			return '\\hline';
	}
}

/**
 * 将对齐方式映射为 LaTeX 列对齐字符
 */
function alignToChar(align: ResolvedCell['effectiveAlign']): 'l' | 'c' | 'r' {
	if (align === 'left') return 'l';
	if (align === 'right' || align === 'decimal') return 'r';
	return 'c';
}

/**
 * 根据对齐字符与列宽（pt）生成支持自动换行的段落列定义
 */
function buildFixedColSpec(alignChar: 'l' | 'c' | 'r', widthPt: number): string {
	const alignCmd =
		alignChar === 'l'
			? '\\raggedright'
			: alignChar === 'r'
				? '\\raggedleft'
				: '\\centering';
	return `>{${alignCmd}\\arraybackslash}m{${widthPt}pt}`;
}

/**
 * 检测表格内容是否包含中文字符（CJK）
 */
function hasCjkContent(data: TableData): boolean {
	const cjkRegex = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
	for (const row of data.rows) {
		for (const cell of row) {
			if (!cell.isMerged && cell.content && cjkRegex.test(cell.content)) {
				return true;
			}
		}
	}
	return false;
}

/**
 * 转义单行文本但完整保留其中的 $...$ 行内公式段
 */
function escapeTextPreservingMath(line: string): string {
	if (!line) return '';
	const parts = line.split(/(\$[^$]+\$)/g);
	return parts
		.map((part) => {
			if (part.length >= 2 && part.startsWith('$') && part.endsWith('$')) {
				return part;
			}
			return escapeLatexText(part);
		})
		.join('');
}

/**
 * 渲染单元格内部内容（处理图文混排转义与公式）
 */
function renderCellContent(cell: ResolvedCell): string {
	const content = cell.content ?? '';
	if (!content) return '';
	return content
		.split('\n')
		.map((line) => escapeTextPreservingMath(line))
		.join('\n');
}

/**
 * 对单行内容应用由 ResolvedCell 派生出的最终样式（粗体、斜体、颜色）
 */
function applyStyles(content: string, cell: ResolvedCell): string {
	let result = content;
	if (cell.effectiveBold) {
		result = `\\textbf{${result}}`;
	}
	if (cell.effectiveItalic) {
		result = `\\textit{${result}}`;
	}
	if (cell.textColor) {
		result = `\\textcolor[HTML]{${formatColor(cell.textColor)}}{${result}}`;
	}
	return result;
}

/**
 * 处理单元格内换行：如果有换行，用 makecell 包裹
 */
function wrapWithMakecell(cell: ResolvedCell, content: string): string {
	if (!cell.content.includes('\n')) {
		return applyStyles(content, cell);
	}

	const lines = content.split('\n');
	const styledLines = lines.map((line) => applyStyles(line, cell));
	const alignChar = alignToChar(cell.effectiveAlign);

	const innerContent = styledLines.join(' \\\\ ');
	return `\\makecell[${alignChar}]{${innerContent}}`;
}

/**
 * 将内容包裹在布局命令中（处理 colspan, rowspan, cellcolor 与单格对齐覆盖）
 */
function wrapWithLayout(
	cell: ResolvedCell,
	innerContent: string,
	suppressCellColor: boolean = false,
	colAlignChar: 'l' | 'c' | 'r' = 'c',
	colWidthPt?: number
): string {
	const { colspan, rowspan, backgroundColor } = cell;
	const cellAlignChar = alignToChar(cell.effectiveAlign);

	const cellColorCmd =
		!suppressCellColor && backgroundColor
			? `\\cellcolor[HTML]{${formatColor(backgroundColor)}}`
			: '';

	let finalLatex = innerContent;

	// 1. 处理 Rowspan
	if (rowspan > 1) {
		finalLatex = `\\multirow{${rowspan}}{*}{${finalLatex}}`;
	}

	// 2. 处理 Colspan 或单格对齐覆盖
	if (colspan > 1) {
		finalLatex = `\\multicolumn{${colspan}}{${cellAlignChar}}{${cellColorCmd}${finalLatex}}`;
	} else if (cellAlignChar !== colAlignChar && rowspan === 1) {
		const spec = colWidthPt ? buildFixedColSpec(cellAlignChar, colWidthPt) : cellAlignChar;
		finalLatex = `\\multicolumn{1}{${spec}}{${cellColorCmd}${finalLatex}}`;
	} else if (cellColorCmd) {
		finalLatex = `${cellColorCmd}${finalLatex}`;
	}

	return finalLatex;
}

// --- Types ---

export interface LatexExportOptions {
	/** 是否包含完整样式（列宽、行高、间距等） */
	includeStyles?: boolean;
	/** 是否包含文档头（documentclass, usepackage 等） */
	includeDocument?: boolean;
}

const DEFAULT_EXPORT_OPTIONS: LatexExportOptions = {
	includeStyles: true,
	includeDocument: true
};

// --- Main ---

export function generateLatexTable(
	data: TableData,
	style: TableStyle,
	options: LatexExportOptions = {}
): string {
	const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
	const { rowHeights, columnWidths } = data;
	const { preset, borders, fontSize, padding } = style;
	const isBooktabs = preset === 'booktabs';

	// 1. 解析表格语义矩阵与特征画像
	const profile = analyzeTableProfile(data);
	const matrix = resolveTableMatrix(data);

	// 计算 cell padding
	const cellPadding = typeof padding === 'number' ? padding : PADDING_MAP[padding] || 8;
	const cellPaddingPt = pxToPt(cellPadding);

	// 计算平均行高与 arraystretch
	const avgRowHeightPx =
		rowHeights.length > 0
			? rowHeights.reduce((a, b) => a + (b || DEFAULT_ROW_HEIGHT), 0) / rowHeights.length
			: DEFAULT_ROW_HEIGHT;
	const avgRowHeightPt = pxToPt(avgRowHeightPx);

	// LaTeX 默认单倍行距约 1.2 倍字号
	const baseLineHeight = fontSize * 1.2;
	const arrayStretch = Math.max(1.0, +(avgRowHeightPt / baseLineHeight).toFixed(2));

	const output: string[] = [];

	// 2. Preamble (仅在 includeDocument 时)
	if (opts.includeDocument) {
		const needsCtex = hasCjkContent(data);
		output.push(
			'% Generated by Samara',
			'\\documentclass{article}',
			'\\usepackage[utf8]{inputenc}'
		);
		if (needsCtex) {
			output.push('\\usepackage[UTF8]{ctex}');
		}
		output.push(
			'\\usepackage{booktabs}',
			'\\usepackage[table]{xcolor}',
			'\\usepackage{amsmath}',
			'\\usepackage{multirow}',
			'\\usepackage{makecell}',
			'\\usepackage{array}',
			'\\usepackage{nicematrix}',
			'\\usepackage{geometry}',
			'\\geometry{margin=1in}',
			''
		);

		if (opts.includeStyles) {
			output.push(`\\setlength{\\tabcolsep}{${cellPaddingPt}pt}`);
			output.push('');
		}

		output.push('\\begin{document}', '');
	}

	output.push('\\begin{table}[h]', '\\centering');

	// 3. 样式控制（原生且无冲突的 arraystretch 与白边修正）
	if (opts.includeStyles) {
		output.push(`\\renewcommand{\\arraystretch}{${arrayStretch}}`);
		if (profile.hasCellColors && isBooktabs) {
			// 消除有背景色时 booktabs 边框产生的微小白边
			output.push('\\setlength{\\aboverulesep}{0pt}');
			output.push('\\setlength{\\belowrulesep}{0pt}');
		}
	}

	// 设置字体大小
	if (opts.includeStyles && fontSize !== 12) {
		output.push(`{\\fontsize{${fontSize}pt}{${Math.round(fontSize * 1.2)}pt}\\selectfont`);
	}

	// 4. Column Config (统计每列的主对齐方式，支持左/中/右对齐与固定列宽自动折行)
	const colCount = profile.colCount;
	const colAlignChars: ('l' | 'c' | 'r')[] = Array.from({ length: colCount }, (_, colIdx) => {
		const counts: Record<'l' | 'c' | 'r', number> = { l: 0, c: 0, r: 0 };
		const startRow = matrix.length > profile.headerRowCount ? profile.headerRowCount : 0;
		for (let r = startRow; r < matrix.length; r++) {
			const cell = matrix[r]?.[colIdx];
			if (!cell || cell.isMerged || cell.colspan > 1) continue;
			counts[alignToChar(cell.effectiveAlign)]++;
		}
		if (counts.l === 0 && counts.c === 0 && counts.r === 0) {
			for (let r = 0; r < matrix.length; r++) {
				const cell = matrix[r]?.[colIdx];
				if (!cell || cell.isMerged || cell.colspan > 1) continue;
				counts[alignToChar(cell.effectiveAlign)]++;
			}
		}
		if (counts.l > counts.c && counts.l >= counts.r) return 'l';
		if (counts.r > counts.c && counts.r > counts.l) return 'r';
		return 'c';
	});

	if (colCount > 0) {
		let colSpec: string;
		if (opts.includeStyles && columnWidths && columnWidths.length === colCount) {
			// 使用段落列 m{width} 配合对齐指令：既固定列宽、垂直居中，又支持长文本自动换行
			colSpec = columnWidths
				.map((w, idx) => {
					const widthPt = pxToPt(w);
					return buildFixedColSpec(colAlignChars[idx] ?? 'c', widthPt);
				})
				.join('');
		} else {
			// 无样式模式，按每列主对齐输出 l / c / r
			colSpec = colAlignChars.join('');
		}
		if (opts.includeStyles) {
			output.push(`\\begin{NiceTabular}{${colSpec}}`);

			// 收集所有整行与单元格背景色，放入 \CodeBefore 块中，实现颜色与单元格结构的彻底解耦
			const codeBeforeLines: string[] = [];
			for (let i = 0; i < matrix.length; i++) {
				const row = matrix[i];
				const uniformBg = getRowUniformBgColor(row);
				if (uniformBg) {
					codeBeforeLines.push(`  \\rowcolor[HTML]{${formatColor(uniformBg)}}{${i + 1}}`);
				} else {
					for (let j = 0; j < row.length; j++) {
						const cell = row[j];
						if (cell.backgroundColor) {
							codeBeforeLines.push(
								`  \\cellcolor[HTML]{${formatColor(cell.backgroundColor)}}{${i + 1}-${j + 1}}`
							);
						}
					}
				}
			}

			if (codeBeforeLines.length > 0) {
				output.push('\\CodeBefore');
				output.push(...codeBeforeLines);
				output.push('\\Body');
			}
		} else {
			output.push(`\\begin{tabular}{${colSpec}}`);
		}
	} else {
		return '';
	}

	// 5. Top border
	const topBorderCmd = isBooktabs ? getBorderCommand(borders.top, 'top') : '\\hline';
	if (topBorderCmd) {
		output.push(topBorderCmd);
	}
	const rulesAbove = getPartialRulesAt(data, -1, isBooktabs);
	if (rulesAbove) {
		output.push(rulesAbove);
	}

	// 追踪被 rowspan 占据的格子
	const spannedMatrix = new Set<string>();

	for (let i = 0; i < matrix.length; i++) {
		const row = matrix[i];
		const rowCells: string[] = [];
		const uniformBg = getRowUniformBgColor(row);

		for (let j = 0; j < row.length; j++) {
			const cell = row[j];
			const coord = `${i}-${j}`;

			if (spannedMatrix.has(coord)) {
				// 在无样式模式下才需要局部背景色，有样式模式由 CodeBefore 集中处理
				const bgCmd =
					!opts.includeStyles && !uniformBg && cell.backgroundColor
						? `\\cellcolor[HTML]{${formatColor(cell.backgroundColor)}}`
						: '';
				rowCells.push(bgCmd);
				continue;
			}

			if (cell.rowspan > 1) {
				const colspan = cell.colspan;
				for (let r = 1; r < cell.rowspan; r++) {
					const targetRow = i + r;
					for (let c = 0; c < colspan; c++) {
						const targetCol = j + c;
						spannedMatrix.add(`${targetRow}-${targetCol}`);
					}
				}
			}

			let innerContent = renderCellContent(cell);
			innerContent = wrapWithMakecell(cell, innerContent);
			const colAlignChar = colAlignChars[j] ?? 'c';
			const colWidthPt =
				opts.includeStyles && columnWidths?.[j] !== undefined
					? pxToPt(columnWidths[j])
					: undefined;
			const latexFragment = wrapWithLayout(
				cell,
				innerContent,
				Boolean(opts.includeStyles || uniformBg),
				colAlignChar,
				colWidthPt
			);
			rowCells.push(latexFragment);

			if (cell.colspan > 1) {
				j += cell.colspan - 1;
			}
		}

		// 无样式模式且整行同色时才输出 \rowcolor，有样式模式已在 CodeBefore 中统一处理
		if (!opts.includeStyles && uniformBg) {
			output.push(`\\rowcolor[HTML]{${formatColor(uniformBg)}}`);
		}
		output.push(rowCells.join(' & ') + ' \\\\');

		const partialRules = getPartialRulesAt(data, i, isBooktabs);
		if (partialRules) {
			output.push(partialRules);
		}

		// 表头分割线（由 profile.headerRowCount 驱动）
		if (profile.headerRowCount && i === profile.headerRowCount - 1) {
			const headerBorderCmd = isBooktabs
				? getBorderCommand(borders.headerBottom, 'header')
				: '\\hline';
			if (headerBorderCmd) {
				output.push(headerBorderCmd);
			}
		}
	}

	// 6. Bottom border
	const bottomBorderCmd = isBooktabs ? getBorderCommand(borders.bottom, 'bottom') : '\\hline';
	if (bottomBorderCmd) {
		output.push(bottomBorderCmd);
	}

	const tabularEndEnv = opts.includeStyles ? 'NiceTabular' : 'tabular';
	output.push(`\\end{${tabularEndEnv}}`);

	if (opts.includeStyles && fontSize !== 12) {
		output.push('}');
	}

	output.push('\\end{table}');

	if (opts.includeDocument) {
		output.push('', '\\end{document}');
	}

	return output.join('\n');
}
