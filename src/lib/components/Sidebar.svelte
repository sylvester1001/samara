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

	const fontOptions = [
		{
			value: 'computer-modern',
			label: 'Computer Modern',
			fontFamily: '"CMU Serif", Georgia, serif',
			tag: 'LaTeX Serif',
			sample: 'Academic Specimen'
		},
		{
			value: 'times',
			label: 'Times New Roman',
			fontFamily: '"Times New Roman", Times, serif',
			tag: 'Classic Serif',
			sample: 'Academic Specimen'
		},
		{
			value: 'arial',
			label: 'Arial',
			fontFamily: 'Arial, Helvetica, sans-serif',
			tag: 'Clean Sans',
			sample: 'Academic Specimen'
		}
	];

	const canvasPresets = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'ppt', label: 'PPT 16:9 (1920 x 1080)' },
		{ value: 'a4', label: 'A4 (794 x 1123)' },
		{ value: 'custom', label: 'Custom' }
	];

	const borderOptions: { value: BorderStyle; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'thin', label: 'Light' },
		{ value: 'thick', label: 'Heavy' },
		{ value: 'double', label: 'Double' }
	];
	const topBorderOptions: { value: BorderStyle; label: string }[] = [
		...borderOptions,
		{ value: 'thick-thin', label: 'Heavy-Light' }
	];
	const bottomBorderOptions: { value: BorderStyle; label: string }[] = [
		...borderOptions,
		{ value: 'thin-thick', label: 'Light-Heavy' }
	];

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
		const allOptions = [...borderOptions, { value: 'thick-thin', label: 'Heavy-Light' }, { value: 'thin-thick', label: 'Light-Heavy' }];
		return allOptions.find((option) => option.value === value)?.label ?? value;
	}
</script>

{#snippet sectionWrapper(title: string, index: string, content: any)}
	{#if uiTheme.theme === 'avant-garde'}
		<div class="pt-3.5 pb-4.5 border-b border-border/60 last:border-b-0 select-none first:pt-0 px-1">
			<!-- 机能风胶囊标签 (Compact Pill Tag)：精准垂直居中（全大写等宽字体光学微调 top-[1px]） -->
			<div class="flex items-center mb-3">
				<div class="inline-flex items-center justify-center bg-[#0202f1] text-white h-[20px] px-2 rounded-[1px] shadow-xs">
					<span class="relative top-[1px] text-[10px] font-terminal font-bold tracking-[0.12em] leading-none uppercase flex items-center gap-1.5">
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
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">Preset</span>
			<PresetPicker value={tableStyle.preset} onValueChange={onPresetChange} />
		</div>

		<div class="h-px bg-border/50 my-1"></div>

		<!-- Typography & Size -->
		<div class="flex flex-col gap-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">Font</span>
			<Select.Root type="single" value={tableStyle.fontFamily} onValueChange={handleFontChange}>
				<Select.Trigger class="w-full h-8 text-sm bg-background border-border/80">
					<span
						class="text-sm truncate font-medium"
						style:font-family={fontOptions.find(o => o.value === tableStyle.fontFamily)?.fontFamily}
					>
						{fontOptions.find(o => o.value === tableStyle.fontFamily)?.label || 'Select font'}
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
				<span class="text-xs text-muted-foreground shrink-0 w-8 font-terminal text-[10px] uppercase tracking-wider">Size</span>
				<Slider
					class="flex-1"
					type="single"
					value={tableStyle.fontSize}
					min={8}
					max={16}
					step={1}
					onValueChange={handleFontSizeChange}
				/>
				<span class="text-xs text-muted-foreground shrink-0 w-8 text-right font-terminal text-[11px] font-semibold text-foreground">{tableStyle.fontSize}pt</span>
			</div>
		</div>

		<div class="h-px bg-border/50 my-1"></div>

		<!-- Cell Padding -->
		<div class="flex flex-col gap-1.5">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">Cell Padding</span>
			<ToggleGroup.Root variant="outline" type="single" value={typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'} onValueChange={(v) => v && handlePaddingChange(v)} class="w-full gap-1.5">
				<ToggleGroup.Item value="compact" aria-label="Compact" class="flex-1 h-8 text-[11px] font-terminal uppercase tracking-wider {uiTheme.theme === 'avant-garde' ? 'data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : 'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground'} bg-background">Compact</ToggleGroup.Item>
				<ToggleGroup.Item value="normal" aria-label="Normal" class="flex-1 h-8 text-[11px] font-terminal uppercase tracking-wider {uiTheme.theme === 'avant-garde' ? 'data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : 'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground'} bg-background">Normal</ToggleGroup.Item>
				<ToggleGroup.Item value="loose" aria-label="Loose" class="flex-1 h-8 text-[11px] font-terminal uppercase tracking-wider {uiTheme.theme === 'avant-garde' ? 'data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : 'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground'} bg-background">Loose</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>

		<div class="h-px bg-border/50 my-1"></div>

		<!-- Border Rules -->
		<div class="flex flex-col gap-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">Border Rules</span>
			<div class="grid grid-cols-2 gap-2.5">
				<div class="flex flex-col gap-1">
					<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">Top Rule</span>
					<Select.Root type="single" value={tableStyle.borders.top} onValueChange={(v) => handleBorderChange('top', v)}>
						<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.top)}</Select.Trigger>
						<Select.Content class="font-terminal text-xs">
							<Select.Group>
								{#each topBorderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">Bottom Rule</span>
					<Select.Root type="single" value={tableStyle.borders.bottom} onValueChange={(v) => handleBorderChange('bottom', v)}>
						<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.bottom)}</Select.Trigger>
						<Select.Content class="font-terminal text-xs">
							<Select.Group>
								{#each bottomBorderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1 col-span-2">
					<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">Header Separator</span>
					<Select.Root type="single" value={tableStyle.borders.headerBottom} onValueChange={(v) => handleBorderChange('headerBottom', v)}>
						<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.headerBottom)}</Select.Trigger>
						<Select.Content class="font-terminal text-xs">
							<Select.Group>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				{#if tableStyle.preset !== 'booktabs'}
					<div class="flex flex-col gap-1">
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">Vertical</span>
						<Select.Root type="single" value={tableStyle.borders.vertical} onValueChange={(v) => handleBorderChange('vertical', v)}>
							<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.vertical)}</Select.Trigger>
							<Select.Content class="font-terminal text-xs">
								<Select.Group>
									{#each borderOptions as option}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">Horizontal</span>
						<Select.Root type="single" value={tableStyle.borders.horizontal} onValueChange={(v) => handleBorderChange('horizontal', v)}>
							<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">{getBorderLabel(tableStyle.borders.horizontal)}</Select.Trigger>
							<Select.Content class="font-terminal text-xs">
								<Select.Group>
									{#each borderOptions as option}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				{/if}
			</div>
		</div>
	{/snippet}
	{@render sectionWrapper('Table Style', '01', tableStyleContent)}

	{#snippet structureContent()}
		<div class="flex flex-col gap-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">Resize Lock</span>
			<div class="grid grid-cols-2 gap-2.5">
				<div class="flex items-center justify-between border border-border/80 px-3 py-2 bg-background">
					<span class="text-xs font-terminal uppercase tracking-wider font-semibold">Column</span>
					<Switch checked={lockColumnResize} onCheckedChange={(v) => onLockColumnResizeChange?.(v)} />
				</div>
				<div class="flex items-center justify-between border border-border/80 px-3 py-2 bg-background">
					<span class="text-xs font-terminal uppercase tracking-wider font-semibold">Row</span>
					<Switch checked={lockRowResize} onCheckedChange={(v) => onLockRowResizeChange?.(v)} />
				</div>
			</div>
		</div>
	{/snippet}
	{@render sectionWrapper('Structure', '02', structureContent)}

	{#snippet canvasContent()}
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1.5">
				<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">Size Preset</span>
				<Select.Root type="single" value={canvasPreset} onValueChange={handleCanvasPresetChange}>
					<Select.Trigger class="w-full h-8 font-terminal text-xs bg-background border-border/80">
						{canvasPresets.find(o => o.value === canvasPreset)?.label || 'Auto'}
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
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">Width (px)</span>
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
						<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">Height (px)</span>
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
				<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold">Background Color</span>
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
	{@render sectionWrapper('Canvas', '03', canvasContent)}
</div>
