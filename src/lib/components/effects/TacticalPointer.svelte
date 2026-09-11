<script lang="ts">
	interface Props {
		/** 是否激活显隐（若父级有 group，也可通过 group-hover 纯 CSS 控制） */
		active?: boolean;
		/** 指针主色调，默认为先锋标志性钴蓝 */
		color?: string;
		/** 指针朝向：right 为指向右侧 ▶，left 为指向左侧 ◀ */
		direction?: 'right' | 'left';
		/** 自定义类名 */
		class?: string;
	}

	let {
		active = false,
		color = 'var(--cobalt, #0202f1)',
		direction = 'right',
		class: className = ''
	}: Props = $props();
</script>

<div
	class="tactical-pointer pointer-events-none select-none flex items-center justify-center leading-none {className}"
	class:direction-left={direction === 'left'}
	class:is-active={active}
	aria-hidden="true"
>
	<svg
		viewBox="0 0 38 28"
		class="w-[28.5px] h-[21px] block overflow-visible"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g transform={direction === 'left' ? 'translate(38, 0) scale(-1, 1)' : undefined}>
			<!-- 破甲筝形主刃（严格按照尼尔原作像素拓扑：右尖锐角大幅拉长，左侧向后收尖延展，光学中心带圆形通透孔） -->
			<path
				d="M 1 14 L 12 6.5 L 36.5 14 L 12 21.5 Z M 12.2 11.6 A 2.4 2.4 0 1 0 12.2 16.4 A 2.4 2.4 0 1 0 12.2 11.6 Z"
				fill={color}
				fill-rule="evenodd"
			/>
			<!-- 针尖上方垂直标定小正方形（对齐针尖末梢） -->
			<rect x="33" y="0.5" width="4" height="4" fill={color} />
			<!-- 针尖下方垂直标定小正方形（对齐针尖末梢） -->
			<rect x="33" y="23.5" width="4" height="4" fill={color} />
		</g>
	</svg>
</div>

<style>
	.tactical-pointer {
		opacity: 0;
		transform: translate3d(-6px, 0, 0);
		transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1), opacity 90ms ease-out;
		will-change: transform, opacity;
	}

	.tactical-pointer.direction-left {
		transform: translate3d(6px, 0, 0);
	}

	/* 外部显式激活或 hover 联动滑入 */
	.tactical-pointer.is-active,
	.tactical-pointer.direction-left.is-active,
	:global(.group:hover) .tactical-pointer,
	:global(.group:active) .tactical-pointer,
	:global(.group[data-active="true"]) .tactical-pointer,
	:global(.group[data-state="open"]) .tactical-pointer {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}
</style>
