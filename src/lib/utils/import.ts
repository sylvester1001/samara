import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * 清洗和规整二维矩阵：
 * 1. 过滤开头与末尾的连续空行
 * 2. 截断每行末尾的连续空单元格
 * 3. 计算实际有效最大列数并规整为矩形矩阵（补全较短行）
 * 4. 设置安全上限，防止 Excel 幽灵区域（如 100 万行空范围）卡死主线程
 */
export function cleanAndNormalizeMatrix(
	rawRows: unknown[][],
	maxRows: number = 10000,
	maxCols: number = 100
): string[][] {
	if (!rawRows || rawRows.length === 0) return [];

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
		return [];
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

	return normalized;
}

export function parseCSV(content: string): string[][] {
	const result = Papa.parse<string[]>(content, {
		skipEmptyLines: true
	});
	return cleanAndNormalizeMatrix(result.data);
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

export function parseExcel(buffer: ArrayBuffer): string[][] {
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

	const rawData = XLSX.utils.sheet_to_json<unknown[]>(targetSheet, {
		header: 1,
		defval: '',
		blankrows: false,
		raw: false
	});

	const normalized = cleanAndNormalizeMatrix(rawData);
	if (normalized.length === 0 || normalized[0].length === 0) {
		throw new Error('未能从 Excel 中识别到有效的表格内容');
	}

	return normalized;
}

export function parseTSV(content: string): string[][] {
	const rows = content
		.trim()
		.split('\n')
		.map((line) => line.split('\t'));
	return cleanAndNormalizeMatrix(rows);
}

export function parseHTMLTable(html: string): string[][] | null {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const table = doc.querySelector('table');
	if (!table) return null;

	const rows: string[][] = [];
	table.querySelectorAll('tr').forEach((tr) => {
		const cells: string[] = [];
		tr.querySelectorAll('td, th').forEach((cell) => {
			cells.push(cell.textContent?.trim() || '');
		});
		if (cells.length > 0) {
			rows.push(cells);
		}
	});
	const normalized = cleanAndNormalizeMatrix(rows);
	return normalized.length > 0 ? normalized : null;
}

export async function handleFileImport(file: File): Promise<string[][]> {
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

export function handlePaste(clipboardData: DataTransfer): string[][] | null {
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
