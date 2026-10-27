<script lang="ts">
	import type { TableData, TableStyle, CanvasConfig } from '$lib/types';
	import { tick, untrack } from 'svelte';
	import AcademicView from './AcademicView.svelte';
	import AxisResizers from './AxisResizers.svelte';
	import {
		shouldWindowRows,
		shouldWindowCols,
		prefixSums,
		computeWindow,
		expandWindowForSpans,
		indexAxisSpans,
		viewRectFromElements,
		viewRectXFromElements,
		fullWindow,
		ROW_OVERSCAN,
		COL_OVERSCAN,
		DEFAULT_ROW_HEIGHT,
		EMPTY_SPANS,
		type WindowRange
	} from '$lib/utils/table-window';

	interface Props {
		tableData: TableData;
		tableStyle: TableStyle;
		canvasConfig: CanvasConfig;
		onCellUpdate?: (row: number, col: number, content: string) => void;
		onColumnResize?: (colIndex: number, width: number) => void;
		onRowResize?: (rowIndex: number, height: number) => void;
		onResizeEnd?: () => void;
		onCanvasResize?: (config: Partial<CanvasConfig>) => void;
		canvasRef?: (el: HTMLElement | null) => void;
		/** 预览缩放，用于把屏幕坐标折回布局坐标 */
		viewScale?: number;
		/** 导出离屏挂载：禁用交互并强制全量渲染 */
		fullRender?: boolean;
		interactive?: boolean;
		layoutRev?: number;
		lockColumnResize?: boolean;
		lockRowResize?: boolean;
	}

	let {
		tableData,
		tableStyle,
		canvasConfig,
		onCellUpdate,
		onColumnResize,
		onRowResize,
		onResizeEnd,
		onCanvasResize,
		canvasRef,
		viewScale = 1,
		fullRender = false,
		interactive = true,
		layoutRev = 0,
		lockColumnResize = false,
		lockRowResize = false
	}: Props = $props();

	const SEGMENT_WIDTH_MAP: Record<string, number> = {
		thin: 1,
		thick: 2,
		double: 3
	};

	const SEGMENT_STYLE_MAP: Record<string, string> = {
		thin: 'solid',
		thick: 'solid',
		double: 'double'
	};

	const SEGMENT_TRIM_PX = 8;
	const DOUBLE_LINE_HEIGHT = 5;

	let canvasElement: HTMLElement | null = $state(null);
	let contentElement: HTMLElement | null = $state(null);
	let tableEl: HTMLTableElement | null = $state(null);
	let tbodyEl: HTMLTableSectionElement | null = $state(null);
	let textareaEl: HTMLTextAreaElement | null = $state(null);
	let scrollViewport: HTMLElement | null = $state(null);

	let viewStartY = $state(0);
	let viewSizeY = $state(1200);
	let viewStartX = $state(0);
	let viewSizeX = $state(1600);
	let heightCache: number[] = $state([]);
	let scrollRaf = 0;

	$effect(() => {
		canvasRef?.(canvasElement);
	});

	const rowCount = $derived(tableData.rows.length);
	const colCount = $derived(tableData.columnWidths.length);
	const headerRowCount = $derived.by(() => {
		const requested = tableData.headerRows ?? 1;
		return Math.min(Math.max(1, requested), tableData.rows.length || 1);
	});

	const virtualizeRows = $derived(!fullRender && shouldWindowRows(rowCount));
	const virtualizeCols = $derived(!fullRender && shouldWindowCols(colCount));

	const displayRowHeights = $derived.by(() => {
		const heights = new Array(rowCount);
		const stored = tableData.rowHeights;
		const cache = heightCache;
		for (let i = 0; i < rowCount; i++) {
			heights[i] = cache[i] || stored[i] || DEFAULT_ROW_HEIGHT;
		}
		return heights;
	});

	const bodyCount = $derived(Math.max(0, rowCount - headerRowCount));
	const bodyHeights = $derived(displayRowHeights.slice(headerRowCount));
	const bodyOffsets = $derived(prefixSums(bodyHeights));
	const colOffsets = $derived.by(() => {
		const offsets: number[] = [0];
		let currentLeft = 0;
		for (const width of tableData.columnWidths) {
			currentLeft += width;
			offsets.push(currentLeft);
		}
		return offsets;
	});

	const rowSpanOrigins = $derived.by(() => {
		void layoutRev;
		if (!virtualizeRows) return EMPTY_SPANS;
		return untrack(() => indexAxisSpans(tableData.rows, 'row'));
	});
	const colSpanOrigins = $derived.by(() => {
		void layoutRev;
		if (!virtualizeCols) return EMPTY_SPANS;
		return untrack(() => indexAxisSpans(tableData.rows, 'col'));
	});

	const bodyWindow: WindowRange = $derived.by(() => {
		if (!virtualizeRows) {
			return {
				start: headerRowCount,
				end: rowCount,
				padStart: 0,
				padEnd: 0
			};
		}
		const raw = computeWindow(bodyCount, bodyOffsets, viewStartY, viewSizeY, ROW_OVERSCAN);
		const localSpans = rowSpanOrigins
			.filter((span) => span.index + span.span > headerRowCount)
			.map((span) => ({
				index: Math.max(0, span.index - headerRowCount),
				span: span.index >= headerRowCount ? span.span : span.index + span.span - headerRowCount
			}));
		const expanded = expandWindowForSpans(raw, bodyCount, bodyOffsets, localSpans);
		return {
			start: expanded.start + headerRowCount,
			end: expanded.end + headerRowCount,
			padStart: expanded.padStart,
			padEnd: expanded.padEnd
		};
	});

	const colWindow: WindowRange = $derived.by(() => {
		if (!virtualizeCols) return fullWindow(colCount);
		const raw = computeWindow(colCount, colOffsets, viewStartX, viewSizeX, COL_OVERSCAN);
		return expandWindowForSpans(raw, colCount, colOffsets, colSpanOrigins);
	});

	const isBooktabs = $derived(tableStyle.preset === 'booktabs');
	const topBorderType = $derived(tableStyle.borders.top);
	const bottomBorderType = $derived(tableStyle.borders.bottom);
	const needsTopDoubleLine = $derived(isBooktabs && topBorderType === 'thick-thin');
	const needsBottomDoubleLine = $derived(isBooktabs && bottomBorderType === 'thin-thick');

	const tableWidth = $derived(tableData.columnWidths.reduce((sum, w) => sum + w, 0));

	let domContentWidth = $state(0);
	let domContentHeight = $state(0);

	const estimatedContentHeight = $derived.by(() => {
		let total = needsTopDoubleLine ? DOUBLE_LINE_HEIGHT : 0;
		if (needsBottomDoubleLine) total += DOUBLE_LINE_HEIGHT;
		for (let i = 0; i < displayRowHeights.length; i++) {
			total += displayRowHeights[i];
		}
		return total;
	});

	const actualContentWidth = $derived(virtualizeRows || virtualizeCols ? tableWidth : domContentWidth || tableWidth);
	const actualContentHeight = $derived(
		virtualizeRows ? estimatedContentHeight : domContentHeight || estimatedContentHeight
	);

	const requestedCanvasWidth = $derived(
		canvasConfig.width === 'auto'
			? Math.ceil(actualContentWidth + canvasConfig.padding * 2)
			: canvasConfig.width
	);
	const requestedCanvasHeight = $derived(
		canvasConfig.height === 'auto'
			? Math.ceil(actualContentHeight + canvasConfig.padding * 2)
			: canvasConfig.height
	);

	const minCanvasWidth = $derived(actualContentWidth);
	const minCanvasHeight = $derived(actualContentHeight);

	const canvasWidth = $derived.by(() => {
		if (requestedCanvasWidth <= minCanvasWidth + 1) return minCanvasWidth;
		return Math.max(requestedCanvasWidth, minCanvasWidth);
	});
	const canvasHeight = $derived.by(() => {
		if (requestedCanvasHeight <= minCanvasHeight + 1) return minCanvasHeight;
		return Math.max(requestedCanvasHeight, minCanvasHeight);
	});

	let measuredRowPositions = $state<(number | undefined)[]>([]);
	let measuredColPositions = $state<(number | undefined)[]>([]);

	function syncDomPositions() {
		if (!tableEl || !contentElement) return;
		const contentRect = contentElement.getBoundingClientRect();
		if (contentRect.height <= 0 || contentRect.width <= 0) return;
		const scale = viewScale > 0 ? viewScale : 1;

		// 1. Measure rows: exactly at bottom edge of each <tr> in tableEl
		const trs = tableEl.querySelectorAll<HTMLTableRowElement>('tr[data-table-row]');
		if (trs.length > 0) {
			const rowPositions: (number | undefined)[] = new Array(rowCount);
			for (const tr of trs) {
				const idx = Number(tr.dataset.tableRow);
				if (Number.isNaN(idx) || idx < 0 || idx >= rowCount) continue;
				const trRect = tr.getBoundingClientRect();
				// 在 border-collapse: collapse 下，trRect.bottom 恰为行底折叠边框的中轴线
				const pos = (trRect.bottom - contentRect.top) / scale;
				rowPositions[idx] = pos;
			}
			measuredRowPositions = rowPositions;
		}

		// 2. Measure columns: exactly at right edge of column cells
		const ths = tableEl.querySelectorAll<HTMLTableCellElement>('thead tr:first-child > th[data-col]');
		if (ths.length > 0) {
			const colPositions: (number | undefined)[] = new Array(colCount);
			for (const th of ths) {
				const colIdx = Number(th.dataset.col);
				const colspan = Number(th.getAttribute('colspan') || 1);
				if (Number.isNaN(colIdx) || colIdx < 0) continue;
				const targetCol = colIdx + colspan - 1;
				if (targetCol >= colCount) continue;
				const thRect = th.getBoundingClientRect();
				// 在 border-collapse: collapse 下，thRect.right 恰为列边框中轴线
				const pos = (thRect.right - contentRect.left) / scale;
				colPositions[targetCol] = pos;
			}
			measuredColPositions = colPositions;
		}
	}

	const rowResizerPositions = $derived.by(() => {
		const positions: number[] = [];
		let currentTop = needsTopDoubleLine ? DOUBLE_LINE_HEIGHT : 0;
		for (let i = 0; i < displayRowHeights.length; i++) {
			currentTop += displayRowHeights[i];
			positions.push(measuredRowPositions[i] ?? currentTop);
		}
		return positions;
	});

	const colResizerPositions = $derived.by(() => {
		const positions: number[] = [];
		let currentLeft = 0;
		for (let i = 0; i < tableData.columnWidths.length; i++) {
			currentLeft += tableData.columnWidths[i];
			positions.push(measuredColPositions[i] ?? currentLeft);
		}
		return positions;
	});

	const visibleColSeams = $derived.by(() => {
		const out: { index: number; pos: number; start: number }[] = [];
		for (let i = colWindow.start; i < colWindow.end; i++) {
			const pos = colResizerPositions[i];
			if (pos == null) continue;
			const start = i === 0 ? 0 : (colResizerPositions[i - 1] ?? colOffsets[i] ?? 0);
			out.push({ index: i, pos, start });
		}
		return out;
	});

	const visibleRowSeams = $derived.by(() => {
		const seen = new Set<number>();
		const out: { index: number; pos: number; start: number }[] = [];
		const top0 = needsTopDoubleLine ? DOUBLE_LINE_HEIGHT : 0;
		const add = (i: number) => {
			if (seen.has(i) || i < 0 || i >= rowResizerPositions.length) return;
			seen.add(i);
			const start = i === 0 ? top0 : (rowResizerPositions[i - 1] ?? top0);
			out.push({ index: i, pos: rowResizerPositions[i], start });
		};
		for (let i = 0; i < headerRowCount; i++) add(i);
		for (let i = bodyWindow.start; i < bodyWindow.end; i++) add(i);
		return out;
	});

	const segmentLines = $derived.by(() => {
		const lines: {
			id: number;
			left: number;
			top: number;
			width: number;
			borderWidth: number;
			borderStyle: string;
		}[] = [];
		if (rowCount === 0 || colCount === 0) return lines;

		const segments = tableData.segments ?? [];
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const atRow = Math.max(-1, Math.min(segment.atRow, rowCount - 1));
			const startCol = Math.max(0, Math.min(segment.startCol, colCount - 1));
			const endCol = Math.max(startCol, Math.min(segment.endCol, colCount - 1));
			const left = colOffsets[startCol] ?? 0;
			const right = colOffsets[endCol + 1] ?? left;
			const trimLeft = segment.trimLeft === 'short' ? SEGMENT_TRIM_PX : 0;
			const trimRight = segment.trimRight === 'short' ? SEGMENT_TRIM_PX : 0;
			const width = Math.max(0, right - left - trimLeft - trimRight);
			if (width <= 0) continue;
			const rawTop =
				atRow < 0
					? needsTopDoubleLine
						? DOUBLE_LINE_HEIGHT
						: 0
					: (rowResizerPositions[atRow] ?? 0);
			const styleKey = segment.style ?? 'thin';
			lines.push({
				id: i,
				left: left + trimLeft,
				top: rawTop - (needsTopDoubleLine ? DOUBLE_LINE_HEIGHT : 0),
				width,
				borderWidth: SEGMENT_WIDTH_MAP[styleKey] ?? 1,
				borderStyle: SEGMENT_STYLE_MAP[styleKey] ?? 'solid'
			});
		}
		return lines;
	});

	let editingCell = $state<{ row: number; col: number } | null>(null);
	let editValue = $state('');

	async function startCellEdit(row: number, col: number, content: string) {
		if (!interactive) return;
		editingCell = { row, col };
		editValue = content;
		await tick();
		textareaEl?.focus();
		textareaEl?.select();
	}

	function finishCellEdit() {
		if (editingCell) {
			const { row, col } = editingCell;
			if (editValue !== (tableData.rows[row]?.[col]?.content ?? '')) {
				onCellUpdate?.(row, col, editValue);
			}
			editingCell = null;
		}
	}

	function handleCellKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.shiftKey) {
			e.preventDefault();
			finishCellEdit();
		} else if (e.key === 'Escape') {
			editingCell = null;
		}
	}

	function handleColumnResize(colIndex: number, newWidth: number) {
		onColumnResize?.(colIndex, Math.max(40, Math.round(newWidth)));
	}

	function handleRowResize(rowIndex: number, newHeight: number) {
		const clamped = Math.max(32, Math.round(newHeight));
		const next = heightCache.slice();
		if (next.length !== rowCount) next.length = rowCount;
		if (lockRowResize) {
			next.fill(clamped);
		} else {
			next[rowIndex] = clamped;
		}
		heightCache = next;
		onRowResize?.(rowIndex, clamped);
	}

	const innerCenterColumns = $derived(
		canvasConfig.width !== 'auto' && canvasWidth > actualContentWidth + 8
	);
	const innerCenterRows = $derived(
		canvasConfig.height !== 'auto' && canvasHeight > actualContentHeight + 8
	);

	let isCanvasResizing = $state(false);
	let resizeCorner = $state<'nw' | 'ne' | 'sw' | 'se' | null>(null);
	let startX = 0;
	let startY = 0;
	let startWidth = 0;
	let startHeight = 0;

	function handleCanvasResizeStart(e: MouseEvent, corner: 'nw' | 'ne' | 'sw' | 'se') {
		e.preventDefault();
		isCanvasResizing = true;
		resizeCorner = corner;
		startX = e.clientX;
		startY = e.clientY;
		startWidth = canvasWidth;
		startHeight = canvasHeight;
		document.addEventListener('mousemove', handleCanvasResizeMove);
		document.addEventListener('mouseup', handleCanvasResizeEnd);
	}

	function handleCanvasResizeMove(e: MouseEvent) {
		if (!isCanvasResizing || !resizeCorner) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		let nextWidth = startWidth;
		let nextHeight = startHeight;

		if (resizeCorner === 'se') {
			nextWidth = startWidth + dx;
			nextHeight = startHeight + dy;
		} else if (resizeCorner === 'sw') {
			nextWidth = startWidth - dx;
			nextHeight = startHeight + dy;
		} else if (resizeCorner === 'ne') {
			nextWidth = startWidth + dx;
			nextHeight = startHeight - dy;
		} else if (resizeCorner === 'nw') {
			nextWidth = startWidth - dx;
			nextHeight = startHeight - dy;
		}

		nextWidth = Math.max(minCanvasWidth, Math.round(nextWidth));
		nextHeight = Math.max(minCanvasHeight, Math.round(nextHeight));
		onCanvasResize?.({ width: nextWidth, height: nextHeight });
	}

	function handleCanvasResizeEnd() {
		isCanvasResizing = false;
		resizeCorner = null;
		document.removeEventListener('mousemove', handleCanvasResizeMove);
		document.removeEventListener('mouseup', handleCanvasResizeEnd);
	}

	function syncViewWindow() {
		if (!scrollViewport || !tbodyEl) return;
		const scale = viewScale > 0 ? viewScale : 1;
		const y = viewRectFromElements(scrollViewport, tbodyEl, scale);
		viewStartY = y.start;
		viewSizeY = y.size;
		if (virtualizeCols && tableEl) {
			const x = viewRectXFromElements(scrollViewport, tableEl, scale);
			viewStartX = x.start;
			viewSizeX = x.size;
		}
	}

	function measureVisibleHeights() {
		if (!tbodyEl && !tableEl) return;
		const root = tableEl ?? tbodyEl;
		if (!root) return;
		const trs = root.querySelectorAll<HTMLTableRowElement>('tr[data-table-row]');
		if (trs.length === 0) return;
		let changed = false;
		const next = heightCache.length === rowCount ? heightCache.slice() : tableData.rowHeights.slice();
		if (next.length !== rowCount) {
			next.length = rowCount;
			for (let i = 0; i < rowCount; i++) {
				if (!next[i]) next[i] = tableData.rowHeights[i] || DEFAULT_ROW_HEIGHT;
			}
		}
		for (const tr of trs) {
			const i = Number(tr.dataset.tableRow);
			if (Number.isNaN(i) || i < 0 || i >= rowCount) continue;
			const h = tr.offsetHeight;
			if (h > 0 && Math.abs((next[i] || 0) - h) > 0.5) {
				next[i] = h;
				changed = true;
			}
		}
		if (changed) heightCache = next;
	}

	$effect(() => {
		if (!canvasElement) return;
		scrollViewport = canvasElement.closest('[data-slot="scroll-area-viewport"]');
		if (!virtualizeRows && !virtualizeCols) return;
		const viewport = scrollViewport;
		if (!viewport) return;
		const onScroll = () => {
			if (scrollRaf) return;
			scrollRaf = requestAnimationFrame(() => {
				scrollRaf = 0;
				syncViewWindow();
			});
		};
		viewport.addEventListener('scroll', onScroll, { passive: true });
		const ro = new ResizeObserver(onScroll);
		ro.observe(viewport);
		onScroll();
		return () => {
			viewport.removeEventListener('scroll', onScroll);
			ro.disconnect();
			if (scrollRaf) cancelAnimationFrame(scrollRaf);
			scrollRaf = 0;
		};
	});

	$effect(() => {
		if (!virtualizeRows) return;
		bodyWindow.start;
		bodyWindow.end;
		void tick().then(measureVisibleHeights);
	});

	$effect(() => {
		const r = tableData.rows.length;
		const c = tableData.columnWidths.length;
		const rev = layoutRev;
		untrack(() => {
			heightCache = tableData.rowHeights.slice();
		});
		void r;
		void c;
		void rev;
	});

	$effect(() => {
		if (virtualizeRows) return;
		if (canvasConfig.width !== 'auto' && canvasConfig.width < minCanvasWidth) {
			onCanvasResize?.({ width: minCanvasWidth });
		}
		if (canvasConfig.height !== 'auto' && canvasConfig.height < minCanvasHeight) {
			onCanvasResize?.({ height: minCanvasHeight });
		}
	});

	$effect(() => {
		if (!tableEl) return;
		const ro = new ResizeObserver(() => {
			syncDomPositions();
		});
		ro.observe(tableEl);
		syncDomPositions();
		return () => ro.disconnect();
	});

	$effect(() => {
		void tableData.rows;
		void tableData.columnWidths;
		void tableData.rowHeights;
		void tableStyle;
		void layoutRev;
		void viewScale;
		void tick().then(syncDomPositions);
	});

	let isCanvasHovered = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="canvas-wrapper"
	class:resizing={isCanvasResizing}
	bind:this={canvasElement}
	style:background-color={canvasConfig.backgroundColor}
	style:width="{canvasWidth}px"
	style:height="{canvasHeight}px"
	onmouseenter={() => (isCanvasHovered = true)}
	onmouseleave={() => (isCanvasHovered = false)}
>
	<div
		class="table-content"
		bind:this={contentElement}
		bind:clientWidth={domContentWidth}
		bind:clientHeight={domContentHeight}
	>
		{#if needsTopDoubleLine}
			<div
				class="double-line double-line-top {topBorderType}"
				style:width="{tableWidth}px"
			></div>
		{/if}

		<div class="table-wrapper" style:width="{tableWidth}px">
			<div class="segment-layer">
				{#each segmentLines as segment (segment.id)}
					<div
						class="segment-line"
						style:left="{segment.left}px"
						style:top="{segment.top}px"
						style:width="{segment.width}px"
						style:--segment-width="{segment.borderWidth}px"
						style:--segment-style={segment.borderStyle}
					></div>
				{/each}
			</div>

			<AcademicView
				{tableData}
				{tableStyle}
				{headerRowCount}
				rowHeights={displayRowHeights}
				{bodyWindow}
				{colWindow}
				{interactive}
				{editingCell}
				{editValue}
				onEditValue={(value) => (editValue = value)}
				onStartEdit={startCellEdit}
				onFinishEdit={finishCellEdit}
				onEditKeydown={handleCellKeydown}
				bind:tableEl
				bind:tbodyEl
				bind:textareaEl
			/>
		</div>

		{#if needsBottomDoubleLine}
			<div
				class="double-line double-line-bottom {bottomBorderType}"
				style:width="{tableWidth}px"
			></div>
		{/if}

		{#if interactive}
			<AxisResizers
				colSeams={visibleColSeams}
				rowSeams={visibleRowSeams}
				colWidths={tableData.columnWidths}
				rowHeights={displayRowHeights}
				{tableWidth}
				tableHeight={actualContentHeight}
				lockColumns={lockColumnResize}
				lockRows={lockRowResize}
				centerColumns={innerCenterColumns}
				centerRows={innerCenterRows}
				isStageHovered={isCanvasHovered}
				viewScale={viewScale}
				onColumnResize={handleColumnResize}
				onRowResize={handleRowResize}
				{onResizeEnd}
			/>
		{/if}
	</div>

	{#if interactive}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="canvas-resizer nw" onmousedown={(e) => handleCanvasResizeStart(e, 'nw')}></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="canvas-resizer ne" onmousedown={(e) => handleCanvasResizeStart(e, 'ne')}></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="canvas-resizer sw" onmousedown={(e) => handleCanvasResizeStart(e, 'sw')}></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="canvas-resizer se" onmousedown={(e) => handleCanvasResizeStart(e, 'se')}></div>
	{/if}
</div>

<style>
	:global(.academic-table .table-cell) {
		white-space: pre-wrap;
	}
	:global(.academic-table .virtual-spacer) {
		padding: 0 !important;
		border: none !important;
		line-height: 0 !important;
		font-size: 0 !important;
		background: transparent !important;
		pointer-events: none;
	}
</style>
