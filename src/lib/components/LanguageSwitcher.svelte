<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { i18n, t, type Locale } from '$lib/i18n';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { Languages } from 'lucide-svelte';

	const languages: { id: Locale; label: string; short: string; lang?: string }[] = [
		{ id: 'zh-CN', label: '简体中文', short: '简', lang: 'zh-CN' },
		{ id: 'zh-TW', label: '繁體中文', short: '繁', lang: 'zh-TW' },
		{ id: 'en', label: 'English', short: 'EN', lang: 'en' }
	];

	const current = $derived(languages.find((lang) => lang.id === i18n.locale) ?? languages[2]);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				size="sm"
				class="h-8 px-2.5 gap-1.5 {uiTheme.theme === 'avant-garde' ? 'hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-md hover:bg-muted'}"
				title={t('toolbar.language')}
				aria-label={t('toolbar.language')}
				{...props}
			>
				<Languages data-icon="inline-start" />
				<span
					class="text-[11px] font-terminal font-semibold uppercase tracking-wider select-none"
					lang={current.lang}
				>{current.short}</span>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-40 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}">
		<DropdownMenu.Group>
			{#each languages as lang}
				<DropdownMenu.Item
					class="flex items-center justify-between {i18n.locale === lang.id ? 'font-semibold' : ''}"
					onSelect={() => i18n.setLocale(lang.id)}
				>
					<span lang={lang.lang}>{lang.label}</span>
					{#if i18n.locale === lang.id}
						<span class="text-[10px] text-muted-foreground" lang={lang.lang}>{lang.short}</span>
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
