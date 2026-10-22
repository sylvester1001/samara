<script lang="ts">
	import TacticalGrip from '$lib/components/effects/TacticalGrip.svelte';
	import { uiTheme } from '$lib/stores/ui-theme.svelte.js';

	export interface AxisSeam {
		index: number;
		pos: number;
	}

	interface Props {
		colSeams: AxisSeam[];
		rowSeams: AxisSeam[];
		tableWidth: number;
		tableHeight: number;
		colWidths: number[];
		rowHeights: number[];
		lockColumns?: boolean;
		lockRows?: boolean;
		centerColumns?: boolean;
		centerRows?: boolean;
		isStageHovered?: boolean;
		viewScale?: number;
		onColumnResize?: (index: number, seamPos: number) => void;
		onRowResize?: (index: number, seamPos: number) => void;
	}

	let {
		colSeams,
		rowSeams,
		tableWidth,
		tableHeight,
		colWidths,
		rowHeights,
		lockColumns = false,
		lockRows = false,
		centerColumns = false,
		centerRows = false,
		isStageHovered = false,
		viewScale = 1,
		onColumnResize,
		onRowResize
	}: Props = $props();

	const HIT = 18;
	const ALONG_PAD = 16;

	type Axis = 'col' | 'row';
	interface ActiveSeam {
		axis: Axis;
		index: number;
		pos: number;
		along: number;
	}

	let hover = $state<ActiveSeam | null>(null);
	let drag = $state<ActiveSeam | null>(null);
	let layerEl: HTMLElement | null = $state(null);
	let gripLive = $state(false);
	let isHoveringLayer = $state(false);

	let dragMath: {
		originClient: number;
		scale: number;
		pos0: number;
		layout0: number;
		recenter: boolean;
	} | null = null;

	const active = $derived(drag ?? hover);
	const isAvant = $derived(uiTheme.theme === 'avant-garde');
	const hasActive = $derived(!!active);
	const showGuides = $derived(isStageHovered || isHoveringLayer || hasActive);
	const hairline = '1.5px';

	$effect(() => {
		if (!hasActive) {
			gripLive = false;
			return;
		}
		const id = requestAnimationFrame(() => {
			gripLive = true;
		});
		return () => cancelAnimationFrame(id);
	});

	function clampAlong(axis: Axis, along: number) {
		const max = axis === 'col' ? tableHeight : tableWidth;
		return Math.max(ALONG_PAD, Math.min(Math.max(ALONG_PAD, max - ALONG_PAD), along));
	}

	function layoutPointFromEvent(e: MouseEvent) {
		const rect = layerEl?.getBoundingClientRect();
		if (!rect || rect.width <= 0 || rect.height <= 0) {
			return { x: 0, y: 0 };
		}
		return {
			x: ((e.clientX - rect.left) / rect.width) * tableWidth,
			y: ((e.clientY - rect.top) / rect.height) * tableHeight
		};
	}

	function setHover(axis: Axis, index: number, pos: number, e: MouseEvent) {
		if (drag) return;
		const point = layoutPointFromEvent(e);
		hover = {
			axis,
			index,
			pos,
			along: clampAlong(axis, axis === 'col' ? point.y : point.x)
		};
	}

	function clearHover() {
		if (!drag) hover = null;
	}

	function detectOuterColRecenter() {
		const stage = layerEl?.closest('[data-preview-stage]');
		if (!stage) return true;
		const paper =
			(stage.querySelector('[data-preview-paper]') as HTMLElement | null) ??
			(stage.firstElementChild as HTMLElement | null);
		if (!paper) return true;
		const sr = stage.getBoundingClientRect();
		const pr = paper.getBoundingClientRect();
		const padL = parseFloat(getComputedStyle(stage).paddingLeft) || 0;
		const padR = parseFloat(getComputedStyle(stage).paddingRight) || 0;
		return pr.left - (sr.left + padL) > 8 && sr.right - padR - pr.right > 8;
	}

	function startDrag(axis: Axis, index: number, pos: number, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const point = layoutPointFromEvent(e);
		const rect = layerEl?.getBoundingClientRect();
		const scale =
			axis === 'col'
				? (rect && rect.width > 0 ? rect.width / tableWidth : 1)
				: (rect && rect.height > 0 ? rect.height / tableHeight : 1);
		const originClient = axis === 'col' ? (rect?.left ?? e.clientX) : (rect?.top ?? e.clientY);
		const along0 = axis === 'col' ? e.clientX : e.clientY;
		dragMath = {
			originClient,
			scale,
			pos0: pos,
			layout0: (along0 - originClient) / scale,
			recenter: axis === 'col' ? centerColumns || detectOuterColRecenter() : centerRows
		};
		const next: ActiveSeam = {
			axis,
			index,
			pos,
			along: clampAlong(axis, axis === 'col' ? point.y : point.x)
		};
		drag = next;
		hover = next;
		document.documentElement.classList.add('axis-dragging');
		document.addEventListener('mousemove', onDragMove);
		document.addEventListener('mouseup', onDragUp);
	}

	function onDragMove(e: MouseEvent) {
		if (!drag || !dragMath) return;
		const along = drag.axis === 'col' ? e.clientX : e.clientY;
		const layoutAlong = (along - dragMath.originClient) / dragMath.scale;
		const factor = dragMath.recenter ? 2 : 1;
		const seamPos = dragMath.pos0 + factor * (layoutAlong - dragMath.layout0);
		if (drag.axis === 'col') onColumnResize?.(drag.index, seamPos);
		else onRowResize?.(drag.index, seamPos);
		const point = layoutPointFromEvent(e);
		drag = {
			...drag,
			along: clampAlong(drag.axis, drag.axis === 'col' ? point.y : point.x)
		};
	}

	function onDragUp() {
		drag = null;
		dragMath = null;
		document.documentElement.classList.remove('axis-dragging');
		document.removeEventListener('mousemove', onDragMove);
		document.removeEventListener('mouseup', onDragUp);
	}

	function liveSeamPos(axis: Axis, index: number, fallback: number) {
		const list = axis === 'col' ? colSeams : rowSeams;
		return list.find((seam) => seam.index === index)?.pos ?? fallback;
	}

	const activeRulePos = $derived(
		active ? liveSeamPos(active.axis, active.index, active.pos) : 0
	);

	const activeDimensionValue = $derived.by(() => {
		if (!active) return 0;
		if (active.axis === 'col') {
			return colWidths[active.index] ?? 0;
		}
		return rowHeights[active.index] ?? 0;
	});

	$effect(() => {
		return () => {
			document.documentElement.classList.remove('axis-dragging');
			document.removeEventListener('mousemove', onDragMove);
			document.removeEventListener('mouseup', onDragUp);
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={layerEl}
	class="axis-resizers {isAvant ? 'avant' : 'classic'}"
	class:is-dragging={!!drag}
	class:has-hover={isHoveringLayer}
	style:width="{tableWidth}px"
	style:height="{tableHeight}px"
	style:--hairline={hairline}
	onmouseenter={() => (isHoveringLayer = true)}
	onmouseleave={() => {
		if (!drag) isHoveringLayer = false;
	}}
>
	<!-- 方案 C：底图精密发丝参考线 + 顶沿/左沿战术游标小卡扣（全表常驻引导，移开消失） -->
	<div class="caliper-guides-layer" class:is-visible={showGuides} aria-hidden="true">
		{#if !lockColumns}
			{#each colSeams as seam (seam.index)}
				{@const isCurrentActive = active?.axis === 'col' && active?.index === seam.index}
				{#if !isCurrentActive}
					<!-- 顶沿外侧悬浮战术卡爪 (Top Caliper Tab) -->
					<div
						class="caliper-tab col"
						style:left="{seam.pos}px"
					>
						<span class="tab-body"></span>
					</div>
					<!-- 纵向极淡发丝引导轨 (Hairline Guide) -->
					<div
						class="ghost-guide col"
						style:left="{seam.pos}px"
					></div>
				{/if}
			{/each}
		{/if}

		{#if !lockRows}
			{#each rowSeams as seam (seam.index)}
				{@const isCurrentActive = active?.axis === 'row' && active?.index === seam.index}
				{#if !isCurrentActive}
					<!-- 左沿外侧悬浮战术卡爪 (Left Caliper Tab) -->
					<div
						class="caliper-tab row"
						style:top="{seam.pos}px"
					>
						<span class="tab-body"></span>
					</div>
					<!-- 横向极淡发丝引导轨 (Hairline Guide) -->
					<div
						class="ghost-guide row"
						style:top="{seam.pos}px"
					></div>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- 交互感应判定层（Hitbox 扩大到 18px，保证全高度任何空白处随手捕捉） -->
	{#if !lockColumns}
		{#each colSeams as seam (seam.index)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="axis-hit col"
				style:left="{seam.pos}px"
				style:width="{HIT}px"
				onmousemove={(e) => setHover('col', seam.index, seam.pos, e)}
				onmouseleave={clearHover}
				onmousedown={(e) => startDrag('col', seam.index, seam.pos, e)}
			></div>
		{/each}
	{/if}

	{#if !lockRows}
		{#each rowSeams as seam (seam.index)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="axis-hit row"
				style:top="{seam.pos}px"
				style:height="{HIT}px"
				onmousemove={(e) => setHover('row', seam.index, seam.pos, e)}
				onmouseleave={clearHover}
				onmousedown={(e) => startDrag('row', seam.index, seam.pos, e)}
			></div>
		{/each}
	{/if}

	<!-- 激活点亮状态（Active Laser Rule + 物理内嵌 TacticalGrip + HUD 战术刻度标） -->
	{#if active}
		<!-- 激光发丝指示线：绝对坐标严格对准缝隙中轴 -->
		<div
			class="axis-rule {active.axis} {isAvant ? 'avant' : 'classic'}"
			style:left={active.axis === 'col' ? `${activeRulePos}px` : '0'}
			style:top={active.axis === 'row' ? `${activeRulePos}px` : '0'}
		>
			<!-- 顶部/左部点亮卡扣 -->
			<div class="active-caliper-anchor {active.axis}"></div>
		</div>

		<!-- 战术滑块手柄：独立挂在 (X, Y) 绝对物理坐标上，消除父级百分比变换干扰 -->
		<div
			class="axis-grip"
			style:left={active.axis === 'col' ? `${activeRulePos}px` : `${Math.round(active.along)}px`}
			style:top={active.axis === 'row' ? `${activeRulePos}px` : `${Math.round(active.along)}px`}
		>
			{#if isAvant}
				<TacticalGrip embedded active={gripLive} horizontal={active.axis === 'row'} />
			{:else}
				<span class="classic-knob {active.axis}"></span>
			{/if}

			<!-- 战术 HUD 尺寸实时浮标（拖拽时跟随光标） -->
			{#if drag}
				<div class="tactical-hud-bubble {active.axis}">
					<span class="hud-label">{active.axis === 'col' ? `COL ${active.index + 1}` : `ROW ${active.index + 1}`}</span>
					<span class="hud-val">{Math.round(activeDimensionValue)}px</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.axis-resizers {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 10;
		--resizer-ghost: rgba(2, 2, 241, 0.08);
		--resizer-tab: rgba(2, 2, 241, 0.35);
	}

	.axis-resizers.classic {
		--resizer-ghost: rgba(0, 0, 0, 0.07);
		--resizer-tab: rgba(0, 0, 0, 0.28);
	}

	:global(.dark) .axis-resizers.avant {
		--resizer-ghost: rgba(59, 130, 246, 0.14);
		--resizer-tab: rgba(59, 130, 246, 0.45);
	}

	:global(.dark) .axis-resizers.classic {
		--resizer-ghost: rgba(255, 255, 255, 0.1);
		--resizer-tab: rgba(255, 255, 255, 0.3);
	}

	/* 引导层：全表发丝线与顶沿战术卡扣 */
	.caliper-guides-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.caliper-guides-layer.is-visible {
		opacity: 1;
	}

	/* 顶沿/左沿外侧小卡扣：浮停在黑线外侧，绝不盖住正文 */
	.caliper-tab {
		position: absolute;
		pointer-events: none;
		z-index: 2;
	}

	.caliper-tab.col {
		top: -6px;
		transform: translateX(-50%);
		width: 8px;
		height: 4px;
	}

	.caliper-tab.col .tab-body {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--resizer-tab);
		border-radius: 1px 1px 0 0;
	}

	.caliper-tab.row {
		left: -6px;
		transform: translateY(-50%);
		width: 4px;
		height: 8px;
	}

	.caliper-tab.row .tab-body {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--resizer-tab);
		border-radius: 1px 0 0 1px;
	}

	/* 极淡发丝引导轨：极其克制的高级工程水印线，常驻且绝不显脏 */
	.ghost-guide {
		position: absolute;
		pointer-events: none;
		z-index: 1;
	}

	.ghost-guide.col {
		top: 0;
		bottom: 0;
		width: var(--hairline, 1px);
		transform: translateX(-50%);
		background: var(--resizer-ghost);
	}

	.ghost-guide.row {
		left: 0;
		right: 0;
		height: var(--hairline, 1px);
		transform: translateY(-50%);
		background: var(--resizer-ghost);
	}

	/* 磁吸判定面：隐形 18px 热区 */
	.axis-hit {
		position: absolute;
		pointer-events: auto;
		z-index: 5;
	}

	.axis-hit.col {
		top: -8px;
		bottom: 0;
		transform: translateX(-50%);
		cursor: col-resize;
	}

	.axis-hit.row {
		left: -8px;
		right: 0;
		transform: translateY(-50%);
		cursor: row-resize;
	}

	:global(html.axis-dragging),
	:global(html.axis-dragging *) {
		cursor: default !important;
		user-select: none !important;
	}

	/* 激活点亮激光线：坚实纯平先锋钴蓝，零发光零光晕 */
	.axis-rule {
		position: absolute;
		pointer-events: none;
		z-index: 6;
	}

	.axis-rule.col {
		top: 0;
		bottom: 0;
		width: var(--hairline, 1px);
		transform: translateX(-50%);
	}

	.axis-rule.row {
		left: 0;
		right: 0;
		height: var(--hairline, 1px);
		transform: translateY(-50%);
	}

	.axis-rule.avant {
		background: var(--cobalt, #0202f1);
	}

	.axis-rule.classic {
		background: rgba(0, 0, 0, 0.5);
	}

	/* 激活状态顶端卡扣高亮 */
	.active-caliper-anchor.col {
		position: absolute;
		top: -6px;
		left: 50%;
		transform: translateX(-50%);
		width: 8px;
		height: 5px;
		background: var(--cobalt, #0202f1);
		border-radius: 1px 1px 0 0;
	}

	.active-caliper-anchor.row {
		position: absolute;
		left: -6px;
		top: 50%;
		transform: translateY(-50%);
		width: 5px;
		height: 8px;
		background: var(--cobalt, #0202f1);
		border-radius: 1px 0 0 1px;
	}

	/* 滑块定位容器：由线自身 50% 物理居中锁定 */
	.axis-grip {
		position: absolute;
		width: 0;
		height: 0;
		pointer-events: none;
		z-index: 7;
	}

	.classic-knob {
		position: absolute;
		left: 0;
		top: 0;
		background: rgba(0, 0, 0, 0.6);
		transform: translate(-50%, -50%);
	}

	.classic-knob.col {
		width: 5px;
		height: 28px;
	}

	.classic-knob.row {
		width: 28px;
		height: 5px;
	}

	/* 机能风战术 HUD 尺寸标签 */
	.tactical-hud-bubble {
		position: absolute;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 2px 6px;
		background: #09090b;
		color: #ffffff;
		border: 1px solid rgba(2, 2, 241, 0.8);
		font-family: var(--font-terminal, monospace);
		font-size: 10px;
		line-height: 1;
		font-weight: 600;
		letter-spacing: 0.05em;
		white-space: nowrap;
		border-radius: 1px;
		pointer-events: none;
		z-index: 10;
		box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.7);
	}

	.tactical-hud-bubble.col {
		bottom: 18px;
		left: 50%;
		transform: translateX(-50%);
	}

	.tactical-hud-bubble.row {
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
	}

	.hud-label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 9px;
	}

	.hud-val {
		color: #ffffff;
		font-weight: 700;
	}
</style>
