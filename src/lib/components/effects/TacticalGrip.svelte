<script lang="ts">
	interface Props {
		/** 矩形滑块颜色，默认采用先锋标志性钴蓝 */
		color?: string;
		/** 由父级控制展开（轴抓手 hover/drag），不依赖分栏 data-slot */
		active?: boolean;
		/** 横放：行高抓手 */
		horizontal?: boolean;
		/** 由父级定位中心点，不再绝对铺在分栏中间 */
		embedded?: boolean;
	}

	let {
		color = 'var(--cobalt, #0202f1)',
		active = false,
		horizontal = false,
		embedded = false
	}: Props = $props();
</script>

<div
	class="tactical-grip pointer-events-none select-none z-30 w-[6px] h-[24px] {embedded ? 'absolute left-0 top-0' : 'absolute top-[40%] left-1/2'} {active ? 'is-active' : ''} {horizontal ? 'is-horizontal' : ''}"
	aria-hidden="true"
>
	<!-- 第一段：四块向心合体的主核（上下两端带 45° 锋利筝形切角 Kite-Faceted Spear） -->
	<div class="relative size-full">
		<!-- 左上方块 (带顶部 45° 尖角切面) -->
		<span
			class="grip-block block-tl absolute top-0 left-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
		<!-- 右上方块 (带顶部 45° 尖角切面) -->
		<span
			class="grip-block block-tr absolute top-0 right-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
		<!-- 左下方块 (带底部 45° 尖角切面) -->
		<span
			class="grip-block block-bl absolute bottom-0 left-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
		<!-- 右下方块 (带底部 45° 尖角切面) -->
		<span
			class="grip-block block-br absolute bottom-0 right-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
	</div>

	<!-- 第二段：尼尔经典伴飞菱形晶片 (NieR Satellite Rhombus Chips) -->
	<!-- 摒弃俗套的播放器实心三角形，采用 45° 旋转的纯正尼尔悬浮菱形晶片，内尖自然朝向主核腰部 -->
	<!-- 左翼菱形伴飞晶片 (向内靠拢 1px) -->
	<span
		class="wing-rhombus wing-left absolute top-1/2 left-[-7px] w-[3.5px] h-[3.5px]"
		style:background-color={color}
	></span>
	<!-- 右翼菱形伴飞晶片 (向内靠拢 1px) -->
	<span
		class="wing-rhombus wing-right absolute top-1/2 right-[-7px] w-[3.5px] h-[3.5px]"
		style:background-color={color}
	></span>
</div>

<style>
	/* 整体容器居中与防模糊渲染 */
	.tactical-grip {
		transform: translate3d(-50%, -50%, 0);
		opacity: 0;
		transition: opacity 120ms ease-in;
		will-change: transform, opacity;
	}

	.tactical-grip.is-horizontal {
		transform: translate3d(-50%, -50%, 0) rotate(90deg);
	}

	/* =========================================================
	   第一段动效：中间筝形主核 (Kite Core)
	   ========================================================= */
	.grip-block {
		transition: transform 120ms cubic-bezier(0.4, 0, 1, 1);
		box-sizing: border-box;
		backface-visibility: hidden;
	}

	/* 四个长方块合拢后组合成纯平、坚实、锋利的 6px x 24px 实心矩形主体 */
	.block-tl {
		transform: translate3d(-4px, -5px, 0);
	}
	.block-tr {
		transform: translate3d(4px, -5px, 0);
	}
	.block-bl {
		transform: translate3d(-4px, 5px, 0);
	}
	.block-br {
		transform: translate3d(4px, 5px, 0);
	}

	/* 第一段进场：160ms 快速咬合合体 */
	.tactical-grip.is-active,
	:global([data-slot="resizable-handle"]:hover) .tactical-grip,
	:global([data-slot="resizable-handle"]:active) .tactical-grip,
	:global([data-slot="resizable-handle"][data-state="drag"]) .tactical-grip,
	:global([data-slot="resizable-handle"][data-active]) .tactical-grip {
		opacity: 1;
		transition: opacity 90ms ease-out;
	}

	.tactical-grip.is-active .grip-block,
	:global([data-slot="resizable-handle"]:hover) .grip-block,
	:global([data-slot="resizable-handle"]:active) .grip-block,
	:global([data-slot="resizable-handle"][data-state="drag"]) .grip-block,
	:global([data-slot="resizable-handle"][data-active]) .grip-block {
		transform: translate3d(0, 0, 0);
		transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* =========================================================
	   第二段动效：左右两翼尼尔伴飞菱形晶片 (NieR Satellite Rhombus)
	   45° 自旋锁定，带 130ms 机械时序延迟滑入
	   ========================================================= */
	.wing-rhombus {
		box-sizing: border-box;
		backface-visibility: hidden;
		transition: transform 100ms ease-in, opacity 80ms ease-in;
	}

	/* 初始待命位置：在两翼较远方隐形，保持 45° 旋转 */
	.wing-left {
		transform: translate3d(-8px, -50%, 0) rotate(45deg);
		opacity: 0;
	}
	.wing-right {
		transform: translate3d(8px, -50%, 0) rotate(45deg);
		opacity: 0;
	}

	/* 第二段进场：主核刚刚合拢（130ms 延迟），两侧菱形晶片平稳滑入腰部两侧对准 */
	.tactical-grip.is-active .wing-left,
	:global([data-slot="resizable-handle"]:hover) .wing-left,
	:global([data-slot="resizable-handle"]:active) .wing-left,
	:global([data-slot="resizable-handle"][data-state="drag"]) .wing-left,
	:global([data-slot="resizable-handle"][data-active]) .wing-left {
		transform: translate3d(0, -50%, 0) rotate(45deg);
		opacity: 1;
		transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1) 130ms, opacity 140ms ease-out 110ms;
	}

	.tactical-grip.is-active .wing-right,
	:global([data-slot="resizable-handle"]:hover) .wing-right,
	:global([data-slot="resizable-handle"]:active) .wing-right,
	:global([data-slot="resizable-handle"][data-state="drag"]) .wing-right,
	:global([data-slot="resizable-handle"][data-active]) .wing-right {
		transform: translate3d(0, -50%, 0) rotate(45deg);
		opacity: 1;
		transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1) 130ms, opacity 140ms ease-out 110ms;
	}

	/* 按住拖拽时高亮增强与微内缩 */
	:global([data-slot="resizable-handle"]:active) .grip-block,
	:global([data-slot="resizable-handle"][data-active]) .grip-block,
	:global([data-slot="resizable-handle"]:active) .wing-rhombus,
	:global([data-slot="resizable-handle"][data-active]) .wing-rhombus {
		filter: brightness(1.2);
	}
</style>
