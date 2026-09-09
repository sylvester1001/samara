<script module lang="ts">
	/** 传给 overlay snippet 的几何信息，坐标系与描边路径完全一致（原点 = 描边外框左上角，单位 CSS px） */
	export interface BorderTraceGeometry {
		/** 描边外框宽高，已对齐到物理像素 */
		frameW: number;
		frameH: number;
		/** 描边宽度（已对齐到整数物理像素）；描边内沿 = strokeWidth，即宿主 border-box 外沿 + gap */
		strokeWidth: number;
		dpr: number;
		/** 最小整数 n，使 n × dpr 为整数；尺寸取 grid 的倍数即可同时落在 CSS 像素与物理像素网格上 */
		grid: number;
	}
</script>

<script lang="ts">
	import { uiTheme, themeFeatures } from '$lib/stores/ui-theme.svelte.js';
	import type { Snippet } from 'svelte';

	interface Props {
		active?: boolean;
		durationMs?: number;
		color?: string;
		strokeWidth?: number;
		class?: string;
		replayKey?: number;
		/** 宿主元素 border-box 外沿与描边内沿之间的间隙（CSS px）。0 = 描边紧贴宿主边框外侧包裹 */
		gap?: number;
		/** HTML 覆盖层（右沿 / 上沿与描边外沿对齐） */
		children?: Snippet;
		/**
		 * SVG 覆盖层：渲染在描边所在的同一个 <svg> 里，与路径共用坐标系和光栅化路径，
		 * 需要和描边严格像素对齐的元素（例如角标色块）应该放在这里而不是 children。
		 */
		overlay?: Snippet<[BorderTraceGeometry]>;
	}

	let {
		active = false,
		durationMs = 1000,
		color = 'var(--cobalt, #0202f1)',
		strokeWidth = 2,
		class: className = '',
		replayKey = 0,
		gap = 0,
		children,
		overlay
	}: Props = $props();

	const isEnabled = $derived(themeFeatures[uiTheme.theme]?.borderTrace ?? false);

	let containerEl = $state<HTMLDivElement | null>(null);
	let pathEl = $state<SVGPathElement | null>(null);

	/**
	 * 物理像素对齐后的几何信息。
	 *
	 * 背景：Blink 绘制普通盒子时把边缘吸附到整数 CSS 像素；合成层（stamp 的 transform 动画层）
	 * 则由 cc 吸附到整数物理像素；SVG 描边是连续几何做抗锯齿。三者规则不同，在 dpr=1.5 这类
	 * 非整数缩放下，奇数 CSS 像素会落在半个物理像素上，于是标签与描边出现 1 物理像素错位。
	 *
	 * 解法：
	 * 1. 把 SVG 根和子内容包装层都放到整数 CSS 像素的盒子上（layerLeft/Top/Width/Height），
	 *    避免 Blink 对 SVG 根做"吸附后再缩放内容"的处理，让路径坐标与 CSS 像素 1:1。
	 * 2. 用 transform 把 SVG 根精确平移到物理像素网格（transform 不受 Blink 的 CSS 像素吸附影响），
	 *    路径外框 [0, frameW] × [0, frameH] 的尺寸为 1/dpr 的整数倍，线宽为整数物理像素，
	 *    于是描边每条边的两侧都恰好落在物理像素边界上，不再发虚。
	 * 3. 子内容层同样用 transform 平移，使 right:0 的标签右沿与描边外沿落在同一个物理像素上。
	 */
	interface Geometry {
		dpr: number;
		grid: number;
		/** 整数 CSS 像素盒（相对容器），SVG 根与子内容层都放在这个盒子上 */
		layerLeft: number;
		layerTop: number;
		layerWidth: number;
		layerHeight: number;
		/** 物理像素对齐后的描边外框尺寸（CSS 像素，均为 1/dpr 的整数倍） */
		frameW: number;
		frameH: number;
		/** 把 SVG 根从整数 CSS 像素盒平移到物理像素网格上的位移 */
		svgShiftX: number;
		svgShiftY: number;
		/** 把子内容层（right:0 / top 锚定）平移到同一物理像素网格上的位移 */
		kidsShiftX: number;
		kidsShiftY: number;
	}

	let geom = $state<Geometry | null>(null);

	function snapDevice(v: number, dpr: number) {
		return Math.round(v * dpr) / dpr;
	}

	// dpr 1.5 → 2，1.25 / 1.75 → 4，1 / 2 → 1；找不到则退回 1
	function deviceGrid(dpr: number) {
		for (let n = 1; n <= 16; n++) {
			if (Math.abs(n * dpr - Math.round(n * dpr)) < 1e-3) return n;
		}
		return 1;
	}

	function measure(el: HTMLElement): Geometry | null {
		const rect = el.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;
		const dpr = window.devicePixelRatio || 1;

		// Blink 绘制普通盒子时使用的整数 CSS 像素坐标；
		// SVG 根与子内容层的布局位置都对齐到这里，使其自身的像素吸附成为无操作
		const cssL = Math.round(rect.left);
		const cssT = Math.round(rect.top);
		const cssR = Math.round(rect.right);
		const cssB = Math.round(rect.bottom);

		// 目标：四条边所在的物理像素边界（以 CSS 像素表示）
		const devL = snapDevice(rect.left, dpr);
		const devT = snapDevice(rect.top, dpr);
		const devR = snapDevice(rect.right, dpr);
		const devB = snapDevice(rect.bottom, dpr);

		return {
			dpr,
			grid: deviceGrid(dpr),
			layerLeft: cssL - rect.left,
			layerTop: cssT - rect.top,
			layerWidth: cssR - cssL,
			layerHeight: cssB - cssT,
			frameW: devR - devL,
			frameH: devB - devT,
			// transform 平移不经过 CSS 像素吸附，可精确落到 1/dpr 网格
			svgShiftX: devL - cssL,
			svgShiftY: devT - cssT,
			kidsShiftX: devR - cssR,
			kidsShiftY: devT - cssT
		};
	}

	// 宿主（position: relative 的父元素）的边框宽度，用来把描边推到宿主 border-box 之外
	let hostBorder = $state(0);

	$effect(() => {
		if (!containerEl) return;
		const el = containerEl;
		const update = () => {
			const host = el.parentElement;
			if (host) {
				hostBorder = parseFloat(getComputedStyle(host).borderTopWidth) || 0;
			}
			const next = measure(el);
			if (next) geom = next;
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	});

	// 线宽对齐到整数物理像素（dpr 在挂载前就已知，不必等 measure）
	const dpr = $derived(geom?.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
	const crispStrokeWidth = $derived(Math.max(1, Math.round(strokeWidth * dpr)) / dpr);
	const half = $derived(crispStrokeWidth / 2);

	// 容器相对宿主 padding-box 向外扩张的距离：越过宿主边框 + 间隙 + 整条描边，
	// 于是描边内沿正好落在「宿主 border-box 外沿 + gap」处，从外侧包裹卡片
	const outset = $derived(hostBorder + gap + crispStrokeWidth);

	// 描边中心线所在的矩形：SVG 原点已在物理像素上，外沿 = [0, frameW] × [0, frameH]，向内缩半个线宽
	const x0 = $derived(half);
	const y0 = $derived(half);
	const x1 = $derived((geom?.frameW ?? 0) - half);
	const y1 = $derived((geom?.frameH ?? 0) - half);
	const innerW = $derived(Math.max(0, x1 - x0));
	const innerH = $derived(Math.max(0, y1 - y0));

	// 起笔点在顶边 68% 处
	const START_RATIO = 0.68;

	const perimeter = $derived(2 * (innerW + innerH));
	const startX = $derived(x0 + innerW * START_RATIO);
	const pathD = $derived(`M ${startX} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} L ${x0} ${y0} Z`);

	$effect(() => {
		const _trigger = replayKey;
		if (!pathEl || !isEnabled || !active || !geom || innerW <= 0 || innerH <= 0) return;

		const el = pathEl;
		const total = perimeter;
		// 第一阶段终点：左下角。此前走过 顶边右段 + 右边 + 底边。
		const phase1Length = (x1 - startX) + innerH + innerW;

		el.style.strokeDasharray = `${total}px ${total}px`;
		el.style.strokeDashoffset = `${total}px`;

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

		animation.onfinish = () => {
			el.style.strokeDasharray = 'none';
			el.style.strokeDashoffset = '0';
		};

		return () => {
			animation.cancel();
		};
	});

	const layerStyle = $derived(
		geom
			? `left:${geom.layerLeft}px;top:${geom.layerTop}px;width:${geom.layerWidth}px;height:${geom.layerHeight}px;`
			: 'left:0;top:0;width:100%;height:100%;'
	);
	const svgStyle = $derived(
		geom ? `${layerStyle}transform:translate(${geom.svgShiftX}px,${geom.svgShiftY}px);` : layerStyle
	);
	const childrenStyle = $derived(
		geom ? `${layerStyle}transform:translate(${geom.kidsShiftX}px,${geom.kidsShiftY}px);` : layerStyle
	);
</script>

{#if isEnabled && active}
	<div
		bind:this={containerEl}
		class="pointer-events-none absolute z-20 overflow-visible {className}"
		style="inset:-{outset}px"
		aria-hidden="true"
	>
		<!--
			SVG 根先放在整数 CSS 像素盒子上（让 Blink 的盒子吸附成为无操作），
			再用 transform 精确平移到物理像素网格；不设 viewBox，坐标与 CSS 像素 1:1。
			路径外沿 = [0, frameW] × [0, frameH]，线宽为整数物理像素，所以每条边都落在整像素上。
			shape-rendering=crispEdges 作为兜底：即使有 1/64px 级布局误差也不会出现半透明边缘。
		-->
		<svg class="absolute overflow-visible" style={svgStyle}>
			<path
				bind:this={pathEl}
				d={pathD}
				fill="none"
				stroke={color}
				stroke-width={crispStrokeWidth}
				stroke-linecap="butt"
				stroke-linejoin="miter"
				stroke-miterlimit="10"
				shape-rendering="crispEdges"
				stroke-dasharray="{perimeter} {perimeter}"
				stroke-dashoffset={perimeter}
			/>
			{#if geom && overlay}
				{@render overlay({
					frameW: geom.frameW,
					frameH: geom.frameH,
					strokeWidth: crispStrokeWidth,
					dpr: geom.dpr,
					grid: geom.grid
				})}
			{/if}
		</svg>
		<div class="absolute overflow-visible" style={childrenStyle}>
			{@render children?.()}
		</div>
	</div>
{/if}
