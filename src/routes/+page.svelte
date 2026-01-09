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
	import type { TableStyle, CanvasConfig, RuleSegment } from "$lib/types";
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

	function handleHeaderRowsChange(count: number) {
		tableStore.setHeaderRows(count);
	}

	function handleAddSegment(segment: RuleSegment) {
		tableStore.addSegment(segment);
	}

	function handleRemoveSegment(index: number) {
		tableStore.removeSegment(index);
	}

	function handleClearSegments() {
		tableStore.clearSegments();
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

	import { generateLatexTable } from "$lib/utils/export-latex";

	// ... (existing imports)

	function handleExportLatex() {
		const latex = generateLatexTable(
			tableStore.tableData,
			tableStore.tableStyle,
		);
		const blob = new Blob([latex], { type: "text/x-tex" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "table.tex";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showExportToast("table.tex");
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
	<AppSidebar.Root collapsible="none" class="border-r border-border">
		<AppSidebar.Header class="h-16 justify-center px-4">
			<AppSidebar.Menu>
				<AppSidebar.MenuItem>
					<AppSidebar.MenuButton size="lg">
						<div
							class="bg-foreground text-background flex size-8 items-center justify-center rounded-lg"
						>
							<Table2 class="size-4" />
						</div>
						<span class="text-sm font-semibold">Tablix</span>
					</AppSidebar.MenuButton>
				</AppSidebar.MenuItem>
			</AppSidebar.Menu>
		</AppSidebar.Header>

		<AppSidebar.Content class="px-4 pb-4">
			<SettingsSidebar
				tableStyle={tableStore.tableStyle}
				canvasConfig={tableStore.canvasConfig}
				tableData={tableStore.tableData}
				selectedCells={tableStore.selectedCells}
				headerRows={tableStore.tableData.headerRows}
				maxHeaderRows={tableStore.tableData.rows.length}
				onHeaderRowsChange={handleHeaderRowsChange}
				onStyleChange={handleStyleChange}
				onCanvasChange={handleCanvasChange}
				lockColumnResize={tableStore.lockColumnResize}
				lockRowResize={tableStore.lockRowResize}
				onLockColumnResizeChange={(value) =>
					(tableStore.lockColumnResize = value)}
				onLockRowResizeChange={(value) =>
					(tableStore.lockRowResize = value)}
				onAddSegment={handleAddSegment}
				onRemoveSegment={handleRemoveSegment}
				onClearSegments={handleClearSegments}
			/>
		</AppSidebar.Content>
	</AppSidebar.Root>

	<AppSidebar.Inset>
		<div class="flex flex-col flex-1 min-h-0 overflow-hidden">
			<Toolbar
				preset={tableStore.tableStyle.preset}
				{canUndo}
				{canRedo}
				onImport={handleImportClick}
				onNewTable={handleNewTable}
				onUndo={handleUndo}
				onRedo={handleRedo}
				onPresetChange={handlePresetChange}
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
						class="p-4 min-h-0 min-w-0 bg-[#f4f4f5] dark:bg-[#0a0a0a] flex flex-col h-full"
					>
						<div class="mb-3 shrink-0">
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
						class="h-full min-h-0 min-w-0 bg-[#fafafa] dark:bg-[#18181b] relative flex flex-col preview-canvas"
						bind:this={previewContainer}
						onwheel={handlePreviewWheel}
					>
						<Badge
							variant="outline"
							class="absolute top-2 right-3 text-[11px] font-medium uppercase tracking-wide z-10 bg-white dark:bg-[#18181b]"
						>
							Preview
						</Badge>
						<div class="absolute top-2 left-3 flex gap-1 z-10">
							<Button
								variant="outline"
								size="icon"
								class="h-7 w-7 bg-white hover:bg-gray-100 dark:bg-[#18181b] dark:hover:bg-[#27272a]"
								onclick={() => (previewZoom = 1)}
							>
								<RotateCcw class="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								class="h-7 w-7 bg-white hover:bg-gray-100 dark:bg-[#18181b] dark:hover:bg-[#27272a]"
								onclick={handleZoomOut}
							>
								<ZoomOut class="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								class="h-7 w-7 bg-white hover:bg-gray-100 dark:bg-[#18181b] dark:hover:bg-[#27272a]"
								onclick={handleZoomIn}
							>
								<ZoomIn class="h-3.5 w-3.5" />
							</Button>
							<span
								class="text-xs text-muted-foreground flex items-center px-2"
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
							class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6"
						>
							<Popover.Root bind:open={exportPopoverOpen}>
								<Popover.Trigger>
									{#snippet child({ props })}
										<Button
											variant="default"
											class="w-[140px] shadow-md"
											{...props}
										>
											<ArrowRightFromLine
												class="w-4 h-4 mr-1"
											/>
											Export Image
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content
									align="center"
									class="w-64"
									onanimationend={handleExportPopoverAnimationEnd}
								>
									<div class="grid gap-4">
										<div class="grid gap-3">
											<div
												class="grid grid-cols-3 items-center gap-4"
											>
												<Label>Format</Label>
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
														class="flex-1 h-8"
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
														class="flex-1 h-8"
													>
														SVG
													</Button>
												</div>
											</div>
											{#if exportFormat === "png"}
												<div
													class="grid grid-cols-3 items-center gap-4"
												>
													<Label>DPI</Label>
													<Select.Root
														type="single"
														value={String(
															exportDpi,
														)}
														onValueChange={handleDpiChange}
													>
														<Select.Trigger
															class="col-span-2 h-8"
														>
															{dpiOptions.find(
																(o) =>
																	o.value ===
																	exportDpi,
															)?.label ||
																"Select DPI"}
														</Select.Trigger>
														<Select.Content>
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
											<Button onclick={handleExport}
												>Export</Button
											>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>
							<Button
								variant="outline"
								class="w-[140px] bg-white hover:bg-gray-100 dark:bg-[#18181b] dark:hover:bg-[#27272a]"
								onclick={handleExportLatex}
							>
								<Code class="w-4 h-4 mr-1" />
								Export LaTeX
							</Button>
						</div>
					</main>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</div>
	</AppSidebar.Inset>
</AppSidebar.Provider>
