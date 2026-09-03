<script lang="ts">
	import { Undo2, Redo2, FilePlus, Download } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { SidebarTrigger } from '$lib/components/ui/sidebar/index.js';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';

	interface Props {
		onImport?: () => void;
		onNewTable?: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
		canUndo?: boolean;
		canRedo?: boolean;
	}

	let {
		onImport,
		onNewTable,
		onUndo,
		onRedo,
		canUndo = false,
		canRedo = false
	}: Props = $props();
</script>

<header class="flex items-center h-14 px-4 border-b border-border bg-background gap-4 overflow-hidden w-full box-border select-none">
	<div class="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
		<div class="flex items-center gap-2 min-w-0">
			<SidebarTrigger class="h-8 w-8 transition-colors {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-md hover:bg-muted'}" />

			{#if uiTheme.theme === 'avant-garde'}
				<div class="hidden sm:flex items-center gap-1.5 px-2 py-0.5 border border-border bg-muted/40 text-[11px] font-terminal uppercase tracking-widest text-muted-foreground select-none">
					<span class="size-1.5 bg-[#0202f1] inline-block animate-pulse"></span>
					<span>Academic Studio</span>
				</div>
			{/if}

			<div class="w-px h-5 bg-border mx-1"></div>

			<!-- Action Buttons -->
			<button
				type="button"
				class="inline-flex items-center gap-1.5 h-8 px-2.5 border border-border bg-background text-[11px] font-medium text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none {uiTheme.theme === 'avant-garde' ? 'ticket-btn font-terminal uppercase tracking-wider font-semibold hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-md hover:bg-muted'}"
				onclick={onImport}
			>
				<Download class="shrink-0 w-3.5 h-3.5 {uiTheme.theme === 'avant-garde' ? 'text-[#0202f1]' : ''}" />
				<span>Import</span>
			</button>

			<button
				type="button"
				class="inline-flex items-center gap-1.5 h-8 px-2.5 border border-border bg-background text-[11px] font-medium text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none {uiTheme.theme === 'avant-garde' ? 'ticket-btn font-terminal uppercase tracking-wider font-semibold hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-md hover:bg-muted'}"
				onclick={onNewTable}
			>
				<FilePlus class="shrink-0 w-3.5 h-3.5 {uiTheme.theme === 'avant-garde' ? 'text-[#0202f1]' : ''}" />
				<span>New</span>
			</button>

			<div class="w-px h-5 bg-border mx-1"></div>

			<div class="inline-flex border border-border overflow-hidden {uiTheme.theme === 'classic' ? 'rounded-md' : ''}">
				<button
					type="button"
					class="h-8 w-8 inline-flex items-center justify-center bg-background text-foreground transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none border-r border-border {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'hover:bg-muted'}"
					onclick={onUndo}
					disabled={!canUndo}
					title="Undo (Ctrl+Z)"
					aria-label="Undo"
				>
					<Undo2 class="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					class="h-8 w-8 inline-flex items-center justify-center bg-background text-foreground transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'hover:bg-muted'}"
					onclick={onRedo}
					disabled={!canRedo}
					title="Redo (Ctrl+Y)"
					aria-label="Redo"
				>
					<Redo2 class="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-2 shrink-0">
		<!-- Theme Style Switcher: Classic / Avant-Garde -->
		<button
			type="button"
			class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius)] border border-border bg-background hover:bg-muted transition-all cursor-pointer select-none text-xs"
			onclick={() => uiTheme.toggle()}
			title="Switch UI Style: Classic / Avant-Garde"
		>
			{#if uiTheme.theme === 'avant-garde'}
				<span class="size-2 rounded-full bg-[#0202f1] shrink-0"></span>
				<span class="font-terminal text-[11px] uppercase tracking-wider font-semibold text-foreground">Avant-Garde</span>
			{:else}
				<span class="size-2 rounded-full bg-muted-foreground/60 shrink-0"></span>
				<span class="text-xs text-muted-foreground font-medium">Classic</span>
			{/if}
		</button>

		<ThemeToggle variant="outline" class="h-8 w-8 rounded-[var(--radius)] border-border hover:bg-foreground hover:text-background transition-colors" />
	</div>
</header>
