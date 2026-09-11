<script lang="ts">
	interface Props {
		class?: string;
		font?: 'mono' | 'serif';
	}

	let { class: className = '', font = 'mono' }: Props = $props();
</script>

<span
	class="latex-logo inline-flex items-baseline select-none {font === 'serif' ? 'is-serif' : 'is-mono'} {className}"
	aria-label="LaTeX"
>
	<span class="latex-l">L</span>
	<span class="latex-a">A</span>
	<span class="latex-t">T</span>
	<span class="latex-e">E</span>
	<span class="latex-x">X</span>
</span>

<style>
	.latex-logo {
		letter-spacing: 0 !important;
		text-transform: none !important;
		vertical-align: baseline;
		line-height: 1;
	}

	.latex-logo.is-mono {
		font-family: 'JetBrains Mono', var(--font-cjk), ui-monospace, monospace;
	}

	.latex-logo.is-serif {
		font-family: 'CMU Serif', var(--font-cjk-serif), 'Times New Roman', Georgia, serif;
		font-weight: 700;
	}

	.latex-l,
	.latex-t,
	.latex-x {
		display: inline-block;
		line-height: 1;
	}

	.latex-logo.is-mono .latex-a {
		display: inline-block;
		font-size: 0.72em;
		transform: translateY(-0.24em);
		margin-left: -0.22em;
		margin-right: -0.1em;
		line-height: 1;
		font-weight: inherit;
	}

	.latex-logo.is-mono .latex-e {
		display: inline-block;
		font-size: 1em;
		transform: translateY(0.2em);
		margin-left: -0.14em;
		margin-right: -0.08em;
		line-height: 1;
		font-weight: inherit;
	}

	.latex-logo.is-serif .latex-a {
		display: inline-block;
		font-size: 0.7em;
		transform: translateY(-0.25em);
		margin-left: -0.32em;
		margin-right: -0.15em;
		line-height: 1;
	}

	.latex-logo.is-serif .latex-e {
		display: inline-block;
		font-size: 1em;
		transform: translateY(0.22em);
		margin-left: -0.18em;
		margin-right: -0.12em;
		line-height: 1;
	}
</style>
