/**
 * 表格视口窗口：只决定「此刻要画哪些行列」，不碰单元格语义。
 * 小表走全量；超过阈值后用前缀和 + 二分定位可见区间，并用 spacer 撑起完整滚动高度。
 */

export const ROW_WINDOW_THRESHOLD = 40;
export const COL_WINDOW_THRESHOLD = 32;
export const ROW_OVERSCAN = 8;
export const COL_OVERSCAN = 4;
export const DEFAULT_ROW_HEIGHT = 32;
export const DEFAULT_EDITOR_ROW_HEIGHT = 30;

export interface WindowRange {
	start: number;
	end: number;
	padStart: number;
	padEnd: number;
}

export interface AxisSpan {
	index: number;
	span: number;
}

export const EMPTY_SPANS: AxisSpan[] = [];

export function shouldWindowRows(rowCount: number): boolean {
	return rowCount > ROW_WINDOW_THRESHOLD;
}

export function shouldWindowCols(colCount: number): boolean {
	return colCount > COL_WINDOW_THRESHOLD;
}

export function prefixSums(sizes: number[]): number[] {
	const n = sizes.length;
	const offsets = new Array(n + 1);
	offsets[0] = 0;
	for (let i = 0; i < n; i++) {
		offsets[i + 1] = offsets[i] + sizes[i];
	}
	return offsets;
}

export function uniformOffsets(count: number, size: number): number[] {
	const offsets = new Array(count + 1);
	for (let i = 0; i <= count; i++) {
		offsets[i] = i * size;
	}
	return offsets;
}

/** offsets 长度为 count+1，返回 pos 所在条目下标 */
export function findIndex(offsets: number[], pos: number): number {
	const n = offsets.length - 1;
	if (n <= 0) return 0;
	if (pos <= offsets[0]) return 0;
	if (pos >= offsets[n]) return n - 1;
	let lo = 0;
	let hi = n - 1;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (offsets[mid + 1] <= pos) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

export function computeWindow(
	count: number,
	offsets: number[],
	viewStart: number,
	viewSize: number,
	overscan: number
): WindowRange {
	if (count <= 0) return { start: 0, end: 0, padStart: 0, padEnd: 0 };
	if (offsets.length !== count + 1) {
		return { start: 0, end: count, padStart: 0, padEnd: 0 };
	}
	const from = viewStart;
	const to = viewStart + Math.max(viewSize, 1);
	let start = findIndex(offsets, from);
	let end = findIndex(offsets, to) + 1;
	start = Math.max(0, start - overscan);
	end = Math.min(count, end + overscan);
	if (end < start) end = start;
	return {
		start,
		end,
		padStart: offsets[start],
		padEnd: offsets[count] - offsets[end]
	};
}

export function fullWindow(count: number): WindowRange {
	return { start: 0, end: count, padStart: 0, padEnd: 0 };
}

/**
 * 合并单元格若跨过窗口边界，必须把 origin 和整段 span 收进窗口，
 * 否则 HTML table 的 rowspan/colspan 会对不齐。
 */
export function expandWindowForSpans(
	range: WindowRange,
	count: number,
	offsets: number[],
	spans: readonly AxisSpan[]
): WindowRange {
	if (spans.length === 0 || count <= 0) return range;
	let start = range.start;
	let end = range.end;
	for (let i = 0; i < spans.length; i++) {
		const { index, span } = spans[i];
		if (span <= 1) continue;
		const spanEnd = Math.min(count, index + span);
		if (spanEnd > start && index < end) {
			if (index < start) start = index;
			if (spanEnd > end) end = spanEnd;
		}
	}
	start = Math.max(0, start);
	end = Math.min(count, Math.max(end, start));
	if (offsets.length !== count + 1) {
		return { start, end, padStart: range.padStart, padEnd: range.padEnd };
	}
	return {
		start,
		end,
		padStart: offsets[start],
		padEnd: offsets[count] - offsets[end]
	};
}

export function indexAxisSpans(
	rows: { rowspan?: number; colspan?: number; isMerged?: boolean }[][],
	axis: 'row' | 'col'
): AxisSpan[] {
	const out: AxisSpan[] = [];
	if (axis === 'row') {
		for (let r = 0; r < rows.length; r++) {
			const row = rows[r];
			for (let c = 0; c < row.length; c++) {
				const cell = row[c];
				if (!cell || cell.isMerged) continue;
				const span = cell.rowspan ?? 1;
				if (span > 1) out.push({ index: r, span });
			}
		}
		return out;
	}
	const colCount = rows[0]?.length ?? 0;
	for (let r = 0; r < rows.length; r++) {
		const row = rows[r];
		for (let c = 0; c < colCount; c++) {
			const cell = row[c];
			if (!cell || cell.isMerged) continue;
			const span = cell.colspan ?? 1;
			if (span > 1) out.push({ index: c, span });
		}
	}
	return out;
}

export function rangeIndices(start: number, end: number): number[] {
	const n = Math.max(0, end - start);
	const out = new Array(n);
	for (let i = 0; i < n; i++) out[i] = start + i;
	return out;
}

export function viewRectFromElements(
	viewport: HTMLElement,
	target: HTMLElement,
	scale: number
): { start: number; size: number } {
	const vp = viewport.getBoundingClientRect();
	const tg = target.getBoundingClientRect();
	const s = scale > 0 ? scale : 1;
	return {
		start: (vp.top - tg.top) / s,
		size: vp.height / s
	};
}

export function viewRectXFromElements(
	viewport: HTMLElement,
	target: HTMLElement,
	scale: number
): { start: number; size: number } {
	const vp = viewport.getBoundingClientRect();
	const tg = target.getBoundingClientRect();
	const s = scale > 0 ? scale : 1;
	return {
		start: (vp.left - tg.left) / s,
		size: vp.width / s
	};
}
