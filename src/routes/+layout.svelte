<script lang="ts">
	import './layout.css';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<Toaster />
{@render children()}
