<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import AppTooltip from "$lib/components/AppTooltip.svelte";
	import {
		TextAlignStart,
		TextAlignCenter,
		TextAlignEnd,
		Bold,
		Italic,
		TableCellsMerge,
		TableCellsSplit,
		Sigma,
		PanelTop,
		Minus,
		ChevronDown,
		X,
	} from "lucide-svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import type { TableData } from "$lib/types";
	import { getSegmentLabel, isSegmentTrimmed } from "$lib/utils/table-geometry";

	interface Props {
		hasSelection?: boolean;
		onAlignChange?: (align: "left" | "center" | "right") => void;
		onToggleBold?: () => void;
		onToggleItalic?: () => void;
		onTextColorChange?: (color: string) => void;
		onBackgroundColorChange?: (color: string) => void;
		onMergeCells?: () => void;
		onUnmergeCells?: () => void;
		onInsertFormula?: () => void;
		headerAdjustMode?: boolean;
		onToggleHeaderAdjust?: () => void;
		tableData?: TableData;
		activeSegmentIndex?: number | null;
		lineHint?: string;
		onAddLine?: (edge: "above" | "below") => void;
		onShorterChange?: (shorter: boolean) => void;
		onRemoveSegment?: (index: number) => void;
		onSelectSegment?: (index: number) => void;
	}

	let {
		hasSelection = false,
		onAlignChange,
		onToggleBold,
		onToggleItalic,
		onTextColorChange,
		onBackgroundColorChange,
		onMergeCells,
		onUnmergeCells,
		onInsertFormula,
		headerAdjustMode = false,
		onToggleHeaderAdjust,
		tableData,
		activeSegmentIndex = null,
		lineHint = "",
		onAddLine,
		onShorterChange,
		onRemoveSegment,
		onSelectSegment,
	}: Props = $props();

	const segments = $derived(tableData?.segments ?? []);
	const activeSegment = $derived(
		activeSegmentIndex != null ? segments[activeSegmentIndex] : undefined,
	);
	const shorterChecked = $derived(isSegmentTrimmed(activeSegment));
	const canToggleShorter = $derived(activeSegmentIndex != null);

	function handleTextColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onTextColorChange?.(target.value);
	}

	function handleBackgroundColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onBackgroundColorChange?.(target.value);
	}
</script>

<div class="flex flex-col gap-2">
<div
	class="flex items-center flex-wrap rounded-lg border border-border bg-white dark:bg-[#0a0a0a] px-2 py-1.5"
>
	<AppTooltip
		text="Align left"
		aria-label="Align left"
		onclick={() => onAlignChange?.("left")}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<TextAlignStart class="w-4 h-4" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text="Align center"
		aria-label="Align center"
		onclick={() => onAlignChange?.("center")}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<TextAlignCenter class="w-4 h-4" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text="Align right"
		aria-label="Align right"
		onclick={() => onAlignChange?.("right")}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<TextAlignEnd class="w-4 h-4" />
			</Button>
		{/snippet}
	</AppTooltip>
	<div class="h-6 border-l border-border dark:border-[#27272a] mx-1"></div>
	<AppTooltip
		text="Bold"
		aria-label="Bold"
		onclick={onToggleBold}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<Bold class="w-4 h-4" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text="Italic"
		aria-label="Italic"
		onclick={onToggleItalic}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<Italic class="w-4 h-4" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text="Text color"
		disabled={!hasSelection}
		childProps={{
			type: "color",
			class: "ml-1 w-7 h-7 rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]",
			"aria-label": "Text color",
			oninput: handleTextColorChange,
		}}
	>
		{#snippet children({ props })}
			<input {...props} />
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text="Cell background"
		disabled={!hasSelection}
		childProps={{
			type: "color",
			class: "ml-2 w-7 h-7 rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]",
			"aria-label": "Cell background",
			oninput: handleBackgroundColorChange,
		}}
	>
		{#snippet children({ props })}
			<input {...props} />
		{/snippet}
	</AppTooltip>
	<div
		class="ml-3 h-6 border-l border-border dark:border-[#27272a] mx-1"
	></div>
	<AppTooltip
		text="Merge cells"
		aria-label="Merge cells"
		onclick={onMergeCells}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" {...props}>
				<TableCellsMerge />
				<!-- Merge -->
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text="Unmerge cells"
		aria-label="Unmerge cells"
		onclick={onUnmergeCells}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" {...props}>
				<TableCellsSplit />
				<!-- Unmerge -->
			</Button>
		{/snippet}
	</AppTooltip>
	<div
		class="ml-3 h-6 border-l border-border dark:border-[#27272a] mx-1"
	></div>
	<AppTooltip
		text="Insert Formula"
		aria-label="Insert Formula"
		onclick={onInsertFormula}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" {...props}>
				<Sigma class="w-4 h-4 mr-1" />
				Formula
			</Button>
		{/snippet}
	</AppTooltip>
	<div
		class="ml-3 h-6 border-l border-border dark:border-[#27272a] mx-1"
	></div>
	<Button
		data-header-adjust-toggle
		variant={headerAdjustMode ? "default" : "ghost"}
		size="sm"
		onclick={onToggleHeaderAdjust}
	>
		<PanelTop class="w-4 h-4 mr-1" />
		Header
	</Button>
	<div
		class="ml-3 h-6 border-l border-border dark:border-[#27272a] mx-1"
	></div>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button variant="ghost" size="sm" {...props}>
					<Minus class="w-4 h-4 mr-1" />
					Line
					<ChevronDown class="w-3.5 h-3.5 ml-0.5 opacity-70" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-52">
			<DropdownMenu.Group>
				<DropdownMenu.Item
					disabled={!hasSelection}
					onSelect={(event) => {
						event.preventDefault();
						onAddLine?.("below");
					}}
				>
					Below this cell
				</DropdownMenu.Item>
				<DropdownMenu.Item
					disabled={!hasSelection}
					onSelect={(event) => {
						event.preventDefault();
						onAddLine?.("above");
					}}
				>
					Above this cell
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.CheckboxItem
					disabled={!canToggleShorter}
					checked={shorterChecked}
					onCheckedChange={(checked) => onShorterChange?.(checked === true)}
				>
					Shorter than cell
				</DropdownMenu.CheckboxItem>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
{#if lineHint || segments.length}
	<div class="flex flex-wrap items-center gap-2 min-h-7 px-1">
		{#if lineHint}
			<span class="text-xs text-muted-foreground">{lineHint}</span>
		{/if}
		{#each segments as segment, index}
			<div
				class="inline-flex items-center gap-1 rounded-md border border-border bg-white dark:bg-[#0a0a0a] px-2 py-1 text-xs {activeSegmentIndex === index ? 'border-blue-500 text-blue-700 dark:text-blue-300' : 'text-foreground'}"
			>
				<button
					type="button"
					class="max-w-32 truncate"
					onclick={() => onSelectSegment?.(index)}
				>
					{tableData ? getSegmentLabel(tableData, segment) : `Line ${index + 1}`}
				</button>
				<button
					type="button"
					class="text-muted-foreground hover:text-destructive"
					onclick={() => onRemoveSegment?.(index)}
					aria-label="Remove line"
				>
					<X class="w-3 h-3" />
				</button>
			</div>
		{/each}
	</div>
{/if}
</div>
