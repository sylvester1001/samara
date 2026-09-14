<script lang="ts">
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
		selectedCellCount?: number;
		activeBold?: boolean;
		activeItalic?: boolean;
		activeAlign?: "left" | "center" | "right" | "decimal";
		activeTextColor?: string;
		activeBackgroundColor?: string;
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
		selectedCellCount = 0,
		activeBold = false,
		activeItalic = false,
		activeAlign = "center",
		activeTextColor = undefined,
		activeBackgroundColor = undefined,
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

	const canMerge = $derived(selectedCellCount >= 2);
	const canInsertFormula = $derived(selectedCellCount === 1 || (hasSelection && selectedCellCount === 0));


	let textColorInput = $state<HTMLInputElement>();
	let bgColorInput = $state<HTMLInputElement>();

	function openTextColorPicker() {
		if (!hasSelection || !textColorInput) return;
		try {
			if ('showPicker' in textColorInput && typeof textColorInput.showPicker === 'function') {
				textColorInput.showPicker();
				return;
			}
		} catch (e) {
			// fallback to click
		}
		textColorInput.click();
	}

	function openBgColorPicker() {
		if (!hasSelection || !bgColorInput) return;
		try {
			if ('showPicker' in bgColorInput && typeof bgColorInput.showPicker === 'function') {
				bgColorInput.showPicker();
				return;
			}
		} catch (e) {
			// fallback to click
		}
		bgColorInput.click();
	}

	function handleTextColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onTextColorChange?.(target.value);
	}

	function handleBgColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onBackgroundColorChange?.(target.value);
	}

	function getButtonActiveClasses(isActive: boolean): string {
		if (isActive) {
			return uiTheme.theme === 'avant-garde'
				? 'bg-[#0202f1] text-white hover:bg-[#0000d0]'
				: 'bg-accent text-accent-foreground font-semibold hover:bg-accent';
		}
		return uiTheme.theme === 'avant-garde'
			? 'text-foreground hover:bg-[#0202f1] hover:text-white active:bg-[#0000d0]'
			: 'text-foreground hover:bg-muted';
	}
</script>

<div class="flex flex-col gap-1.5 select-none" unselectable="on">
	<!-- Row 1: Cell Formatting Keypad Bays (Never wraps, dedicated to cell-level tools) -->
	<div class="flex items-center gap-1.5 h-7 flex-nowrap overflow-x-hidden">
			<!-- Bay 1: Alignment Bay [ ⇥ | ↔ | ⇤ ] -->
			<div
				class="h-7 inline-flex items-center border border-border bg-background shrink-0 select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)] overflow-hidden'}"
				unselectable="on"
			>
				<AppTooltip
					text={t('edit.alignLeft')}
					aria-label={t('edit.alignLeft')}
					onclick={() => onAlignChange?.("left")}
					disabled={!hasSelection}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="w-7 h-full inline-flex items-center justify-center border-r border-border cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(hasSelection && activeAlign === 'left')}"
							disabled={!hasSelection}
							onclick={() => onAlignChange?.("left")}
							aria-label={t('edit.alignLeft')}
							{...props}
						>
							<TextAlignStart class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
						</button>
					{/snippet}
				</AppTooltip>

				<AppTooltip
					text={t('edit.alignCenter')}
					aria-label={t('edit.alignCenter')}
					onclick={() => onAlignChange?.("center")}
					disabled={!hasSelection}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="w-7 h-full inline-flex items-center justify-center border-r border-border cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(hasSelection && activeAlign === 'center')}"
							disabled={!hasSelection}
							onclick={() => onAlignChange?.("center")}
							aria-label={t('edit.alignCenter')}
							{...props}
						>
							<TextAlignCenter class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
						</button>
					{/snippet}
				</AppTooltip>

				<AppTooltip
					text={t('edit.alignRight')}
					aria-label={t('edit.alignRight')}
					onclick={() => onAlignChange?.("right")}
					disabled={!hasSelection}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="w-7 h-full inline-flex items-center justify-center last:border-r-0 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(hasSelection && (activeAlign === 'right' || activeAlign === 'decimal'))}"
							disabled={!hasSelection}
							onclick={() => onAlignChange?.("right")}
							aria-label={t('edit.alignRight')}
							{...props}
						>
							<TextAlignEnd class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
						</button>
					{/snippet}
				</AppTooltip>
			</div>

			<!-- Bay 2: Style Bay [ B | I ] -->
			<div
				class="h-7 inline-flex items-center border border-border bg-background shrink-0 select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)] overflow-hidden'}"
				unselectable="on"
			>
				<AppTooltip
					text={t('edit.bold')}
					aria-label={t('edit.bold')}
					onclick={onToggleBold}
					disabled={!hasSelection}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="w-7 h-full inline-flex items-center justify-center border-r border-border cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(hasSelection && activeBold)}"
							disabled={!hasSelection}
							onclick={onToggleBold}
							aria-label={t('edit.bold')}
							{...props}
						>
							<Bold class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
						</button>
					{/snippet}
				</AppTooltip>

				<AppTooltip
					text={t('edit.italic')}
					aria-label={t('edit.italic')}
					onclick={onToggleItalic}
					disabled={!hasSelection}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="w-7 h-full inline-flex items-center justify-center last:border-r-0 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(hasSelection && activeItalic)}"
							disabled={!hasSelection}
							onclick={onToggleItalic}
							aria-label={t('edit.italic')}
							{...props}
						>
							<Italic class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
						</button>
					{/snippet}
				</AppTooltip>
			</div>

			<!-- Bay 3: Color Bay [ A | 🪣 ] -->
			<div
				class="h-7 inline-flex items-center border border-border bg-background shrink-0 select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)] overflow-hidden'}"
				unselectable="on"
			>
				<AppTooltip
					text={t('edit.textColor')}
					aria-label={t('edit.textColor')}
					disabled={!hasSelection}
					onclick={openTextColorPicker}
				>
					{#snippet children({ props })}
						<div class="relative h-full inline-flex items-center">
							<button
								type="button"
								class="w-7 h-full inline-flex flex-col items-center justify-center border-r border-border cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(false)}"
								disabled={!hasSelection}
								onclick={openTextColorPicker}
								aria-label={t('edit.textColor')}
								{...props}
							>
								<Baseline class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
								<span
									class="w-3.5 h-[2px] mt-0.5 rounded-[0.5px]"
									style:background-color={hasSelection && activeTextColor ? activeTextColor : 'currentColor'}
								></span>
							</button>
							<input
								bind:this={textColorInput}
								type="color"
								value={activeTextColor || "#000000"}
								class="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
								onchange={handleTextColorChange}
								oninput={handleTextColorChange}
								tabindex={-1}
							/>
						</div>
					{/snippet}
				</AppTooltip>

				<AppTooltip
					text={t('edit.backgroundColor')}
					aria-label={t('edit.backgroundColor')}
					disabled={!hasSelection}
					onclick={openBgColorPicker}
				>
					{#snippet children({ props })}
						<div class="relative h-full inline-flex items-center">
							<button
								type="button"
								class="w-7 h-full inline-flex flex-col items-center justify-center last:border-r-0 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(false)}"
								disabled={!hasSelection}
								onclick={openBgColorPicker}
								aria-label={t('edit.backgroundColor')}
								{...props}
							>
								<PaintBucket class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
								<span
									class="w-3.5 h-[2px] mt-0.5 rounded-[0.5px] {activeBackgroundColor ? 'border border-border/50' : ''}"
									style:background-color={hasSelection && activeBackgroundColor ? activeBackgroundColor : 'transparent'}
								></span>
							</button>
							<input
								bind:this={bgColorInput}
								type="color"
								value={activeBackgroundColor || "#ffffff"}
								class="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
								onchange={handleBgColorChange}
								oninput={handleBgColorChange}
								tabindex={-1}
							/>
						</div>
					{/snippet}
				</AppTooltip>
			</div>

			<!-- Bay 4: Structure Bay [ ⧉ | ⧇ ] -->
			<div
				class="h-7 inline-flex items-center border border-border bg-background shrink-0 select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)] overflow-hidden'}"
				unselectable="on"
			>
				<AppTooltip
					text={t('edit.mergeCells')}
					aria-label={t('edit.mergeCells')}
					onclick={onMergeCells}
					disabled={!hasSelection || !canMerge}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="w-7 h-full inline-flex items-center justify-center border-r border-border cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(false)}"
							disabled={!hasSelection || !canMerge}
							onclick={onMergeCells}
							aria-label={t('edit.mergeCells')}
							{...props}
						>
							<TableCellsMerge class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
						</button>
					{/snippet}
				</AppTooltip>

				<AppTooltip
					text={t('edit.unmergeCells')}
					aria-label={t('edit.unmergeCells')}
					onclick={onUnmergeCells}
					disabled={!hasSelection}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="w-7 h-full inline-flex items-center justify-center last:border-r-0 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {getButtonActiveClasses(false)}"
							disabled={!hasSelection}
							onclick={onUnmergeCells}
							aria-label={t('edit.unmergeCells')}
							{...props}
						>
							<TableCellsSplit class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
						</button>
					{/snippet}
				</AppTooltip>
			</div>

			<!-- Bay 5: Formula Bay [ ∑ FORMULA ] -->
			<div
				class="h-7 inline-flex items-center border border-border bg-background shrink-0 select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)] overflow-hidden'}"
				unselectable="on"
			>
				<AppTooltip
					text={t('edit.insertFormula')}
					aria-label={t('edit.insertFormula')}
					onclick={onInsertFormula}
					disabled={!hasSelection || !canInsertFormula}
				>
					{#snippet children({ props })}
						<button
							type="button"
							class="h-full px-2 inline-flex items-center gap-1 last:border-r-0 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none select-none {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider' : 'text-xs font-medium'} {getButtonActiveClasses(false)}"
							disabled={!hasSelection || !canInsertFormula}
							onclick={onInsertFormula}
							aria-label={t('edit.insertFormula')}
							{...props}
						>
							<Sigma class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
							<span>{t('edit.formula')}</span>
						</button>
					{/snippet}
				</AppTooltip>
			</div>
		</div>

		<!-- Row 2: Table Architecture Instruments -->
		<div class="flex items-center gap-1.5 h-7 select-none">
			<!-- Header Adjust Mode Toggle Bay -->
			<div
				class="h-7 inline-flex items-center border border-border bg-background shrink-0 select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)] overflow-hidden'}"
				unselectable="on"
			>
				<AppTooltip
					text={t('edit.header')}
					aria-label={t('edit.header')}
					onclick={onToggleHeaderAdjust}
				>
					{#snippet children({ props })}
						<button
							type="button"
							data-header-adjust-toggle
							class="h-full px-2.5 inline-flex items-center gap-1 last:border-r-0 cursor-pointer transition-colors select-none {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider' : 'text-xs font-medium'} {getButtonActiveClasses(headerAdjustMode)}"
							onclick={onToggleHeaderAdjust}
							aria-label={t('edit.header')}
							{...props}
						>
							<PanelTop class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
							<span>{t('edit.header')}</span>
						</button>
					{/snippet}
				</AppTooltip>
			</div>

			<!-- Line Dropdown Bay -->
			<div
				class="h-7 inline-flex items-center border border-border bg-background shrink-0 select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)] overflow-hidden'}"
				unselectable="on"
			>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button
								type="button"
								class="h-full px-2.5 inline-flex items-center gap-1 last:border-r-0 cursor-pointer transition-colors select-none {uiTheme.theme === 'avant-garde' ? 'font-terminal text-[11px] uppercase tracking-wider hover:bg-[#0202f1] hover:text-white' : 'hover:bg-muted text-xs font-medium'}"
								{...props}
							>
								<Minus class="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
								<span>{t('edit.line')}</span>
								<ChevronDown class="w-3 h-3 ml-0.5 opacity-70 shrink-0" />
							</button>
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
		</div>

	<!-- Row 3: Segments / Line Hints (Underneath as separate dedicated row, exactly as before) -->
	{#if lineHint || segments.length}
		<div class="flex flex-wrap items-center gap-1.5 min-h-6 px-0.5 select-none" unselectable="on">
			{#if lineHint}
				<span class="text-[11px] font-terminal uppercase tracking-wider text-muted-foreground select-none">{lineHint}</span>
			{/if}
			{#each segments as segment, index}
				<div
					class="inline-flex items-center gap-1.5 border {activeSegmentIndex === index ? (uiTheme.theme === 'avant-garde' ? 'border-[#0202f1] bg-[#0202f1]/10 text-[#0202f1] font-bold' : 'border-foreground bg-muted text-foreground font-bold') : 'border-border bg-background text-foreground'} px-2 py-0.5 text-[11px] font-terminal uppercase tracking-wider select-none {uiTheme.theme === 'avant-garde' ? '' : 'rounded-[var(--radius)]'}"
					unselectable="on"
				>
					<button
						type="button"
						class="max-w-32 truncate select-none cursor-pointer"
						unselectable="on"
						onclick={() => onSelectSegment?.(index)}
					>
						{tableData ? getSegmentLabel(tableData, segment) : t('edit.lineN', { n: index + 1 })}
					</button>
					<button
						type="button"
						class="text-muted-foreground hover:text-destructive transition-colors select-none cursor-pointer"
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
