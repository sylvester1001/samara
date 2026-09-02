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
		{ value: 'computer-modern', label: 'Computer Modern' },
		{ value: 'times', label: 'Times New Roman' },
		{ value: 'arial', label: 'Arial' }
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

<div class="flex flex-col gap-4">
	<Sidebar.Group class="rounded-lg border border-sidebar-border bg-background">
		<Sidebar.GroupLabel class="text-sm text-sidebar-foreground">Table Style</Sidebar.GroupLabel>
		<Sidebar.GroupContent class="flex flex-col gap-5 px-2 pb-3">
			<div class="flex flex-col gap-3">
				<Label>Preset</Label>
				<PresetPicker value={tableStyle.preset} onValueChange={onPresetChange} />
			</div>

			<div class="flex flex-col gap-3 pt-4 border-t border-border/60">
				<Label>Font</Label>
				<Select.Root type="single" value={tableStyle.fontFamily} onValueChange={handleFontChange}>
					<Select.Trigger class="w-full">
						{fontOptions.find(o => o.value === tableStyle.fontFamily)?.label || 'Select font'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each fontOptions as option}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="flex items-center gap-3">
					<span class="text-xs text-muted-foreground shrink-0 w-8">Size</span>
					<Slider
						class="flex-1"
						type="single"
						value={tableStyle.fontSize}
						min={8}
						max={16}
						step={1}
						onValueChange={handleFontSizeChange}
					/>
					<span class="text-xs text-muted-foreground shrink-0 w-8 text-right">{tableStyle.fontSize}pt</span>
				</div>
			</div>

			<div class="flex flex-col gap-3 pt-4 border-t border-border/60">
				<Label>Spacing</Label>
				<div class="flex flex-col gap-2">
					<span class="text-xs text-muted-foreground">Cell Padding</span>
					<ToggleGroup.Root variant="outline" type="single" value={typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'} onValueChange={(v) => v && handlePaddingChange(v)} class="w-full">
						<ToggleGroup.Item value="compact" aria-label="Compact" class="flex-1">Compact</ToggleGroup.Item>
						<ToggleGroup.Item value="normal" aria-label="Normal" class="flex-1">Normal</ToggleGroup.Item>
						<ToggleGroup.Item value="loose" aria-label="Loose" class="flex-1">Loose</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>
			</div>

			<div class="flex flex-col gap-3 pt-4 border-t border-border/60">
				<Label>Rules</Label>
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Top</span>
						<Select.Root type="single" value={tableStyle.borders.top} onValueChange={(v) => handleBorderChange('top', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.top)}</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each topBorderOptions as option}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Bottom</span>
						<Select.Root type="single" value={tableStyle.borders.bottom} onValueChange={(v) => handleBorderChange('bottom', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.bottom)}</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each bottomBorderOptions as option}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-xs text-muted-foreground">Header</span>
						<Select.Root type="single" value={tableStyle.borders.headerBottom} onValueChange={(v) => handleBorderChange('headerBottom', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.headerBottom)}</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each borderOptions as option}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					{#if tableStyle.preset !== 'booktabs'}
						<div class="flex flex-col gap-2">
							<span class="text-xs text-muted-foreground">Vertical</span>
							<Select.Root type="single" value={tableStyle.borders.vertical} onValueChange={(v) => handleBorderChange('vertical', v)}>
								<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.vertical)}</Select.Trigger>
								<Select.Content>
									<Select.Group>
										{#each borderOptions as option}
											<Select.Item value={option.value}>{option.label}</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="flex flex-col gap-2">
							<span class="text-xs text-muted-foreground">Horizontal</span>
							<Select.Root type="single" value={tableStyle.borders.horizontal} onValueChange={(v) => handleBorderChange('horizontal', v)}>
								<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.horizontal)}</Select.Trigger>
								<Select.Content>
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
		</Sidebar.GroupContent>
	</Sidebar.Group>

	<Sidebar.Group class="rounded-lg border border-sidebar-border bg-background">
		<Sidebar.GroupLabel class="text-sm text-sidebar-foreground">Structure</Sidebar.GroupLabel>
		<Sidebar.GroupContent class="flex flex-col gap-3 px-2 pb-3">
			<Label>Resize Lock</Label>
			<div class="grid grid-cols-2 gap-4">
				<div class="flex items-center justify-between">
					<span class="text-xs text-muted-foreground">Column</span>
					<Switch checked={lockColumnResize} onCheckedChange={(v) => onLockColumnResizeChange?.(v)} />
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-muted-foreground">Row</span>
					<Switch checked={lockRowResize} onCheckedChange={(v) => onLockRowResizeChange?.(v)} />
				</div>
			</div>
		</Sidebar.GroupContent>
	</Sidebar.Group>

	<Sidebar.Group class="rounded-lg border border-sidebar-border bg-background">
		<Sidebar.GroupLabel class="text-sm text-sidebar-foreground">Canvas</Sidebar.GroupLabel>
		<Sidebar.GroupContent class="flex flex-col gap-5 px-2 pb-3">
			<div class="flex flex-col gap-3">
				<Label>Size Preset</Label>
				<Select.Root type="single" value={canvasPreset} onValueChange={handleCanvasPresetChange}>
					<Select.Trigger class="w-full">
						{canvasPresets.find(o => o.value === canvasPreset)?.label || 'Auto'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each canvasPresets as option}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>

			{#if canvasPreset === 'custom'}
				<div class="flex flex-col gap-3">
					<Label>Custom Width (px)</Label>
					<Input
						type="number"
						value={customWidth}
						onchange={handleCustomWidthChange}
						min={200}
						max={4000}
					/>
				</div>
				<div class="flex flex-col gap-3">
					<Label>Custom Height (px)</Label>
					<Input
						type="number"
						value={customHeight}
						onchange={handleCustomHeightChange}
						min={200}
						max={4000}
					/>
				</div>
			{/if}

			<div class="flex flex-col gap-3 pt-4 border-t border-border/60">
				<Label>Background</Label>
				<input
					type="color"
					class="w-full h-9 border border-border rounded-md cursor-pointer p-0.5"
					value={canvasConfig.backgroundColor}
					onchange={handleBgColorChange}
				/>
			</div>
		</Sidebar.GroupContent>
	</Sidebar.Group>
</div>
