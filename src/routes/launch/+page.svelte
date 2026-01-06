<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		ArrowRight,
		Download,
		Github,
		BookOpen,
		Sparkles,
		Layers,
		Table2,
		Wand,
		Check
	} from 'lucide-svelte';

	const links = {
		repo: 'https://github.com/your-org/tablix',
		guide: '/docs',
		download: 'https://github.com/your-org/tablix/releases',
		screenshot: '/UI-screenshot.png'
	};

	const highlights = [
		'WYSIWYG table editing with LaTeX-grade output.',
		'Precise control over rules, merges, and spacing.',
		'Export clean PNG or SVG for papers and slides.'
	];

	const features = [
		{
			title: 'Academic-ready presets',
			description: 'Booktabs, bordered, or minimal styles with live previews.',
			icon: Table2
		},
		{
			title: 'Smart cell ops',
			description: 'Merge, split, and align data with predictable behavior.',
			icon: Layers
		},
		{
			title: 'Design polish',
			description: 'Fine-tune line weight, spacing, and typography in seconds.',
			icon: Wand
		},
		{
			title: 'Export anywhere',
			description: 'Publish to PNG, SVG, or LaTeX without layout drift.',
			icon: Download
		},
		{
			title: 'Desktop + web',
			description: 'Same workspace across platforms with no compromise.',
			icon: Sparkles
		},
		{
			title: 'Fast to start',
			description: 'Drop CSV, paste tables, or build from scratch in minutes.',
			icon: ArrowRight
		}
	];
</script>

<svelte:head>
	<title>Tablix - Tables with academic precision</title>
	<meta
		name="description"
		content="Tablix is a table design studio for academic work. Build precise tables fast, export LaTeX-ready output, and share instantly."
	/>
</svelte:head>

<div class="landing text-slate-100">
	<header class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
		<a href="/" class="group flex items-center gap-3">
			<div class="logo-tile">
				<Table2 class="h-5 w-5" />
			</div>
			<span class="text-base font-semibold tracking-tight text-white">Tablix</span>
		</a>
		<nav class="hidden items-center gap-2 md:flex">
			<Button
				variant="ghost"
				href={links.repo}
				class="text-slate-200 hover:text-white hover:bg-white/10"
			>
				<Github class="h-4 w-4" />
				GitHub
			</Button>
			<Button
				variant="ghost"
				href={links.guide}
				class="text-slate-200 hover:text-white hover:bg-white/10"
			>
				<BookOpen class="h-4 w-4" />
				User Guide
			</Button>
		</nav>
		<div class="flex items-center gap-2 md:hidden">
			<Button
				variant="ghost"
				size="icon"
				href={links.repo}
				class="text-slate-200 hover:text-white hover:bg-white/10"
				aria-label="GitHub"
			>
				<Github class="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				href={links.guide}
				class="text-slate-200 hover:text-white hover:bg-white/10"
				aria-label="User Guide"
			>
				<BookOpen class="h-4 w-4" />
			</Button>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl px-6 pb-24">
		<section class="pt-16 lg:pt-24">
			<div class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
				<div class="space-y-6 reveal reveal-delay-1">
					<Badge variant="secondary" class="badge-soft">
						Desktop + Web
					</Badge>
					<div class="space-y-5">
						<h1 class="hero-title text-4xl leading-tight sm:text-5xl lg:text-6xl">
							Tables, finally designed for academic precision.
						</h1>
						<p class="text-lg text-slate-300 sm:text-xl">
							Tablix blends a focused editor with LaTeX-grade output so your
							tables look right every time.
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<Button href="/" class="cta-primary">
							Try it now
							<ArrowRight class="h-4 w-4" />
						</Button>
						<Button href={links.download} variant="outline" class="cta-secondary">
							<Download class="h-4 w-4" />
							Download
						</Button>
					</div>
					<div class="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
						<div class="flex items-center gap-2">
							<Sparkles class="h-4 w-4 text-amber-300" />
							Clean exports with no layout drift.
						</div>
						<div class="flex items-center gap-2">
							<Table2 class="h-4 w-4 text-amber-300" />
							Advanced rules, merges, and spacing.
						</div>
						<div class="flex items-center gap-2">
							<Layers class="h-4 w-4 text-amber-300" />
							Reusable presets for quick styling.
						</div>
						<div class="flex items-center gap-2">
							<Wand class="h-4 w-4 text-amber-300" />
							Polish in seconds, not hours.
						</div>
					</div>
				</div>
				<Card.Root class="hero-card reveal reveal-delay-2">
					<Card.Header class="space-y-3">
						<Card.Title class="text-lg font-semibold text-white">
							Build tables like a designer
						</Card.Title>
						<Card.Description class="text-slate-300">
							Drag rows, apply booktabs, and preview LaTeX instantly.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="mini-preview">
							<div class="mini-grid">
								<div class="mini-row"></div>
								<div class="mini-row"></div>
								<div class="mini-row"></div>
								<div class="mini-row"></div>
							</div>
						</div>
						<div class="flex items-center gap-2 text-sm text-slate-300">
							<Check class="h-4 w-4 text-emerald-300" />
							Ready for papers, slides, and docs.
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<img
				class="hero-screenshot reveal reveal-delay-3 mt-14"
				src={links.screenshot}
				alt="Tablix UI screenshot"
			/>
		</section>

		<Separator class="my-16 bg-white/10" />

		<section id="ui" class="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
			<div class="space-y-6">
				<h2 class="section-title text-3xl sm:text-4xl">The full workspace view.</h2>
				<p class="text-base text-slate-300 sm:text-lg">
					Everything you need is visible at a glance: structure controls on the
					left, editable canvas in the center, and export-ready preview on the
					right.
				</p>
				<div class="space-y-3">
					{#each highlights as item}
						<div class="flex items-start gap-3 text-slate-200">
							<div class="check-chip">
								<Check class="h-3.5 w-3.5" />
							</div>
							<span>{item}</span>
						</div>
					{/each}
				</div>
				<Button href="/" class="cta-secondary">
					Open the editor
					<ArrowRight class="h-4 w-4" />
				</Button>
			</div>
			<img
				class="ui-screenshot reveal reveal-delay-2"
				src={links.screenshot}
				alt="Full Tablix workspace"
			/>
		</section>

		<Separator class="my-16 bg-white/10" />

		<section id="features" class="space-y-10">
			<div class="space-y-3">
				<h2 class="section-title text-3xl sm:text-4xl">Built for serious tables.</h2>
				<p class="text-base text-slate-300 sm:text-lg">
					Every feature is tuned for clarity, consistency, and academic output.
				</p>
			</div>
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each features as feature, i}
					<Card.Root
						class="feature-card reveal"
						style={`animation-delay: ${0.1 + i * 0.08}s`}
					>
						<Card.Header class="space-y-3">
							<div class="feature-icon">
								<svelte:component this={feature.icon} class="h-4 w-4" />
							</div>
							<Card.Title class="text-lg text-white">{feature.title}</Card.Title>
						</Card.Header>
						<Card.Content class="text-sm text-slate-300">
							{feature.description}
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</section>

		<section class="mt-20">
			<Card.Root class="cta-panel">
				<Card.Header class="space-y-3">
					<Badge variant="secondary" class="badge-soft">
						Start in minutes
					</Badge>
					<Card.Title class="section-title text-3xl sm:text-4xl">
						Design your next table faster.
					</Card.Title>
					<Card.Description class="text-base text-slate-300 sm:text-lg">
						Jump into the editor or grab the desktop build.
					</Card.Description>
				</Card.Header>
				<Card.Footer class="mt-6 flex flex-wrap gap-3">
					<Button href="/" class="cta-primary">
						Try it now
						<ArrowRight class="h-4 w-4" />
					</Button>
					<Button href={links.download} variant="outline" class="cta-secondary">
						<Download class="h-4 w-4" />
						Download
					</Button>
				</Card.Footer>
			</Card.Root>
		</section>
	</main>

	<footer class="mx-auto w-full max-w-6xl px-6 pb-12 text-sm text-slate-400">
		<div class="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
			<span>Tablix (c) 2025</span>
			<div class="flex items-center gap-4">
				<a href={links.repo} class="hover:text-white">Source</a>
				<a href={links.guide} class="hover:text-white">Docs</a>
			</div>
		</div>
	</footer>
</div>

<style>
	@import "computer-modern/cmu-sans-serif.css";
	@import "computer-modern/cmu-serif.css";

	:global(html),
	:global(body) {
		height: auto;
		overflow-x: hidden;
		overflow-y: auto;
	}

	:global(body) {
		background: #0d0e12;
		color: #e8e9ef;
		font-family: "CMU Sans Serif", "Helvetica Neue", Arial, sans-serif;
		user-select: text;
	}

	.landing {
		min-height: 100vh;
		background: radial-gradient(circle at 10% 20%, rgba(245, 179, 71, 0.18), transparent 45%),
			radial-gradient(circle at 85% 15%, rgba(86, 131, 255, 0.12), transparent 40%),
			radial-gradient(circle at 40% 85%, rgba(91, 189, 155, 0.12), transparent 35%),
			#0d0e12;
	}

	.hero-title,
	.section-title {
		font-family: "CMU Serif", "Times New Roman", serif;
		letter-spacing: -0.01em;
	}

	.logo-tile {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 40px;
		width: 40px;
		border-radius: 12px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.03));
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
	}

	:global(.badge-soft) {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	:global(.cta-primary) {
		background: linear-gradient(135deg, #f7d58b, #f4a461);
		color: #201a0f;
		box-shadow: 0 12px 30px rgba(244, 164, 97, 0.25);
	}

	:global(.cta-primary:hover) {
		filter: brightness(1.05);
	}

	:global(.cta-secondary) {
		border-color: rgba(255, 255, 255, 0.3);
		color: rgba(255, 255, 255, 0.85);
		background: rgba(255, 255, 255, 0.02);
	}

	:global(.cta-secondary:hover) {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	:global(.hero-card) {
		background: rgba(15, 16, 22, 0.75);
		border-color: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(14px);
	}

	.mini-preview {
		height: 180px;
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 16px;
	}

	.mini-grid {
		display: grid;
		gap: 10px;
	}

	.mini-row {
		height: 14px;
		border-radius: 999px;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05));
	}

	.hero-screenshot,
	.ui-screenshot {
		width: 100%;
		display: block;
		height: auto;
	}

	.check-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 26px;
		width: 26px;
		border-radius: 999px;
		background: rgba(116, 255, 193, 0.12);
		border: 1px solid rgba(116, 255, 193, 0.3);
		color: #7af5c9;
		flex-shrink: 0;
	}

	:global(.feature-card) {
		background: rgba(14, 15, 20, 0.72);
		border-color: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(8px);
	}

	.feature-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 38px;
		width: 38px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.08);
		color: #f6d28c;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	:global(.cta-panel) {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
		border-color: rgba(255, 255, 255, 0.12);
		padding: 28px;
	}

	:global(.reveal) {
		opacity: 0;
		transform: translateY(16px);
		animation: rise 0.9s ease forwards;
	}

	:global(.reveal-delay-1) {
		animation-delay: 0.1s;
	}

	:global(.reveal-delay-2) {
		animation-delay: 0.2s;
	}

	:global(.reveal-delay-3) {
		animation-delay: 0.3s;
	}

	@keyframes rise {
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.reveal) {
			animation: none;
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.hero-screenshot {
			margin-top: 2.5rem;
		}
	}
</style>
