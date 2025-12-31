<script lang="ts">
	interface Props {
		onResize: (delta: number) => void;
	}

	let { onResize }: Props = $props();

	let isDragging = $state(false);
	let startY = 0;

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		isDragging = true;
		startY = e.clientY;
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		const delta = e.clientY - startY;
		startY = e.clientY;
		onResize(delta);
	}

	function handleMouseUp() {
		isDragging = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<div
	class="row-resizer"
	class:dragging={isDragging}
	onmousedown={handleMouseDown}
	role="separator"
	aria-orientation="horizontal"
	tabindex="-1"
></div>
