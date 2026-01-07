<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { TextAlignStart, TextAlignCenter, TextAlignEnd, Bold, Italic, TableCellsMerge, TableCellsSplit } from 'lucide-svelte';

	interface Props {
		hasSelection?: boolean;
		onAlignChange?: (align: 'left' | 'center' | 'right') => void;
		onToggleBold?: () => void;
		onToggleItalic?: () => void;
		onTextColorChange?: (color: string) => void;
		onBackgroundColorChange?: (color: string) => void;
		onMergeCells?: () => void;
		onUnmergeCells?: () => void;
	}

	let {
		hasSelection = false,
		onAlignChange,
		onToggleBold,
		onToggleItalic,
		onTextColorChange,
		onBackgroundColorChange,
		onMergeCells,
		onUnmergeCells
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

<div class="flex items-center gap-2 flex-wrap rounded-lg border border-border bg-white dark:bg-[#0a0a0a] px-3 py-2">
	<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('left')} disabled={!hasSelection} title="Align Left">
		<TextAlignStart class="w-4 h-4" />
	</Button>
	<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('center')} disabled={!hasSelection} title="Align Center">
		<TextAlignCenter class="w-4 h-4" />
	</Button>
	<Button variant="ghost" size="icon" onclick={() => onAlignChange?.('right')} disabled={!hasSelection} title="Align Right">
		<TextAlignEnd class="w-4 h-4" />
	</Button>
	<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-2"></div>
	<Button variant="ghost" size="icon" onclick={onToggleBold} disabled={!hasSelection} title="Bold">
		<Bold class="w-4 h-4" />
	</Button>
	<Button variant="ghost" size="icon" onclick={onToggleItalic} disabled={!hasSelection} title="Italic">
		<Italic class="w-4 h-4" />
	</Button>
	<input
		type="color"
		class="w-7 h-7 border border-border dark:border-[#27272a] rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]"
		disabled={!hasSelection}
		title="Text Color"
		onchange={handleTextColorChange}
	/>
	<input
		type="color"
		class="w-7 h-7 border border-border dark:border-[#27272a] rounded-md cursor-pointer p-0.5 bg-white dark:bg-[#0a0a0a]"
		disabled={!hasSelection}
		title="Cell Background"
		onchange={handleBackgroundColorChange}
	/>
	<div class="w-px h-6 bg-border dark:bg-[#27272a] mx-2"></div>
	<Button variant="outline" size="sm" onclick={onMergeCells} disabled={!hasSelection}>
		<TableCellsMerge />
		<!-- Merge -->
	</Button>
	<Button variant="outline" size="sm" onclick={onUnmergeCells} disabled={!hasSelection}>
		<TableCellsSplit />
		<!-- Unmerge -->
	</Button>
</div>
