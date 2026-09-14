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
	maxRows: number = 300,
	maxCols: number = 50
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

export function parseExcel(buffer: ArrayBuffer): string[][] {
	const workbook = XLSX.read(buffer, {
		type: 'array',
		cellFormula: false,
		cellHTML: false,
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
