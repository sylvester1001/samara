import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface CellMergeRange {
	row: number;
	col: number;
	rowspan: number;
	colspan: number;
}

export interface ImportedTableData {
	rows: string[][];
	merges: CellMergeRange[];
}

/**
 * 清洗和规整二维矩阵并同步校准合并单元格坐标：
 * 1. 过滤开头与末尾的连续空行（同时保护纵向合并覆盖到的末尾行）
 * 2. 截断每行末尾的连续空单元格（同时保护横向合并覆盖到的末尾列）
 * 3. 计算实际有效最大列数并规整为矩形矩阵（补全较短行）
 * 4. 设置安全上限，防止 Excel 幽灵区域（如 100 万行空范围）卡死主线程
 */
export function cleanAndNormalizeMatrixWithMerges(
	rawRows: unknown[][],
	rawMerges: CellMergeRange[] = [],
	maxRows: number = 10000,
	maxCols: number = 100
): ImportedTableData {
	if (!rawRows || rawRows.length === 0) return { rows: [], merges: [] };

	// 统一转成 string 并去除首尾空白
	const stringRows = rawRows.map((row) =>
		(row || []).map((cell) => (cell == null ? '' : String(cell).trim()))
	);

	// 1. 寻找有效数据首行与尾行
	let firstNonEmptyRow = 0;
	while (
		firstNonEmptyRow < stringRows.length &&
		stringRows[firstNonEmptyRow].every((cell) => cell === '')
	) {
		firstNonEmptyRow++;
	}

	let lastNonEmptyRow = stringRows.length - 1;
	while (
		lastNonEmptyRow >= firstNonEmptyRow &&
		stringRows[lastNonEmptyRow].every((cell) => cell === '')
	) {
		lastNonEmptyRow--;
	}

	if (firstNonEmptyRow > lastNonEmptyRow) {
		return { rows: [], merges: [] };
	}

	// 若合并单元格起点位于有效行内，且纵向跨越到了末尾空行，扩展 lastNonEmptyRow 以保留完整合并范围
	for (const m of rawMerges) {
		if (m.row >= firstNonEmptyRow && m.row <= lastNonEmptyRow) {
			const mergeEndRow = Math.min(stringRows.length - 1, m.row + m.rowspan - 1);
			if (mergeEndRow > lastNonEmptyRow) {
				lastNonEmptyRow = mergeEndRow;
			}
		}
	}

	const activeRows = stringRows.slice(firstNonEmptyRow, lastNonEmptyRow + 1);

	// 2. 寻找所有有效行中右侧最远非空列索引
	let maxColIdx = 0;
	for (const row of activeRows) {
		for (let c = row.length - 1; c >= 0; c--) {
			if (row[c] !== '') {
				if (c > maxColIdx) maxColIdx = c;
				break;
			}
		}
	}

	// 若合并单元格横向跨越到了更右侧的列，扩展 maxColIdx
	for (const m of rawMerges) {
		if (m.row >= firstNonEmptyRow && m.row <= lastNonEmptyRow) {
			const mergeEndCol = m.col + m.colspan - 1;
			if (mergeEndCol > maxColIdx) {
				maxColIdx = mergeEndCol;
			}
		}
	}

	const safeColCount = Math.min(Math.max(1, maxColIdx + 1), maxCols);
	const safeRowCount = Math.min(activeRows.length, maxRows);

	// 3. 构建严格矩形矩阵
	const normalized: string[][] = [];
	for (let r = 0; r < safeRowCount; r++) {
		const row = activeRows[r] || [];
		const newRow: string[] = [];
		for (let c = 0; c < safeColCount; c++) {
			newRow.push(row[c] || '');
		}
		normalized.push(newRow);
	}

	// 4. 校准合并区域坐标（扣除被裁掉的顶部空行偏移 firstNonEmptyRow）
	const normalizedMerges: CellMergeRange[] = [];
	for (const m of rawMerges) {
		const shiftedRow = m.row - firstNonEmptyRow;
		const col = m.col;
		if (shiftedRow < 0 || shiftedRow >= safeRowCount || col < 0 || col >= safeColCount) {
			continue;
		}
		const rowspan = Math.min(m.rowspan, safeRowCount - shiftedRow);
		const colspan = Math.min(m.colspan, safeColCount - col);
		if (rowspan > 1 || colspan > 1) {
			normalizedMerges.push({
				row: shiftedRow,
				col,
				rowspan,
				colspan
			});
		}
	}

	return {
		rows: normalized,
		merges: normalizedMerges
	};
}

export function cleanAndNormalizeMatrix(
	rawRows: unknown[][],
	maxRows: number = 10000,
	maxCols: number = 100
): string[][] {
	return cleanAndNormalizeMatrixWithMerges(rawRows, [], maxRows, maxCols).rows;
}

export function parseCSV(content: string): ImportedTableData {
	const result = Papa.parse<string[]>(content, {
		skipEmptyLines: true
	});
	return cleanAndNormalizeMatrixWithMerges(result.data);
}

/**
 * 智能计算工作表的安全紧凑范围：
 * 避免 Excel 默认的 A1:XFD1048576 幽灵区域导致 sheet_to_json 百万次虚假遍历卡死主线程
 */
function computeSafeSheetRef(
	sheet: XLSX.WorkSheet,
	maxRows: number = 10000,
	maxCols: number = 100
): string {
	if (!sheet['!ref']) return 'A1:A1';

	let maxR = 0;
	let maxC = 0;
	let found = false;

	// 1. 如果是 dense 模式（targetSheet['!data']）
	if (Array.isArray(sheet['!data'])) {
		const data = sheet['!data'];
		const rowLimit = Math.min(data.length, maxRows);
		for (let r = 0; r < rowLimit; r++) {
			const row = data[r];
			if (!row) continue;
			const colLimit = Math.min(row.length, maxCols);
			for (let c = 0; c < colLimit; c++) {
				const cell = row[c];
				if (cell && cell.v !== undefined && cell.v !== '') {
					if (r > maxR) maxR = r;
					if (c > maxC) maxC = c;
					found = true;
				}
			}
		}
	} else {
		// 2. 稀疏对象模式：遍历属性键
		const keys = Object.keys(sheet);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (key.charCodeAt(0) === 33) continue; // 跳过 ! 开头的元属性（!ref, !merges 等）
			const cell = sheet[key];
			if (!cell || cell.v === undefined || cell.v === '') continue;

			const coord = XLSX.utils.decode_cell(key);
			if (coord.r > maxR) maxR = coord.r;
			if (coord.c > maxC) maxC = coord.c;
			found = true;
		}
	}

	// 3. 将合并单元格终点纳入有效边界（防止末尾行被纵向合并覆盖而无独立值时被截断）
	const sheetMerges = sheet['!merges'];
	if (Array.isArray(sheetMerges) && found) {
		for (const merge of sheetMerges) {
			if (merge.s.r <= maxR && merge.s.c <= maxC) {
				if (merge.e.r < maxRows && merge.e.r > maxR) maxR = merge.e.r;
				if (merge.e.c < maxCols && merge.e.c > maxC) maxC = merge.e.c;
			}
		}
	}

	const originalRange = XLSX.utils.decode_range(sheet['!ref']);

	if (!found) {
		// 未找到显式非空单元格，在原 ref 基础上做安全上限裁剪
		const clampedRange = {
			s: { r: Math.max(0, originalRange.s.r), c: Math.max(0, originalRange.s.c) },
			e: {
				r: Math.min(originalRange.e.r, maxRows - 1),
				c: Math.min(originalRange.e.c, maxCols - 1)
			}
		};
		return XLSX.utils.encode_range(clampedRange);
	}

	// 限制在实际有数据的最大行列范围与安全上限之间
	const safeRange = {
		s: { r: 0, c: 0 },
		e: {
			r: Math.min(maxR, maxRows - 1),
			c: Math.min(maxC, maxCols - 1)
		}
	};
	return XLSX.utils.encode_range(safeRange);
}

export function parseExcel(buffer: ArrayBuffer): ImportedTableData {
	const workbook = XLSX.read(buffer, {
		type: 'array',
		sheetRows: 10000,       // 安全上限：支持上万行真实数据，同时防止数百万幽灵空行
		dense: true,            // 核心优化：使用连续内存二维数组，极大降低 GC 和对象分配
		cellFormula: false,     // 忽略公式计算
		cellHTML: false,        // 忽略 HTML
		cellStyles: false,      // 忽略样式
		cellNF: false,          // 忽略数字格式化正则匹配
		sheetStubs: false,      // 忽略 stub 占位符
		raw: false
	});

	const sheetNames = workbook.SheetNames || [];
	if (sheetNames.length === 0) {
		throw new Error('未在文件中找到有效的工作表');
	}

	// 寻找第一个包含有效单元格范围的工作表（跳过空白或图表表单）
	let targetSheet: XLSX.WorkSheet | null = null;
	for (const name of sheetNames) {
		const sheet = workbook.Sheets[name];
		if (sheet && sheet['!ref']) {
			targetSheet = sheet;
			break;
		}
	}
	if (!targetSheet) {
		targetSheet = workbook.Sheets[sheetNames[0]];
	}

	if (!targetSheet) {
		throw new Error('工作表内容为空');
	}

	// 核心优化：计算紧凑的安全范围，彻底消除 Excel/WPS 默认的 A1:XFD1048576 幽灵区域
	targetSheet['!ref'] = computeSafeSheetRef(targetSheet, 10000, 100);

	// 保持 blankrows: true 以确保行号与 targetSheet['!merges'] 的物理坐标 1:1 严格对齐
	const rawData = XLSX.utils.sheet_to_json<unknown[]>(targetSheet, {
		header: 1,
		defval: '',
		blankrows: true,
		raw: false
	});

	const rawMerges: CellMergeRange[] = [];
	if (Array.isArray(targetSheet['!merges'])) {
		for (const merge of targetSheet['!merges']) {
			const rowspan = merge.e.r - merge.s.r + 1;
			const colspan = merge.e.c - merge.s.c + 1;
			if (rowspan > 1 || colspan > 1) {
				rawMerges.push({
					row: merge.s.r,
					col: merge.s.c,
					rowspan,
					colspan
				});
			}
		}
	}

	const normalized = cleanAndNormalizeMatrixWithMerges(rawData, rawMerges);
	if (normalized.rows.length === 0 || normalized.rows[0].length === 0) {
		throw new Error('未能从 Excel 中识别到有效的表格内容');
	}

	return normalized;
}

export function parseTSV(content: string): ImportedTableData {
	const rows = content
		.trim()
		.split('\n')
		.map((line) => line.split('\t'));
	return cleanAndNormalizeMatrixWithMerges(rows);
}

export function parseHTMLTable(html: string): ImportedTableData | null {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const table = doc.querySelector('table');
	if (!table) return null;

	const trList = Array.from(table.querySelectorAll('tr'));
	if (trList.length === 0) return null;

	const grid: string[][] = [];
	const occupied: boolean[][] = [];
	const rawMerges: CellMergeRange[] = [];

	for (let r = 0; r < trList.length; r++) {
		if (!grid[r]) grid[r] = [];
		if (!occupied[r]) occupied[r] = [];

		let c = 0;
		const cells = trList[r].querySelectorAll('td, th');
		cells.forEach((cell) => {
			// 跳过已被上方/左侧合并单元格（rowspan/colspan）占用的格位
			while (occupied[r][c]) {
				c++;
			}

			const text = cell.textContent?.trim() || '';
			const rawRowSpan = parseInt(cell.getAttribute('rowspan') || '1', 10);
			const rawColSpan = parseInt(cell.getAttribute('colspan') || '1', 10);
			const maxPossibleRowSpan = Math.max(1, trList.length - r);
			const rowspan =
				Number.isFinite(rawRowSpan) && rawRowSpan > 1
					? Math.min(rawRowSpan, maxPossibleRowSpan, 1000)
					: 1;
			const colspan =
				Number.isFinite(rawColSpan) && rawColSpan > 1 ? Math.min(rawColSpan, 100) : 1;

			grid[r][c] = text;

			for (let dr = 0; dr < rowspan; dr++) {
				const targetR = r + dr;
				if (!grid[targetR]) grid[targetR] = [];
				if (!occupied[targetR]) occupied[targetR] = [];
				for (let dc = 0; dc < colspan; dc++) {
					const targetC = c + dc;
					occupied[targetR][targetC] = true;
					if (dr !== 0 || dc !== 0) {
						grid[targetR][targetC] = '';
					}
				}
			}

			if (rowspan > 1 || colspan > 1) {
				rawMerges.push({
					row: r,
					col: c,
					rowspan,
					colspan
				});
			}

			c += colspan;
		});
	}

	const normalized = cleanAndNormalizeMatrixWithMerges(grid, rawMerges);
	return normalized.rows.length > 0 ? normalized : null;
}

export async function handleFileImport(file: File): Promise<ImportedTableData> {
	const ext = file.name.split('.').pop()?.toLowerCase();

	if (ext === 'csv') {
		const text = await file.text();
		return parseCSV(text);
	}

	if (ext === 'xlsx' || ext === 'xls') {
		const buffer = await file.arrayBuffer();
		return parseExcel(buffer);
	}

	throw new Error(`不支持的文件格式: .${ext}，请选择 .xlsx、.xls 或 .csv 文件`);
}

export function handlePaste(clipboardData: DataTransfer): ImportedTableData | null {
	const html = clipboardData.getData('text/html');
	if (html) {
		const tableData = parseHTMLTable(html);
		if (tableData) return tableData;
	}

	const text = clipboardData.getData('text/plain');
	if (text) {
		if (text.includes('\t')) {
			return parseTSV(text);
		}
		return parseCSV(text);
	}

	return null;
}
