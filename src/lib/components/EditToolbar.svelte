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
	import { uiTheme } from "$lib/stores/ui-theme.svelte.js";

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
	class="flex items-center flex-wrap rounded-[var(--radius)] border border-border bg-background px-1.5 py-1 gap-0.5"
>
	<AppTooltip
		text="Align left"
		aria-label="Align left"
		onclick={() => onAlignChange?.("left")}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" class="h-7 w-7 rounded-[var(--radius)] hover:bg-foreground hover:text-background" {...props}>
				<TextAlignStart class="w-3.5 h-3.5" />
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
			<Button variant="ghost" size="icon" class="h-7 w-7 rounded-[var(--radius)] hover:bg-foreground hover:text-background" {...props}>
				<TextAlignCenter class="w-3.5 h-3.5" />
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
			<Button variant="ghost" size="icon" class="h-7 w-7 rounded-[var(--radius)] hover:bg-foreground hover:text-background" {...props}>
				<TextAlignEnd class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>

	<div class="h-5 w-px bg-border mx-1"></div>

	<AppTooltip
		text="Bold"
		aria-label="Bold"
		onclick={onToggleBold}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" class="h-7 w-7 rounded-[var(--radius)] hover:bg-foreground hover:text-background" {...props}>
				<Bold class="w-3.5 h-3.5" />
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
			<Button variant="ghost" size="icon" class="h-7 w-7 rounded-[var(--radius)] hover:bg-foreground hover:text-background" {...props}>
				<Italic class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text="Text color"
		disabled={!hasSelection}
		childProps={{
			type: "color",
			class: "ml-0.5 w-6 h-6 rounded-[var(--radius)] cursor-pointer p-0.5 border border-border bg-background",
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
			class: "ml-1 w-6 h-6 rounded-[var(--radius)] cursor-pointer p-0.5 border border-border bg-background",
			"aria-label": "Cell background",
			oninput: handleBackgroundColorChange,
		}}
	>
		{#snippet children({ props })}
			<input {...props} />
		{/snippet}
	</AppTooltip>

	<div class="h-5 w-px bg-border mx-1"></div>

	<AppTooltip
		text="Merge cells"
		aria-label="Merge cells"
		onclick={onMergeCells}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" class="h-7 px-2 rounded-[var(--radius)] hover:bg-foreground hover:text-background" {...props}>
				<TableCellsMerge class="w-3.5 h-3.5" />
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
			<Button variant="ghost" size="sm" class="h-7 px-2 rounded-[var(--radius)] hover:bg-foreground hover:text-background" {...props}>
				<TableCellsSplit class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>

	<div class="h-5 w-px bg-border mx-1"></div>

	<AppTooltip
		text="Insert Formula"
		aria-label="Insert Formula"
		onclick={onInsertFormula}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" class="h-7 px-2 rounded-[var(--radius)] text-xs hover:bg-foreground hover:text-background {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider' : ''}" {...props}>
				<Sigma class="w-3.5 h-3.5 mr-1" />
				Formula
			</Button>
		{/snippet}
	</AppTooltip>

	<div class="h-5 w-px bg-border mx-1"></div>

	<Button
		data-header-adjust-toggle
		variant={headerAdjustMode ? "default" : "ghost"}
		size="sm"
		class="h-7 px-2.5 rounded-[var(--radius)] text-xs {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider' : ''} {headerAdjustMode ? 'bg-[var(--cobalt)] text-white hover:bg-[var(--cobalt-hover)]' : 'hover:bg-foreground hover:text-background'}"
		onclick={onToggleHeaderAdjust}
	>
		<PanelTop class="w-3.5 h-3.5 mr-1" />
		Header
	</Button>

	<div class="h-5 w-px bg-border mx-1"></div>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button variant="ghost" size="sm" class="h-7 px-2 rounded-[var(--radius)] text-xs hover:bg-foreground hover:text-background {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider' : ''}" {...props}>
					<Minus class="w-3.5 h-3.5 mr-1" />
					Line
					<ChevronDown class="w-3 h-3 ml-0.5 opacity-70" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-52 rounded-[var(--radius)] border-border {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}">
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
	<div class="flex flex-wrap items-center gap-1.5 min-h-6 px-0.5">
		{#if lineHint}
			<span class="text-[11px] font-terminal uppercase tracking-wider text-muted-foreground">{lineHint}</span>
		{/if}
		{#each segments as segment, index}
			<div
				class="inline-flex items-center gap-1.5 rounded-[1px] border {activeSegmentIndex === index ? 'border-[var(--cobalt)] bg-[var(--cobalt-subtle)] text-[var(--cobalt)] font-bold' : 'border-border bg-background text-foreground'} px-2 py-0.5 text-[11px] font-terminal uppercase tracking-wider"
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
					class="text-muted-foreground hover:text-destructive transition-colors"
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
