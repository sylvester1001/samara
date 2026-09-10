<script lang="ts">
	interface Props {
		/** 矩形滑块颜色，默认采用先锋标志性钴蓝 */
		color?: string;
	}

	let {
		color = 'var(--cobalt, #0202f1)'
	}: Props = $props();
</script>

<div
	class="tactical-grip pointer-events-none absolute top-[40%] left-1/2 select-none z-30 w-[6px] h-[24px]"
	aria-hidden="true"
>
	<!-- 四个直角长方块向心合拢形成 6px x 24px 纯实心矩形滑块 (移除 overflow 裁剪，消除亚像素虚化，动画全程可见) -->
	<div class="relative size-full">
		<!-- 左上方块 (Top-Left, 3.5px x 12px) -->
		<span
			class="grip-block block-tl absolute top-0 left-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
		<!-- 右上方块 (Top-Right, 3.5px x 12px) -->
		<span
			class="grip-block block-tr absolute top-0 right-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
		<!-- 左下方块 (Bottom-Left, 3.5px x 12px) -->
		<span
			class="grip-block block-bl absolute bottom-0 left-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
		<!-- 右下方块 (Bottom-Right, 3.5px x 12px) -->
		<span
			class="grip-block block-br absolute bottom-0 right-0 w-[3.5px] h-[12px]"
			style:background-color={color}
		></span>
	</div>
</div>

<style>
	/* 开启 GPU 3D 渲染与消除亚像素模糊 */
	.tactical-grip {
		transform: translate3d(-50%, -50%, 0);
		opacity: 0;
		transition: opacity 120ms ease-in;
		will-change: transform, opacity;
	}

	.grip-block {
		/* 离开时的退出动画 */
		transition: transform 140ms cubic-bezier(0.4, 0, 1, 1);
		box-sizing: border-box;
		backface-visibility: hidden;
	}

	/* 待命外展位置（X: ±6px, Y: ±6px）：距离适中，全程可见，绝无裁切 */
	.block-tl {
		transform: translate3d(-6px, -6px, 0);
	}
	.block-tr {
		transform: translate3d(6px, -6px, 0);
	}
	.block-bl {
		transform: translate3d(-6px, 6px, 0);
	}
	.block-br {
		transform: translate3d(6px, 6px, 0);
	}

	/* 当 hover 或拖拽时触发合体进场：200ms 阻尼曲线，全程清晰看见 4 块向心咬合 */
	:global([data-slot="resizable-handle"]:hover) .tactical-grip,
	:global([data-slot="resizable-handle"]:active) .tactical-grip,
	:global([data-slot="resizable-handle"][data-state="drag"]) .tactical-grip,
	:global([data-slot="resizable-handle"][data-active]) .tactical-grip {
		opacity: 1;
		transition: opacity 100ms ease-out;
	}

	:global([data-slot="resizable-handle"]:hover) .grip-block,
	:global([data-slot="resizable-handle"]:active) .grip-block,
	:global([data-slot="resizable-handle"][data-state="drag"]) .grip-block,
	:global([data-slot="resizable-handle"][data-active]) .grip-block {
		/* 精准咬合至 (0, 0)，拼合成一块 6px x 24px 锋利纯实心矩形 */
		transform: translate3d(0, 0, 0);
		transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* 按住拖拽时轻微高亮增强 */
	:global([data-slot="resizable-handle"]:active) .grip-block,
	:global([data-slot="resizable-handle"][data-active]) .grip-block {
		filter: brightness(1.2);
	}
</style>
