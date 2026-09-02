import type { TableData, TableStyle, Cell, BorderStyle, RuleSegment } from '$lib/types';
import { escapeLatexText } from './latex-processor';

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
            // 粗线 + 细线，用于顶部
            return '\\toprule\\midrule';
        case 'thin-thick':
            // 细线 + 粗线，用于底部
            return '\\midrule\\bottomrule';
        default:
            return '\\hline';
    }
}

/**
 * 渲染单元格内部内容（处理转义、粗体、斜体、文字颜色）
 * 注意：换行处理在 wrapWithMakecell 中进行
 */
function renderCellContent(cell: Cell): string {
    let content = cell.content;

    // 1. 转义或保留公式
    if (!(content.startsWith('$') && content.endsWith('$'))) {
        content = escapeLatexText(content);
    }

    // 不在这里应用样式，样式在 wrapWithMakecell 中按行应用
    return content;
}

/**
 * 对单行内容应用样式（粗体、斜体、颜色）
 */
function applyStyles(content: string, cell: Cell): string {
    let result = content;
    if (cell.isBold) result = `\\textbf{${result}}`;
    if (cell.isItalic) result = `\\textit{${result}}`;
    if (cell.textColor) {
        result = `\\textcolor[HTML]{${formatColor(cell.textColor)}}{${result}}`;
    }
    return result;
}

/**
 * 处理单元格内换行：如果有换行，用 makecell 包裹
 * 样式需要对每一行分别应用，否则 \\ 在样式命令内部不会正确换行
 */
function wrapWithMakecell(cell: Cell, content: string): string {
    if (!cell.content.includes('\n')) {
        // 没有换行，直接应用样式
        return applyStyles(content, cell);
    }
    
    // 有换行，需要对每一行分别应用样式
    const lines = content.split('\n');
    const styledLines = lines.map(line => applyStyles(line, cell));
    const alignChar = cell.align ? cell.align[0] : 'c';
    
    const innerContent = styledLines.join(' \\\\ ');
    return `\\makecell[${alignChar}]{${innerContent}}`;
}

/**
 * 将内容包裹在布局命令中（处理 colspan, rowspan, cellcolor）
 * 注意：当使用 m{} 列类型时，不应该用 \multicolumn{1}{c} 覆盖单个单元格的对齐
 */
function wrapWithLayout(cell: Cell, innerContent: string, useStyleMode: boolean = false): string {
    const { colspan = 1, rowspan = 1, backgroundColor } = cell;

    // 准备组件
    const cellColorCmd = backgroundColor
        ? `\\cellcolor[HTML]{${formatColor(backgroundColor)}}`
        : '';

    // 组合逻辑
    let finalLatex = innerContent;

    // 1. 处理 Rowspan
    if (rowspan > 1) {
        // \multirow{row}{width}{content}
        finalLatex = `\\multirow{${rowspan}}{*}{${finalLatex}}`;
    }

    // 2. 处理 Colspan
    // 在样式模式下，只有 colspan > 1 或有背景色时才用 multicolumn
    // 单个单元格的对齐由列定义 m{} 处理，不需要 multicolumn{1}{c} 覆盖
    if (colspan > 1) {
        // colspan > 1 时需要 multicolumn，使用 c 保持居中
        finalLatex = `\\multicolumn{${colspan}}{c}{${cellColorCmd}${finalLatex}}`;
    } else if (backgroundColor) {
        // 只有背景色，直接添加 cellcolor
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
    const { rows, headerRows, rowHeights, columnWidths } = data;
    const { preset, borders, fontSize, padding } = style;
    const isBooktabs = preset === 'booktabs';

    // 计算 cell padding
    const cellPadding = typeof padding === 'number' ? padding : PADDING_MAP[padding] || 8;
    const cellPaddingPt = pxToPt(cellPadding);

    // 计算平均行高
    const avgRowHeightPx = rowHeights.length > 0 
        ? rowHeights.reduce((a, b) => a + (b || DEFAULT_ROW_HEIGHT), 0) / rowHeights.length 
        : DEFAULT_ROW_HEIGHT;
    const avgRowHeightPt = pxToPt(avgRowHeightPx);
    
    // 基础文字高度（大约是字体大小）
    const textHeight = fontSize;
    // 需要添加的额外高度（上下各一半）
    const extraHeight = Math.max(0, avgRowHeightPt - textHeight);
    const halfExtra = (extraHeight / 2).toFixed(1);

    const output: string[] = [];

    // 1. Preamble (仅在 includeDocument 时)
    if (opts.includeDocument) {
        output.push(
            '% Generated by Tablix',
            '\\documentclass{article}',
            '\\usepackage[utf8]{inputenc}',
            '\\usepackage{booktabs}',
            '\\usepackage[table]{xcolor}',
            '\\usepackage{amsmath}',
            '\\usepackage{multirow}',
            '\\usepackage{makecell}',
            '\\usepackage{array}',
            '\\usepackage{geometry}',
            '\\geometry{margin=1in}',
            ''
        );

        if (opts.includeStyles) {
            output.push(`\\setlength{\\tabcolsep}{${cellPaddingPt}pt}`);
            // 使用 setcellgapes 设置上下间距（makecell 包）
            output.push(`\\setcellgapes{${halfExtra}pt}`);
            output.push('');
        }

        output.push('\\begin{document}', '');
    }

    output.push('\\begin{table}[h]', '\\centering');

    // 启用 makegapedcells 来应用间距
    if (opts.includeStyles) {
        output.push('\\makegapedcells');
    }

    // 设置字体大小
    if (opts.includeStyles && fontSize !== 12) {
        output.push(`{\\fontsize{${fontSize}pt}{${Math.round(fontSize * 1.2)}pt}\\selectfont`);
    }

    // 2. Column Config
    const colCount = rows[0]?.length || 0;
    if (colCount > 0) {
        let colSpec: string;
        if (opts.includeStyles && columnWidths && columnWidths.length === colCount) {
            // 使用 w{c}{width} 列类型：固定宽度 + 水平居中，不自动换行
            colSpec = columnWidths.map(w => {
                const widthPt = pxToPt(w);
                return `w{c}{${widthPt}pt}`;
            }).join('');
        } else {
            // 无样式模式，使用简单的 c 列
            colSpec = Array(colCount).fill('c').join('');
        }
        output.push(`\\begin{tabular}{${colSpec}}`);
    } else {
        return '';
    }

    // 3. Top border
    const topBorderCmd = isBooktabs 
        ? getBorderCommand(borders.top, 'top')
        : '\\hline';
    if (topBorderCmd) {
        output.push(topBorderCmd);
    }
    const rulesAbove = getPartialRulesAt(data, -1, isBooktabs);
    if (rulesAbove) {
        output.push(rulesAbove);
    }

    // 追踪被 rowspan 占据的格子
    const spannedMatrix = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowCells: string[] = [];

        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            const coord = `${i}-${j}`;

            if (spannedMatrix.has(coord)) {
                const bgCmd = cell.backgroundColor
                    ? `\\cellcolor[HTML]{${formatColor(cell.backgroundColor)}}`
                    : '';
                rowCells.push(bgCmd);
                continue;
            }

            if (cell.rowspan && cell.rowspan > 1) {
                const colspan = cell.colspan || 1;
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
            const latexFragment = wrapWithLayout(cell, innerContent);
            rowCells.push(latexFragment);

            if (cell.colspan && cell.colspan > 1) {
                j += cell.colspan - 1;
            }
        }

        output.push(rowCells.join(' & ') + ' \\\\');

        const partialRules = getPartialRulesAt(data, i, isBooktabs);
        if (partialRules) {
            output.push(partialRules);
        }

        if (headerRows && i === headerRows - 1) {
            const headerBorderCmd = isBooktabs
                ? getBorderCommand(borders.headerBottom, 'header')
                : '\\hline';
            if (headerBorderCmd) {
                output.push(headerBorderCmd);
            }
        }
    }

    // 4. Bottom border
    const bottomBorderCmd = isBooktabs
        ? getBorderCommand(borders.bottom, 'bottom')
        : '\\hline';
    if (bottomBorderCmd) {
        output.push(bottomBorderCmd);
    }

    output.push('\\end{tabular}');
    
    if (opts.includeStyles && fontSize !== 12) {
        output.push('}');
    }

    output.push('\\end{table}');

    if (opts.includeDocument) {
        output.push('', '\\end{document}');
    }

    return output.join('\n');
}
