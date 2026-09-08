<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AppTooltip from '$lib/components/AppTooltip.svelte';
	import { t, type TranslationKey } from '$lib/i18n';
	import { uiTheme, type UiTheme } from '$lib/stores/ui-theme.svelte.js';
	import { Palette, Check } from 'lucide-svelte';

	interface ThemeItem {
		id: UiTheme;
		labelKey: TranslationKey;
		dotClass: string;
		badge?: string;
	}

	const themes: ThemeItem[] = [
		{
			id: 'avant-garde',
			labelKey: 'toolbar.avantGarde',
			dotClass: 'bg-[#0202f1]',
			badge: 'NEW'
		},
		{
			id: 'classic',
			labelKey: 'toolbar.classic',
			dotClass: 'bg-muted-foreground/60',
			badge: 'STD'
		}
	];

	const current = $derived(themes.find((item) => item.id === uiTheme.theme) ?? themes[0]);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<AppTooltip text={t('toolbar.switchStyle')} childProps={props}>
				{#snippet children({ props: tooltipProps })}
					<Button
						variant="outline"
						size="sm"
						class="h-8 px-2.5 gap-1.5 {uiTheme.theme === 'avant-garde' ? 'ticket-btn font-terminal uppercase hover:bg-[#0202f1] hover:text-white hover:border-[#0202f1]' : 'rounded-md hover:bg-muted'}"
						aria-label={t('toolbar.switchStyle')}
						{...tooltipProps}
					>
						<Palette class="w-3.5 h-3.5 shrink-0" />
						<span class="text-[11px] font-terminal font-semibold uppercase tracking-wider select-none">
							{t(current.labelKey)}
						</span>
					</Button>
				{/snippet}
			</AppTooltip>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-44 {uiTheme.theme === 'avant-garde' ? 'font-terminal text-xs' : ''}">
		<DropdownMenu.Group>
			{#each themes as item}
				<DropdownMenu.Item
					class="flex items-center justify-between cursor-pointer {uiTheme.theme === item.id ? 'font-semibold' : ''}"
					onSelect={() => uiTheme.setTheme(item.id)}
				>
					<div class="flex items-center gap-2">
						<span class="size-2 rounded-full {item.dotClass} shrink-0"></span>
						<span>{t(item.labelKey)}</span>
					</div>
					{#if uiTheme.theme === item.id}
						<Check class="w-3.5 h-3.5 text-primary" />
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
