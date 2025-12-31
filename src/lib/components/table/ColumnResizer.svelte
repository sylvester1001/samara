<script lang="ts">
	interface Props {
		onResize: (delta: number) => void;
	}

	let { onResize }: Props = $props();

	let isDragging = $state(false);
	let startX = 0;

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		isDragging = true;
		startX = e.clientX;
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		const delta = e.clientX - startX;
		startX = e.clientX;
		onResize(delta);
	}

	function handleMouseUp() {
		isDragging = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<div
	class="column-resizer"
	class:dragging={isDragging}
	onmousedown={handleMouseDown}
	role="separator"
	aria-orientation="vertical"
	tabindex="-1"
></div>
