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
		Baseline,
		PaintBucket,
	} from "lucide-svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import type { TableData } from "$lib/types";
	import { getSegmentLabel, isSegmentTrimmed } from "$lib/utils/table-geometry";
	import { uiTheme } from "$lib/stores/ui-theme.svelte.js";
	import { t } from "$lib/i18n";

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

	let textColorInput = $state<HTMLInputElement>();
	let bgColorInput = $state<HTMLInputElement>();

	function handleTextColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onTextColorChange?.(target.value);
	}

	function handleBgColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onBackgroundColorChange?.(target.value);
	}
</script>

<div class="flex flex-col gap-2 select-none" unselectable="on">
<div
	class="flex items-center flex-wrap px-2 py-1 gap-0.5 select-none {uiTheme.theme === 'avant-garde' ? 'border-b border-border bg-background' : 'rounded-[var(--radius)] border border-border bg-background'}"
	unselectable="on"
>
	<AppTooltip
		text={t('edit.alignLeft')}
		aria-label={t('edit.alignLeft')}
		onclick={() => onAlignChange?.("left")}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<TextAlignStart class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text={t('edit.alignCenter')}
		aria-label={t('edit.alignCenter')}
		onclick={() => onAlignChange?.("center")}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<TextAlignCenter class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text={t('edit.alignRight')}
		aria-label={t('edit.alignRight')}
		onclick={() => onAlignChange?.("right")}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<TextAlignEnd class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>

	<div class="h-4 w-px bg-border/80 mx-1"></div>

	<AppTooltip
		text={t('edit.bold')}
		aria-label={t('edit.bold')}
		onclick={onToggleBold}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<Bold class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text={t('edit.italic')}
		aria-label={t('edit.italic')}
		onclick={onToggleItalic}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="icon" class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<Italic class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>

	<div class="h-4 w-px bg-border/80 mx-1"></div>

	<AppTooltip
		text={t('edit.textColor')}
		aria-label={t('edit.textColor')}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<div class="relative inline-flex items-center">
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}"
					disabled={!hasSelection}
					onclick={() => textColorInput?.click()}
					{...props}
				>
					<Baseline class="w-3.5 h-3.5" />
				</Button>
				<input
					bind:this={textColorInput}
					type="color"
					value="#000000"
					class="sr-only"
					onchange={handleTextColorChange}
					tabindex={-1}
				/>
			</div>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text={t('edit.backgroundColor')}
		aria-label={t('edit.backgroundColor')}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<div class="relative inline-flex items-center">
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}"
					disabled={!hasSelection}
					onclick={() => bgColorInput?.click()}
					{...props}
				>
					<PaintBucket class="w-3.5 h-3.5" />
				</Button>
				<input
					bind:this={bgColorInput}
					type="color"
					value="#ffffff"
					class="sr-only"
					onchange={handleBgColorChange}
					tabindex={-1}
				/>
			</div>
		{/snippet}
	</AppTooltip>

	<div class="h-4 w-px bg-border/80 mx-1"></div>

	<AppTooltip
		text={t('edit.mergeCells')}
		aria-label={t('edit.mergeCells')}
		onclick={onMergeCells}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" class="h-7 px-2 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<TableCellsMerge class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>
	<AppTooltip
		text={t('edit.unmergeCells')}
		aria-label={t('edit.unmergeCells')}
		onclick={onUnmergeCells}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" class="h-7 px-2 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<TableCellsSplit class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</AppTooltip>

	<div class="h-4 w-px bg-border/80 mx-1"></div>

	<AppTooltip
		text={t('edit.insertFormula')}
		aria-label={t('edit.insertFormula')}
		onclick={onInsertFormula}
		disabled={!hasSelection}
	>
		{#snippet children({ props })}
			<Button variant="ghost" size="sm" class="h-7 px-2 text-xs transition-colors {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-foreground hover:text-background'}" {...props}>
				<Sigma class="w-3.5 h-3.5 mr-1" />
				{t('edit.formula')}
			</Button>
		{/snippet}
	</AppTooltip>

	<div class="h-4 w-px bg-border/80 mx-1"></div>

	<Button
		data-header-adjust-toggle
		variant={headerAdjustMode ? "default" : "ghost"}
		size="sm"
		class="h-7 px-2.5 text-xs transition-colors {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider' : 'rounded-[var(--radius)]'} {headerAdjustMode ? (uiTheme.theme === 'avant-garde' ? 'bg-[#0202f1] text-white hover:bg-[#0000d0]' : 'bg-foreground text-background hover:bg-foreground/90') : (uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'hover:bg-muted')}"
		onclick={onToggleHeaderAdjust}
	>
		<PanelTop class="w-3.5 h-3.5 mr-1" />
		{t('edit.header')}
	</Button>

	<div class="h-4 w-px bg-border/80 mx-1"></div>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button variant="ghost" size="sm" class="h-7 px-2 text-xs transition-colors {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-muted'}" {...props}>
					<Minus class="w-3.5 h-3.5 mr-1" />
					{t('edit.line')}
					<ChevronDown class="w-3 h-3 ml-0.5 opacity-70" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-52 border-border {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : 'rounded-[var(--radius)]'}">
			<DropdownMenu.Group>
				<DropdownMenu.Item
					disabled={!hasSelection}
					onSelect={(event) => {
						event.preventDefault();
						onAddLine?.("below");
					}}
				>
					{t('edit.lineBelow')}
				</DropdownMenu.Item>
				<DropdownMenu.Item
					disabled={!hasSelection}
					onSelect={(event) => {
						event.preventDefault();
						onAddLine?.("above");
					}}
				>
					{t('edit.lineAbove')}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.CheckboxItem
					disabled={!canToggleShorter}
					checked={shorterChecked}
					onCheckedChange={(checked) => onShorterChange?.(checked === true)}
				>
					{t('edit.shorterThanCell')}
				</DropdownMenu.CheckboxItem>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
{#if lineHint || segments.length}
	<div class="flex flex-wrap items-center gap-1.5 min-h-6 px-0.5 select-none" unselectable="on">
		{#if lineHint}
			<span class="text-[11px] font-terminal uppercase tracking-wider text-muted-foreground select-none">{lineHint}</span>
		{/if}
		{#each segments as segment, index}
			<div
				class="inline-flex items-center gap-1.5 rounded-[1px] border {activeSegmentIndex === index ? (uiTheme.theme === 'avant-garde' ? 'border-[var(--cobalt)] bg-[var(--cobalt-subtle)] text-[var(--cobalt)] font-bold' : 'border-foreground bg-muted text-foreground font-bold') : 'border-border bg-background text-foreground'} px-2 py-0.5 text-[11px] font-terminal uppercase tracking-wider select-none"
				unselectable="on"
			>
				<button
					type="button"
					class="max-w-32 truncate select-none"
					unselectable="on"
					onclick={() => onSelectSegment?.(index)}
				>
					{tableData ? getSegmentLabel(tableData, segment) : t('edit.lineN', { n: index + 1 })}
				</button>
				<button
					type="button"
					class="text-muted-foreground hover:text-destructive transition-colors select-none"
					unselectable="on"
					onclick={() => onRemoveSegment?.(index)}
					aria-label={t('edit.removeLine')}
				>
					<X class="w-3 h-3" />
				</button>
			</div>
		{/each}
	</div>
{/if}
</div>
