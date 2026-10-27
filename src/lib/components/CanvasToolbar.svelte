<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import AppTooltip from '$lib/components/AppTooltip.svelte';
	import type { CanvasConfig } from '$lib/types';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { t } from '$lib/i18n';
	import { ChevronDown, RotateCcw } from 'lucide-svelte';

	interface Props {
		canvasConfig: CanvasConfig;
		onCanvasChange?: (config: Partial<CanvasConfig>) => void;
		actualWidth?: number;
		actualHeight?: number;
	}

	let {
		canvasConfig,
		onCanvasChange,
		actualWidth = 0,
		actualHeight = 0
	}: Props = $props();

	let popoverOpen = $state(false);

	const presetSizes = {
		ppt: { width: 1920, height: 1080 },
		a4: { width: 794, height: 1123 }
	} as const;

	function inferPreset(config: CanvasConfig): 'auto' | 'ppt' | 'a4' | 'custom' {
		if (config.width === 'auto' && config.height === 'auto') return 'auto';
		if (config.width === presetSizes.ppt.width && config.height === presetSizes.ppt.height) return 'ppt';
		if (config.width === presetSizes.a4.width && config.height === presetSizes.a4.height) return 'a4';
		return 'custom';
	}

	const currentPreset = $derived(inferPreset(canvasConfig));
	const isAuto = $derived(currentPreset === 'auto');

	let customWidth = $state(800);
	let customHeight = $state(600);

	$effect(() => {
		if (typeof canvasConfig.width === 'number') {
			customWidth = canvasConfig.width;
		} else if (actualWidth > 0) {
			customWidth = actualWidth;
		}
		if (typeof canvasConfig.height === 'number') {
			customHeight = canvasConfig.height;
		} else if (actualHeight > 0) {
			customHeight = actualHeight;
		}
	});

	const displayLabel = $derived.by(() => {
		if (currentPreset === 'auto') {
			return t('preview.canvasAuto');
		}
		if (currentPreset === 'ppt') {
			return t('preview.canvasPpt');
		}
		if (currentPreset === 'a4') {
			return t('preview.canvasA4');
		}
		const w = typeof canvasConfig.width === 'number' ? canvasConfig.width : actualWidth || customWidth;
		const h = typeof canvasConfig.height === 'number' ? canvasConfig.height : actualHeight || customHeight;
		return `${t('sidebar.canvas')}: ${w} × ${h}`;
	});

	function handleSelectPreset(preset: 'auto' | 'ppt' | 'a4' | 'custom') {
		if (preset === 'auto') {
			onCanvasChange?.({ width: 'auto', height: 'auto' });
			popoverOpen = false;
			return;
		}
		if (preset === 'ppt') {
			onCanvasChange?.({ width: presetSizes.ppt.width, height: presetSizes.ppt.height });
			popoverOpen = false;
			return;
		}
		if (preset === 'a4') {
			onCanvasChange?.({ width: presetSizes.a4.width, height: presetSizes.a4.height });
			popoverOpen = false;
			return;
		}
		if (preset === 'custom') {
			const w = typeof canvasConfig.width === 'number' ? canvasConfig.width : (actualWidth || customWidth || 800);
			const h = typeof canvasConfig.height === 'number' ? canvasConfig.height : (actualHeight || customHeight || 600);
			customWidth = w;
			customHeight = h;
			onCanvasChange?.({ width: w, height: h });
		}
	}

	function handleResetToAuto() {
		onCanvasChange?.({ width: 'auto', height: 'auto' });
	}

	function handleCustomWidthChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value, 10);
		if (Number.isFinite(val) && val > 0) {
			customWidth = val;
			onCanvasChange?.({ width: val });
		}
	}

	function handleCustomHeightChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value, 10);
		if (Number.isFinite(val) && val > 0) {
			customHeight = val;
			onCanvasChange?.({ height: val });
		}
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement)?.blur();
			popoverOpen = false;
		}
	}
</script>

<!-- 画布控制器仪表（Canvas Controller Toolbar） -->
<div
	class="inline-flex items-center h-7 bg-background/95 backdrop-blur-xs border border-border select-none shadow-2xs overflow-hidden {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : 'rounded-[var(--radius)]'}"
>
	<!-- 画布状态与下拉触发按键 -->
	<Popover.Root bind:open={popoverOpen}>
		<Popover.Trigger>
			{#snippet child({ props: popoverProps })}
				<AppTooltip text={t('preview.canvasController')} childProps={popoverProps}>
					{#snippet children({ props })}
						<button
							{...props}
							type="button"
							class="h-full px-2.5 inline-flex items-center gap-1.5 border-r border-border cursor-pointer transition-colors text-foreground select-none {popoverOpen ? (uiTheme.theme === 'avant-garde' ? 'bg-[#0202f1] text-white' : 'bg-accent text-accent-foreground') : (uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white active:bg-[#0000d0]' : 'hover:bg-muted')}"
							aria-label={t('preview.canvasController')}
						>
							<span
								class="tabular-nums text-[11px] font-semibold tracking-wider whitespace-nowrap {uiTheme.theme === 'avant-garde' ? 'font-terminal' : 'font-sans'}"
							>
								{displayLabel}
							</span>
							<ChevronDown
								class="w-3 h-3 stroke-[2.2] shrink-0 opacity-60 transition-transform duration-200 {popoverOpen ? 'rotate-180' : ''}"
							/>
						</button>
					{/snippet}
				</AppTooltip>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content
			align="center"
			sideOffset={6}
			class="w-72 p-3 select-none bg-background/98 backdrop-blur-md border border-border shadow-lg z-50 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : 'font-sans text-xs'}"
		>
			<!-- 标题与当前实际尺寸 -->
			<div class="flex items-center justify-between pb-2 mb-2.5 border-b border-border/60">
				<span class="text-[11px] font-semibold uppercase tracking-wider text-foreground">{t('sidebar.canvas')}</span>
				{#if actualWidth > 0 && actualHeight > 0}
					<span
						class="text-[10px] tabular-nums text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-[2px] {uiTheme.theme === 'avant-garde' ? 'font-terminal' : 'font-sans'}"
					>
						{actualWidth} × {actualHeight} px
					</span>
				{/if}
			</div>

			<!-- 预设网格 (2x2) -->
			<div class="flex flex-col gap-1 mb-2">
				<span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'font-terminal' : 'font-sans'}">
					{t('preview.canvasPresetHeading')}
				</span>
				<div class="grid grid-cols-2 gap-1.5 pt-0.5">
					<!-- 自动 -->
					<button
						type="button"
						class="flex flex-col items-start p-2 text-left border cursor-pointer transition-all relative {currentPreset === 'auto'
							? (uiTheme.theme === 'avant-garde'
								? 'border-[#0202f1] bg-[#0202f1]/10 text-foreground font-semibold shadow-xs ring-1 ring-[#0202f1]'
								: 'border-primary bg-primary/10 text-foreground font-medium ring-1 ring-primary')
							: 'border-border/80 hover:border-foreground/30 hover:bg-muted/40 text-foreground'
						} {uiTheme.theme === 'avant-garde' ? '' : 'rounded-md'}"
						onclick={() => handleSelectPreset('auto')}
					>
						<div class="flex items-center justify-between w-full">
							<span class="text-xs font-semibold leading-tight">{t('sidebar.canvasAuto')}</span>
							{#if currentPreset === 'auto'}
								<span class="size-1.5 rounded-full {uiTheme.theme === 'avant-garde' ? 'bg-[#0202f1]' : 'bg-primary'}"></span>
							{/if}
						</div>
						<span class="text-[10px] text-muted-foreground leading-tight mt-1">{t('preview.canvasAutoDesc')}</span>
					</button>

					<!-- PPT 16:9 -->
					<button
						type="button"
						class="flex flex-col items-start p-2 text-left border cursor-pointer transition-all relative {currentPreset === 'ppt'
							? (uiTheme.theme === 'avant-garde'
								? 'border-[#0202f1] bg-[#0202f1]/10 text-foreground font-semibold shadow-xs ring-1 ring-[#0202f1]'
								: 'border-primary bg-primary/10 text-foreground font-medium ring-1 ring-primary')
							: 'border-border/80 hover:border-foreground/30 hover:bg-muted/40 text-foreground'
						} {uiTheme.theme === 'avant-garde' ? '' : 'rounded-md'}"
						onclick={() => handleSelectPreset('ppt')}
					>
						<div class="flex items-center justify-between w-full">
							<span class="text-xs font-semibold leading-tight">{t('preview.canvasPpt')}</span>
							{#if currentPreset === 'ppt'}
								<span class="size-1.5 rounded-full {uiTheme.theme === 'avant-garde' ? 'bg-[#0202f1]' : 'bg-primary'}"></span>
							{/if}
						</div>
						<span class="text-[10px] text-muted-foreground leading-tight mt-1">{t('preview.canvasPptDesc')}</span>
					</button>

					<!-- A4 纸张 -->
					<button
						type="button"
						class="flex flex-col items-start p-2 text-left border cursor-pointer transition-all relative {currentPreset === 'a4'
							? (uiTheme.theme === 'avant-garde'
								? 'border-[#0202f1] bg-[#0202f1]/10 text-foreground font-semibold shadow-xs ring-1 ring-[#0202f1]'
								: 'border-primary bg-primary/10 text-foreground font-medium ring-1 ring-primary')
							: 'border-border/80 hover:border-foreground/30 hover:bg-muted/40 text-foreground'
						} {uiTheme.theme === 'avant-garde' ? '' : 'rounded-md'}"
						onclick={() => handleSelectPreset('a4')}
					>
						<div class="flex items-center justify-between w-full">
							<span class="text-xs font-semibold leading-tight">{t('preview.canvasA4')}</span>
							{#if currentPreset === 'a4'}
								<span class="size-1.5 rounded-full {uiTheme.theme === 'avant-garde' ? 'bg-[#0202f1]' : 'bg-primary'}"></span>
							{/if}
						</div>
						<span class="text-[10px] text-muted-foreground leading-tight mt-1">{t('preview.canvasA4Desc')}</span>
					</button>

					<!-- 自定义 -->
					<button
						type="button"
						class="flex flex-col items-start p-2 text-left border cursor-pointer transition-all relative {currentPreset === 'custom'
							? (uiTheme.theme === 'avant-garde'
								? 'border-[#0202f1] bg-[#0202f1]/10 text-foreground font-semibold shadow-xs ring-1 ring-[#0202f1]'
								: 'border-primary bg-primary/10 text-foreground font-medium ring-1 ring-primary')
							: 'border-border/80 hover:border-foreground/30 hover:bg-muted/40 text-foreground'
						} {uiTheme.theme === 'avant-garde' ? '' : 'rounded-md'}"
						onclick={() => handleSelectPreset('custom')}
					>
						<div class="flex items-center justify-between w-full">
							<span class="text-xs font-semibold leading-tight">{t('sidebar.canvasCustom')}</span>
							{#if currentPreset === 'custom'}
								<span class="size-1.5 rounded-full {uiTheme.theme === 'avant-garde' ? 'bg-[#0202f1]' : 'bg-primary'}"></span>
							{/if}
						</div>
						<span class="text-[10px] text-muted-foreground leading-tight mt-1">{t('preview.canvasCustomDesc')}</span>
					</button>
				</div>
			</div>

			<!-- 自定义数值微调 -->
			<div class="pt-2 border-t border-border/60 flex flex-col gap-1.5">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'font-terminal' : 'font-sans'}">
						{t('preview.canvasCustomHeading')}
					</span>
					{#if currentPreset === 'custom'}
						<span class="text-[9px] uppercase px-1 py-0.2 text-[#0202f1] dark:text-blue-400 bg-[#0202f1]/10 rounded-[1px] font-semibold">
							ACTIVE
						</span>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div
						class="flex items-center border border-border bg-background px-2 h-7 focus-within:ring-1 focus-within:ring-[#0202f1] {uiTheme.theme === 'avant-garde' ? '' : 'rounded-md'}"
					>
						<span class="text-[10px] font-semibold text-muted-foreground mr-1.5 select-none">W</span>
						<input
							type="number"
							min="100"
							max="5000"
							step="10"
							class="w-full bg-transparent text-xs tabular-nums text-foreground focus:outline-none {uiTheme.theme === 'avant-garde' ? 'font-terminal' : 'font-sans'}"
							value={customWidth}
							oninput={handleCustomWidthChange}
							onkeydown={handleInputKeydown}
						/>
						<span class="text-[9px] text-muted-foreground select-none">px</span>
					</div>
					<div
						class="flex items-center border border-border bg-background px-2 h-7 focus-within:ring-1 focus-within:ring-[#0202f1] {uiTheme.theme === 'avant-garde' ? '' : 'rounded-md'}"
					>
						<span class="text-[10px] font-semibold text-muted-foreground mr-1.5 select-none">H</span>
						<input
							type="number"
							min="100"
							max="5000"
							step="10"
							class="w-full bg-transparent text-xs tabular-nums text-foreground focus:outline-none {uiTheme.theme === 'avant-garde' ? 'font-terminal' : 'font-sans'}"
							value={customHeight}
							oninput={handleCustomHeightChange}
							onkeydown={handleInputKeydown}
						/>
						<span class="text-[9px] text-muted-foreground select-none">px</span>
					</div>
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>

	<!-- 一键贴合复位按键 [⟲] -->
	<AppTooltip text={t('preview.canvasFitTooltip')} onclick={handleResetToAuto}>
		{#snippet children({ props })}
			<button
				type="button"
				class="w-7 h-full inline-flex items-center justify-center cursor-pointer transition-colors text-foreground {isAuto ? 'opacity-35 pointer-events-none' : ''} {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white active:bg-[#0000d0]' : 'hover:bg-muted'}"
				disabled={isAuto}
				{...props}
				onclick={handleResetToAuto}
				aria-label={t('preview.canvasFitTooltip')}
			>
				<RotateCcw class="w-3 h-3 stroke-[2.2]" />
			</button>
		{/snippet}
	</AppTooltip>
</div>
