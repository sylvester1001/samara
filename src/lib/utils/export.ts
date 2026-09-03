import { toPng, toSvg } from 'html-to-image';

export interface ExportOptions {
	pixelRatio?: number;
	backgroundColor?: string;
	includeBackground?: boolean;
}

// 过滤掉不需要导出的元素
function filterExportElements(node: HTMLElement): boolean {
	// 排除 resizers-layer 和 canvas-resizer
	if (node.classList?.contains('resizers-layer')) return false;
	if (node.classList?.contains('canvas-resizer')) return false;
	return true;
}

export async function exportToPng(
	element: HTMLElement,
	options: ExportOptions = {}
): Promise<string> {
	const { pixelRatio = 2, backgroundColor = '#ffffff', includeBackground = true } = options;

	const dataUrl = await toPng(element, {
		pixelRatio,
		backgroundColor: includeBackground ? backgroundColor : undefined,
		filter: filterExportElements,
		style: {
			boxShadow: 'none'
		}
	});

	return dataUrl;
}

export async function exportToSvg(
	element: HTMLElement,
	options: ExportOptions = {}
): Promise<string> {
	const { backgroundColor = '#ffffff', includeBackground = true } = options;

	const dataUrl = await toSvg(element, {
		backgroundColor: includeBackground ? backgroundColor : undefined,
		filter: filterExportElements,
		style: {
			boxShadow: 'none'
		}
	});

	return dataUrl;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
	const link = document.createElement('a');
	link.download = filename;
	link.href = dataUrl;
	link.click();
}

export async function exportAndDownloadPng(
	element: HTMLElement,
	filename: string = 'table.png',
	options: ExportOptions = {}
) {
	const dataUrl = await exportToPng(element, options);
	downloadDataUrl(dataUrl, filename);
}

export async function exportAndDownloadSvg(
	element: HTMLElement,
	filename: string = 'table.svg',
	options: ExportOptions = {}
) {
	const dataUrl = await exportToSvg(element, options);
	downloadDataUrl(dataUrl, filename);
}
