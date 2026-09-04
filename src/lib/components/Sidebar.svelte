<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import PresetPicker from '$lib/components/PresetPicker.svelte';
	import type { TableStyle, CanvasConfig, BorderStyle } from '$lib/types';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { isWindows } from '$lib/stores/platform.svelte.js';
	import { t } from '$lib/i18n';

	interface Props {
		tableStyle: TableStyle;
		canvasConfig: CanvasConfig;
		onStyleChange?: (style: Partial<TableStyle>) => void;
		onPresetChange?: (preset: TableStyle['preset']) => void;
		onCanvasChange?: (config: Partial<CanvasConfig>) => void;
		lockColumnResize?: boolean;
		lockRowResize?: boolean;
		onLockColumnResizeChange?: (locked: boolean) => void;
		onLockRowResizeChange?: (locked: boolean) => void;
	}

	let {
		tableStyle,
		canvasConfig,
		onStyleChange,
		onPresetChange,
		onCanvasChange,
		lockColumnResize = false,
		lockRowResize = false,
		onLockColumnResizeChange,
		onLockRowResizeChange
	}: Props = $props();

	const fontOptions = $derived([
		{
			value: 'computer-modern',
			label: 'Computer Modern',
			fontFamily: '"CMU Serif", var(--font-cjk), Georgia, serif',
			tag: t('sidebar.fontTagLatex'),
			sample: t('sidebar.fontSample')
		},
		{
			value: 'times',
			label: 'Times New Roman',
			fontFamily: '"Times New Roman", Times, var(--font-cjk), serif',
			tag: t('sidebar.fontTagClassic'),
			sample: t('sidebar.fontSample')
		},
		{
			value: 'arial',
			label: 'Arial',
			fontFamily: 'Arial, Helvetica, var(--font-cjk), sans-serif',
			tag: t('sidebar.fontTagSans'),
			sample: t('sidebar.fontSample')
		}
	]);

	const canvasPresets = $derived([
		{ value: 'auto', label: t('sidebar.canvasAuto') },
		{ value: 'ppt', label: t('sidebar.canvasPpt') },
		{ value: 'a4', label: t('sidebar.canvasA4') },
		{ value: 'custom', label: t('sidebar.canvasCustom') }
	]);

	const borderOptions = $derived([
		{ value: 'none' as BorderStyle, label: t('sidebar.borderNone') },
		{ value: 'thin' as BorderStyle, label: t('sidebar.borderLight') },
		{ value: 'thick' as BorderStyle, label: t('sidebar.borderHeavy') },
		{ value: 'double' as BorderStyle, label: t('sidebar.borderDouble') }
	]);
	const topBorderOptions = $derived([
		...borderOptions,
		{ value: 'thick-thin' as BorderStyle, label: t('sidebar.borderHeavyLight') }
	]);
	const bottomBorderOptions = $derived([
		...borderOptions,
		{ value: 'thin-thick' as BorderStyle, label: t('sidebar.borderLightHeavy') }
	]);

	let canvasPreset = $state('auto');
	let customWidth = $state(800);
	let customHeight = $state(600);

	// Initialize custom dimensions from canvasConfig
	$effect(() => {
		if (typeof canvasConfig.width === 'number') {
			customWidth = canvasConfig.width;
		}
		if (typeof canvasConfig.height === 'number') {
			customHeight = canvasConfig.height;
		}
	});

	const presetSizes: Record<string, { width: number; height: number }> = {
		ppt: { width: 1920, height: 1080 },
		a4: { width: 794, height: 1123 }
	};

	function handleFontChange(value: string | undefined) {
		if (value) {
			onStyleChange?.({ fontFamily: value as TableStyle['fontFamily'] });
		}
	}

	function handlePaddingChange(value: string | undefined) {
		if (value) {
			onStyleChange?.({ padding: value as 'compact' | 'normal' | 'loose' });
		}
	}

	function handleFontSizeChange(value: number) {
		onStyleChange?.({ fontSize: value });
	}

	function inferPreset(config: CanvasConfig) {
		if (config.width === 'auto' && config.height === 'auto') return 'auto';
		if (config.width === presetSizes.ppt.width && config.height === presetSizes.ppt.height) return 'ppt';
		if (config.width === presetSizes.a4.width && config.height === presetSizes.a4.height) return 'a4';
		return 'custom';
	}

	$effect(() => {
		canvasPreset = inferPreset(canvasConfig);
	});

	function handleCanvasPresetChange(value: string | undefined) {
		if (!value) return;
		canvasPreset = value;
		if (value === 'auto') {
			onCanvasChange?.({ width: 'auto', height: 'auto' });
			return;
		}
		if (value === 'custom') {
			onCanvasChange?.({ width: customWidth, height: customHeight });
			return;
		}
		const preset = presetSizes[value];
		if (preset) {
			onCanvasChange?.({ width: preset.width, height: preset.height });
		}
	}

	function handleCustomWidthChange(e: Event) {
		const target = e.target as HTMLInputElement;
		customWidth = parseInt(target.value) || 800;
		if (canvasPreset === 'custom') {
			onCanvasChange?.({ width: customWidth });
		}
	}

	function handleCustomHeightChange(e: Event) {
		const target = e.target as HTMLInputElement;
		customHeight = parseInt(target.value) || 600;
		if (canvasPreset === 'custom') {
			onCanvasChange?.({ height: customHeight });
		}
	}

	function handleBgColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onCanvasChange?.({ backgroundColor: target.value });
	}

	function handleBorderChange(key: keyof TableStyle['borders'], value: string | undefined) {
		if (!value) return;
		onStyleChange?.({
			borders: { ...tableStyle.borders, [key]: value as BorderStyle }
		});
	}

	function getBorderLabel(value: BorderStyle) {
		const allOptions = [
			...borderOptions,
			{ value: 'thick-thin' as BorderStyle, label: t('sidebar.borderHeavyLight') },
			{ value: 'thin-thick' as BorderStyle, label: t('sidebar.borderLightHeavy') }
		];
		return allOptions.find((option) => option.value === value)?.label ?? value;
	}
</script>

{#snippet sectionWrapper(title: string, index: string, content: any)}
	{#if uiTheme.theme === 'avant-garde'}
		<div class="pt-3.5 pb-4.5 border-b border-border/60 last:border-b-0 select-none first:pt-0 px-1">
			<!-- 机能风胶囊标签 (Compact Pill Tag)：精准垂直居中（跨平台光学对齐，Mac 无需额外下移 1px） -->
			<div class="flex items-center mb-3">
				<div class="inline-flex items-center justify-center bg-[#0202f1] text-white h-[20px] px-2 rounded-[1px] shadow-xs">
					<span class="{isWindows ? 'relative top-[1px]' : ''} text-[10px] font-terminal font-bold tracking-[0.12em] leading-none uppercase flex items-center gap-1.5">
						<span class="opacity-80 font-normal">{index} //</span>
						<span>{title}</span>
					</span>
				</div>
			</div>
			<div class="flex flex-col gap-3">
				{@render content()}
			</div>
		</div>
	{:else}
		<Sidebar.Group class="rounded-lg border border-sidebar-border bg-background">
			<Sidebar.GroupLabel class="text-sm text-sidebar-foreground">{title}</Sidebar.GroupLabel>
			<Sidebar.GroupContent class="flex flex-col gap-5 px-2 pb-3">
				{@render content()}
			</Sidebar.GroupContent>
		</Sidebar.Group>
	{/if}
{/snippet}

<div class="flex flex-col {uiTheme.theme === 'avant-garde' ? 'gap-0' : 'gap-3'}">
	{#snippet tableStyleContent()}
		<!-- Preset -->
		<div class="flex flex-col gap-1.5">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">{t('sidebar.preset')}</span>
			<PresetPicker value={tableStyle.preset} onValueChange={onPresetChange} />
		</div>

		<div class="h-px bg-border/50 my-1"></div>

		<!-- Typography & Size -->
		<div class="flex flex-col gap-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">{t('sidebar.font')}</span>
			<Select.Root type="single" value={tableStyle.fontFamily} onValueChange={handleFontChange}>
				<Select.Trigger class="w-full h-8 text-sm bg-background border-border/80">
					<span
						class="text-sm truncate font-medium"
						style:font-family={fontOptions.find(o => o.value === tableStyle.fontFamily)?.fontFamily}
					>
						{fontOptions.find(o => o.value === tableStyle.fontFamily)?.label || t('sidebar.selectFont')}
					</span>
				</Select.Trigger>
				<Select.Content side="bottom" align="start" sideOffset={4} class="w-[280px]">
					<Select.Group>
						{#each fontOptions as option}
							<Select.Item value={option.value} label={option.label} class="py-2 px-2.5">
								<div class="flex flex-col gap-0.5 w-full pr-4">
									<div class="flex items-center justify-between">
										<span
											class="text-sm font-semibold text-foreground tracking-normal"
											style:font-family={option.fontFamily}
										>
											{option.label}
										</span>
										<span class="text-[9px] font-terminal text-muted-foreground uppercase tracking-wider opacity-70">
											{option.tag}
										</span>
									</div>
									<span
										class="text-xs text-muted-foreground/90 tracking-normal"
										style:font-family={option.fontFamily}
									>
										Aa Bb Gg 123 — {option.sample}
									</span>
								</div>
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
			<div class="flex items-center gap-3 pt-1">
				<span class="text-xs text-muted-foreground shrink-0 w-8 font-terminal text-[10px] uppercase tracking-wider">{t('sidebar.size')}</span>
				<div class="relative flex-1 flex items-center py-1">
					<!-- 12pt Center Benchmark Notch (工业标定刻度线) -->
					<button
						type="button"
						class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-5 flex flex-col items-center justify-between pointer-events-auto cursor-pointer z-0 group"
						onclick={() => handleFontSizeChange?.(12)}
						title={t('sidebar.fontSizeDefault')}
					>
						<span class="w-[1.5px] h-[3.5px] rounded-[1px] bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary transition-colors"></span>
						<span class="w-[1.5px] h-[3.5px] rounded-[1px] bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary transition-colors"></span>
					</button>
					<Slider
						class="w-full relative z-[1]"
						type="single"
						value={tableStyle.fontSize}
						min={8}
						max={16}
						step={1}
						onValueChange={handleFontSizeChange}
					/>
				</div>
				<button
					type="button"
					class="text-xs text-muted-foreground shrink-0 w-8 text-right font-terminal text-[11px] font-semibold transition-colors {tableStyle.fontSize === 12 ? 'text-foreground' : 'text-primary hover:underline cursor-pointer'}"
					onclick={() => handleFontSizeChange?.(12)}
					title={tableStyle.fontSize === 12 ? t('sidebar.fontSizeDefaultShort') : t('sidebar.fontSizeReset')}
				>
					{tableStyle.fontSize}pt
				</button>
			</div>
		</div>

		<div class="h-px bg-border/50 my-1"></div>

		<!-- Cell Padding -->
		<div class="flex flex-col gap-1.5">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">{t('sidebar.cellPadding')}</span>
			<ToggleGroup.Root variant="outline" type="single" value={typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'} onValueChange={(v) => v && handlePaddingChange(v)} class="w-full gap-1.5">
				<ToggleGroup.Item value="compact" aria-label={t('sidebar.compact')} class="flex-1 h-8 text-[11px] font-terminal uppercase tracking-wider {uiTheme.theme === 'avant-garde' ? 'data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : 'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground'} bg-background">{t('sidebar.compact')}</ToggleGroup.Item>
				<ToggleGroup.Item value="normal" aria-label={t('sidebar.normal')} class="flex-1 h-8 text-[11px] font-terminal uppercase tracking-wider {uiTheme.theme === 'avant-garde' ? 'data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : 'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground'} bg-background">{t('sidebar.normal')}</ToggleGroup.Item>
				<ToggleGroup.Item value="loose" aria-label={t('sidebar.loose')} class="flex-1 h-8 text-[11px] font-terminal uppercase tracking-wider {uiTheme.theme === 'avant-garde' ? 'data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : 'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground'} bg-background">{t('sidebar.loose')}</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>

		<div class="h-px bg-border/50 my-1"></div>

		<!-- Border Rules -->
		<div class="flex flex-col gap-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">{t('sidebar.borderRules')}</span>
			{#snippet borderItem(option: { value: BorderStyle; label: string })}
				<Select.Item value={option.value} label={option.label} class="flex items-center justify-between gap-3 w-full text-xs font-terminal cursor-pointer">
					<span class="truncate font-medium">{option.label}</span>
					<div class="w-8 mr-2.5 flex items-center justify-center shrink-0">
						{#if option.value === 'none'}
							<span class="text-[9px] text-muted-foreground/50 tracking-wider">{t('sidebar.borderNonePreview')}</span>
						{:else if option.value === 'thin'}
							<div class="w-full h-[1px] bg-foreground/75"></div>
						{:else if option.value === 'thick'}
							<div class="w-full h-[2.5px] bg-foreground"></div>
						{:else if option.value === 'double'}
							<div class="w-full flex flex-col gap-[1.5px]">
								<div class="w-full h-[1px] bg-foreground/85"></div>
								<div class="w-full h-[1px] bg-foreground/85"></div>
							</div>
						{:else if option.value === 'thick-thin'}
							<div class="w-full flex flex-col gap-[1.5px]">
								<div class="w-full h-[2px] bg-foreground"></div>
								<div class="w-full h-[1px] bg-foreground/75"></div>
							</div>
						{:else if option.value === 'thin-thick'}
							<div class="w-full flex flex-col gap-[1.5px]">
								<div class="w-full h-[1px] bg-foreground/75"></div>
								<div class="w-full h-[2px] bg-foreground"></div>
							</div>
						{/if}
					</div>
				</Select.Item>
			{/snippet}

			<div class="grid grid-cols-2 gap-2.5">
				<div class="flex flex-col gap-1">
					<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">{t('sidebar.topRule')}</span>
					<Select.Root type="single" value={tableStyle.borders.top} onValueChange={(v) => handleBorderChange('top', v)}>
						<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.top)}</Select.Trigger>
						<Select.Content class="font-terminal text-xs min-w-[155px]">
							<Select.Group>
								{#each topBorderOptions as option}
									{@render borderItem(option)}
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">{t('sidebar.bottomRule')}</span>
					<Select.Root type="single" value={tableStyle.borders.bottom} onValueChange={(v) => handleBorderChange('bottom', v)}>
						<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.bottom)}</Select.Trigger>
						<Select.Content class="font-terminal text-xs min-w-[155px]">
							<Select.Group>
								{#each bottomBorderOptions as option}
									{@render borderItem(option)}
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1 col-span-2">
					<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">{t('sidebar.headerSeparator')}</span>
					<Select.Root type="single" value={tableStyle.borders.headerBottom} onValueChange={(v) => handleBorderChange('headerBottom', v)}>
						<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.headerBottom)}</Select.Trigger>
						<Select.Content class="font-terminal text-xs min-w-[155px]">
							<Select.Group>
								{#each borderOptions as option}
									{@render borderItem(option)}
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				{#if tableStyle.preset !== 'booktabs'}
					<div class="flex flex-col gap-1">
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">{t('sidebar.vertical')}</span>
						<Select.Root type="single" value={tableStyle.borders.vertical} onValueChange={(v) => handleBorderChange('vertical', v)}>
							<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.vertical)}</Select.Trigger>
							<Select.Content class="font-terminal text-xs min-w-[155px]">
								<Select.Group>
									{#each borderOptions as option}
										{@render borderItem(option)}
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">{t('sidebar.horizontal')}</span>
						<Select.Root type="single" value={tableStyle.borders.horizontal} onValueChange={(v) => handleBorderChange('horizontal', v)}>
							<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.horizontal)}</Select.Trigger>
							<Select.Content class="font-terminal text-xs min-w-[155px]">
								<Select.Group>
									{#each borderOptions as option}
										{@render borderItem(option)}
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				{/if}
			</div>
		</div>
	{/snippet}
	{@render sectionWrapper(t('sidebar.tableStyle'), '01', tableStyleContent)}

	{#snippet structureContent()}
		<div class="flex flex-col gap-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">{t('sidebar.resizeLock')}</span>
			<div class="grid grid-cols-2 gap-2.5">
				<div class="flex items-center justify-between border border-border/80 px-3 py-2 bg-background">
					<span class="text-xs font-terminal uppercase tracking-wider font-semibold">{t('sidebar.column')}</span>
					<Switch checked={lockColumnResize} onCheckedChange={(v) => onLockColumnResizeChange?.(v)} />
				</div>
				<div class="flex items-center justify-between border border-border/80 px-3 py-2 bg-background">
					<span class="text-xs font-terminal uppercase tracking-wider font-semibold">{t('sidebar.row')}</span>
					<Switch checked={lockRowResize} onCheckedChange={(v) => onLockRowResizeChange?.(v)} />
				</div>
			</div>
		</div>
	{/snippet}
	{@render sectionWrapper(t('sidebar.structure'), '02', structureContent)}

	{#snippet canvasContent()}
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1.5">
				<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">{t('sidebar.sizePreset')}</span>
				<Select.Root type="single" value={canvasPreset} onValueChange={handleCanvasPresetChange}>
					<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">
						{canvasPresets.find(o => o.value === canvasPreset)?.label || t('sidebar.canvasAuto')}
					</Select.Trigger>
					<Select.Content class="font-terminal text-xs">
						<Select.Group>
							{#each canvasPresets as option}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>

			{#if canvasPreset === 'custom'}
				<div class="grid grid-cols-2 gap-2.5">
					<div class="flex flex-col gap-1">
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">{t('sidebar.widthPx')}</span>
						<Input
							type="number"
							class="h-8 font-terminal text-xs bg-background border-border/80"
							value={customWidth}
							onchange={handleCustomWidthChange}
							min={200}
							max={4000}
						/>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">{t('sidebar.heightPx')}</span>
						<Input
							type="number"
							class="h-8 font-terminal text-xs bg-background border-border/80"
							value={customHeight}
							onchange={handleCustomHeightChange}
							min={200}
							max={4000}
						/>
					</div>
				</div>
			{/if}

			<div class="flex items-center justify-between pt-2 border-t border-border/40">
				<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">{t('sidebar.backgroundColor')}</span>
				<div class="flex items-center gap-2">
					<input
						type="color"
						class="w-7 h-7 border border-border cursor-pointer p-0.5 bg-background shrink-0 rounded-[1px]"
						value={canvasConfig.backgroundColor}
						onchange={handleBgColorChange}
					/>
					<span class="text-xs font-terminal text-muted-foreground uppercase">{canvasConfig.backgroundColor}</span>
				</div>
			</div>
		</div>
	{/snippet}
	{@render sectionWrapper(t('sidebar.canvas'), '03', canvasContent)}
</div>
