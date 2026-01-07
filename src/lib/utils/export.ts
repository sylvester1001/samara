import { toCanvas, toPng, toSvg } from 'html-to-image';

export interface ExportOptions {
	pixelRatio?: number;
	backgroundColor?: string;
	includeBackground?: boolean;
	bakeScale?: boolean;
	scale?: number;
	normalizePixelRatio?: boolean;
}

function parseSize(value: string | null | undefined) {
	if (!value) return null;
	const trimmed = value.trim();
	const match = trimmed.match(/^(-?\d*\.?\d+)([a-z%]+)?$/i);
	if (!match) return null;
	const numeric = Number.parseFloat(match[1]);
	if (Number.isNaN(numeric)) return null;
	return { value: numeric, unit: match[2] ?? 'px' };
}

function formatNumber(value: number) {
	return Number(value.toFixed(3)).toString();
}

function scaleLength(value: string, scale: number, roundPx = true) {
	const parsed = parseSize(value);
	if (!parsed) return null;
	const scaled = parsed.value * scale;
	if (parsed.unit === 'px' && roundPx) {
		return `${Math.max(1, Math.round(scaled))}px`;
	}
	return `${formatNumber(scaled)}${parsed.unit}`;
}

function scaleCssVarPx(element: HTMLElement, name: string, scale: number) {
	const current = element.style.getPropertyValue(name);
	const scaled = current ? scaleLength(current, scale) : null;
	if (scaled) {
		element.style.setProperty(name, scaled);
	}
}

function bakeTableScale(element: HTMLElement, scale: number) {
	const scaleNodes = element.querySelectorAll<HTMLElement>('.table-scale');
	scaleNodes.forEach((node) => {
		node.style.transform = 'none';
	});

	const table = element.querySelector<HTMLElement>('table.academic-table');
	if (!table) return;

	if (table.style.fontSize) {
		const scaledFont = scaleLength(table.style.fontSize, scale, false);
		if (scaledFont) table.style.fontSize = scaledFont;
	}

	scaleCssVarPx(table, '--cell-padding', scale);
	scaleCssVarPx(table, '--border-top', scale);
	scaleCssVarPx(table, '--border-bottom', scale);
	scaleCssVarPx(table, '--border-header', scale);
	scaleCssVarPx(table, '--border-vertical', scale);
	scaleCssVarPx(table, '--border-horizontal', scale);
	table.style.setProperty('--double-line-size', `${Math.max(1, Math.round(4 * scale))}px`);
	table.style.setProperty('--double-line-offset', `${Math.max(0, Math.round(3 * scale))}px`);

	const sampleCell = element.querySelector<HTMLElement>('.academic-table th, .academic-table td');
	if (sampleCell) {
		const computed = getComputedStyle(sampleCell);
		const paddingX = scaleLength(computed.paddingLeft, scale);
		if (paddingX) {
			table.style.setProperty('--cell-padding-x', paddingX);
		}
	}

	let totalWidth = 0;
	const cols = element.querySelectorAll<HTMLTableColElement>('col');
	cols.forEach((col) => {
		const width = scaleLength(col.style.width, scale);
		if (!width) return;
		col.style.width = width;
		const parsed = parseSize(width);
		if (parsed) totalWidth += parsed.value;
	});
	if (totalWidth > 0) {
		table.style.width = `${Math.round(totalWidth)}px`;
	}

	let totalHeight = 0;
	const rows = element.querySelectorAll<HTMLTableRowElement>('tr');
	rows.forEach((row) => {
		const height = scaleLength(row.style.height, scale);
		if (!height) return;
		row.style.height = height;
		const parsed = parseSize(height);
		if (parsed) totalHeight += parsed.value;
	});

	const tableContainer = element.querySelector<HTMLElement>('.table-container');
	if (tableContainer) {
		if (totalWidth > 0) tableContainer.style.width = `${Math.round(totalWidth)}px`;
		if (totalHeight > 0) tableContainer.style.height = `${Math.round(totalHeight)}px`;
	}

	const canvasWrapper = element.querySelector<HTMLElement>('.canvas-wrapper');
	if (canvasWrapper && totalWidth > 0 && totalHeight > 0) {
		const computed = getComputedStyle(canvasWrapper);
		const padX = (parseSize(computed.paddingLeft)?.value ?? 0) + (parseSize(computed.paddingRight)?.value ?? 0);
		const padY = (parseSize(computed.paddingTop)?.value ?? 0) + (parseSize(computed.paddingBottom)?.value ?? 0);
		canvasWrapper.style.width = `${Math.round(totalWidth + padX)}px`;
		canvasWrapper.style.height = `${Math.round(totalHeight + padY)}px`;
	}

	const segmentLines = element.querySelectorAll<HTMLElement>('.segment-line');
	segmentLines.forEach((line) => {
		const left = scaleLength(line.style.left, scale);
		const top = scaleLength(line.style.top, scale);
		const width = scaleLength(line.style.width, scale);
		if (left) line.style.left = left;
		if (top) line.style.top = top;
		if (width) line.style.width = width;
		scaleCssVarPx(line, '--segment-width', scale);
	});

	element.querySelectorAll<HTMLElement>('.column-resizer, .row-resizer, .canvas-resizer').forEach((node) => {
		node.style.display = 'none';
	});
}

function createBakedScaleClone(element: HTMLElement, scale: number) {
	const wrapper = document.createElement('div');
	wrapper.setAttribute('data-export-baked', 'true');
	wrapper.style.position = 'fixed';
	wrapper.style.left = '-10000px';
	wrapper.style.top = '0';
	wrapper.style.opacity = '0';
	wrapper.style.pointerEvents = 'none';
	wrapper.style.zIndex = '-1';

	const style = document.createElement('style');
	style.textContent = `
		[data-export-baked] .academic-table th,
		[data-export-baked] .academic-table td {
			padding-left: var(--cell-padding-x, 12px);
			padding-right: var(--cell-padding-x, 12px);
		}
	`;

	const clone = element.cloneNode(true) as HTMLElement;
	wrapper.appendChild(style);
	wrapper.appendChild(clone);
	document.body.appendChild(wrapper);

	bakeTableScale(clone, scale);

	return {
		element: clone,
		cleanup: () => wrapper.remove()
	};
}

export async function exportToPng(
	element: HTMLElement,
	options: ExportOptions = {}
): Promise<string> {
	const {
		pixelRatio = 2,
		backgroundColor = '#ffffff',
		includeBackground = true,
		bakeScale = false,
		scale = 1,
		normalizePixelRatio = true
	} = options;
	const target = bakeScale ? createBakedScaleClone(element, scale) : null;
	const exportElement = target?.element ?? element;
	const exportBackground = includeBackground ? backgroundColor : undefined;

	// Clone + bake scale to avoid transform sub-pixel gaps in exports.
	try {
		if (normalizePixelRatio && !Number.isInteger(pixelRatio)) {
			const baseRatio = Math.max(1, Math.ceil(pixelRatio));
			const canvas = await toCanvas(exportElement, {
				pixelRatio: baseRatio,
				backgroundColor: exportBackground
			});
			const targetWidth = Math.max(1, Math.round((canvas.width * pixelRatio) / baseRatio));
			const targetHeight = Math.max(1, Math.round((canvas.height * pixelRatio) / baseRatio));
			const output = document.createElement('canvas');
			output.width = targetWidth;
			output.height = targetHeight;
			const ctx = output.getContext('2d');
			if (!ctx) {
				return canvas.toDataURL();
			}
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
			return output.toDataURL();
		}

		return await toPng(exportElement, {
			pixelRatio,
			backgroundColor: exportBackground
		});
	} finally {
		target?.cleanup();
	}
}

export async function exportToSvg(
	element: HTMLElement,
	options: ExportOptions = {}
): Promise<string> {
	const { backgroundColor = '#ffffff', includeBackground = true, bakeScale = false, scale = 1 } = options;
	const target = bakeScale ? createBakedScaleClone(element, scale) : null;

	try {
		const dataUrl = await toSvg(target?.element ?? element, {
			backgroundColor: includeBackground ? backgroundColor : undefined
		});
		return dataUrl;
	} finally {
		target?.cleanup();
	}
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
