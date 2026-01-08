<script lang="ts">
	import './layout.css';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher, mode } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />
<Toaster theme={mode.current} />
{@render children()}
