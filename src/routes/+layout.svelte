<script lang="ts">
	import './layout.css';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';

	let { children } = $props();

	$effect(() => {
		const current = uiTheme.theme;
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', current);
		}
	});
</script>

<ModeWatcher />
<Toaster theme={mode.current} />
{@render children()}

