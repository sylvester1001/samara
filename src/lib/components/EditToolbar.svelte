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
	} from "lucide-svelte";

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
	}: Props = $props();

	function handleTextColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onTextColorChange?.(target.value);
	}

	function handleBackgroundColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onBackgroundColorChange?.(target.value);
	}
</script>

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
</div>
