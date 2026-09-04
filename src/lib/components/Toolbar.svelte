<script lang="ts">
	import { Undo2, Redo2, FilePlus, Download } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { SidebarTrigger } from '$lib/components/ui/sidebar/index.js';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { isMac, isTauri } from '$lib/stores/platform.svelte.js';
	import { t } from '$lib/i18n';

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

	function handleDragMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		const target = e.target as HTMLElement | null;
		if (target?.closest('button, a, input, select, textarea, [role="button"]')) {
			return;
		}
		e.preventDefault();
		if (isTauri) {
			import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
				getCurrentWindow().startDragging();
			}).catch(() => {});
		}
	}

	function handleDragDblClick(e: MouseEvent) {
		const target = e.target as HTMLElement | null;
		if (target?.closest('button, a, input, select, textarea, [role="button"]')) {
			return;
		}
		if (isTauri) {
			import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
				getCurrentWindow().toggleMaximize();
			}).catch(() => {});
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
	data-tauri-drag-region
	onmousedown={handleDragMouseDown}
	ondblclick={handleDragDblClick}
	class="flex items-center h-14 px-4 border-b border-border bg-background gap-4 overflow-hidden w-full box-border select-none"
>
	<div class="flex items-center gap-2 min-w-0 shrink-0 select-none">
		<SidebarTrigger class="h-8 w-8 transition-colors select-none {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'rounded-md hover:bg-muted'}" />

		<div class="w-px h-5 bg-border mx-1"></div>

		<!-- Action Buttons -->
		<button
			type="button"
			class="inline-flex items-center gap-1.5 h-8 px-2.5 border border-border bg-background text-[11px] font-medium text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none {uiTheme.theme === 'avant-garde' ? 'ticket-btn font-terminal uppercase tracking-wider font-semibold hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-md hover:bg-muted'}"
			onclick={onImport}
		>
			<Download class="shrink-0 w-3.5 h-3.5" />
			<span class="select-none">{t('toolbar.import')}</span>
		</button>

		<button
			type="button"
			class="inline-flex items-center gap-1.5 h-8 px-2.5 border border-border bg-background text-[11px] font-medium text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none {uiTheme.theme === 'avant-garde' ? 'ticket-btn font-terminal uppercase tracking-wider font-semibold hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-md hover:bg-muted'}"
			onclick={onNewTable}
		>
			<FilePlus class="shrink-0 w-3.5 h-3.5" />
			<span class="select-none">{t('toolbar.newTable')}</span>
		</button>

		<div class="w-px h-5 bg-border mx-1"></div>

		<div class="inline-flex border border-border overflow-hidden select-none {uiTheme.theme === 'classic' ? 'rounded-md' : ''}">
			<button
				type="button"
				class="h-8 w-8 inline-flex items-center justify-center bg-background text-foreground transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none border-r border-border select-none {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'hover:bg-muted'}"
				onclick={onUndo}
				disabled={!canUndo}
				title={t('toolbar.undoShortcut', { key: isMac ? '⌘Z' : 'Ctrl+Z' })}
				aria-label={t('toolbar.undo')}
			>
				<Undo2 class="w-3.5 h-3.5" />
			</button>
			<button
				type="button"
				class="h-8 w-8 inline-flex items-center justify-center bg-background text-foreground transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white' : 'hover:bg-muted'}"
				onclick={onRedo}
				disabled={!canRedo}
				title={t('toolbar.redoShortcut', { key: isMac ? '⌘Y' : 'Ctrl+Y' })}
				aria-label={t('toolbar.redo')}
			>
				<Redo2 class="w-3.5 h-3.5" />
			</button>
		</div>
	</div>

	<!-- Draggable middle region -->
	<div
		data-tauri-drag-region
		class="flex-1 h-full min-w-0 select-none self-stretch"
	></div>

	<div class="flex items-center gap-2 shrink-0 select-none">
		<!-- Theme Style Switcher: Classic / Avant-Garde -->
		<button
			type="button"
			class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius)] border border-border bg-background hover:bg-muted transition-all cursor-pointer select-none text-xs"
			onclick={() => uiTheme.toggle()}
			title={t('toolbar.switchStyle')}
		>
			{#if uiTheme.theme === 'avant-garde'}
				<span class="size-2 rounded-full bg-[#0202f1] shrink-0"></span>
				<span class="font-terminal text-[11px] uppercase tracking-wider font-semibold text-foreground select-none">{t('toolbar.avantGarde')}</span>
			{:else}
				<span class="size-2 rounded-full bg-muted-foreground/60 shrink-0"></span>
				<span class="text-xs text-muted-foreground font-medium select-none">{t('toolbar.classic')}</span>
			{/if}
		</button>

		<LanguageSwitcher />

		<ThemeToggle variant="outline" class="h-8 w-8 rounded-[var(--radius)] border-border hover:bg-foreground hover:text-background transition-colors select-none" />
	</div>
</header>
