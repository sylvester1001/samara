<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { cn } from '$lib/utils.js';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import BorderTrace, { type BorderTraceGeometry } from '$lib/components/effects/BorderTrace.svelte';
	import type { TableStyle } from '$lib/types';
	import { t } from '$lib/i18n';

	interface Props {
		value: TableStyle['preset'];
		onValueChange?: (preset: TableStyle['preset']) => void;
	}

	let { value, onValueChange }: Props = $props();

	let animTrigger = $state<Record<string, number>>({
		booktabs: 0,
		bordered: 0,
		minimal: 0
	});

	const presets = $derived([
		{ value: 'booktabs' as TableStyle['preset'], label: t('preset.booktabs'), code: 'PR-01' },
		{ value: 'bordered' as TableStyle['preset'], label: t('preset.bordered'), code: 'PR-02' },
		{ value: 'minimal' as TableStyle['preset'], label: t('preset.minimal'), code: 'PR-03' }
	]);

	function handleItemClick(presetVal: TableStyle['preset']) {
		animTrigger[presetVal] = (animTrigger[presetVal] || 0) + 1;
		if (value !== presetVal) {
			onValueChange?.(presetVal);
		}
	}

	function handleChange(next: string | undefined) {
		if (next === 'booktabs' || next === 'bordered' || next === 'minimal') {
			animTrigger[next] = (animTrigger[next] || 0) + 1;
			onValueChange?.(next);
		}
	}

	// 角标色块的名义尺寸（CSS px）。实际尺寸会向上取整到 BorderTrace 给出的 grid 倍数，
	// 使四条边同时落在整数 CSS 像素与整数物理像素上。
	const STAMP_W = 44;
	const STAMP_H = 16;
	function snapUp(v: number, grid: number) {
		return Math.ceil(v / grid) * grid;
	}
</script>

<ToggleGroup.Root
	type="single"
	{value}
	onValueChange={handleChange}
	class="grid w-full grid-cols-3 gap-2 p-0.5 pt-4"
>
	{#each presets as preset}
		<ToggleGroup.Item
			value={preset.value}
			aria-label={preset.label}
			onclick={() => handleItemClick(preset.value)}
			class={cn(
				'relative ml-0 flex h-auto min-w-0 flex-col gap-1.5 border border-border bg-background p-1.5 shadow-none transition-all overflow-visible',
				'first:ml-0',
				'hover:border-foreground/40 hover:text-foreground',
				'focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 ring-0 ring-offset-0 outline-none',
				uiTheme.theme === 'avant-garde'
					? 'rounded-none first:rounded-none last:rounded-none data-[state=on]:border-transparent data-[state=on]:bg-background data-[state=on]:text-[var(--cobalt)]'
					: 'rounded-[2px] first:rounded-[2px] last:rounded-[2px] data-[state=on]:border-foreground data-[state=on]:shadow-[inset_0_0_0_1.5px_currentColor] data-[state=on]:bg-muted/60 data-[state=on]:text-foreground'
			)}
		>
			<BorderTrace active={value === preset.value} replayKey={animTrigger[preset.value]}>
				{#snippet overlay(g: BorderTraceGeometry)}
					{#if uiTheme.theme === 'avant-garde' && value === preset.value}
						{@const w = snapUp(STAMP_W, g.grid)}
						{@const h = snapUp(STAMP_H, g.grid)}
						{#key `${value}-${animTrigger[preset.value]}`}
							<!--
								角标色块画在描边所在的同一个 <svg> 里：右边 x = g.frameW 与描边外沿是同一个坐标，
								同一套光栅化，不存在 HTML 盒子按 CSS 像素吸附导致的半像素错位。
								底边 y = g.strokeWidth 即描边内沿（卡片 border-box 外沿），色块坐在卡片外延上、
								与蓝色边框共用同一条基线，盖住顶边描边的右段。
								嵌套 <svg> 充当「门框」（overflow hidden 做裁切），内部 <g> 从右侧滑出。
							-->
							<svg
								class="stamp-portal select-none"
								x={g.frameW - w}
								y={g.strokeWidth - h}
								width={w}
								height={h}
								overflow="hidden"
								style="--stamp-w:{w}px"
							>
								<g class="stamp-slider">
									<rect width={w} height={h} fill="var(--cobalt, #0202f1)" shape-rendering="crispEdges" />
									<text
										class="stamp-label font-terminal text-[8.5px] font-bold tracking-wider fill-white"
										x={w / 2}
										y={h / 2}
										text-anchor="middle"
										dominant-baseline="central"
									>[{preset.code}]</text>
									<g class="stamp-slashes" aria-hidden="true">
										<rect class="slash-line" x={w} y={-h} width="2.5" height={h * 3} transform="skewX(-24)" />
										<rect class="slash-line" x={w + 6} y={-h} width="2.5" height={h * 3} transform="skewX(-24)" />
									</g>
								</g>
							</svg>
						{/key}
					{/if}
				{/snippet}
			</BorderTrace>
			<div class={cn(
				'flex aspect-[5/4] w-full items-center justify-center overflow-hidden bg-muted/40 p-1.5',
				uiTheme.theme === 'avant-garde' ? 'rounded-none' : 'rounded-[1px]'
			)}>
				{#if preset.value === 'booktabs'}
					<div class="flex h-full w-full flex-col justify-between py-0.5">
						<div class="h-0.5 rounded-full bg-foreground"></div>
						<div class="grid grid-cols-3 gap-1 px-0.5">
							<div class="h-1 rounded-sm bg-foreground/70"></div>
							<div class="h-1 rounded-sm bg-foreground/70"></div>
							<div class="h-1 rounded-sm bg-foreground/70"></div>
						</div>
						<div class="h-px bg-foreground/80"></div>
						<div class="grid grid-cols-3 gap-1 px-0.5">
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
						</div>
						<div class="grid grid-cols-3 gap-1 px-0.5">
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/50"></div>
						</div>
						<div class="h-0.5 rounded-full bg-foreground"></div>
					</div>
				{:else if preset.value === 'bordered'}
					<div class="grid h-full w-full grid-cols-3 grid-rows-3 border border-foreground/80">
						{#each Array(9) as _}
							<div class="border border-foreground/50"></div>
						{/each}
					</div>
				{:else}
					<div class="flex h-full w-full flex-col justify-center gap-1.5 px-0.5">
						<div class="grid grid-cols-3 gap-1">
							<div class="h-1 rounded-sm bg-foreground/60"></div>
							<div class="h-1 rounded-sm bg-foreground/60"></div>
							<div class="h-1 rounded-sm bg-foreground/60"></div>
						</div>
						<div class="grid grid-cols-3 gap-1">
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
						</div>
						<div class="grid grid-cols-3 gap-1">
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
							<div class="h-1 rounded-sm bg-muted-foreground/40"></div>
						</div>
					</div>
				{/if}
			</div>
			<div class="flex flex-col items-center justify-center w-full gap-0.5 select-none">
				<span class="text-[10px] font-terminal uppercase tracking-widest font-semibold leading-none">{preset.label}</span>
			</div>
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>

<style>
	/* 嵌套 <svg> 作为门框：overflow hidden 裁掉门外的部分 */
	.stamp-portal {
		overflow: hidden;
		pointer-events: none;
	}

	.stamp-slider {
		/* 就像从右侧一扇看不见的门里向左滑出来一样：字与色块严丝合缝从门缝探出 */
		animation: door-slide-out 340ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.stamp-label {
		user-select: none;
	}

	.stamp-slashes {
		/* 在底色和文字从门里完全滑出就位后，两条粗斜线 // 疾速从右向左刷扫掠过 */
		animation: slashes-sweep 680ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.slash-line {
		fill: #ffffff;
	}

	@keyframes door-slide-out {
		0% {
			transform: translateX(var(--stamp-w, 100%));
		}
		100% {
			transform: translateX(0);
		}
	}

	@keyframes slashes-sweep {
		0%, 30% {
			transform: translateX(35px);
			opacity: 0;
		}
		34% {
			transform: translateX(30px);
			opacity: 1;
		}
		100% {
			transform: translateX(-65px);
			opacity: 1;
		}
	}
</style>
