<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Copy,
		Check,
		ExternalLink,
		Terminal,
		ShieldCheck,
		ArrowRight,
		Monitor,
		Apple
	} from 'lucide-svelte';

	type OSType = 'windows' | 'macos' | 'linux';
	let detectedOS = $state<OSType>('windows');
	let activeTerminalTab = $state<OSType>('windows');
	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout>;

	const terminalCommands: Record<OSType, string> = {
		windows: 'irm https://samara.app/install.ps1 | iex',
		macos: 'curl -fsSL https://samara.app/install.sh | sh',
		linux: 'curl -fsSL https://samara.app/install.sh | sh'
	};

	const osLabels: Record<OSType, { name: string; ext: string }> = {
		windows: { name: 'Windows', ext: '.msi / x64' },
		macos: { name: 'macOS', ext: '.dmg / Universal' },
		linux: { name: 'Linux', ext: '.AppImage' }
	};

	onMount(() => {
		if (typeof navigator !== 'undefined') {
			const ua = navigator.userAgent.toLowerCase();
			if (ua.includes('mac')) {
				detectedOS = 'macos';
				activeTerminalTab = 'macos';
			} else if (ua.includes('linux')) {
				detectedOS = 'linux';
				activeTerminalTab = 'linux';
			} else {
				detectedOS = 'windows';
				activeTerminalTab = 'windows';
			}
		}
	});

	function handleCopyCommand() {
		const cmd = terminalCommands[activeTerminalTab];
		if (navigator.clipboard) {
			navigator.clipboard.writeText(cmd);
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}
</script>

<svelte:head>
	<title>Samara — The Academic Table Engine</title>
	<meta
		name="description"
		content="A precision typesetting station engineered for native LaTeX booktabs and publication-grade academic tables."
	/>
</svelte:head>

<div class="landing-root">
	<!-- =================================================================================== -->
	<!-- NAVBAR                                                                              -->
	<!-- =================================================================================== -->
	<header class="landing-nav">
		<a href="/" class="brand-badge">
			<span class="brand-square"></span>
			<span class="brand-name">SAMARA</span>
			<span class="brand-version">// v1.2.0</span>
		</a>

		<nav class="nav-links">
			<a href="#hero" class="nav-item">§ 01 Station</a>
			<a href="#features" class="nav-item">§ 02 Specification</a>
			<a href="#platforms" class="nav-item">§ 03 Platforms</a>
			<a href="https://github.com/sylvester1001/samara" target="_blank" rel="noreferrer" class="nav-item nav-ext">
				<span>GitHub</span>
				<ExternalLink class="size-3 opacity-60" />
			</a>
		</nav>

		<a href="/" class="nav-cta-btn">
			<span>Web 在线版</span>
			<ArrowRight class="size-3.5" />
		</a>
	</header>

	<!-- =================================================================================== -->
	<!-- HERO (方案 B: 42% 左侧排印与下载 / 58% 右侧真实高清 UI 战术展台)                    -->
	<!-- =================================================================================== -->
	<section id="hero" class="hero-wrapper">
		<div class="hero-meta-bar">
			<span>LOC: 31°14'N // LNG: 121°28'E // ARCHIVE SPEC: 2026-LATEX</span>
			<span class="hide-mobile">PRECISION WORKSTATION // 100% LOCAL COMPUTE</span>
		</div>

		<div class="hero-columns">
			<!-- 左栏：大标题与下载通道 -->
			<div class="hero-left">
				<div class="hero-pill">
					<span class="pulse-dot"></span>
					<span>PRECISION ACADEMIC TYPESETTING</span>
				</div>

				<h1 class="hero-title">
					The Rigor<br />
					Of Academics.<br />
					<span class="title-italic">The Precision</span><br />
					Of Machinery.
				</h1>

				<div class="actions-group">
					<!-- 主下载按钮 -->
					<div class="btn-row">
						<a
							href="https://github.com/sylvester1001/samara/releases"
							target="_blank"
							rel="noreferrer"
							class="primary-download-btn"
						>
							{#if detectedOS === 'macos'}
								<Apple class="size-4 shrink-0 fill-current" />
								<span>Download for macOS</span>
							{:else if detectedOS === 'linux'}
								<Monitor class="size-4 shrink-0" />
								<span>Download for Linux</span>
							{:else}
								<Monitor class="size-4 shrink-0" />
								<span>Download for Windows</span>
							{/if}
						</a>

						<a href="/" class="secondary-web-btn">
							<span>启动在线终端</span>
							<ArrowRight class="size-3.5 opacity-80" />
						</a>
					</div>

					<!-- 终端安装命令行盒 -->
					<div class="terminal-deck">
						<div class="terminal-header-meta">
							<span>// INSTALL VIA TERMINAL</span>
							<span>{osLabels[activeTerminalTab].ext}</span>
						</div>

						<div class="terminal-box">
							<div class="terminal-tabs">
								<button
									type="button"
									class="term-tab {activeTerminalTab === 'macos' ? 'active' : ''}"
									onclick={() => (activeTerminalTab = 'macos')}
								>
									macOS
								</button>
								<button
									type="button"
									class="term-tab border-l {activeTerminalTab === 'linux' ? 'active' : ''}"
									onclick={() => (activeTerminalTab = 'linux')}
								>
									Linux
								</button>
								<button
									type="button"
									class="term-tab border-l {activeTerminalTab === 'windows' ? 'active' : ''}"
									onclick={() => (activeTerminalTab = 'windows')}
								>
									Windows
								</button>
							</div>

							<div class="terminal-body">
								<code class="terminal-code">
									{terminalCommands[activeTerminalTab]}
								</code>
								<button
									type="button"
									class="copy-btn"
									onclick={handleCopyCommand}
									title="复制命令"
									aria-label="Copy Command"
								>
									{#if copied}
										<Check class="size-3.5 stroke-[2.5]" />
									{:else}
										<Copy class="size-3.5 stroke-[2.2]" />
									{/if}
								</button>
							</div>
						</div>

						<div class="terminal-footer-meta">
							<ShieldCheck class="size-3 opacity-60" />
							<span>SHA-256 VERIFIED // ZERO TELEMETRY // 100% LOCAL</span>
						</div>
					</div>
				</div>
			</div>

			<!-- 右栏：真实软件高清截图战术展台 -->
			<div class="hero-right">
				<div class="tactical-stage">
					<!-- 四角取景器标定 (明日方舟 Crop Marks) -->
					<div class="corner-mark top-left"></div>
					<div class="corner-mark top-right"></div>
					<div class="corner-mark bottom-left"></div>
					<div class="corner-mark bottom-right"></div>

					<!-- 顶部像素标尺 -->
					<div class="stage-scale-top">
						<span>⌜ 000 // TACTICAL VIEWPORT</span>
						<span class="scale-title">SAMARA ACADEMIC ENGINE</span>
						<span>1024 ⌝</span>
					</div>

					<!-- 真实产品截图 -->
					<div class="screenshot-container">
						<img
							src="/samara-ui-preview.png"
							alt="Samara Academic Table Editor Interface"
							class="preview-img"
							draggable="false"
						/>
					</div>

					<!-- 底部状态标定 -->
					<div class="stage-scale-bottom">
						<span>⌞ ARCHIVE: V1.2.0</span>
						<span>● LIVE INTERFACE PREVIEW</span>
						<span>STATUS: READY ⌟</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- =================================================================================== -->
	<!-- FEATURES (冷白底先锋三列网格)                                                       -->
	<!-- =================================================================================== -->
	<section id="features" class="features-wrapper">
		<div class="section-container">
			<div class="features-header">
				<div class="features-title-row">
					<h2 class="features-title">Features</h2>
					<span class="eye-symbol">👁</span>
				</div>
				<div class="features-meta">
					// 01 ARCHIVE SPECIFICATION & ENGINE STANDARDS
				</div>
			</div>

			<div class="features-grid">
				<!-- 卡片 1 -->
				<div class="feature-card">
					<div class="card-text-block">
						<div class="card-badge">#1 SPECIFICATION</div>
						<h3 class="card-heading">The Three Rules</h3>
						<p class="card-desc">
							严守学术界“永不使用竖线”的纯正排印传统。精确标定 1.0pt 顶线与底线、0.5pt 表头分隔线，让数据层次分明。
						</p>
					</div>
					<div class="blueprint-box">
						<div class="blueprint-lines">
							<div class="b-line b-thick">
								<span>TOP RULE</span>
								<span>1.0 pt</span>
							</div>
							<div class="b-line b-thin">
								<span>MID RULE</span>
								<span>0.5 pt</span>
							</div>
							<div class="b-line b-thick">
								<span>BOTTOM RULE</span>
								<span>1.0 pt</span>
							</div>
						</div>
						<div class="blueprint-stamp">BOOKTABS SPEC // ZERO VERTICAL LINES</div>
					</div>
				</div>

				<!-- 卡片 2 -->
				<div class="feature-card">
					<div class="card-text-block">
						<div class="card-badge">#2 COMPILER</div>
						<h3 class="card-heading">LaTeX Synthesis</h3>
						<p class="card-desc">
							光标级精准公式注入与跨列合并。一键导出干净、零冗余包的 \begin&#123;booktabs&#125; 源码，直接粘入 Overleaf。
						</p>
					</div>
					<div class="blueprint-box">
						<div class="latex-preview-block">
							<span class="latex-comment">% Pure Native Code</span><br />
							\usepackage&#123;<span class="latex-keyword">booktabs</span>&#125;<br />
							\begin&#123;tabular&#125;&#123;&gt;&#123;\centering\arraybackslash&#125;m&#123;2.4cm&#125;&#125;
						</div>
						<div class="blueprint-stamp">OVERLEAF COMPLIANT // UTF-8 CTEX</div>
					</div>
				</div>

				<!-- 卡片 3 -->
				<div class="feature-card">
					<div class="card-text-block">
						<div class="card-badge">#3 SOVEREIGNTY</div>
						<h3 class="card-heading">Zero Leakage</h3>
						<p class="card-desc">
							未发表的核心学术实验成果与商业机密，数据 100% 留存在本地设备。无任何云端上传，零遥测，绝对安全。
						</p>
					</div>
					<div class="blueprint-box">
						<div class="security-stamp-pill">
							<ShieldCheck class="size-4" />
							<span>100% LOCAL COMPUTATION</span>
						</div>
						<div class="blueprint-sub">NO TELEMETRY // AIR-GAPPED READY</div>
						<div class="blueprint-stamp">STANDALONE DESKTOP DECK</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- =================================================================================== -->
	<!-- PLATFORMS (三平台下载矩阵)                                                         -->
	<!-- =================================================================================== -->
	<section id="platforms" class="platforms-wrapper">
		<div class="section-container platforms-center">
			<div class="platforms-header">
				<div class="platforms-sub">ACROSS ALL COMPUTERS</div>
				<h2 class="platforms-title">Samara Desktop App</h2>
			</div>

			<div class="platforms-grid">
				<div class="platform-card">
					<div class="platform-meta">macOS 12+</div>
					<h3 class="platform-name">macOS</h3>
					<a
						href="https://github.com/sylvester1001/samara/releases"
						target="_blank"
						rel="noreferrer"
						class="platform-download-btn"
					>
						<Apple class="size-4 fill-current" />
						<span>Download .dmg</span>
					</a>
				</div>

				<div class="platform-card">
					<div class="platform-meta">Windows 10/11</div>
					<h3 class="platform-name">Windows</h3>
					<a
						href="https://github.com/sylvester1001/samara/releases"
						target="_blank"
						rel="noreferrer"
						class="platform-download-btn"
					>
						<Monitor class="size-4" />
						<span>Download .msi</span>
					</a>
				</div>

				<div class="platform-card">
					<div class="platform-meta">Any Distro</div>
					<h3 class="platform-name">Linux</h3>
					<a
						href="https://github.com/sylvester1001/samara/releases"
						target="_blank"
						rel="noreferrer"
						class="platform-download-btn"
					>
						<Terminal class="size-4" />
						<span>Install via Terminal</span>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- =================================================================================== -->
	<!-- FOOTER                                                                              -->
	<!-- =================================================================================== -->
	<footer class="landing-footer">
		<div>TYPESET IN CMU SERIF & JETBRAINS MONO. (C) 2026 SAMARA ENGINE.</div>
		<div class="footer-links">
			<a href="https://github.com/sylvester1001/samara" target="_blank" rel="noreferrer">GitHub</a>
			<a href="https://github.com/sylvester1001/samara/releases" target="_blank" rel="noreferrer">Releases</a>
			<a href="/" class="footer-cta">Launch Web Editor ↗</a>
		</div>
	</footer>
</div>

<style>
	/* 强制恢复全局滚动 */
	:global(html),
	:global(body) {
		height: auto !important;
		min-height: 100% !important;
		overflow-y: auto !important;
		overflow-x: hidden !important;
		background: #0202f1 !important;
		margin: 0;
		padding: 0;
	}

	.landing-root {
		width: 100%;
		min-height: 100vh;
		background-color: #0202f1;
		color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	/* NAVBAR */
	.landing-nav {
		width: 100%;
		height: 64px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.18);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 3.5rem;
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(2, 2, 241, 0.95);
		backdrop-filter: blur(12px);
		box-sizing: border-box;
	}

	.brand-badge {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: #ffffff;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.12em;
	}

	.brand-square {
		width: 8px;
		height: 8px;
		background: #ffffff;
		display: inline-block;
	}

	.brand-version {
		font-size: 0.65rem;
		opacity: 0.45;
		letter-spacing: 0.05em;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 2.5rem;
	}

	.nav-item {
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		transition: color 0.15s;
	}

	.nav-item:hover {
		color: #ffffff;
	}

	.nav-ext {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.nav-cta-btn {
		height: 36px;
		padding: 0 1.1rem;
		background: #ffffff;
		color: #0202f1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 0;
		box-shadow: 0 2px 8px rgba(0,0,0,0.15);
		transition: background 0.15s, transform 0.1s;
	}

	.nav-cta-btn:hover {
		background: #f0f0ff;
	}

	/* HERO */
	.hero-wrapper {
		max-width: 1680px;
		margin: 0 auto;
		padding: 2.5rem 3.5rem 5rem;
		min-height: calc(100vh - 64px);
		display: flex;
		flex-direction: column;
		justify-content: center;
		box-sizing: border-box;
	}

	.hero-meta-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.45);
		text-transform: uppercase;
		margin-bottom: 2rem;
		user-select: none;
	}

	.hero-columns {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 3.5rem;
		width: 100%;
	}

	.hero-left {
		flex: 0 0 42%;
		max-width: 42%;
		display: flex;
		flex-direction: column;
	}

	.hero-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.8);
		text-transform: uppercase;
		margin-bottom: 1.2rem;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
	}

	.hero-title {
		font-family: 'CMU Serif', 'Computer Modern Serif', 'Times New Roman', Georgia, serif;
		font-size: 4.8rem;
		line-height: 0.94;
		letter-spacing: -0.03em;
		text-transform: uppercase;
		color: #ffffff;
		margin: 0 0 2.8rem 0;
		font-weight: 700;
	}

	.title-italic {
		font-weight: 400;
		font-style: italic;
		opacity: 0.9;
	}

	.actions-group {
		display: flex;
		flex-direction: column;
		gap: 1.8rem;
	}

	.btn-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.primary-download-btn {
		height: 48px;
		padding: 0 1.8rem;
		background: #ffffff;
		color: #0202f1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		border-radius: 0;
		box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.35);
		transition: background 0.15s, transform 0.1s;
	}

	.primary-download-btn:hover {
		background: #f4f4f6;
		transform: translateY(-1px);
	}

	.secondary-web-btn {
		height: 48px;
		padding: 0 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.45);
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0;
		transition: background 0.15s;
	}

	.secondary-web-btn:hover {
		background: rgba(255, 255, 255, 0.16);
	}

	.terminal-deck {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		max-width: 460px;
		width: 100%;
	}

	.terminal-header-meta,
	.terminal-footer-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.55);
		text-transform: uppercase;
	}

	.terminal-box {
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(8px);
		display: flex;
		flex-direction: column;
	}

	.terminal-tabs {
		display: flex;
		border-bottom: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.05);
	}

	.term-tab {
		flex: 1;
		padding: 0.4rem 0.6rem;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		text-transform: uppercase;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.term-tab.border-l {
		border-left: 1px solid rgba(255, 255, 255, 0.18);
	}

	.term-tab.active {
		background: #ffffff;
		color: #0202f1;
		font-weight: 700;
	}

	.terminal-body {
		padding: 0.65rem 0.8rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.terminal-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.copy-btn {
		background: rgba(255, 255, 255, 0.12);
		border: none;
		color: #ffffff;
		padding: 0.35rem 0.45rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}

	.copy-btn:hover {
		background: #ffffff;
		color: #0202f1;
	}

	/* HERO RIGHT (战术展台与真实截图) */
	.hero-right {
		flex: 0 0 55%;
		max-width: 55%;
		position: relative;
	}

	.tactical-stage {
		position: relative;
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: rgba(0, 0, 0, 0.4);
		padding: 0.6rem;
		box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.65);
		box-sizing: border-box;
	}

	/* 明日方舟取景器四角切角 */
	.corner-mark {
		position: absolute;
		width: 10px;
		height: 10px;
		pointer-events: none;
	}

	.corner-mark.top-left {
		top: -4px;
		left: -4px;
		border-top: 2px solid #ffffff;
		border-left: 2px solid #ffffff;
	}

	.corner-mark.top-right {
		top: -4px;
		right: -4px;
		border-top: 2px solid #ffffff;
		border-right: 2px solid #ffffff;
	}

	.corner-mark.bottom-left {
		bottom: -4px;
		left: -4px;
		border-bottom: 2px solid #ffffff;
		border-left: 2px solid #ffffff;
	}

	.corner-mark.bottom-right {
		bottom: -4px;
		right: -4px;
		border-bottom: 2px solid #ffffff;
		border-right: 2px solid #ffffff;
	}

	.stage-scale-top,
	.stage-scale-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		padding: 0.2rem 0.4rem;
	}

	.stage-scale-top {
		border-bottom: 1px solid rgba(255, 255, 255, 0.18);
	}

	.stage-scale-bottom {
		border-top: 1px solid rgba(255, 255, 255, 0.18);
		margin-top: 0.4rem;
	}

	.scale-title {
		letter-spacing: 0.25em;
		font-weight: 600;
	}

	.screenshot-container {
		margin-top: 0.4rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: #09090b;
		overflow: hidden;
		box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
	}

	.preview-img {
		width: 100%;
		height: auto;
		display: block;
		user-select: none;
		pointer-events: none;
	}

	/* FEATURES */
	.features-wrapper {
		background: #ffffff;
		color: #111113;
		padding: 7rem 3.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.12);
		box-sizing: border-box;
	}

	.section-container {
		max-width: 1680px;
		margin: 0 auto;
	}

	.features-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		border-bottom: 1px solid rgba(0, 0, 0, 0.18);
		padding-bottom: 1.5rem;
		margin-bottom: 3.5rem;
	}

	.features-title-row {
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}

	.features-title {
		font-family: 'CMU Serif', Georgia, serif;
		font-size: 4.5rem;
		line-height: 1;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: -0.02em;
		margin: 0;
		color: #000000;
	}

	.eye-symbol {
		font-size: 2.4rem;
		color: #0202f1;
	}

	.features-meta {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		letter-spacing: 0.15em;
		color: rgba(0, 0, 0, 0.5);
		text-transform: uppercase;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2.2rem;
	}

	.feature-card {
		border: 1px solid rgba(0, 0, 0, 0.15);
		background: #ffffff;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}

	.feature-card:hover {
		border-color: #0202f1;
	}

	.card-badge {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		color: #0202f1;
		font-weight: 700;
		text-transform: uppercase;
		margin-bottom: 0.8rem;
	}

	.card-heading {
		font-family: 'CMU Serif', Georgia, serif;
		font-size: 1.85rem;
		text-transform: uppercase;
		margin: 0 0 1rem 0;
		color: #000000;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.card-desc {
		font-size: 0.85rem;
		line-height: 1.6;
		color: rgba(0, 0, 0, 0.7);
		margin: 0 0 2rem 0;
	}

	.blueprint-box {
		width: 100%;
		height: 180px;
		background: #f4f4f6;
		border: 1px solid rgba(0, 0, 0, 0.1);
		padding: 1.2rem;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		box-sizing: border-box;
	}

	.blueprint-lines {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		color: #0202f1;
	}

	.b-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.25rem;
	}

	.b-line.b-thick {
		border-bottom: 2px solid #0202f1;
		font-weight: 700;
	}

	.b-line.b-thin {
		border-bottom: 1px solid rgba(2, 2, 241, 0.45);
	}

	.blueprint-stamp {
		position: absolute;
		bottom: 0.5rem;
		right: 0.6rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.55rem;
		letter-spacing: 0.15em;
		color: rgba(2, 2, 241, 0.6);
		text-transform: uppercase;
	}

	.latex-preview-block {
		background: #ffffff;
		border: 1px solid rgba(2, 2, 241, 0.3);
		padding: 0.8rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #0202f1;
	}

	.latex-comment {
		color: rgba(0, 0, 0, 0.4);
	}

	.latex-keyword {
		font-weight: 700;
		color: #0202f1;
	}

	.security-stamp-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid #0202f1;
		padding: 0.4rem 0.8rem;
		background: #ffffff;
		color: #0202f1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		align-self: flex-start;
	}

	.blueprint-sub {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		color: rgba(0, 0, 0, 0.45);
		margin-top: 0.5rem;
	}

	/* PLATFORMS */
	.platforms-wrapper {
		background: #0202f1;
		color: #ffffff;
		padding: 7rem 3.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		box-sizing: border-box;
	}

	.platforms-center {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.platforms-header {
		text-align: center;
		margin-bottom: 3.5rem;
	}

	.platforms-sub {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		letter-spacing: 0.2em;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 0.6rem;
	}

	.platforms-title {
		font-family: 'CMU Serif', Georgia, serif;
		font-size: 3.2rem;
		text-transform: uppercase;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.platforms-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.8rem;
		width: 100%;
		max-width: 1100px;
	}

	.platform-card {
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(0, 0, 0, 0.25);
		padding: 2.5rem 1.8rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}

	.platform-card:hover {
		border-color: #ffffff;
	}

	.platform-meta {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.55);
		text-transform: uppercase;
		margin-bottom: 0.8rem;
	}

	.platform-name {
		font-family: 'CMU Serif', Georgia, serif;
		font-size: 2.2rem;
		text-transform: uppercase;
		margin: 0 0 2rem 0;
	}

	.platform-download-btn {
		width: 100%;
		height: 44px;
		background: #ffffff;
		color: #0202f1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: background 0.15s;
	}

	.platform-download-btn:hover {
		background: #f0f0ff;
	}

	/* FOOTER */
	.landing-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		padding: 2.5rem 3.5rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.55);
		text-transform: uppercase;
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1680px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.footer-links {
		display: flex;
		align-items: center;
		gap: 1.8rem;
	}

	.footer-links a {
		color: rgba(255, 255, 255, 0.75);
		text-decoration: none;
		transition: color 0.15s;
	}

	.footer-links a:hover {
		color: #ffffff;
	}

	.footer-cta {
		color: #ffffff !important;
		font-weight: 700;
	}

	/* RESPONSIVE */
	@media (max-width: 1100px) {
		.landing-nav {
			padding: 0 1.5rem;
		}

		.hero-wrapper {
			padding: 2rem 1.5rem 4rem;
		}

		.hero-columns {
			flex-direction: column;
			gap: 3rem;
		}

		.hero-left,
		.hero-right {
			flex: 0 0 100%;
			max-width: 100%;
		}

		.hero-title {
			font-size: 3.5rem;
		}

		.features-wrapper,
		.platforms-wrapper,
		.landing-footer {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}

		.features-grid,
		.platforms-grid {
			grid-template-columns: 1fr;
		}

		.hide-mobile {
			display: none;
		}
	}
</style>
