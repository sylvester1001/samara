<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		ArrowRight,
		Download,
		Github,
		Table2,
		Layers,
		FileImage
	} from 'lucide-svelte';
	import { t } from '$lib/i18n';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	const links = {
		repo: 'https://github.com/sylvester1001/samara',
		download: 'https://github.com/sylvester1001/samara/releases',
		screenshot: '/UI-screenshot.png'
	};

	const features = $derived([
		{
			title: t('launch.feature1Title'),
			description: t('launch.feature1Desc'),
			icon: Table2
		},
		{
			title: t('launch.feature2Title'),
			description: t('launch.feature2Desc'),
			icon: Layers
		},
		{
			title: t('launch.feature3Title'),
			description: t('launch.feature3Desc'),
			icon: FileImage
		}
	]);
</script>

<svelte:head>
	<title>{t('launch.title')}</title>
	<meta
		name="description"
		content={t('launch.description')}
	/>
</svelte:head>

<div class="landing">
	<header class="header">
		<div class="container">
			<a href="/" class="logo">
				<div class="logo-icon">
					<Table2 class="h-5 w-5" />
				</div>
				<span class="logo-text">Samara</span>
			</a>
			<nav class="nav">
				<LanguageSwitcher />
				<Button variant="ghost" href={links.repo} class="nav-link">
					<Github class="h-4 w-4" />
					{t('common.github')}
				</Button>
			</nav>
		</div>
	</header>

	<main class="main">
		<section class="hero">
			<div class="container">
				<div class="hero-content">
					<h1 class="hero-title">
						{t('launch.heroTitleBefore')}<span class="italic">{t('launch.heroTitleEmphasis')}</span>
					</h1>
					<p class="hero-description">
						{t('launch.heroDescription')}
					</p>
					<div class="hero-actions">
						<Button href="/" size="lg" class="btn-primary">
							{t('launch.openEditor')}
							<ArrowRight class="h-4 w-4" />
						</Button>
						<Button href={links.download} variant="outline" size="lg" class="btn-secondary">
							<Download class="h-4 w-4" />
							{t('launch.getDesktop')}
						</Button>
					</div>
				</div>
			</div>
		</section>

		<section class="screenshot-section">
			<div class="container">
				<img
					class="app-screenshot"
					src={links.screenshot}
					alt={t('a11y.screenshot')}
				/>
			</div>
		</section>

		<section class="features-section">
			<div class="container">
				<div class="features-header">
					<h2 class="section-title">{t('launch.featuresTitle')}</h2>
					<p class="section-description">
						{t('launch.featuresSubtitle')}
					</p>
				</div>
				<div class="features-grid">
					{#each features as feature}
						<Card.Root class="feature-card">
							<Card.Content class="feature-content">
								<div class="feature-icon">
									<svelte:component this={feature.icon} class="h-5 w-5" />
								</div>
								<h3 class="feature-title">{feature.title}</h3>
								<p class="feature-description">{feature.description}</p>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			</div>
		</section>

		<section class="cta-section">
			<div class="container">
				<Card.Root class="cta-card">
					<Card.Content class="cta-content">
						<h2 class="cta-title">{t('launch.ctaTitle')}</h2>
						<p class="cta-description">
							{t('launch.ctaDescription')}
						</p>
						<div class="cta-actions">
							<Button href="/" size="lg" class="btn-primary">
								{t('launch.openEditor')}
								<ArrowRight class="h-4 w-4" />
							</Button>
							<Button href={links.download} variant="outline" size="lg" class="btn-secondary">
								<Download class="h-4 w-4" />
								{t('launch.getDesktop')}
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</section>
	</main>

	<footer class="footer">
		<div class="container">
			<span class="footer-text">{t('launch.footer')}</span>
			<div class="footer-links">
				<a href={links.repo} class="footer-link">{t('common.github')}</a>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(html),
	:global(body) {
		height: auto;
		overflow-x: hidden;
		overflow-y: auto;
	}

	:global(body) {
		background: #fafaf9;
		color: #1c1917;
		font-family: "CMU Sans Serif", var(--font-cjk), -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
		user-select: text;
	}

	.landing {
		min-height: 100vh;
		background: #fafaf9;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Header */
	.header {
		padding: 1.5rem 0;
		border-bottom: 1px solid #e7e5e4;
		background: rgba(250, 250, 249, 0.8);
		backdrop-filter: blur(8px);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.header .container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.logo:hover {
		opacity: 0.7;
	}

	.logo-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: #1c1917;
		color: #fafaf9;
	}

	.logo-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1c1917;
		letter-spacing: -0.01em;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.nav-link) {
		color: #57534e;
	}

	:global(.nav-link:hover) {
		color: #1c1917;
		background: #f5f5f4;
	}

	/* Hero */
	.hero {
		padding: 6rem 0 4rem;
	}

	.hero-content {
		max-width: 720px;
		margin: 0 auto;
		text-align: center;
	}

	.hero-title {
		font-family: "CMU Serif", var(--font-cjk), Georgia, serif;
		font-size: clamp(2.5rem, 5vw, 3.5rem);
		font-weight: 400;
		line-height: 1.1;
		color: #1c1917;
		margin-bottom: 1.5rem;
		letter-spacing: -0.02em;
	}

	.hero-title .italic {
		font-style: italic;
		color: #78716c;
	}

	.hero-description {
		font-size: 1.125rem;
		line-height: 1.6;
		color: #57534e;
		margin-bottom: 2rem;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	/* Screenshot Section */
	.screenshot-section {
		padding: 2rem 0 4rem;
	}

	.app-screenshot {
		width: 100%;
		height: auto;
		border-radius: 0;
		border: none;
		box-shadow: none;
	}

	/* Features Section */
	.features-section {
		padding: 4rem 0;
	}

	.features-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.section-title {
		font-family: "CMU Serif", var(--font-cjk), Georgia, serif;
		font-size: 2.5rem;
		font-weight: 400;
		color: #1c1917;
		margin-bottom: 1rem;
		letter-spacing: -0.01em;
	}

	.section-description {
		font-size: 1.125rem;
		color: #57534e;
	}

	.features-grid {
		display: grid;
		gap: 2rem;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	}

	:global(.feature-card) {
		background: #ffffff;
		border: 1px solid #e7e5e4;
	}

	:global(.feature-content) {
		padding: 2rem;
	}

	.feature-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 10px;
		background: #1c1917;
		color: #fafaf9;
		margin-bottom: 1rem;
	}

	.feature-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1c1917;
		margin-bottom: 0.5rem;
	}

	.feature-description {
		font-size: 0.9375rem;
		color: #57534e;
		line-height: 1.6;
	}

	/* CTA Section */
	.cta-section {
		padding: 4rem 0;
	}

	:global(.cta-card) {
		background: #ffffff;
		border: 1px solid #e7e5e4;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	:global(.cta-content) {
		padding: 3rem;
		text-align: center;
	}

	.cta-title {
		font-family: "CMU Serif", var(--font-cjk), Georgia, serif;
		font-size: 2rem;
		font-weight: 400;
		color: #1c1917;
		margin-bottom: 1rem;
		letter-spacing: -0.01em;
	}

	.cta-description {
		font-size: 1.125rem;
		color: #57534e;
		margin-bottom: 2rem;
	}

	.cta-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	/* Buttons */
	:global(.btn-primary) {
		background: #1c1917;
		color: #fafaf9;
		border: 1px solid #1c1917;
	}

	:global(.btn-primary:hover) {
		background: #292524;
		border-color: #292524;
	}

	:global(.btn-secondary) {
		border-color: #d6d3d1;
		color: #1c1917;
		background: transparent;
	}

	:global(.btn-secondary:hover) {
		background: #f5f5f4;
		border-color: #a8a29e;
	}

	/* Main */
	.main {
		flex: 1;
	}

	/* Footer */
	.footer {
		padding: 2rem 0;
		border-top: 1px solid #e7e5e4;
		margin-top: 4rem;
	}

	.footer .container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.footer-text {
		font-size: 0.875rem;
		color: #78716c;
	}

	.footer-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.footer-link {
		font-size: 0.875rem;
		color: #57534e;
		text-decoration: none;
		transition: color 0.2s;
	}

	.footer-link:hover {
		color: #1c1917;
	}

	@media (max-width: 768px) {
		.hero {
			padding: 4rem 0 3rem;
		}

		.container {
			padding: 0 1.5rem;
		}

		:global(.cta-content) {
			padding: 2rem;
		}
	}
</style>
