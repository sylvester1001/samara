<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { TableStyle, CanvasConfig, BorderStyle } from '$lib/types';

	interface Props {
		tableStyle: TableStyle;
		canvasConfig: CanvasConfig;
		onStyleChange?: (style: Partial<TableStyle>) => void;
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

	const paddingOptions = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'loose', label: 'Loose' }
	];

	const canvasPresets = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'ppt', label: 'PPT 16:9 (1920 x 1080)' },
		{ value: 'a4', label: 'A4 (794 x 1123)' },
		{ value: 'custom', label: 'Custom' }
	];

	const borderOptions: { value: BorderStyle; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'thin', label: 'Thin' },
		{ value: 'thick', label: 'Thick' },
		{ value: 'double', label: 'Double' }
	];

	let canvasPreset = $state('auto');
	let customWidth = $state(typeof canvasConfig.width === 'number' ? canvasConfig.width : 800);
	let customHeight = $state(typeof canvasConfig.height === 'number' ? canvasConfig.height : 600);

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

	function handleScaleChange(value: number) {
		onStyleChange?.({ scale: value / 100 });
	}

	function inferPreset(config: CanvasConfig) {
		if (config.width === 'auto' && config.height === 'auto') return 'auto';
		if (config.width === presetSizes.ppt.width && config.height === presetSizes.ppt.height) return 'ppt';
		if (config.width === presetSizes.a4.width && config.height === presetSizes.a4.height) return 'a4';
		return 'custom';
	}

	$effect(() => {
		canvasPreset = inferPreset(canvasConfig);
		if (typeof canvasConfig.width === 'number') {
			customWidth = canvasConfig.width;
		}
		if (typeof canvasConfig.height === 'number') {
			customHeight = canvasConfig.height;
		}
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

	function handlePaddingValueChange(value: number) {
		onCanvasChange?.({ padding: value });
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
		return borderOptions.find((option) => option.value === value)?.label ?? value;
	}

	function handleLockColumnChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onLockColumnResizeChange?.(target.checked);
	}

	function handleLockRowChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onLockRowResizeChange?.(target.checked);
	}
</script>

<div class="settings-panel">
	<Card.Root class="p-4">
		<Card.Header class="p-0 pb-4">
			<Card.Title class="text-sm">Table Style</Card.Title>
		</Card.Header>
		<Card.Content class="p-0 space-y-4">
			<div class="space-y-2">
				<Label>Font</Label>
				<Select.Root type="single" value={tableStyle.fontFamily} onValueChange={handleFontChange}>
					<Select.Trigger class="w-full">
						{fontOptions.find(o => o.value === tableStyle.fontFamily)?.label || 'Select font'}
					</Select.Trigger>
					<Select.Content>
						{#each fontOptions as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label>Font Size: {tableStyle.fontSize}pt</Label>
				<Slider
					type="single"
					value={tableStyle.fontSize}
					min={8}
					max={16}
					step={1}
					onValueChange={handleFontSizeChange}
				/>
			</div>

			<div class="space-y-2">
				<Label>Scale: {Math.round(tableStyle.scale * 100)}%</Label>
				<Slider
					type="single"
					value={tableStyle.scale * 100}
					min={50}
					max={150}
					step={5}
					onValueChange={handleScaleChange}
				/>
			</div>

			<div class="space-y-2">
				<Label>Cell Padding</Label>
				<Select.Root 
					type="single" 
					value={typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'} 
					onValueChange={handlePaddingChange}
				>
					<Select.Trigger class="w-full">
						{paddingOptions.find(o => o.value === (typeof tableStyle.padding === 'string' ? tableStyle.padding : 'normal'))?.label || 'Normal'}
					</Select.Trigger>
					<Select.Content>
						{#each paddingOptions as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label>Table Borders</Label>
				<div class="border-grid">
					<div class="border-field">
						<span class="border-label">Top</span>
						<Select.Root type="single" value={tableStyle.borders.top} onValueChange={(v) => handleBorderChange('top', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.top)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="border-field">
						<span class="border-label">Bottom</span>
						<Select.Root type="single" value={tableStyle.borders.bottom} onValueChange={(v) => handleBorderChange('bottom', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.bottom)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="border-field">
						<span class="border-label">Header</span>
						<Select.Root type="single" value={tableStyle.borders.headerBottom} onValueChange={(v) => handleBorderChange('headerBottom', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.headerBottom)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="border-field">
						<span class="border-label">Vertical</span>
						<Select.Root type="single" value={tableStyle.borders.vertical} onValueChange={(v) => handleBorderChange('vertical', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.vertical)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="border-field">
						<span class="border-label">Horizontal</span>
						<Select.Root type="single" value={tableStyle.borders.horizontal} onValueChange={(v) => handleBorderChange('horizontal', v)}>
							<Select.Trigger class="w-full">{getBorderLabel(tableStyle.borders.horizontal)}</Select.Trigger>
							<Select.Content>
								{#each borderOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="p-4 mt-4">
		<Card.Header class="p-0 pb-4">
			<Card.Title class="text-sm">Canvas</Card.Title>
		</Card.Header>
		<Card.Content class="p-0 space-y-4">
			<div class="space-y-2">
				<Label>Size Preset</Label>
				<Select.Root type="single" value={canvasPreset} onValueChange={handleCanvasPresetChange}>
					<Select.Trigger class="w-full">
						{canvasPresets.find(o => o.value === canvasPreset)?.label || 'Auto'}
					</Select.Trigger>
					<Select.Content>
						{#each canvasPresets as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			{#if canvasPreset === 'custom'}
				<div class="space-y-2">
					<Label>Custom Width (px)</Label>
					<Input
						type="number"
						value={customWidth}
						onchange={handleCustomWidthChange}
						min={200}
						max={4000}
					/>
				</div>
				<div class="space-y-2">
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

			<div class="space-y-2">
				<Label>Padding: {canvasConfig.padding}px</Label>
				<Slider
					type="single"
					value={canvasConfig.padding}
					min={0}
					max={60}
					step={4}
					onValueChange={handlePaddingValueChange}
				/>
			</div>

			<div class="space-y-2">
				<Label>Background</Label>
				<input
					type="color"
					class="color-input"
					value={canvasConfig.backgroundColor}
					onchange={handleBgColorChange}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="p-4 mt-4">
		<Card.Header class="p-0 pb-4">
			<Card.Title class="text-sm">Resize Lock</Card.Title>
		</Card.Header>
		<Card.Content class="p-0 space-y-3">
			<label class="toggle-row">
				<span>Lock Column Widths</span>
				<input
					type="checkbox"
					class="toggle-input"
					checked={lockColumnResize}
					onchange={handleLockColumnChange}
				/>
			</label>
			<label class="toggle-row">
				<span>Lock Row Heights</span>
				<input
					type="checkbox"
					class="toggle-input"
					checked={lockRowResize}
					onchange={handleLockRowChange}
				/>
			</label>
		</Card.Content>
	</Card.Root>
</div>
