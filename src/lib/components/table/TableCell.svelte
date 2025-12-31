<script lang="ts">
	import type { Cell } from '$lib/types';
	import { renderLatex } from '$lib/utils/katex';

	interface Props {
		cell: Cell;
		isHeader?: boolean;
		onupdate?: (content: string) => void;
	}

	let { cell, isHeader = false, onupdate }: Props = $props();

	let editing = $state(false);
	let editValue = $state('');
	let cellElement: HTMLElement;

	function startEdit() {
		editing = true;
		editValue = cell.content;
	}

	function finishEdit() {
		editing = false;
		if (editValue !== cell.content) {
			onupdate?.(editValue);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			finishEdit();
		}
		if (e.key === 'Escape') {
			editing = false;
		}
	}

	function handleBlur() {
		finishEdit();
	}

	const alignClass = $derived({
		left: 'text-left',
		center: 'text-center',
		right: 'text-right',
		decimal: 'text-right'
	}[cell.align || 'center']);
</script>

{#if isHeader}
	<th
		class="table-cell {alignClass}"
		class:font-bold={cell.isBold}
		class:italic={cell.isItalic}
		style:background-color={cell.backgroundColor}
		style:color={cell.textColor}
		colspan={cell.colspan}
		rowspan={cell.rowspan}
		ondblclick={startEdit}
		bind:this={cellElement}
	>
		{#if editing}
			<input
				type="text"
				class="cell-input"
				bind:value={editValue}
				onblur={handleBlur}
				onkeydown={handleKeydown}
			/>
		{:else}
			{@html renderLatex(cell.content)}
		{/if}
	</th>
{:else}
	<td
		class="table-cell {alignClass}"
		class:font-bold={cell.isBold}
		class:italic={cell.isItalic}
		style:background-color={cell.backgroundColor}
		style:color={cell.textColor}
		colspan={cell.colspan}
		rowspan={cell.rowspan}
		ondblclick={startEdit}
		bind:this={cellElement}
	>
		{#if editing}
			<input
				type="text"
				class="cell-input"
				bind:value={editValue}
				onblur={handleBlur}
				onkeydown={handleKeydown}
			/>
		{:else}
			{@html renderLatex(cell.content)}
		{/if}
	</td>
{/if}
