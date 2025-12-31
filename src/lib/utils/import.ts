import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function parseCSV(content: string): string[][] {
	const result = Papa.parse<string[]>(content, {
		skipEmptyLines: true
	});
	return result.data;
}

export function parseExcel(buffer: ArrayBuffer): string[][] {
	const workbook = XLSX.read(buffer, { type: 'array' });
	const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
	const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
	return data.map((row) => row.map((cell) => String(cell ?? '')));
}

export function parseTSV(content: string): string[][] {
	return content
		.trim()
		.split('\n')
		.map((line) => line.split('\t'));
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
	return rows.length > 0 ? rows : null;
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

	throw new Error(`Unsupported file type: ${ext}`);
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
