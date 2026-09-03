<script lang="ts">
	import {
		Toolbar,
		EditToolbar,
		AcademicTable,
		TableEditor,
		FormulaDialog,
	} from "$lib/components";
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
	import { showExportToast } from "$lib/utils/notifications";
	import { generateLatexTable } from "$lib/utils/export-latex";
	import { isSegmentTrimmed, type LineEdge } from "$lib/utils/table-geometry";
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
	} from "lucide-svelte";
	import BrandLogo from "$lib/components/BrandLogo.svelte";
	import LogoShowcaseDialog from "$lib/components/LogoShowcaseDialog.svelte";

	let logoShowcaseOpen = $state(false);
	let activeLogoVariant = $state<'user-samara' | 'engraved-single' | 'engraved-dual'>('user-samara');
	let activeBrandFont = $state<'baskerville' | 'garamond' | 'mono'>('garamond');

	let tableElement: HTMLElement | null = $state(null);
	let previewContainer: HTMLElement;
	let fileInput: HTMLInputElement;
	let exportDpi = $state(300);
	let previewZoom = $state(1);

	function handleImportClick() {
		fileInput?.click();
	}

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			try {
				const data = await handleFileImport(file);
				tableStore.importData(data);
			} catch (err) {
				console.error("Import failed:", err);
			}
		}
		target.value = "";
	}

	function handleNewTable() {
		tableStore.createNewTable(4, 4);
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

	function handleResizeTable(rows: number, cols: number) {
		tableStore.resizeTable(rows, cols);
	}

	function handleSelectionChange(cells: { row: number; col: number }[]) {
		tableStore.setSelectedCells(cells);
		if (cells.length > 0) {
			lineHint = "";
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

	function handleTextColorChange(color: string) {
		tableStore.applyToSelectedCells({ textColor: color });
	}

	function handleBackgroundColorChange(color: string) {
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
	let lineHint = $state("");
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
			lineHint = "Select a cell first";
			return;
		}
		lineHint = "";
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
		if (tableElement) {
			const pixelRatio = Math.max(1, exportDpi / 96);
			await exportAndDownloadPng(tableElement, "table.png", {
				pixelRatio,
				backgroundColor: tableStore.canvasConfig.backgroundColor,
			});
			showExportToast("table.png");
		}
	}

	async function handleExportSvg() {
		if (tableElement) {
			await exportAndDownloadSvg(tableElement, "table.svg", {
				backgroundColor: tableStore.canvasConfig.backgroundColor,
			});
			showExportToast("table.svg");
		}
	}

	function handleGlobalPaste(e: ClipboardEvent) {
		if (e.clipboardData) {
			const data = handlePaste(e.clipboardData);
			if (data) {
				e.preventDefault();
				tableStore.pasteAtSelection(data);
			}
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
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

	const canUndo = $derived(tableStore.historyIndex > 0);
	const canRedo = $derived(
		tableStore.historyIndex < tableStore.history.length - 1,
	);
	const hasSelection = $derived(tableStore.selectedCells.length > 0);

	let formulaDialogOpen = $state(false);
	let currentFormulaCell = $derived(
		tableStore.selectedCells.length === 1
			? tableStore.tableData.rows[tableStore.selectedCells[0].row][
					tableStore.selectedCells[0].col
				].content
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

	function handleExportLatex(includeStyles: boolean = true) {
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

<svelte:window onpaste={handleGlobalPaste} onkeydown={handleGlobalKeydown} />

<svelte:head>
	<title>Samara — Academic Table Editor</title>
</svelte:head>

<FormulaDialog
	open={formulaDialogOpen}
	initialValue={currentFormulaCell}
	onOpenChange={handleFormulaDialogOpen}
	onConfirm={handleFormulaConfirm}
/>

<input
	type="file"
	accept=".csv,.xlsx,.xls"
	class="hidden"
	bind:this={fileInput}
	onchange={handleFileChange}
/>

<AppSidebar.Provider>
	<AppSidebar.Root collapsible="offcanvas">
		<AppSidebar.Header class="h-14 shrink-0 justify-center px-4 border-b border-sidebar-border bg-sidebar select-none">
			<button
				type="button"
				class="flex items-center gap-2.5 group cursor-pointer text-left -ml-1.5 px-1.5 py-1 rounded-[var(--radius)] hover:bg-muted/50 transition-colors w-full"
				onclick={() => (logoShowcaseOpen = true)}
				title="Click to preview & choose Logo / Typography"
			>
				<div class="flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
					<BrandLogo
						variant={activeLogoVariant}
						class={activeLogoVariant === 'user-samara' ? 'w-[39px] h-[24px]' : 'size-6'}
						color={uiTheme.theme === 'avant-garde' ? '#0202f1' : 'currentColor'}
					/>
				</div>
				<div class="flex flex-col leading-none grow min-w-0">
					{#if activeBrandFont === 'baskerville'}
						<span class="text-[15px] font-baskerville font-bold tracking-tight text-foreground truncate">Samara</span>
					{:else if activeBrandFont === 'garamond'}
						<span class="text-[17px] font-garamond font-semibold tracking-wide text-foreground truncate">Samara</span>
					{:else}
						<span class="text-[13px] font-mono-brand font-semibold tracking-wider text-foreground truncate">samara</span>
					{/if}
					{#if uiTheme.theme === 'avant-garde'}
						<span class="text-[8.5px] font-terminal tracking-wider text-muted-foreground uppercase mt-0.5">ACADEMIC // v0.1</span>
					{/if}
				</div>
			</button>
		</AppSidebar.Header>

		<LogoShowcaseDialog
			bind:open={logoShowcaseOpen}
			bind:currentVariant={activeLogoVariant}
			bind:currentFont={activeBrandFont}
		/>

		<AppSidebar.Content class="px-4 py-5">
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
						class="p-3 min-h-0 min-w-0 bg-muted/15 flex flex-col h-full"
					>
						<div class="mb-2 shrink-0">
							<EditToolbar
								{hasSelection}
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
								{lineHint}
								onAddLine={handleAddLine}
								onShorterChange={handleShorterChange}
								onRemoveSegment={handleRemoveSegment}
								onSelectSegment={handleSelectSegment}
							/>
						</div>
						<div class="flex-1 min-h-0">
							<TableEditor
								rows={tableStore.tableData.rows}
								selectedCells={tableStore.selectedCells}
								onSelectionChange={handleSelectionChange}
								onCellChange={handleCellChange}
								onAddRow={handleAddRow}
								onAddColumn={handleAddColumn}
								onDeleteRow={handleDeleteRow}
								onDeleteColumn={handleDeleteColumn}
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
							/>
						</div>
					</div>
				</Resizable.Pane>
				<Resizable.Handle />
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
									<span>PREVIEW // LIVE</span>
								</span>
							</div>
						{:else}
							<Badge
								variant="outline"
								class="absolute top-2 right-3 text-[11px] font-medium uppercase tracking-wide z-10 bg-background"
							>
								Preview
							</Badge>
						{/if}
						<div class="absolute top-3 left-3 flex items-center gap-0.5 z-10">
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-muted'}"
								onclick={() => (previewZoom = 1)}
								title="Reset Zoom"
							>
								<RotateCcw class="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-muted'}"
								onclick={handleZoomOut}
								title="Zoom Out"
							>
								<ZoomOut class="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-muted'}"
								onclick={handleZoomIn}
								title="Zoom In"
							>
								<ZoomIn class="h-3.5 w-3.5" />
							</Button>
							<span
								class="text-[11px] font-terminal text-muted-foreground flex items-center px-1.5 font-semibold select-none"
							>
								{Math.round(previewZoom * 100)}%
							</span>
						</div>
						<ScrollArea
							class="flex-1 w-full pt-12 px-4 pb-16"
							orientation="both"
						>
							<div
								class="min-w-full min-h-full flex justify-center items-start py-4"
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
										onCanvasResize={handleCanvasChange}
										canvasRef={(el) => (tableElement = el)}
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
										<Button
											variant="default"
											class="w-[144px] h-9 shadow-lg font-medium transition-all {uiTheme.theme === 'avant-garde' ? 'export-img-btn font-terminal text-xs uppercase tracking-[0.14em] font-bold' : ''}"
											style={uiTheme.theme === 'avant-garde' ? 'background-color: #0202f1 !important; color: #ffffff !important; border: 1px solid #0202f1 !important; font-family: "JetBrains Mono", monospace !important;' : undefined}
											{...props}
										>
											<ArrowRightFromLine
												class="w-3.5 h-3.5 mr-1.5 {uiTheme.theme === 'avant-garde' ? 'stroke-[2.5]' : ''}"
											/>
											Export Image
										</Button>
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
												<Label class={uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider text-muted-foreground' : ''}>Format</Label>
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
														class="flex-1 h-8 {exportFormat === 'png' && uiTheme.theme === 'avant-garde' ? 'export-img-btn font-terminal uppercase font-bold text-xs' : ''}"
														style={exportFormat === 'png' && uiTheme.theme === 'avant-garde' ? 'background-color: #0202f1 !important; color: #ffffff !important; font-family: "JetBrains Mono", monospace !important;' : undefined}
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
														class="flex-1 h-8 {exportFormat === 'svg' && uiTheme.theme === 'avant-garde' ? 'export-img-btn font-terminal uppercase font-bold text-xs' : ''}"
														style={exportFormat === 'svg' && uiTheme.theme === 'avant-garde' ? 'background-color: #0202f1 !important; color: #ffffff !important; font-family: "JetBrains Mono", monospace !important;' : undefined}
													>
														SVG
													</Button>
												</div>
											</div>
											{#if exportFormat === "png"}
												<div
													class="grid grid-cols-3 items-center gap-4"
												>
													<Label class={uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider text-muted-foreground' : ''}>DPI</Label>
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
																"Select DPI"}
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
												style={uiTheme.theme === 'avant-garde' ? 'background-color: #0202f1 !important; color: #ffffff !important; border: 1px solid #0202f1 !important; font-family: "JetBrains Mono", monospace !important;' : undefined}
											>
												Export
											</Button>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>
							<Popover.Root>
								<Popover.Trigger>
									{#snippet child({ props })}
										<Button
											variant="outline"
											class="w-[144px] h-9 bg-background hover:bg-muted shadow-lg font-medium transition-all {uiTheme.theme === 'avant-garde' ? 'hover:text-[#0202f1] hover:border-[#0202f1] font-terminal text-xs uppercase tracking-[0.14em] font-bold' : ''}"
											style={uiTheme.theme === 'avant-garde' ? 'font-family: "JetBrains Mono", monospace !important;' : undefined}
											{...props}
										>
											<Code class="w-3.5 h-3.5 mr-1.5 {uiTheme.theme === 'avant-garde' ? 'text-[#0202f1] stroke-[2.5]' : ''}" />
											Export LaTeX
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content
									side="top"
									align="center"
									class="w-56"
								>
									<div class="grid gap-2">
										<p class="text-sm text-muted-foreground mb-2">Choose export format:</p>
										<Button
											variant="outline"
											class="w-full justify-start"
											onclick={() => handleExportLatex(true)}
										>
											With Styles
										</Button>
										<Button
											variant="outline"
											class="w-full justify-start"
											onclick={() => handleExportLatex(false)}
										>
											Plain (No Styles)
										</Button>
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
