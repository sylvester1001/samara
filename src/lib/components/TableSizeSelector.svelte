<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Grid3x3 } from 'lucide-svelte';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';

	interface Props {
		currentRows: number;
		currentCols: number;
		onSizeChange: (rows: number, cols: number) => void;
	}

	let { currentRows, currentCols, onSizeChange }: Props = $props();

	const maxRows = 12;
	const maxCols = 12;
	const cellSize = 18;
	const gap = 3;

	let hoverRow = $state(0);
	let hoverCol = $state(0);
	let open = $state(false);
	let gridEl: HTMLDivElement;

	function handleMouseMove(e: MouseEvent) {
		if (!gridEl) return;
		const rect = gridEl.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const col = Math.min(maxCols, Math.max(1, Math.ceil(x / (cellSize + gap))));
		const row = Math.min(maxRows, Math.max(1, Math.ceil(y / (cellSize + gap))));

		hoverRow = row;
		hoverCol = col;
	}

	function handleMouseLeave() {
		hoverRow = 0;
		hoverCol = 0;
	}

	function handleClick() {
		if (hoverRow > 0 && hoverCol > 0) {
			onSizeChange(hoverRow, hoverCol);
			open = false;
		}
	}

	function isHighlighted(row: number, col: number) {
		return row <= hoverRow && col <= hoverCol;
	}

	const displayRows = $derived(hoverRow > 0 ? hoverRow : currentRows);
	const displayCols = $derived(hoverCol > 0 ? hoverCol : currentCols);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon"
				class="h-7 w-7 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-[var(--radius)] hover:bg-muted'}"
				{...props}
				title="Table Size"
			>
				<Grid3x3 class="w-3.5 h-3.5" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="start" class="w-auto p-2.5 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}">
		<div class="flex flex-col gap-2">
			<div class="text-xs font-medium text-center text-foreground {uiTheme.theme === 'avant-garde' ? 'font-terminal font-semibold uppercase tracking-wider' : ''}">
				{displayRows} × {displayCols}
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={gridEl}
				class="grid cursor-pointer"
				style="grid-template-columns: repeat({maxCols}, {cellSize}px); gap: {gap}px;"
				onmousemove={handleMouseMove}
				onmouseleave={handleMouseLeave}
				onclick={handleClick}
			>
				{#each Array(maxRows) as _, rowIndex}
					{#each Array(maxCols) as _, colIndex}
						{@const row = rowIndex + 1}
						{@const col = colIndex + 1}
						<div
							class="rounded-[2px] border pointer-events-none"
							class:bg-blue-100={isHighlighted(row, col)}
							class:dark:bg-blue-900={isHighlighted(row, col)}
							class:border-blue-300={isHighlighted(row, col)}
							class:dark:border-blue-700={isHighlighted(row, col)}
							class:bg-gray-50={!isHighlighted(row, col)}
							class:dark:bg-zinc-800={!isHighlighted(row, col)}
							class:border-gray-200={!isHighlighted(row, col)}
							class:dark:border-zinc-700={!isHighlighted(row, col)}
							style="width: {cellSize}px; height: {cellSize}px;"
						></div>
					{/each}
				{/each}
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
