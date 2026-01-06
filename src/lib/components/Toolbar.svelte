<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ArrowRightFromLine, Undo2, Redo2, FilePlus, Download } from 'lucide-svelte';
	import type { TableStyle } from '$lib/types';

	interface Props {
		onImport?: () => void;
		onNewTable?: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
		onExportPng?: () => void;
		onExportSvg?: () => void;
		preset: TableStyle['preset'];
		onPresetChange?: (preset: TableStyle['preset']) => void;
		canUndo?: boolean;
		canRedo?: boolean;
		dpi?: number;
		onDpiChange?: (dpi: number) => void;
	}

	let {
		onImport,
		onNewTable,
		onUndo,
		onRedo,
		onExportPng,
		onExportSvg,
		preset,
		onPresetChange,
		canUndo = false,
		canRedo = false,
		dpi = 300,
		onDpiChange
	}: Props = $props();

	const presetOptions = [
		{ value: 'booktabs', label: 'Three-line Table' },
		{ value: 'bordered', label: 'Bordered' },
		{ value: 'minimal', label: 'Minimal' }
	];

	const dpiOptions = [
		{ value: 96, label: '96 DPI' },
		{ value: 150, label: '150 DPI' },
		{ value: 300, label: '300 DPI' },
		{ value: 600, label: '600 DPI' }
	];

	let exportFormat = $state<'png' | 'svg'>('png');
	let exportPopoverOpen = $state(false);
	let exportPending = $state(false);
	let exportFallbackTimer: ReturnType<typeof setTimeout> | null = null;

	function handlePresetChange(value: string | undefined) {
		if (value) {
			onPresetChange?.(value as TableStyle['preset']);
		}
	}

	function handleDpiChange(value: string | undefined) {
		if (!value) return;
		const parsed = parseInt(value);
		if (!Number.isNaN(parsed)) {
			onDpiChange?.(parsed);
		}
	}

	function runExport() {
		if (exportFormat === 'png') {
			onExportPng?.();
		} else {
			onExportSvg?.();
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
		if (!target || target.getAttribute('data-state') !== 'closed') return;
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
</script>

<div class="flex items-center h-16 px-4 py-2 border-b border-border bg-white dark:bg-[#09090b] dark:border-[#27272a] gap-4 overflow-hidden w-full box-border">
	<div class="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
		<div class="flex items-center gap-2 min-w-0">
			<Button variant="outline" size="sm" onclick={onImport}>
				<Download class="shrink-0 w-4 h-4" />
				<span class="hidden min-[1200px]:inline whitespace-nowrap">Import</span>
			</Button>
			<Button variant="outline" size="sm" onclick={onNewTable}>
				<FilePlus class="shrink-0 w-4 h-4" />
				<span class="hidden min-[1200px]:inline whitespace-nowrap">New</span>
			</Button>
			<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-1"></div>
			<Button variant="ghost" size="icon" onclick={onUndo} disabled={!canUndo}>
				<Undo2 class="w-4 h-4" />
			</Button>
			<Button variant="ghost" size="icon" onclick={onRedo} disabled={!canRedo}>
				<Redo2 class="w-4 h-4" />
			</Button>
		</div>

		<div class="flex items-center gap-2 min-w-0 flex-[0_0_200px] min-w-[200px]">
			<Select.Root type="single" value={preset} onValueChange={handlePresetChange}>
				<Select.Trigger class="w-full min-w-0">
					<span class="whitespace-nowrap overflow-visible">
						{presetOptions.find(o => o.value === preset)?.label || 'Select style'}
					</span>
				</Select.Trigger>
				<Select.Content>
					{#each presetOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<div class="flex items-center gap-2 shrink-0">
		<Popover.Root bind:open={exportPopoverOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button size="sm" {...props}>
						<ArrowRightFromLine class="shrink-0 w-4 h-4" />
						<span class="hidden min-[1200px]:inline whitespace-nowrap">Export</span>
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content align="end" class="w-64" on:animationend={handleExportPopoverAnimationEnd}>
				<div class="grid gap-4">
					<div class="grid gap-3">
						<div class="grid grid-cols-3 items-center gap-4">
							<Label>Format</Label>
							<div class="col-span-2 flex gap-1">
								<Button 
									size="sm" 
									variant={exportFormat === 'png' ? 'default' : 'outline'}
									onclick={() => exportFormat = 'png'}
									class="flex-1 h-8"
								>
									PNG
								</Button>
								<Button 
									size="sm" 
									variant={exportFormat === 'svg' ? 'default' : 'outline'}
									onclick={() => exportFormat = 'svg'}
									class="flex-1 h-8"
								>
									SVG
								</Button>
							</div>
						</div>
						{#if exportFormat === 'png'}
							<div class="grid grid-cols-3 items-center gap-4">
								<Label>DPI</Label>
								<Select.Root type="single" value={String(dpi)} onValueChange={handleDpiChange}>
									<Select.Trigger class="col-span-2 h-8">
										{dpiOptions.find(o => o.value === dpi)?.label || 'Select DPI'}
									</Select.Trigger>
									<Select.Content>
										{#each dpiOptions as option}
											<Select.Item value={String(option.value)}>{option.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{/if}
					</div>
					<div class="flex justify-end">
						<Button size="sm" onclick={handleExport}>Export</Button>
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
