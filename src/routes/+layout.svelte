<script lang="ts">
	import './layout.css';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';

	let { children } = $props();

	$effect(() => {
		uiTheme.apply();
	});
</script>

<ModeWatcher />
<Toaster theme={mode.current} />
{@render children()}

