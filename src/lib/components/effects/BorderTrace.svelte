<script lang="ts">
	import { uiTheme, themeFeatures } from '$lib/stores/ui-theme.svelte.js';

	interface Props {
		active?: boolean;
		durationMs?: number;
		color?: string;
		strokeWidth?: number;
		class?: string;
		replayKey?: number;
	}

	let {
		active = false,
		durationMs = 1000,
		color = 'var(--cobalt, #0202f1)',
		strokeWidth = 1.75,
		class: className = '',
		replayKey = 0
	}: Props = $props();

	const isEnabled = $derived(themeFeatures[uiTheme.theme]?.borderTrace ?? false);

	let pathEl = $state<SVGPathElement | null>(null);

	// 实测容器像素尺寸。viewBox 与像素 1:1 对齐，这样 stroke-dasharray / dashoffset 都是真实像素长度。
	// 之前用 viewBox 0 0 100 100 + pathLength=100 + non-scaling-stroke 的组合，在 Chromium 里
	// 虚线会按"屏幕像素 × (真实路径长/pathLength)"计算，非正方形容器上路径在 dashoffset 远未到 0 时就已画满，
	// 动画后半段全部是死时间，因此看不到任何减速。
	let width = $state(0);
	let height = $state(0);

	// 起笔点在顶边 68% 处
	const START_RATIO = 0.68;

	const perimeter = $derived(2 * (width + height));
	const startX = $derived(width * START_RATIO);
	const pathD = $derived(
		`M ${startX} 0 L ${width} 0 L ${width} ${height} L 0 ${height} L 0 0 Z`
	);

	$effect(() => {
		const _trigger = replayKey;
		if (!pathEl || !isEnabled || !active || width <= 0 || height <= 0) return;

		const el = pathEl;
		const total = perimeter;
		// 第一阶段终点：左下角。此前走过 顶边右段 + 右边 + 底边。
		const phase1Length = (width - startX) + height + width;

		el.style.strokeDasharray = `${total}px ${total}px`;
		el.style.strokeDashoffset = `${total}px`;

		// 两段式曲线（单条 cubic-bezier 无法为尾段单独分配时间）：
		//   阶段 1（0 → 左下角，占 40% 时间）easeInExpo：慢起笔 -> 加速甩过右边、底边
		//   阶段 2（左下角 → 合拢，占 60% 时间）easeOutCubic：沿左边、顶边匀减速滑行
		// 尾段刻意不用 easeOutExpo：expo 在前 1/10 时间就走完一半路程，剩下的位移只有几像素，
		// 对 1.75px 宽的线来说等同于"瞬间停住"；cubic 的速度是线性衰减，减速过程本身可见。
		const animation = el.animate(
			[
				{ strokeDashoffset: `${total}px`, offset: 0, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' },
				{ strokeDashoffset: `${total - phase1Length}px`, offset: 0.4, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
				{ strokeDashoffset: '0px', offset: 1 }
			],
			{
				duration: durationMs,
				fill: 'forwards'
			}
		);

		// 动画结束时转为封闭实线，消除接缝
		animation.onfinish = () => {
			el.style.strokeDasharray = 'none';
			el.style.strokeDashoffset = '0';
		};

		return () => {
			animation.cancel();
		};
	});
</script>

{#if isEnabled && active}
	<div
		class="pointer-events-none absolute inset-0 z-20 overflow-visible {className}"
		aria-hidden="true"
		bind:clientWidth={width}
		bind:clientHeight={height}
	>
		<svg
			class="h-full w-full overflow-visible"
			viewBox="0 0 {width} {height}"
			preserveAspectRatio="none"
		>
			<!--
				纯 90° 直角描边（stroke-linejoin: miter），坐标为真实像素：
				起笔于顶边 68% 处 -> 右上角 -> 右下角 -> 左下角（阶段 1 结束）-> 左上角 -> 回到起点合拢（阶段 2）
			-->
			<path
				bind:this={pathEl}
				d={pathD}
				fill="none"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-linecap="butt"
				stroke-linejoin="miter"
				stroke-miterlimit="10"
				stroke-dasharray="{perimeter} {perimeter}"
				stroke-dashoffset={perimeter}
			/>
		</svg>
	</div>
{/if}
