<script lang="ts">
	import type { Cell } from '$lib/types';
	import { renderLatex } from '$lib/utils/katex';
	import { tick } from 'svelte';
	import { t } from '$lib/i18n';

	interface Props {
		cell: Cell;
		isHeader?: boolean;
		onupdate?: (content: string) => void;
	}

	let { cell, isHeader = false, onupdate }: Props = $props();

	let editing = $state(false);
	let editValue = $state('');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	async function startEdit() {
		editing = true;
		editValue = cell.content;
		await tick();
		textareaRef?.focus();
		textareaRef?.select();
	}

	function finishEdit() {
		editing = false;
		if (editValue !== cell.content) {
			onupdate?.(editValue);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.shiftKey) {
			// Shift+Enter: finish editing
			e.preventDefault();
			finishEdit();
		}
		if (e.key === 'Escape') {
			editing = false;
		}
		// Plain Enter: allow default behavior (insert newline in textarea)
	}

	function handleBlur() {
		finishEdit();
	}
</script>

<style>
	.cell-content {
		display: block;
		width: 100%;
		height: 100%;
	}

	.cell-input {
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: inherit;
		resize: none;
		overflow: hidden;
		white-space: pre-wrap;
		word-wrap: break-word;
	}
</style>

<div class="cell-content" ondblclick={startEdit} role="textbox" aria-label={t('a11y.cellEdit')} tabindex="0">
	{#if editing}
		<textarea
			class="cell-input"
			bind:this={textareaRef}
			bind:value={editValue}
			onblur={handleBlur}
			onkeydown={handleKeydown}
		></textarea>
	{:else}
		<div style="white-space: pre-wrap;">
			{@html renderLatex(cell.content)}
		</div>
	{/if}
</div>
