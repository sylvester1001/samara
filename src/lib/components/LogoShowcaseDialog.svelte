<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import BrandLogo from './BrandLogo.svelte';
	import { Check } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	let {
		open = $bindable(false),
		currentVariant = $bindable<'user-samara' | 'engraved-single' | 'engraved-dual'>('user-samara'),
		currentFont = $bindable<'baskerville' | 'garamond' | 'mono'>('garamond')
	}: {
		open?: boolean;
		currentVariant?: 'user-samara' | 'engraved-single' | 'engraved-dual';
		currentFont?: 'baskerville' | 'garamond' | 'mono';
	} = $props();

	const variants = $derived([
		{
			id: 'user-samara' as const,
			title: t('logo.twinTitle'),
			subtitle: t('logo.twinSubtitle'),
			desc: t('logo.twinDesc')
		},
		{
			id: 'engraved-single' as const,
			title: t('logo.singleTitle'),
			subtitle: t('logo.singleSubtitle'),
			desc: t('logo.singleDesc')
		},
		{
			id: 'engraved-dual' as const,
			title: t('logo.dualTitle'),
			subtitle: t('logo.dualSubtitle'),
			desc: t('logo.dualDesc')
		}
	]);

	const fonts = $derived([
		{
			id: 'baskerville' as const,
			label: 'Libre Baskerville',
			preview: 'Samara',
			desc: t('logo.fontBaskerville')
		},
		{
			id: 'garamond' as const,
			label: 'EB Garamond',
			preview: 'Samara',
			desc: t('logo.fontGaramond')
		},
		{
			id: 'mono' as const,
			label: 'JetBrains Mono',
			preview: 'samara',
			desc: t('logo.fontMono')
		}
	]);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl bg-background border border-border p-6 shadow-2xl">
		<Dialog.Header class="pb-2">
			<Dialog.Title class="text-base font-terminal uppercase tracking-widest text-foreground flex items-center gap-2">
				<span>✦</span>
				<span>{t('logo.galleryTitle')}</span>
			</Dialog.Title>
			<Dialog.Description class="text-xs text-muted-foreground">
				{t('logo.galleryDesc')}
			</Dialog.Description>
		</Dialog.Header>

		<!-- 1. Logo 图标方案对比 -->
		<div class="space-y-3 pt-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold block">
				{t('logo.selectGlyph')}
			</span>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				{#each variants as item}
					<button
						type="button"
						class="text-left p-3.5 rounded-[2px] border transition-all cursor-pointer relative flex flex-col items-center justify-between gap-3 group {currentVariant === item.id ? 'border-primary bg-primary/5 ring-1 ring-primary/40' : 'border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40'}"
						onclick={() => (currentVariant = item.id)}
					>
						{#if currentVariant === item.id}
							<div class="absolute top-2 right-2 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
								<Check class="size-2.5 stroke-[3]" />
							</div>
						{/if}

						<div class="size-16 rounded-[4px] bg-background border border-border/60 flex items-center justify-center p-1.5 shadow-xs group-hover:scale-105 transition-transform">
							<BrandLogo variant={item.id} class="w-12 h-8 text-foreground" />
						</div>

						<div class="w-full text-center">
							<div class="text-xs font-semibold text-foreground tracking-tight">
								{item.title}
							</div>
							<div class="text-[9px] font-terminal text-muted-foreground mt-0.5 opacity-80 uppercase tracking-wider">
								{item.subtitle}
							</div>
							<p class="text-[11px] text-muted-foreground/90 mt-2 text-left leading-relaxed line-clamp-3">
								{item.desc}
							</p>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- 2. 字标字体排版对比 -->
		<div class="space-y-3 pt-3">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold block">
				{t('logo.selectType')}
			</span>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
				{#each fonts as f}
					<button
						type="button"
						class="p-2.5 rounded-[2px] border text-left transition-all cursor-pointer flex flex-col justify-between {currentFont === f.id ? 'border-primary bg-primary/5 ring-1 ring-primary/40' : 'border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40'}"
						onclick={() => (currentFont = f.id)}
					>
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-terminal uppercase tracking-wider text-muted-foreground">
								{f.label}
							</span>
							{#if currentFont === f.id}
								<Check class="size-3 text-primary stroke-[2.5]" />
							{/if}
						</div>

						<div class="py-2.5">
							{#if f.id === 'baskerville'}
								<span class="font-baskerville text-xl font-bold tracking-tight text-foreground">Samara</span>
							{:else if f.id === 'garamond'}
								<span class="font-garamond text-2xl font-semibold tracking-wide text-foreground">Samara</span>
							{:else}
								<span class="font-mono-brand text-sm tracking-wider font-semibold text-foreground">samara</span>
							{/if}
						</div>

						<span class="text-[10px] text-muted-foreground leading-snug">
							{f.desc}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- 3. 当前实时合体效果预览 -->
		<div class="mt-4 p-3.5 rounded-[2px] bg-muted/40 border border-border/80 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex items-center justify-center shrink-0">
					<BrandLogo variant={currentVariant} class="w-8 h-5.5 text-[#0202f1]" color="#0202f1" />
				</div>
				<div class="flex flex-col leading-none">
					{#if currentFont === 'baskerville'}
						<span class="font-baskerville text-lg font-bold tracking-tight text-foreground">Samara</span>
					{:else if currentFont === 'garamond'}
						<span class="font-garamond text-xl font-semibold tracking-wide text-foreground">Samara</span>
					{:else}
						<span class="font-mono-brand text-sm font-semibold tracking-wider text-foreground">samara</span>
					{/if}
					<span class="text-[8.5px] font-terminal tracking-wider text-muted-foreground uppercase mt-0.5">{t('preview.academicTag')}</span>
				</div>
			</div>

			<button
				type="button"
				class="px-4 py-1.5 rounded-[2px] bg-foreground text-background text-xs font-terminal uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
				onclick={() => (open = false)}
			>
				{t('common.done')}
			</button>
		</div>
	</Dialog.Content>
</Dialog.Root>
