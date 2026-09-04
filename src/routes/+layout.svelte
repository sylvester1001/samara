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
	import 'computer-modern/cmu-serif.css';

	import './layout.css';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { i18n } from '$lib/i18n';

	let { children } = $props();

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

<ModeWatcher />
<Toaster theme={mode.current} />
{@render children()}

