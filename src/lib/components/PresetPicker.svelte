<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { cn } from '$lib/utils.js';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';
	import BorderTrace from '$lib/components/effects/BorderTrace.svelte';
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
				uiTheme.theme === 'avant-garde'
					? 'rounded-none first:rounded-none last:rounded-none data-[state=on]:border-transparent data-[state=on]:bg-[var(--cobalt-subtle)]/30 data-[state=on]:text-[var(--cobalt)]'
					: 'rounded-[2px] first:rounded-[2px] last:rounded-[2px] data-[state=on]:border-foreground data-[state=on]:shadow-[inset_0_0_0_1.5px_currentColor] data-[state=on]:bg-muted/60 data-[state=on]:text-foreground'
			)}
		>
			<BorderTrace active={value === preset.value} replayKey={animTrigger[preset.value]} />

			{#if uiTheme.theme === 'avant-garde' && value === preset.value}
				{#key `${value}-${animTrigger[preset.value]}`}
					<div class="stamp-portal pointer-events-none absolute bottom-[calc(100%-1px)] right-[-1px] z-30 overflow-hidden select-none">
						<div class="stamp-slider inline-flex items-center justify-center bg-[var(--cobalt)] px-1.5 py-0.5 relative overflow-hidden">
							<span class="stamp-label font-terminal text-[8.5px] font-bold tracking-wider leading-none text-white whitespace-nowrap">
								[{preset.code}]
							</span>
							<div class="stamp-slashes" aria-hidden="true">
								<span class="slash-line"></span>
								<span class="slash-line"></span>
							</div>
						</div>
					</div>
				{/key}
			{/if}
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
	.stamp-portal {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 0;
	}

	.stamp-slider {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background-color: var(--cobalt, #0202f1);
		border-radius: 0;
		will-change: transform;
		/* 就像从右侧一扇看不见的门里向左滑出来一样：字与色块严丝合缝从门缝探出 */
		animation: door-slide-out 340ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.stamp-label {
		display: inline-block;
		position: relative;
		z-index: 1;
	}

	.stamp-slashes {
		position: absolute;
		top: -60%;
		bottom: -60%;
		right: 0;
		display: flex;
		gap: 3.5px;
		align-items: center;
		z-index: 2;
		pointer-events: none;
		will-change: transform;
		/* 在底色和文字从门里完全滑出就位后，两条粗斜线 // 疾速从右向左刷扫掠过 */
		animation: slashes-sweep 680ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.slash-line {
		display: block;
		width: 2.5px;
		height: 220%;
		background-color: #ffffff;
		transform: skewX(-24deg);
		transform-origin: center center;
		flex-shrink: 0;
	}

	@keyframes door-slide-out {
		0% {
			transform: translateX(100%);
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
