<script lang="ts">
	// Local Fonts (100% Offline & High Performance)
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/eb-garamond/400.css';
	import '@fontsource/eb-garamond/500.css';
	import '@fontsource/eb-garamond/600.css';
	import '@fontsource/eb-garamond/700.css';
	import '@fontsource/eb-garamond/500-italic.css';
	import '@fontsource/libre-baskerville/400.css';
	import '@fontsource/libre-baskerville/700.css';
	import '@fontsource/libre-baskerville/400-italic.css';
	import '@fontsource/jetbrains-mono/400.css';
	import '@fontsource/jetbrains-mono/500.css';
	import '@fontsource/jetbrains-mono/600.css';
	import '@fontsource/jetbrains-mono/700.css';
	import '$lib/styles/source-han-sans.css';
	import '$lib/styles/source-han-serif.css';
	import '$lib/styles/computer-modern.css';

	import './layout.css';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { i18n } from '$lib/i18n';

	import { onMount } from 'svelte';
	import { isTauri } from '$lib/stores/platform.svelte.js';
	import { X } from 'lucide-svelte';

	let { children } = $props();

	onMount(async () => {
		try {
			if (typeof document !== 'undefined' && 'fonts' in document) {
				await Promise.race([
					document.fonts.ready,
					new Promise((resolve) => setTimeout(resolve, 1500))
				]);
			}
			if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
				const { getCurrentWindow } = await import('@tauri-apps/api/window');
				await getCurrentWindow().show();
			}
		} catch (e) {
			console.error('Failed to show window:', e);
		}
	});

	$effect(() => {
		const current = uiTheme.theme;
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', current);
		}
	});

	$effect(() => {
		i18n.locale;
		i18n.apply();
	});
</script>

{#snippet closeIconSnippet()}
	<X class="size-3 stroke-[2.2]" />
{/snippet}

<ModeWatcher />
<Toaster
	theme={mode.current}
	closeButton={true}
	duration={2500}
	closeIcon={closeIconSnippet}
/>
{@render children()}

