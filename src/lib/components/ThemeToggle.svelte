<script lang="ts">
	import SunIcon from 'lucide-svelte/icons/sun';
	import MoonIcon from 'lucide-svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import AppTooltip from '$lib/components/AppTooltip.svelte';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { t } from '$lib/i18n';

	interface Props {
		variant?: ButtonProps['variant'];
		class?: string;
	}

	let { variant, class: className }: Props = $props();
</script>

<AppTooltip text={t('a11y.toggleTheme')} onclick={toggleMode}>
	{#snippet children({ props })}
		<Button
			variant={variant || (uiTheme.theme === 'avant-garde' ? 'ghost' : 'outline')}
			size="icon"
			class={className}
			{...props}
			onclick={toggleMode}
		>
			<SunIcon class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
			<MoonIcon class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0" />
			<span class="sr-only">{t('a11y.toggleTheme')}</span>
		</Button>
	{/snippet}
</AppTooltip>
