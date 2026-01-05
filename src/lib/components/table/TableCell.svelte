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
</script>

<div class="cell-content" ondblclick={startEdit} role="textbox" aria-label="Table cell, double-click to edit" tabindex="0">
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
</div>
