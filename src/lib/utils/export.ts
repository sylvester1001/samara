import { toPng, toSvg } from 'html-to-image';

export interface ExportOptions {
	pixelRatio?: number;
	backgroundColor?: string;
	includeBackground?: boolean;
}

export async function exportToPng(
	element: HTMLElement,
	options: ExportOptions = {}
): Promise<string> {
	const { pixelRatio = 2, backgroundColor = '#ffffff', includeBackground = true } = options;

	const dataUrl = await toPng(element, {
		pixelRatio,
		backgroundColor: includeBackground ? backgroundColor : undefined
	});

	return dataUrl;
}

export async function exportToSvg(
	element: HTMLElement,
	options: ExportOptions = {}
): Promise<string> {
	const { backgroundColor = '#ffffff', includeBackground = true } = options;

	const dataUrl = await toSvg(element, {
		backgroundColor: includeBackground ? backgroundColor : undefined
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
