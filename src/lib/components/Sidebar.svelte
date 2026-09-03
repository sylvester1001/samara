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

{#snippet sectionWrapper(title: string, tag: string | null, index: string, content: any)}
	{#if uiTheme.theme === 'avant-garde'}
		<div class="pt-3 pb-4 border-b border-border/70 last:border-b-0 select-none">
			<div class="flex items-center justify-between mb-3 px-1">
				<div class="flex items-center gap-2">
					<span class="text-[10px] font-terminal font-bold text-[#0202f1] tracking-wider">{index} //</span>
					<span class="text-[11px] font-terminal font-bold uppercase tracking-[0.16em] text-foreground">{title}</span>
				</div>
				{#if tag}
					<span class="text-[9px] font-terminal font-bold text-muted-foreground/80 tracking-widest">{tag}</span>
				{/if}
			</div>
			<div class="flex flex-col gap-4 px-1">
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
		<div class="flex flex-col gap-2">
			<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Preset</Label>
			<PresetPicker value={tableStyle.preset} onValueChange={onPresetChange} />
		</div>

		<div class="flex flex-col gap-2.5 pt-3 {uiTheme.theme === 'avant-garde' ? 'border-t border-border/40' : 'border-t border-border/60'}">
			<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Font</Label>
			<Select.Root type="single" value={tableStyle.fontFamily} onValueChange={handleFontChange}>
				<Select.Trigger class="w-full h-9 text-sm bg-background">
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
			<div class="flex items-center gap-3">
				<span class="text-xs text-muted-foreground shrink-0 w-8 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[10px] uppercase tracking-wider' : ''}">Size</span>
				<Slider
					class="flex-1"
					type="single"
					value={tableStyle.fontSize}
					min={8}
					max={16}
					step={1}
					onValueChange={handleFontSizeChange}
				/>
				<span class="text-xs text-muted-foreground shrink-0 w-8 text-right {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] font-semibold text-foreground' : ''}">{tableStyle.fontSize}pt</span>
			</div>
		</div>

		<div class="flex flex-col gap-2 pt-3 {uiTheme.theme === 'avant-garde' ? 'border-t border-border/40' : 'border-t border-border/60'}">
			<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Spacing</Label>
			<div class="flex flex-col gap-1.5">
				<span class="text-xs text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-wider' : ''}">Cell Padding</span>
				<ToggleGroup.Root variant="outline" type="single" value={typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'} onValueChange={(v) => v && handlePaddingChange(v)} class="w-full gap-1">
					<ToggleGroup.Item value="compact" aria-label="Compact" class="flex-1 {uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider h-7 data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : ''}">Compact</ToggleGroup.Item>
					<ToggleGroup.Item value="normal" aria-label="Normal" class="flex-1 {uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider h-7 data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : ''}">Normal</ToggleGroup.Item>
					<ToggleGroup.Item value="loose" aria-label="Loose" class="flex-1 {uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider h-7 data-[state=on]:bg-[#0202f1] data-[state=on]:text-white data-[state=on]:border-[#0202f1]' : ''}">Loose</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>
		</div>

		<div class="flex flex-col gap-2.5 pt-3 {uiTheme.theme === 'avant-garde' ? 'border-t border-border/40' : 'border-t border-border/60'}">
			<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Rules</Label>
			<div class="grid grid-cols-2 gap-2.5">
				<div class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-wider' : ''}">Top</span>
					<Select.Root type="single" value={tableStyle.borders.top} onValueChange={(v) => handleBorderChange('top', v)}>
						<Select.Trigger class="w-full {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}">{getBorderLabel(tableStyle.borders.top)}</Select.Trigger>
						<Select.Content class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}>
							<Select.Group>
								{#each topBorderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-wider' : ''}">Bottom</span>
					<Select.Root type="single" value={tableStyle.borders.bottom} onValueChange={(v) => handleBorderChange('bottom', v)}>
						<Select.Trigger class="w-full {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}">{getBorderLabel(tableStyle.borders.bottom)}</Select.Trigger>
						<Select.Content class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}>
							<Select.Group>
								{#each bottomBorderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-wider' : ''}">Header</span>
					<Select.Root type="single" value={tableStyle.borders.headerBottom} onValueChange={(v) => handleBorderChange('headerBottom', v)}>
						<Select.Trigger class="w-full {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}">{getBorderLabel(tableStyle.borders.headerBottom)}</Select.Trigger>
						<Select.Content class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}>
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
						<span class="text-xs text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-wider' : ''}">Vertical</span>
						<Select.Root type="single" value={tableStyle.borders.vertical} onValueChange={(v) => handleBorderChange('vertical', v)}>
							<Select.Trigger class="w-full {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}">{getBorderLabel(tableStyle.borders.vertical)}</Select.Trigger>
							<Select.Content class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}>
								<Select.Group>
									{#each borderOptions as option}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted-foreground {uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-wider' : ''}">Horizontal</span>
						<Select.Root type="single" value={tableStyle.borders.horizontal} onValueChange={(v) => handleBorderChange('horizontal', v)}>
							<Select.Trigger class="w-full {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}">{getBorderLabel(tableStyle.borders.horizontal)}</Select.Trigger>
							<Select.Content class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}>
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
	{@render sectionWrapper('Table Style', '[ SPEC ]', '01', tableStyleContent)}

	{#snippet structureContent()}
		<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Resize Lock</Label>
		<div class="grid grid-cols-2 gap-3">
			<div class="flex items-center justify-between border border-border/80 px-2.5 py-1.5 bg-muted/20">
				<span class="text-xs {uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider font-semibold' : ''}">Column</span>
				<Switch checked={lockColumnResize} onCheckedChange={(v) => onLockColumnResizeChange?.(v)} />
			</div>
			<div class="flex items-center justify-between border border-border/80 px-2.5 py-1.5 bg-muted/20">
				<span class="text-xs {uiTheme.theme === 'avant-garde' ? 'text-[11px] font-terminal uppercase tracking-wider font-semibold' : ''}">Row</span>
				<Switch checked={lockRowResize} onCheckedChange={(v) => onLockRowResizeChange?.(v)} />
			</div>
		</div>
	{/snippet}
	{@render sectionWrapper('Structure', '[ LOCK ]', '02', structureContent)}

	{#snippet canvasContent()}
		<div class="flex flex-col gap-2">
			<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Size Preset</Label>
			<Select.Root type="single" value={canvasPreset} onValueChange={handleCanvasPresetChange}>
				<Select.Trigger class="w-full {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}">
					{canvasPresets.find(o => o.value === canvasPreset)?.label || 'Auto'}
				</Select.Trigger>
				<Select.Content class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}>
					<Select.Group>
						{#each canvasPresets as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</div>

		{#if canvasPreset === 'custom'}
			<div class="flex flex-col gap-2">
				<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Custom Width (px)</Label>
				<Input
					type="number"
					class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}
					value={customWidth}
					onchange={handleCustomWidthChange}
					min={200}
					max={4000}
				/>
			</div>
			<div class="flex flex-col gap-2">
				<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Custom Height (px)</Label>
				<Input
					type="number"
					class={uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs bg-background' : ''}
					value={customHeight}
					onchange={handleCustomHeightChange}
					min={200}
					max={4000}
				/>
			</div>
		{/if}

		<div class="flex flex-col gap-2 pt-2 {uiTheme.theme === 'avant-garde' ? 'border-t border-border/40' : 'border-t border-border/60'}">
			<Label class={uiTheme.theme === 'avant-garde' ? 'text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold' : ''}>Background</Label>
			<input
				type="color"
				class="w-full h-8 border border-border cursor-pointer p-0.5 bg-background"
				value={canvasConfig.backgroundColor}
				onchange={handleBgColorChange}
			/>
		</div>
	{/snippet}
	{@render sectionWrapper('Canvas', '[ VIEW ]', '03', canvasContent)}
</div>
