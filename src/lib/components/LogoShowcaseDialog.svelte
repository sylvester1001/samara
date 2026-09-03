<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import BrandLogo from './BrandLogo.svelte';
	import { Check } from 'lucide-svelte';

	let {
		open = $bindable(false),
		currentVariant = $bindable<'user-samara' | 'engraved-single' | 'engraved-dual'>('user-samara'),
		currentFont = $bindable<'baskerville' | 'garamond' | 'mono'>('garamond')
	}: {
		open?: boolean;
		currentVariant?: 'user-samara' | 'engraved-single' | 'engraved-dual';
		currentFont?: 'baskerville' | 'garamond' | 'mono';
	} = $props();

	const variants: { id: 'user-samara' | 'engraved-single' | 'engraved-dual'; title: string; subtitle: string; desc: string }[] = [
		{
			id: 'user-samara',
			title: '交错对偶翅果标 (Twin Samaras)',
			subtitle: 'Handcrafted Botanical Vector',
			desc: '1:1 高清矢量重构自你提供的手绘插画：实心墨色种核、交错舒展的透光波浪翅膜、带微环的优雅果柄。神韵完整保留，无限放大不失真。'
		},
		{
			id: 'engraved-single',
			title: '独羽垂悬标 (Solitary Samara)',
			subtitle: 'Single Botanical Engraving',
			desc: '单体翅果的核心骨架。顶部为细密螺旋纹种核，向下垂悬展开扇形薄翼，翼面布满精细手绘刻线。纯正博物学手绘质感。'
		},
		{
			id: 'engraved-dual',
			title: '对偶垂悬标 (Dual Samaras)',
			subtitle: 'Paired Symmetrical Study',
			desc: '两枚果实垂悬交织的瞬间。两翼在下方对称舒展，微呈 90° 扇面平衡，兼顾自然植物的野趣与学术图鉴的对称美。'
		}
	];

	const fonts: { id: 'baskerville' | 'garamond' | 'mono'; label: string; preview: string; desc: string }[] = [
		{
			id: 'baskerville',
			label: 'Libre Baskerville',
			preview: 'Samara',
			desc: '英国剑桥大学出版社经典学术印刷体 — 敦厚、端庄、正统学术典籍感'
		},
		{
			id: 'garamond',
			label: 'EB Garamond',
			preview: 'Samara',
			desc: '欧陆人文主义学术经典 — 笔触沉稳细腻，毫无轻浮脂粉气'
		},
		{
			id: 'mono',
			label: 'JetBrains Mono',
			preview: 'samara',
			desc: '极客学术代码等宽体 — 古典版画图腾 + 现代学术编译器的反差美感'
		}
	];
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl bg-background border border-border p-6 shadow-2xl">
		<Dialog.Header class="pb-2">
			<Dialog.Title class="text-base font-terminal uppercase tracking-widest text-foreground flex items-center gap-2">
				<span>✦</span>
				<span>Samara Botanical Engraving Gallery</span>
			</Dialog.Title>
			<Dialog.Description class="text-xs text-muted-foreground">
				基于你所钟爱的自然线描手绘图，提炼出 3 款去繁就简的纯线描学术版画徽标。
			</Dialog.Description>
		</Dialog.Header>

		<!-- 1. Logo 图标方案对比 -->
		<div class="space-y-3 pt-2">
			<span class="text-[10px] font-terminal uppercase tracking-widest text-muted-foreground font-semibold block">
				01 // Select Botanical Glyph
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
				02 // Select Academic Typography
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
					<span class="text-[8.5px] font-terminal tracking-wider text-muted-foreground uppercase mt-0.5">ACADEMIC // v0.1</span>
				</div>
			</div>

			<button
				type="button"
				class="px-4 py-1.5 rounded-[2px] bg-foreground text-background text-xs font-terminal uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
				onclick={() => (open = false)}
			>
				Done
			</button>
		</div>
	</Dialog.Content>
</Dialog.Root>
