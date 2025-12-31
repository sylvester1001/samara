<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { TableStyle, CanvasConfig } from '$lib/types';

	interface Props {
		tableStyle: TableStyle;
		canvasConfig: CanvasConfig;
		onStyleChange?: (style: Partial<TableStyle>) => void;
		onCanvasChange?: (config: Partial<CanvasConfig>) => void;
	}

	let { tableStyle, canvasConfig, onStyleChange, onCanvasChange }: Props = $props();

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
		{ value: '1920', label: 'PPT 16:9 (1920px)' },
		{ value: '794', label: 'A4 (794px)' },
		{ value: 'custom', label: 'Custom' }
	];

	let canvasWidthPreset = $state('auto');
	let customWidth = $state(800);

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

	function handleCanvasWidthChange(value: string | undefined) {
		if (!value) return;
		canvasWidthPreset = value;
		if (value === 'auto') {
			onCanvasChange?.({ width: 'auto' });
		} else if (value === 'custom') {
			onCanvasChange?.({ width: customWidth });
		} else {
			onCanvasChange?.({ width: parseInt(value) });
		}
	}

	function handleCustomWidthChange(e: Event) {
		const target = e.target as HTMLInputElement;
		customWidth = parseInt(target.value) || 800;
		if (canvasWidthPreset === 'custom') {
			onCanvasChange?.({ width: customWidth });
		}
	}

	function handlePaddingValueChange(value: number) {
		onCanvasChange?.({ padding: value });
	}

	function handleBgColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onCanvasChange?.({ backgroundColor: target.value });
	}
</script>

<aside class="sidebar">
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
		</Card.Content>
	</Card.Root>

	<Card.Root class="p-4 mt-4">
		<Card.Header class="p-0 pb-4">
			<Card.Title class="text-sm">Canvas</Card.Title>
		</Card.Header>
		<Card.Content class="p-0 space-y-4">
			<div class="space-y-2">
				<Label>Width</Label>
				<Select.Root type="single" value={canvasWidthPreset} onValueChange={handleCanvasWidthChange}>
					<Select.Trigger class="w-full">
						{canvasPresets.find(o => o.value === canvasWidthPreset)?.label || 'Auto'}
					</Select.Trigger>
					<Select.Content>
						{#each canvasPresets as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			{#if canvasWidthPreset === 'custom'}
				<div class="space-y-2">
					<Label>Custom Width (px)</Label>
					<Input
						type="number"
						value={customWidth}
						onchange={handleCustomWidthChange}
						min={200}
						max={3000}
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
</aside>
