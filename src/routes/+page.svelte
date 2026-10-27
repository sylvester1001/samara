<script lang="ts">
	import { onMount, tick } from "svelte";
	import {
		Toolbar,
		EditToolbar,
		AcademicTable,
		TableEditor,
		FormulaDialog,
		TacticalButton,
		LatexLogo,
	} from "$lib/components";
	import TacticalGrip from "$lib/components/effects/TacticalGrip.svelte";
	import AppTooltip from "$lib/components/AppTooltip.svelte";
	import SettingsSidebar from "$lib/components/Sidebar.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as AppSidebar from "$lib/components/ui/sidebar/index.js";
	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { tableStore } from "$lib/stores/table.svelte";
	import { handleFileImport, handlePaste } from "$lib/utils/import";
	import { formatCellContent } from "$lib/utils/latex-processor";
	import {
		exportAndDownloadPng,
		exportAndDownloadSvg,
	} from "$lib/utils/export";
	import {
		showExportToast,
		showCopySuccessToast,
		showCopyErrorToast,
	} from "$lib/utils/notifications";
	import { toast } from "svelte-sonner";
	import { generateLatexTable } from "$lib/utils/export-latex";
	import { isSegmentTrimmed, type LineEdge } from "$lib/utils/table-geometry";
	import { resolveCell } from "$lib/utils/table-semantics";
	import { shouldWindowRows, shouldWindowCols } from "$lib/utils/table-window";
	import type { TableStyle, CanvasConfig } from "$lib/types";
	import { uiTheme } from "$lib/stores/ui-theme.svelte.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import {
		Table2,
		ArrowRightFromLine,
		Code,
		ZoomIn,
		ZoomOut,
		RotateCcw,
		Copy,
		FileText,
		CheckSquare,
		Download,
		Minus,
		Plus,
	} from "lucide-svelte";
	import BrandLogo from "$lib/components/BrandLogo.svelte";
	import { isMac, isTauri } from "$lib/stores/platform.svelte.js";
	import { loadDraft, saveDraft, clearDraft } from "$lib/utils/draft-storage";
	import { copyTextToClipboard } from "$lib/utils/clipboard";
	import { t } from "$lib/i18n";

	let tableElement: HTMLElement | null = $state(null);
	let previewContainer: HTMLElement;
	let fileInput: HTMLInputElement;
	let exportDpi = $state(300);
	let previewZoom = $state(1);

	function getPreviewAvailableWidth(): number | undefined {
		if (!previewContainer || previewContainer.clientWidth <= 0) return undefined;
		const pad = (tableStore.canvasConfig.padding ?? 24) * 2;
		const stageMargin = 64;
		return Math.max(320, previewContainer.clientWidth - stageMargin - pad);
	}

	function handleImportClick() {
		fileInput?.click();
	}

	let isImporting = $state(false);
	let exportMountOpen = $state(false);
	let exportTableEl: HTMLElement | null = $state(null);

	function needsFullExportMount() {
		const rows = tableStore.tableData.rows.length;
		const cols = tableStore.tableData.rows[0]?.length ?? 0;
		return shouldWindowRows(rows) || shouldWindowCols(cols);
	}

	async function getExportElement(): Promise<HTMLElement | null> {
		if (!needsFullExportMount()) return tableElement;
		exportMountOpen = true;
		await tick();
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		);
		try {
			await document.fonts.ready;
		} catch {
			/* ignore */
		}
		return exportTableEl;
	}

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) {
			target.value = "";
			return;
		}

		isImporting = true;
		const loadingToastId = toast.loading("正在导入表格...");
		await new Promise((resolve) => setTimeout(resolve, 0));

		try {
			const data = await handleFileImport(file);

			if (!data || data.rows.length === 0 || !data.rows[0] || data.rows[0].length === 0) {
				toast.dismiss(loadingToastId);
				toast.error("未能在文件中识别到有效的表格内容");
				return;
			}

			tableStore.importData(data, getPreviewAvailableWidth());
			toast.dismiss(loadingToastId);
			toast.success(`导入完成 (${data.rows.length}行×${data.rows[0].length}列)`);
		} catch (err) {
			console.error("Import failed:", err);
			toast.dismiss(loadingToastId);
			toast.error(err instanceof Error ? err.message : "表格导入失败，请检查文件格式");
		} finally {
			isImporting = false;
			target.value = "";
		}
	}

	let isDraftLoaded = $state(false);
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let draftStatus = $state<'saved' | 'saving'>('saved');
	let savePulseKey = $state(0);
	let isInitialMount = true;

	onMount(() => {
		// TODO: 大表草稿还原是同步 JSON.parse + 整表代理，启动窗口会卡住（低于编辑卡死的优先度）
		const draft = loadDraft();
		if (draft) {
			tableStore.restoreDraft(draft);
		}
		isDraftLoaded = true;
	});

	$effect(() => {
		// 仅建立响应式依赖追踪，不进行昂贵的同步深拷贝
		tableStore.tableData;
		tableStore.tableStyle;
		tableStore.canvasConfig;

		if (!isDraftLoaded) return;
		if (isInitialMount) {
			isInitialMount = false;
			return;
		}

		draftStatus = 'saving';

		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}

		autoSaveTimer = setTimeout(() => {
			saveDraft({
				tableData: tableStore.exportTableData(),
				tableStyle: $state.snapshot(tableStore.tableStyle),
				canvasConfig: $state.snapshot(tableStore.canvasConfig),
			});
			draftStatus = 'saved';
			savePulseKey = Date.now();
		}, 10000);

		return () => {
			if (autoSaveTimer) clearTimeout(autoSaveTimer);
		};
	});

	function handleManualSave() {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
			autoSaveTimer = null;
		}
		saveDraft({
			tableData: tableStore.exportTableData(),
			tableStyle: $state.snapshot(tableStore.tableStyle),
			canvasConfig: $state.snapshot(tableStore.canvasConfig),
		});
		draftStatus = 'saved';
		savePulseKey = Date.now();
	}

	function handleBeforeUnload() {
		if (!isDraftLoaded) return;
		saveDraft({
			tableData: tableStore.exportTableData(),
			tableStyle: $state.snapshot(tableStore.tableStyle),
			canvasConfig: $state.snapshot(tableStore.canvasConfig),
		});
	}

	function handleNewTable() {
		const hasContent = tableStore.tableData.rows.some((row) =>
			row.some((cell) => cell.content && cell.content.trim() !== '')
		);
		if (hasContent) {
			if (!window.confirm(t('toolbar.confirmNewTable'))) {
				return;
			}
		}
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
			autoSaveTimer = null;
		}
		tableStore.createNewTable(4, 4);
		clearDraft();
		draftStatus = 'saved';
		savePulseKey = Date.now();
	}

	function handleUndo() {
		tableStore.undo();
	}

	function handleRedo() {
		tableStore.redo();
	}

	function handlePresetChange(preset: TableStyle["preset"]) {
		tableStore.setPreset(preset);
	}

	function handleStyleChange(style: Partial<TableStyle>) {
		Object.assign(tableStore.tableStyle, style);
	}

	function handleCanvasChange(config: Partial<CanvasConfig>) {
		Object.assign(tableStore.canvasConfig, config);
	}

	function handleCellChange(row: number, col: number, content: string) {
		tableStore.updateCell(row, col, { content });
	}

	function handleColumnResize(colIndex: number, width: number) {
		tableStore.setColumnWidth(colIndex, width);
	}

	function handleRowResize(rowIndex: number, height: number) {
		tableStore.setRowHeight(rowIndex, height);
	}

	function handleAddRow(index?: number) {
		tableStore.addRow(index);
	}

	function handleAddColumn(index?: number) {
		tableStore.addColumn(index);
	}

	function handleDeleteRow(index: number) {
		tableStore.deleteRow(index);
	}

	function handleDeleteColumn(index: number) {
		tableStore.deleteColumn(index);
	}

	function handleDeleteRows(indices: number[]) {
		tableStore.deleteRows(indices);
	}

	function handleDeleteColumns(indices: number[]) {
		tableStore.deleteColumns(indices);
	}

	function handleResizeTable(rows: number, cols: number) {
		tableStore.resizeTable(rows, cols);
	}

	function handleSelectionChange(cells: { row: number; col: number }[]) {
		tableStore.setSelectedCells(cells);
		if (cells.length > 0) {
			selectCellHint = false;
		}
		syncActiveSegment();
	}

	function handleAlignChange(align: "left" | "center" | "right") {
		tableStore.applyToSelectedCells({ align });
	}

	function handleToggleBold() {
		tableStore.toggleSelectedCells("isBold");
	}

	function handleToggleItalic() {
		tableStore.toggleSelectedCells("isItalic");
	}

	function handleTextColorChange(color: string | undefined) {
		tableStore.applyToSelectedCells({ textColor: color });
	}

	function handleBackgroundColorChange(color: string | undefined) {
		tableStore.applyToSelectedCells({ backgroundColor: color });
	}

	function handleMergeCells() {
		tableStore.mergeSelectedCells();
	}

	function handleUnmergeCells() {
		tableStore.unmergeSelectedCells();
	}

	function handleHeaderRowsChange(count: number, recordHistory = true) {
		tableStore.setHeaderRows(count, recordHistory);
	}

	function handleHeaderRowsCommit() {
		tableStore.commitHistory();
	}

	let headerAdjustMode = $state(false);
	let activeSegmentIndex = $state<number | null>(null);
	let selectCellHint = $state(false);
	let lineShorter = $state(true);

	function syncActiveSegment() {
		const below = tableStore.findLineIndexFromSelection("below");
		const above = tableStore.findLineIndexFromSelection("above");
		if (
			activeSegmentIndex != null &&
			(activeSegmentIndex === below || activeSegmentIndex === above)
		) {
			return;
		}
		activeSegmentIndex = below ?? above ?? null;
	}

	function handleAddLine(edge: LineEdge) {
		if (tableStore.selectedCells.length === 0) {
			selectCellHint = true;
			return;
		}
		selectCellHint = false;
		const shorter =
			activeSegmentIndex != null
				? isSegmentTrimmed(
						tableStore.tableData.segments[activeSegmentIndex],
					)
				: lineShorter;
		const index = tableStore.addLineFromSelection(edge, shorter);
		if (index != null) {
			activeSegmentIndex = index;
			lineShorter = isSegmentTrimmed(
				tableStore.tableData.segments[index],
			);
		}
	}

	function handleShorterChange(shorter: boolean) {
		lineShorter = shorter;
		if (activeSegmentIndex == null) return;
		tableStore.setSegmentTrim(activeSegmentIndex, shorter);
	}

	function handleRemoveSegment(index: number) {
		tableStore.removeSegment(index);
		if (activeSegmentIndex == null) return;
		if (activeSegmentIndex === index) {
			activeSegmentIndex = null;
			return;
		}
		if (activeSegmentIndex > index) {
			activeSegmentIndex -= 1;
		}
	}

	function handleSelectSegment(index: number) {
		activeSegmentIndex = index;
	}

	async function handleExportPng() {
		const el = await getExportElement();
		try {
			if (el) {
				const pixelRatio = Math.max(1, exportDpi / 96);
				await exportAndDownloadPng(el, "table.png", {
					pixelRatio,
					backgroundColor: tableStore.canvasConfig.backgroundColor,
				});
				showExportToast("table.png");
			}
		} finally {
			exportMountOpen = false;
		}
	}

	async function handleExportSvg() {
		const el = await getExportElement();
		try {
			if (el) {
				await exportAndDownloadSvg(el, "table.svg", {
					backgroundColor: tableStore.canvasConfig.backgroundColor,
				});
				showExportToast("table.svg");
			}
		} finally {
			exportMountOpen = false;
		}
	}

	function isExternalEditable(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		if (target.isContentEditable) return true;
		if (target.tagName === "INPUT") return true;
		if (target.tagName === "TEXTAREA") {
			return !target.hasAttribute("data-row");
		}
		return false;
	}

	function hasActiveTextSubstringSelection(target: EventTarget | null): boolean {
		if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
			return (
				target.selectionStart != null &&
				target.selectionEnd != null &&
				target.selectionStart !== target.selectionEnd
			);
		}
		return false;
	}

	function handleGlobalCopy(e: ClipboardEvent) {
		if (isExternalEditable(e.target) || hasActiveTextSubstringSelection(e.target)) return;
		const payload = tableStore.serializeSelectionForClipboard();
		if (payload && e.clipboardData) {
			e.preventDefault();
			e.clipboardData.setData("text/plain", payload.text);
			e.clipboardData.setData("text/html", payload.html);
		}
	}

	function handleGlobalCut(e: ClipboardEvent) {
		if (isExternalEditable(e.target) || hasActiveTextSubstringSelection(e.target)) return;
		const payload = tableStore.serializeSelectionForClipboard();
		if (payload && e.clipboardData) {
			e.preventDefault();
			e.clipboardData.setData("text/plain", payload.text);
			e.clipboardData.setData("text/html", payload.html);
			tableStore.clearSelectedCellsContent();
		}
	}

	function handleGlobalPaste(e: ClipboardEvent) {
		if (isExternalEditable(e.target)) return;
		if (e.clipboardData) {
			const html = e.clipboardData.getData("text/html");
			const plain = e.clipboardData.getData("text/plain");
			const hasTablePayload =
				(html && /<table[\s>]/i.test(html)) ||
				plain.includes("\t") ||
				plain.includes("\n");
			if (
				!hasTablePayload &&
				e.target instanceof HTMLTextAreaElement &&
				e.target.hasAttribute("data-row") &&
				e.target.value.length > 0
			) {
				return;
			}
			const data = handlePaste(e.clipboardData);
			if (data) {
				e.preventDefault();
				tableStore.pasteAtSelection(data, getPreviewAvailableWidth());
			}
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		const mod = e.ctrlKey || e.metaKey;
		const key = e.key.toLowerCase();

		if (mod && key === "s") {
			e.preventDefault();
			handleManualSave();
			return;
		}

		if (isExternalEditable(e.target)) return;

		if (mod && !e.shiftKey && key === "z") {
			e.preventDefault();
			handleUndo();
			return;
		}

		if (mod && (key === "y" || (e.shiftKey && key === "z"))) {
			e.preventDefault();
			handleRedo();
			return;
		}

		if (mod && key === "b" && tableStore.selectedCells.length > 0) {
			e.preventDefault();
			handleToggleBold();
			return;
		}

		if (mod && key === "i" && tableStore.selectedCells.length > 0) {
			e.preventDefault();
			handleToggleItalic();
			return;
		}

		const target = e.target as HTMLElement;
		const isEditing =
			target.tagName === "INPUT" ||
			target.tagName === "TEXTAREA" ||
			target.isContentEditable;
		if (isEditing) return;

		if (
			(e.key === "Backspace" || e.key === "Delete") &&
			tableStore.selectedCells.length > 0
		) {
			e.preventDefault();
			tableStore.clearSelectedCellsContent();
		}
	}

	const canUndo = $derived(tableStore.historyIndex > 0 || tableStore.historyPending);
	const canRedo = $derived(
		!tableStore.historyPending &&
			tableStore.historyIndex < tableStore.history.length - 1,
	);
	const hasSelection = $derived(tableStore.selectedCells.length > 0);
	const activeCellSemantics = $derived.by(() => {
		const first = tableStore.selectedCells[0];
		if (!first) return null;
		const raw = tableStore.tableData.rows[first.row]?.[first.col];
		if (!raw) return null;
		return resolveCell(raw, first.row, first.col, tableStore.tableData.headerRows ?? 1);
	});
	const activeBold = $derived(activeCellSemantics?.effectiveBold ?? false);
	const activeItalic = $derived(activeCellSemantics?.effectiveItalic ?? false);
	const activeAlign = $derived(
		(activeCellSemantics?.effectiveAlign === "decimal" ? "right" : activeCellSemantics?.effectiveAlign) ?? "center"
	);
	const activeTextColor = $derived(activeCellSemantics?.textColor);
	const activeBackgroundColor = $derived(activeCellSemantics?.backgroundColor);

	let formulaDialogOpen = $state(false);
	let currentFormulaCell = $derived(
		tableStore.selectedCells.length === 1
			? tableStore.tableData.rows[tableStore.selectedCells[0].row]?.[
					tableStore.selectedCells[0].col
				]?.content ?? ""
			: "",
	);

	function handleInsertFormula() {
		if (tableStore.selectedCells.length === 1) {
			formulaDialogOpen = true;
		}
	}

	function handleFormulaDialogOpen(open: boolean) {
		formulaDialogOpen = open;
	}

	function handleFormulaConfirm(latex: string) {
		if (tableStore.selectedCells.length === 1) {
			const { row, col } = tableStore.selectedCells[0];
			// 简单的将公式作为内容插入，这里暂时不处理混合文本
			// 使用 formatCellContent 确保格式（虽然目前只是包裹 $...$）
			const formatted = formatCellContent(latex, true);
			tableStore.updateCell(row, col, { content: formatted });
		}
	}

	const dpiOptions = [
		{ value: 96, label: "96 DPI" },
		{ value: 150, label: "150 DPI" },
		{ value: 300, label: "300 DPI" },
		{ value: 600, label: "600 DPI" },
	];

	let exportFormat = $state<"png" | "svg">("png");
	let exportPopoverOpen = $state(false);
	let exportPending = $state(false);
	let exportFallbackTimer: ReturnType<typeof setTimeout> | null = null;

	function handleDpiChange(value: string | undefined) {
		if (!value) return;
		const parsed = parseInt(value);
		if (!Number.isNaN(parsed)) {
			exportDpi = parsed;
		}
	}

	function runExport() {
		if (exportFormat === "png") {
			handleExportPng();
		} else {
			handleExportSvg();
		}
	}

	function scheduleExportFallback() {
		if (exportFallbackTimer) {
			clearTimeout(exportFallbackTimer);
		}
		exportFallbackTimer = setTimeout(() => {
			if (!exportPending) return;
			exportPending = false;
			exportFallbackTimer = null;
			runExport();
		}, 250);
	}

	function handleExportPopoverAnimationEnd(event: AnimationEvent) {
		if (!exportPending) return;
		if (event.target !== event.currentTarget) return;
		const target = event.currentTarget as HTMLElement | null;
		if (!target || target.getAttribute("data-state") !== "closed") return;
		exportPending = false;
		if (exportFallbackTimer) {
			clearTimeout(exportFallbackTimer);
			exportFallbackTimer = null;
		}
		runExport();
	}

	function handleExport() {
		if (exportPending) return;
		exportPending = true;
		exportPopoverOpen = false;
		scheduleExportFallback();
	}

	let latexPopoverOpen = $state(false);

	async function handleCopyLatex(includeStyles: boolean, includeDocument: boolean) {
		latexPopoverOpen = false;
		const latex = generateLatexTable(
			tableStore.tableData,
			tableStore.tableStyle,
			{ includeStyles, includeDocument }
		);
		const success = await copyTextToClipboard(latex);
		if (success) {
			const desc = includeDocument
				? t('toast.copyDocSuccessDesc')
				: t('toast.copySnippetSuccessDesc');
			showCopySuccessToast(desc);
		} else {
			showCopyErrorToast();
		}
	}

	function handleExportLatex(includeStyles: boolean = true) {
		latexPopoverOpen = false;
		const latex = generateLatexTable(
			tableStore.tableData,
			tableStore.tableStyle,
			{ includeStyles, includeDocument: true }
		);
		const blob = new Blob([latex], { type: "text/x-tex" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = includeStyles ? "table-styled.tex" : "table.tex";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showExportToast(includeStyles ? "table-styled.tex" : "table.tex");
	}

	function handleZoomIn() {
		previewZoom = Math.min(3, previewZoom + 0.1);
	}

	function handleZoomOut() {
		previewZoom = Math.max(0.25, previewZoom - 0.1);
	}

	function handlePreviewWheel(e: WheelEvent) {
		if (!e.ctrlKey) return;
		e.preventDefault();
		if (e.deltaY < 0) {
			handleZoomIn();
		} else {
			handleZoomOut();
		}
	}
</script>

<svelte:window
	oncopy={handleGlobalCopy}
	oncut={handleGlobalCut}
	onpaste={handleGlobalPaste}
	onkeydown={handleGlobalKeydown}
	onbeforeunload={handleBeforeUnload}
/>

<svelte:head>
	<title>{t('preview.documentTitle')}</title>
</svelte:head>

<FormulaDialog
	open={formulaDialogOpen}
	initialValue={currentFormulaCell}
	onOpenChange={handleFormulaDialogOpen}
	onConfirm={handleFormulaConfirm}
/>

{#if exportMountOpen}
	<div class="pointer-events-none absolute -left-[10000px] top-0" aria-hidden="true">
		<AcademicTable
			tableData={tableStore.tableData}
			tableStyle={tableStore.tableStyle}
			canvasConfig={tableStore.canvasConfig}
			fullRender={true}
			interactive={false}
			layoutRev={tableStore.layoutRev}
			canvasRef={(el) => (exportTableEl = el)}
		/>
	</div>
{/if}

<input
	type="file"
	accept=".csv,.xlsx,.xls"
	class="hidden"
	bind:this={fileInput}
	onchange={handleFileChange}
/>

<AppSidebar.Provider>
	<AppSidebar.Root collapsible="offcanvas">
		<AppSidebar.Header data-tauri-drag-region={isMac && isTauri ? '' : undefined} class="{isMac && isTauri ? 'pt-[38px]' : ''} shrink-0 justify-center px-4 pb-1 bg-sidebar select-none">
			<div class="flex items-center gap-2.5 text-left -ml-1.5 px-1.5 py-1 w-full select-none">
				<div class="flex items-center justify-center shrink-0">
					<BrandLogo
						class="w-[39px] h-[24px]"
						color={uiTheme.theme === 'avant-garde' ? '#0202f1' : 'currentColor'}
					/>
				</div>
				<div class="flex flex-col leading-none grow min-w-0">
					<span class="text-[17px] font-garamond font-semibold tracking-wide text-foreground truncate">Samara</span>
					{#if uiTheme.theme === 'avant-garde'}
						<span class="text-[8.5px] font-terminal tracking-wider text-muted-foreground uppercase mt-0.5">{t('preview.academicTag')}</span>
					{/if}
				</div>
			</div>
		</AppSidebar.Header>

		<AppSidebar.Content class="px-4 pt-3 pb-5">
			<SettingsSidebar
				tableStyle={tableStore.tableStyle}
				canvasConfig={tableStore.canvasConfig}
				onStyleChange={handleStyleChange}
				onPresetChange={handlePresetChange}
				onCanvasChange={handleCanvasChange}
				lockColumnResize={tableStore.lockColumnResize}
				lockRowResize={tableStore.lockRowResize}
				onLockColumnResizeChange={(value) =>
					(tableStore.lockColumnResize = value)}
				onLockRowResizeChange={(value) =>
					(tableStore.lockRowResize = value)}
			/>
		</AppSidebar.Content>
		<AppSidebar.Rail />
	</AppSidebar.Root>

	<AppSidebar.Inset>
		<div class="flex flex-col flex-1 min-h-0 overflow-hidden">
			<Toolbar
				{canUndo}
				{canRedo}
				onImport={handleImportClick}
				onNewTable={handleNewTable}
				onSave={handleManualSave}
				onUndo={handleUndo}
				onRedo={handleRedo}
			/>

			<Resizable.PaneGroup
				direction="horizontal"
				class="flex flex-1 overflow-hidden min-h-0 min-w-0"
			>
				<Resizable.Pane
					defaultSize={46}
					minSize={30}
					class="min-w-[360px] min-h-0"
				>
					<div
						class="min-h-0 min-w-0 bg-muted/15 flex flex-col h-full select-none"
						unselectable="on"
					>
						<div class="px-3 py-3 shrink-0 flex flex-col justify-center">
							<EditToolbar
								{hasSelection}
								selectedCellCount={tableStore.selectedCells.length}
								{activeBold}
								{activeItalic}
								{activeAlign}
								{activeTextColor}
								{activeBackgroundColor}
								onAlignChange={handleAlignChange}
								onToggleBold={handleToggleBold}
								onToggleItalic={handleToggleItalic}
								onTextColorChange={handleTextColorChange}
								onBackgroundColorChange={handleBackgroundColorChange}
								onMergeCells={handleMergeCells}
								onUnmergeCells={handleUnmergeCells}
								onInsertFormula={handleInsertFormula}
								{headerAdjustMode}
								onToggleHeaderAdjust={() =>
									(headerAdjustMode = !headerAdjustMode)}
								tableData={tableStore.tableData}
								{activeSegmentIndex}
								lineHint={selectCellHint ? t('preview.selectCellFirst') : ""}
								onAddLine={handleAddLine}
								onShorterChange={handleShorterChange}
								onRemoveSegment={handleRemoveSegment}
								onSelectSegment={handleSelectSegment}
							/>
						</div>
						<div class="flex-1 min-h-0 px-3 pb-3">
							<TableEditor
								rows={tableStore.tableData.rows}
								selectedCells={tableStore.selectedCells}
								onSelectionChange={handleSelectionChange}
								onCellChange={handleCellChange}
								onAddRow={handleAddRow}
								onAddColumn={handleAddColumn}
								onDeleteRow={handleDeleteRow}
								onDeleteColumn={handleDeleteColumn}
								onDeleteRows={handleDeleteRows}
								onDeleteColumns={handleDeleteColumns}
								onClearSelectedCells={() =>
									tableStore.clearSelectedCellsContent()}
								onResizeTable={handleResizeTable}
								headerRows={tableStore.tableData.headerRows}
								{headerAdjustMode}
								onHeaderRowsChange={handleHeaderRowsChange}
								onHeaderRowsCommit={handleHeaderRowsCommit}
								onHeaderAdjustModeChange={(open: boolean) =>
									(headerAdjustMode = open)}
								onMergeCells={handleMergeCells}
								onUnmergeCells={handleUnmergeCells}
								onAddLine={handleAddLine}
								{draftStatus}
								{savePulseKey}
								layoutRev={tableStore.layoutRev}
								contentRev={tableStore.contentRev}
							/>
						</div>
					</div>
				</Resizable.Pane>
				<Resizable.Handle class={uiTheme.theme === 'avant-garde' ? 'avant-resizable-handle' : ''}>
					{#if uiTheme.theme === 'avant-garde'}
						<TacticalGrip />
					{/if}
				</Resizable.Handle>
				<Resizable.Pane
					defaultSize={54}
					minSize={30}
					class="min-w-[360px] min-h-0"
				>
					<main
						class="h-full min-h-0 min-w-0 bg-[#fafafa] dark:bg-[#18181b] relative flex flex-col preview-canvas select-none"
						bind:this={previewContainer}
						onwheel={handlePreviewWheel}
					>
						{#if uiTheme.theme === 'avant-garde'}
							<div class="absolute top-3 right-3 z-10">
								<span class="ticket-tag bg-background text-foreground border-border shadow-xs">
									<span class="size-1.5 rounded-full bg-[#0202f1]"></span>
									<span>{t('preview.live')}</span>
								</span>
							</div>
						{:else}
							<Badge
								variant="outline"
								class="absolute top-2 right-3 text-[11px] font-medium uppercase tracking-wide z-10 bg-background"
							>
								{t('preview.preview')}
							</Badge>
						{/if}
						<!-- 战术取景器缩放控制仪（Unified Viewfinder Zoom Instrument） -->
						<div
							class="absolute top-3 left-3 z-10 inline-flex items-center h-7 bg-background/95 backdrop-blur-xs border border-border select-none shadow-2xs overflow-hidden {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : 'rounded-[var(--radius)]'}"
						>
							<!-- 缩小 [-] -->
							<AppTooltip text={t('preview.zoomOut')} onclick={handleZoomOut}>
								{#snippet children({ props })}
									<button
										type="button"
										class="w-7 h-full inline-flex items-center justify-center border-r border-border cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none text-foreground {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white active:bg-[#0000d0]' : 'hover:bg-muted'}"
										disabled={previewZoom <= 0.25}
										{...props}
										onclick={handleZoomOut}
										aria-label={t('preview.zoomOut')}
									>
										<Minus class="w-3.5 h-3.5 stroke-[2.2]" />
									</button>
								{/snippet}
							</AppTooltip>

							<!-- 等宽数值刻度显示（纯展示） -->
							<span
								class="h-full px-2.5 inline-flex items-center justify-center border-r border-border select-none tabular-nums text-[11px] font-semibold tracking-wider text-foreground {uiTheme.theme === 'avant-garde' ? 'font-terminal' : 'font-sans'}"
							>
								{Math.round(previewZoom * 100)}%
							</span>

							<!-- 放大 [+] -->
							<AppTooltip text={t('preview.zoomIn')} onclick={handleZoomIn}>
								{#snippet children({ props })}
									<button
										type="button"
										class="w-7 h-full inline-flex items-center justify-center border-r border-border cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none text-foreground {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white active:bg-[#0000d0]' : 'hover:bg-muted'}"
										disabled={previewZoom >= 3}
										{...props}
										onclick={handleZoomIn}
										aria-label={t('preview.zoomIn')}
									>
										<Plus class="w-3.5 h-3.5 stroke-[2.2]" />
									</button>
								{/snippet}
							</AppTooltip>

							<!-- 复位按键 [⟲] -->
							<AppTooltip text={t('preview.resetZoom')} onclick={() => (previewZoom = 1)}>
								{#snippet children({ props })}
									<button
										type="button"
										class="w-7 h-full inline-flex items-center justify-center cursor-pointer transition-colors text-foreground {previewZoom === 1 ? 'opacity-35 pointer-events-none' : ''} {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white active:bg-[#0000d0]' : 'hover:bg-muted'}"
										disabled={previewZoom === 1}
										{...props}
										onclick={() => (previewZoom = 1)}
										aria-label={t('preview.resetZoom')}
									>
										<RotateCcw class="w-3 h-3 stroke-[2.2]" />
									</button>
								{/snippet}
							</AppTooltip>
						</div>
						<ScrollArea
							class="flex-1 w-full h-full min-h-0 min-w-0"
							orientation="both"
						>
							<div
								class="min-w-full min-h-full flex justify-center items-start pt-16 pb-28 px-4"
							>
								<div
									style:transform="scale({previewZoom})"
									style:transform-origin="top center"
								>
									<AcademicTable
										tableData={tableStore.tableData}
										tableStyle={tableStore.tableStyle}
										canvasConfig={tableStore.canvasConfig}
										onCellUpdate={handleCellChange}
										onColumnResize={handleColumnResize}
										onRowResize={handleRowResize}
										onResizeEnd={() => tableStore.commitHistory()}
										onCanvasResize={handleCanvasChange}
										canvasRef={(el) => (tableElement = el)}
										viewScale={previewZoom}
										layoutRev={tableStore.layoutRev}
										lockColumnResize={tableStore.lockColumnResize}
										lockRowResize={tableStore.lockRowResize}
									/>
								</div>
							</div>
						</ScrollArea>
						<div
							class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20"
						>
							<Popover.Root bind:open={exportPopoverOpen}>
								<Popover.Trigger>
									{#snippet child({ props })}
										<TacticalButton
											class="w-[150px]"
											active={exportPopoverOpen}
											{...props}
										>
											<ArrowRightFromLine
												class="w-3.5 h-3.5 shrink-0 stroke-[2.2]"
											/>
											<span class="truncate">{t('preview.exportImage')}</span>
										</TacticalButton>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content
									align="center"
									class="w-64 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}"
									onanimationend={handleExportPopoverAnimationEnd}
								>
									<div class="grid gap-4">
										<div class="grid gap-3">
											<div
												class="grid grid-cols-3 items-center gap-4"
											>
												<Label class={uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider text-muted-foreground' : ''}>{t('preview.format')}</Label>
												<div
													class="col-span-2 flex gap-1"
												>
													<Button
														size="sm"
														variant={exportFormat ===
														"png"
															? "default"
															: "outline"}
														onclick={() =>
															(exportFormat =
																"png")}
														class="flex-1 h-8 transition-none {exportFormat === 'png' && uiTheme.theme === 'avant-garde' ? 'export-img-btn font-terminal uppercase font-bold text-xs' : ''}"
														style={exportFormat === 'png' && uiTheme.theme === 'avant-garde' ? 'background-color: #0202f1 !important; color: #ffffff !important; font-family: "JetBrains Mono", var(--font-cjk), monospace !important;' : undefined}
													>
														PNG
													</Button>
													<Button
														size="sm"
														variant={exportFormat ===
														"svg"
															? "default"
															: "outline"}
														onclick={() =>
															(exportFormat =
																"svg")}
														class="flex-1 h-8 transition-none {exportFormat === 'svg' && uiTheme.theme === 'avant-garde' ? 'export-img-btn font-terminal uppercase font-bold text-xs' : ''}"
														style={exportFormat === 'svg' && uiTheme.theme === 'avant-garde' ? 'background-color: #0202f1 !important; color: #ffffff !important; font-family: "JetBrains Mono", var(--font-cjk), monospace !important;' : undefined}
													>
														SVG
													</Button>
												</div>
											</div>
											{#if exportFormat === "png"}
												<div
													class="grid grid-cols-3 items-center gap-4"
												>
													<Label class={uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider text-muted-foreground' : ''}>{t('preview.dpi')}</Label>
													<Select.Root
														type="single"
														value={String(
															exportDpi,
														)}
														onValueChange={handleDpiChange}
													>
														<Select.Trigger
															class="col-span-2 h-8 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}"
														>
															{dpiOptions.find(
																(o) =>
																	o.value ===
																	exportDpi,
															)?.label ||
																t('preview.selectDpi')}
														</Select.Trigger>
														<Select.Content class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}>
															{#each dpiOptions as option}
																<Select.Item
																	value={String(
																		option.value,
																	)}
																	>{option.label}</Select.Item
																>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>
											{/if}
										</div>
										<div class="flex justify-end">
											<Button 
												onclick={handleExport}
												class={uiTheme.theme === 'avant-garde' ? 'export-img-btn font-terminal text-xs uppercase tracking-wider font-bold' : ''}
												style={uiTheme.theme === 'avant-garde' ? 'background-color: #0202f1 !important; color: #ffffff !important; border: 1px solid #0202f1 !important; font-family: "JetBrains Mono", var(--font-cjk), monospace !important;' : undefined}
											>
												{t('preview.export')}
											</Button>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>
							<Popover.Root bind:open={latexPopoverOpen}>
								<Popover.Trigger>
									{#snippet child({ props })}
										<TacticalButton
											class="w-[150px]"
											pointerPosition="right"
											active={latexPopoverOpen}
											{...props}
										>
											<Code class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
											<span class="truncate inline-flex items-center gap-1">
												<span>{t('preview.exportLatex').replace('LaTeX', '').trim()}</span>
												<LatexLogo />
											</span>
										</TacticalButton>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content
									side="top"
									align="center"
									sideOffset={8}
									class="w-72 p-1.5 shadow-xl border border-border bg-popover {uiTheme.theme === 'avant-garde' ? 'font-terminal' : ''}"
								>
									<div class="flex flex-col gap-0.5 select-none">
										<!-- Copy Section Header -->
										<div class="flex items-center justify-between px-2 pt-1 pb-0.5">
											<span class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
												{t('preview.copyToClipboard')}
											</span>
											{#if uiTheme.theme === 'avant-garde'}
												<span class="text-[9px] text-[#0202f1] font-bold tracking-wider uppercase">OVERLEAF // READY</span>
											{:else}
												<span class="text-[10px] text-primary font-medium">Overleaf</span>
											{/if}
										</div>

										<!-- Primary: Copy Snippet (Styled) -->
										<button
											type="button"
											class="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[var(--radius)] hover:bg-accent hover:text-accent-foreground text-left cursor-pointer group outline-none select-none"
											onclick={() => handleCopyLatex(true, false)}
										>
											<Copy class="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-accent-foreground" />
											<div class="flex flex-col min-w-0">
												<span class="text-xs font-semibold text-foreground group-hover:text-accent-foreground">
													{t('preview.copyLatexSnippet')}
												</span>
												<span class="text-[11px] text-muted-foreground group-hover:text-accent-foreground/80 leading-snug">
													{t('preview.copyLatexSnippetDesc')}
												</span>
											</div>
										</button>

										<!-- Copy Full Doc -->
										<button
											type="button"
											class="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[var(--radius)] hover:bg-accent hover:text-accent-foreground text-left cursor-pointer group outline-none select-none"
											onclick={() => handleCopyLatex(true, true)}
										>
											<FileText class="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-accent-foreground" />
											<div class="flex flex-col min-w-0">
												<span class="text-xs font-medium text-foreground group-hover:text-accent-foreground">
													{t('preview.copyLatexDocument')}
												</span>
												<span class="text-[11px] text-muted-foreground group-hover:text-accent-foreground/80 leading-snug">
													{t('preview.copyLatexDocumentDesc')}
												</span>
											</div>
										</button>

										<!-- Copy Plain Snippet -->
										<button
											type="button"
											class="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[var(--radius)] hover:bg-accent hover:text-accent-foreground text-left cursor-pointer group outline-none select-none"
											onclick={() => handleCopyLatex(false, false)}
										>
											<CheckSquare class="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-accent-foreground" />
											<div class="flex flex-col min-w-0">
												<span class="text-xs font-medium text-foreground group-hover:text-accent-foreground">
													{t('preview.copyPlainLatex')}
												</span>
												<span class="text-[11px] text-muted-foreground group-hover:text-accent-foreground/80 leading-snug">
													{t('preview.copyPlainLatexDesc')}
												</span>
											</div>
										</button>

										<!-- Divider -->
										<div class="h-px bg-border/60 my-1"></div>

										<!-- Download Section Header -->
										<div class="px-2 pt-0.5 pb-1">
											<span class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
												{t('preview.downloadFile')}
											</span>
										</div>

										<!-- Download Buttons Grid -->
										<div class="grid grid-cols-2 gap-1.5 px-1 pb-1">
											<AppTooltip text={t('preview.downloadStyledTex')} onclick={() => handleExportLatex(true)}>
												{#snippet children({ props })}
													<button
														type="button"
														class="inline-flex items-center justify-center gap-1.5 h-8 px-2 border border-border bg-background text-foreground cursor-pointer select-none group {uiTheme.theme === 'avant-garde' ? 'ticket-btn font-terminal uppercase tracking-wider text-[11px] font-semibold hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-[var(--radius)] hover:bg-muted text-xs font-medium'}"
														{...props}
														onclick={() => handleExportLatex(true)}
													>
														<Download class="w-3.5 h-3.5 shrink-0 text-muted-foreground group-hover:text-inherit" />
														<span class="truncate">{t('preview.withStyles')}</span>
													</button>
												{/snippet}
											</AppTooltip>
											<AppTooltip text={t('preview.downloadPlainTex')} onclick={() => handleExportLatex(false)}>
												{#snippet children({ props })}
													<button
														type="button"
														class="inline-flex items-center justify-center gap-1.5 h-8 px-2 border border-border bg-background text-foreground cursor-pointer select-none group {uiTheme.theme === 'avant-garde' ? 'ticket-btn font-terminal uppercase tracking-wider text-[11px] font-semibold hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-[var(--radius)] hover:bg-muted text-xs font-medium'}"
														{...props}
														onclick={() => handleExportLatex(false)}
													>
														<Download class="w-3.5 h-3.5 shrink-0 text-muted-foreground group-hover:text-inherit" />
														<span class="truncate">{t('preview.plain')}</span>
													</button>
												{/snippet}
											</AppTooltip>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>
						</div>
					</main>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</div>
	</AppSidebar.Inset>
</AppSidebar.Provider>
