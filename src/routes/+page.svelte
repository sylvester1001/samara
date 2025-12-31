<script lang="ts">
	import { Toolbar, Sidebar, AcademicTable } from '$lib/components';
	import { tableStore } from '$lib/stores/table.svelte';
	import { handleFileImport, handlePaste } from '$lib/utils/import';
	import { exportAndDownloadPng, exportAndDownloadSvg } from '$lib/utils/export';
	import type { TableStyle, CanvasConfig } from '$lib/types';

	let tableElement: HTMLElement;
	let fileInput: HTMLInputElement;

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

	function handleCellUpdate(row: number, col: number, content: string) {
		tableStore.updateCell(row, col, { content });
	}

	function handleColumnResize(colIndex: number, width: number) {
		tableStore.setColumnWidth(colIndex, width);
	}

	function handleRowResize(rowIndex: number, height: number) {
		tableStore.setRowHeight(rowIndex, height);
	}

	async function handleExportPng() {
		if (tableElement) {
			await exportAndDownloadPng(tableElement, 'table.png', {
				pixelRatio: 2,
				backgroundColor: tableStore.canvasConfig.backgroundColor
			});
		}
	}

	async function handleExportSvg() {
		if (tableElement) {
			await exportAndDownloadSvg(tableElement, 'table.svg', {
				backgroundColor: tableStore.canvasConfig.backgroundColor
			});
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
</script>

<svelte:window onpaste={handleGlobalPaste} />

<input
	type="file"
	accept=".csv,.xlsx,.xls"
	class="hidden"
	bind:this={fileInput}
	onchange={handleFileChange}
/>

<div class="app-layout">
	<Toolbar
		preset={tableStore.tableStyle.preset}
		{canUndo}
		{canRedo}
		onImport={handleImportClick}
		onNewTable={handleNewTable}
		onUndo={handleUndo}
		onRedo={handleRedo}
		onPresetChange={handlePresetChange}
		onExportPng={handleExportPng}
		onExportSvg={handleExportSvg}
	/>

	<div class="main-content">
		<Sidebar
			tableStyle={tableStore.tableStyle}
			canvasConfig={tableStore.canvasConfig}
			onStyleChange={handleStyleChange}
			onCanvasChange={handleCanvasChange}
		/>

		<main class="canvas-area">
			<div class="canvas-container" bind:this={tableElement}>
				<AcademicTable
					tableData={tableStore.tableData}
					tableStyle={tableStore.tableStyle}
					canvasConfig={tableStore.canvasConfig}
					onCellUpdate={handleCellUpdate}
					onColumnResize={handleColumnResize}
					onRowResize={handleRowResize}
				/>
			</div>
		</main>
	</div>
</div>
