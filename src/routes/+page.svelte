<script lang="ts">
	import { Toolbar, AcademicTable, TableEditor } from '$lib/components';
	import SettingsSidebar from '$lib/components/Sidebar.svelte';
	import * as AppSidebar from '$lib/components/ui/sidebar/index.js';
	import { tableStore } from '$lib/stores/table.svelte';
	import { handleFileImport, handlePaste } from '$lib/utils/import';
	import { exportAndDownloadPng, exportAndDownloadSvg } from '$lib/utils/export';
	import { showExportToast } from '$lib/utils/notifications';
	import type { TableStyle, CanvasConfig } from '$lib/types';
	import { Table2 } from 'lucide-svelte';

	let tableElement: HTMLElement;
	let previewArea: HTMLElement;
	let fileInput: HTMLInputElement;
	let exportDpi = $state(300);

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
				console.error('Import failed:', err);
			}
		}
		target.value = '';
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

	function handlePresetChange(preset: TableStyle['preset']) {
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

	function handleAddRow() {
		tableStore.addRow();
	}

	function handleAddColumn() {
		tableStore.addColumn();
	}

	function handleDeleteRow(index: number) {
		tableStore.deleteRow(index);
	}

	function handleDeleteColumn(index: number) {
		tableStore.deleteColumn(index);
	}

	function handleSelectionChange(cells: { row: number; col: number }[]) {
		tableStore.setSelectedCells(cells);
	}

	function handleAlignChange(align: 'left' | 'center' | 'right') {
		tableStore.applyToSelectedCells({ align });
	}

	function handleToggleBold() {
		tableStore.toggleSelectedCells('isBold');
	}

	function handleToggleItalic() {
		tableStore.toggleSelectedCells('isItalic');
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

	async function handleExportPng() {
		if (tableElement) {
			const pixelRatio = Math.max(1, exportDpi / 96);
			await exportAndDownloadPng(tableElement, 'table.png', {
				pixelRatio,
				backgroundColor: tableStore.canvasConfig.backgroundColor
			});
			showExportToast('table.png');
		}
	}

	async function handleExportSvg() {
		if (tableElement) {
			await exportAndDownloadSvg(tableElement, 'table.svg', {
				backgroundColor: tableStore.canvasConfig.backgroundColor
			});
			showExportToast('table.svg');
		}
	}

	function handleGlobalPaste(e: ClipboardEvent) {
		if (e.clipboardData) {
			const data = handlePaste(e.clipboardData);
			if (data) {
				e.preventDefault();
				tableStore.importData(data);
			}
		}
	}

	const canUndo = $derived(tableStore.historyIndex > 0);
	const canRedo = $derived(tableStore.historyIndex < tableStore.history.length - 1);
	const hasSelection = $derived(tableStore.selectedCells.length > 0);
</script>

<svelte:window onpaste={handleGlobalPaste} />

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
						<div class="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg">
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
				onStyleChange={handleStyleChange}
				onCanvasChange={handleCanvasChange}
				lockColumnResize={tableStore.lockColumnResize}
				lockRowResize={tableStore.lockRowResize}
				onLockColumnResizeChange={(value) => (tableStore.lockColumnResize = value)}
				onLockRowResizeChange={(value) => (tableStore.lockRowResize = value)}
			/>
		</AppSidebar.Content>
	</AppSidebar.Root>

	<AppSidebar.Inset>
		<div class="flex flex-col flex-1 min-h-0 overflow-hidden">
			<Toolbar
				preset={tableStore.tableStyle.preset}
				{canUndo}
				{canRedo}
				{hasSelection}
				onImport={handleImportClick}
				onNewTable={handleNewTable}
				onUndo={handleUndo}
				onRedo={handleRedo}
				onPresetChange={handlePresetChange}
				onExportPng={handleExportPng}
				onExportSvg={handleExportSvg}
				onAlignChange={handleAlignChange}
				onToggleBold={handleToggleBold}
				onToggleItalic={handleToggleItalic}
				onTextColorChange={handleTextColorChange}
				onBackgroundColorChange={handleBackgroundColorChange}
				onMergeCells={handleMergeCells}
				onUnmergeCells={handleUnmergeCells}
				dpi={exportDpi}
				onDpiChange={(value) => (exportDpi = value)}
			/>

			<div class="flex flex-1 overflow-hidden min-h-0 min-w-0">
				<div class="flex-1 p-4 min-h-0 min-w-0 bg-[#f4f4f5] dark:bg-[#0a0a0a] border-r border-border dark:border-[#27272a]">
					<TableEditor
						rows={tableStore.tableData.rows}
						selectedCells={tableStore.selectedCells}
						onSelectionChange={handleSelectionChange}
						onCellChange={handleCellChange}
						onAddRow={handleAddRow}
						onAddColumn={handleAddColumn}
						onDeleteRow={handleDeleteRow}
						onDeleteColumn={handleDeleteColumn}
					/>
				</div>

				<main class="flex-1 overflow-auto min-h-0 min-w-0 bg-[#fafafa] dark:bg-[#18181b] pt-9 px-4 pb-4 relative flex flex-col items-center justify-start" bind:this={previewArea}>
					<div class="absolute top-2 right-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Preview</div>
					<div bind:this={tableElement}>
						<AcademicTable
							tableData={tableStore.tableData}
							tableStyle={tableStore.tableStyle}
							canvasConfig={tableStore.canvasConfig}
							onCellUpdate={handleCellChange}
							onColumnResize={handleColumnResize}
							onRowResize={handleRowResize}
							onCanvasResize={handleCanvasChange}
						/>
					</div>
				</main>
			</div>
		</div>
	</AppSidebar.Inset>
</AppSidebar.Provider>
