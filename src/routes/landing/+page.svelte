<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Copy,
		Check,
		ExternalLink,
		ShieldCheck,
		ArrowRight
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

{#snippet appleIcon(className = 'size-5')}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 40 560 560" class="{className} shrink-0 fill-current" aria-hidden="true">
		<path d="M447.1 332.7C446.9 296 463.5 268.3 497.1 247.9C478.3 221 449.9 206.2 412.4 203.3C376.9 200.5 338.1 224 323.9 224C308.9 224 274.5 204.3 247.5 204.3C191.7 205.2 132.4 248.8 132.4 337.5C132.4 363.7 137.2 390.8 146.8 418.7C159.6 455.4 205.8 545.4 254 543.9C279.2 543.3 297 526 329.8 526C361.6 526 378.1 543.9 406.2 543.9C454.8 543.2 496.6 461.4 508.8 424.6C443.6 393.9 447.1 334.6 447.1 332.7zM390.5 168.5C417.8 136.1 415.3 106.6 414.5 96C390.4 97.4 362.5 112.4 346.6 130.9C329.1 150.7 318.8 175.2 321 202.8C347.1 204.8 370.9 191.4 390.5 168.5z" />
	</svg>
{/snippet}

{#snippet windowsIcon(className = 'size-5')}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="{className} shrink-0 fill-current" aria-hidden="true">
		<path fill="currentColor" d="M2.75 7.189V2.865c0-.102 0-.115.115-.115h8.622c.128 0 .14 0 .14.128V11.5c0 .128 0 .128-.14.128H2.865c-.102 0-.115 0-.115-.116zM7.189 21.25H2.865c-.102 0-.115 0-.115-.116V12.59c0-.128 0-.128.128-.128h8.635c.102 0 .115 0 .115.115v8.57c0 .09 0 .103-.116.103zM21.25 7.189v4.31c0 .116 0 .116-.116.116h-8.557c-.102 0-.128 0-.128-.115V2.865c0-.09 0-.102.115-.102h8.48c.206 0 .206 0 .206.205zm-8.763 9.661v-4.273c0-.09 0-.115.103-.09h8.621c.026 0 0 .09 0 .142v8.518a.06.06 0 0 1-.017.06a.06.06 0 0 1-.06.017H12.54s-.09 0-.077-.09V16.85z" />
	</svg>
{/snippet}

{#snippet linuxIcon(className = 'size-5')}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="{className} shrink-0 fill-current" aria-hidden="true">
		<path d="M316.9 187.3C317.9 187.8 318.7 189 319.9 189C321 189 322.7 188.6 322.8 187.5C323 186.1 320.9 185.2 319.6 184.6C317.9 183.9 315.7 183.6 314.1 184.5C313.7 184.7 313.3 185.2 313.5 185.6C313.8 186.9 315.8 186.7 316.9 187.3zM295 189C296.2 189 297 187.8 298 187.3C299.1 186.7 301.1 186.9 301.5 185.7C301.7 185.3 301.3 184.8 300.9 184.6C299.3 183.7 297.1 184 295.4 184.7C294.1 185.3 292 186.2 292.2 187.6C292.3 188.6 294 189.1 295 189zM516 467.8C512.4 463.8 510.7 456.2 508.8 448.1C507 440 504.9 431.3 498.3 425.7C497 424.6 495.7 423.6 494.3 422.8C493 422 491.6 421.3 490.2 420.8C499.4 393.5 495.8 366.3 486.5 341.7C475.1 311.6 455.2 285.3 440 267.3C422.9 245.8 406.3 225.4 406.6 195.3C407.1 149.4 411.7 64.1 330.8 64C228.4 63.8 254 167.4 252.9 199.2C251.2 222.6 246.5 241 230.4 263.9C211.5 286.4 184.9 322.7 172.3 360.6C166.3 378.5 163.5 396.7 166.1 413.9C159.6 419.7 154.7 428.6 149.5 434.1C145.3 438.4 139.2 440 132.5 442.4C125.8 444.8 118.5 448.4 114 456.9C111.9 460.8 111.2 465 111.2 469.3C111.2 473.2 111.8 477.2 112.4 481.1C113.6 489.2 114.9 496.8 113.2 501.9C108 516.3 107.3 526.3 111 533.6C114.8 540.9 122.4 544.1 131.1 545.9C148.4 549.5 171.9 548.6 190.4 558.4C210.2 568.8 230.3 572.5 246.3 568.8C257.9 566.2 267.4 559.2 272.2 548.6C284.7 548.5 298.5 543.2 320.5 542C335.4 540.8 354.1 547.3 375.6 546.1C376.2 548.4 377 550.7 378.1 552.8L378.1 552.9C386.4 569.6 401.9 577.2 418.4 575.9C435 574.6 452.5 564.9 466.7 548C480.3 531.6 502.7 524.8 517.6 515.8C525 511.3 531 505.7 531.5 497.5C531.9 489.3 527.1 480.2 516 467.8zM319.8 151.3C329.6 129.1 354 129.5 363.8 150.9C370.3 165.1 367.4 181.8 359.5 191.3C357.9 190.5 353.6 188.7 346.9 186.4C348 185.2 350 183.7 350.8 181.8C355.6 170 350.6 154.8 341.7 154.5C334.4 154 327.8 165.3 329.9 177.5C325.8 175.5 320.5 174 316.9 173.1C315.9 166.2 316.6 158.5 319.8 151.3zM279.1 139.8C289.2 139.8 299.9 154 298.2 173.3C294.7 174.3 291.1 175.8 288 177.9C289.2 169 284.7 157.8 278.4 158.3C270 159 268.6 179.5 276.6 186.4C277.6 187.2 278.5 186.2 270.7 191.9C255.1 177.3 260.2 139.8 279.1 139.8zM265.5 200.5C271.7 195.9 279.1 190.5 279.6 190C284.3 185.6 293.1 175.8 307.5 175.8C314.6 175.8 323.1 178.1 333.4 184.7C339.7 188.8 344.7 189.1 356 194C364.4 197.5 369.7 203.7 366.5 212.2C363.9 219.3 355.5 226.6 343.8 230.3C332.7 233.9 324 246.3 305.6 245.2C301.7 245 298.6 244.2 296 243.1C288 239.6 283.8 232.7 276 228.1C267.4 223.3 262.8 217.7 261.3 212.8C259.9 207.9 261.3 203.8 265.5 200.5zM268.8 534.5C266.1 569.6 224.9 568.9 193.5 552.5C163.6 536.7 124.9 546 117 530.6C114.6 525.9 114.6 517.9 119.6 504.2L119.6 504C122 496.4 120.2 488 119 480.1C117.8 472.3 117.2 465.1 119.9 460.1C123.4 453.4 128.4 451 134.7 448.8C145 445.1 146.5 445.4 154.3 438.9C159.8 433.2 163.8 426 168.6 420.9C173.7 415.4 178.6 412.8 186.3 414C194.4 415.2 201.4 420.8 208.2 430L227.8 465.6C237.3 485.5 270.9 514 268.8 534.5zM267.4 508.6C263.3 502 257.8 495 253 489C260.1 489 267.2 486.8 269.7 480.1C272 473.9 269.7 465.2 262.3 455.2C248.8 437 224 422.7 224 422.7C210.5 414.3 202.9 404 199.4 392.8C195.9 381.6 196.4 369.5 199.1 357.6C204.3 334.7 217.7 312.4 226.3 298.4C228.6 296.7 227.1 301.6 217.6 319.2C209.1 335.3 193.2 372.5 215 401.6C215.6 380.9 220.5 359.8 228.8 340.1C240.8 312.7 266.1 265.2 268.1 227.4C269.2 228.2 272.7 230.6 274.3 231.5C278.9 234.2 282.4 238.2 286.9 241.8C299.3 251.8 315.4 251 329.3 243C335.5 239.5 340.5 235.5 345.2 234C355.1 230.9 363 225.4 367.5 219C375.2 249.4 393.2 293.3 404.7 314.7C410.8 326.1 423 350.2 428.3 379.3C431.6 379.2 435.3 379.7 439.2 380.7C453 345 427.5 306.5 415.9 295.8C411.2 291.2 411 289.2 413.3 289.3C425.9 300.5 442.5 323 448.5 348.3C451.3 359.9 451.8 372 448.9 384C465.3 390.8 484.8 401.9 479.6 418.8C477.4 418.7 476.4 418.8 475.4 418.8C478.6 408.7 471.5 401.2 452.6 392.7C433 384.1 416.6 384.1 414.3 405.2C402.2 409.4 396 419.9 392.9 432.5C390.1 443.7 389.3 457.2 388.5 472.4C388 480.1 384.9 490.4 381.7 501.4C349.6 524.3 305 534.3 267.4 508.6zM524.8 497.1C523.9 513.9 483.6 517 461.6 543.6C448.4 559.3 432.2 568 418 569.1C403.8 570.2 391.5 564.3 384.3 549.8C379.6 538.7 381.9 526.7 385.4 513.5C389.1 499.3 394.6 484.7 395.3 472.9C396.1 457.7 397 444.4 399.5 434.2C402.1 423.9 406.1 417 413.2 413.1C413.5 412.9 413.9 412.8 414.2 412.6C415 425.8 421.5 439.2 433 442.1C445.6 445.4 463.7 434.6 471.4 425.8C480.4 425.5 487.1 424.9 494 430.9C503.9 439.4 501.1 461.2 511.1 472.5C521.7 484.1 525.1 492 524.8 497.1zM269.4 212.7C271.4 214.6 274.1 217.2 277.4 219.8C284 225 293.2 230.4 304.7 230.4C316.3 230.4 327.2 224.5 336.5 219.6C341.4 217 347.4 212.6 351.3 209.2C355.2 205.8 357.2 202.9 354.4 202.6C351.6 202.3 351.8 205.2 348.4 207.7C344 210.9 338.7 215.1 334.5 217.5C327.1 221.7 315 227.7 304.6 227.7C294.2 227.7 285.9 222.9 279.7 218C276.6 215.5 274 213 272 211.1C270.5 209.7 270.1 206.5 267.7 206.2C266.3 206.1 265.9 209.9 269.4 212.7z" />
	</svg>
{/snippet}

<svelte:head>
	<title>Samara — The Academic Table Engine</title>
	<meta
		name="description"
		content="A precision typesetting station engineered for native LaTeX booktabs and publication-grade academic tables."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="landing-root">
	<!-- =================================================================================== -->
	<!-- NAVBAR                                                                              -->
	<!-- =================================================================================== -->
	<header class="landing-nav">
		<div class="nav-inner">
			<a href="/" class="brand-badge">
				<span class="brand-square"></span>
				<span class="brand-name">SAMARA</span>
				<span class="brand-version">// v1.2.0</span>
			</a>

			<nav class="nav-links">
				<a href="#hero" class="nav-item">§ 01 Station</a>
				<a href="#features" class="nav-item">§ 02 Specification</a>
				<a href="#platforms" class="nav-item">§ 03 Platforms</a>
				<a
					href="https://github.com/sylvester1001/samara"
					target="_blank"
					rel="noreferrer"
					class="nav-item nav-ext"
				>
					<span>GitHub</span>
					<ExternalLink class="size-3 opacity-60" />
				</a>
			</nav>

			<div class="nav-right-actions">
				<!-- 语言指示器 -->
				<div class="lang-pill">
					<span class="lang-active">EN</span>
					<span class="lang-sep">/</span>
					<span class="lang-inactive">中</span>
				</div>

				<a href="/" class="nav-cta-btn">
					<span>Launch Web App</span>
					<ArrowRight class="size-3.5" />
				</a>
			</div>
		</div>
	</header>

	<!-- =================================================================================== -->
	<!-- HERO (方案 B: 40% 左侧排印与下载中枢 / 60% 右侧真实高清 UI 战术展台)                 -->
	<!-- =================================================================================== -->
	<section id="hero" class="hero-wrapper">
		<div class="hero-meta-bar">
			<span>LOC: 31°14'N // LNG: 121°28'E // ARCHIVE SPEC: 2026-LATEX</span>
			<span class="hide-mobile">PRECISION WORKSTATION // 100% LOCAL COMPUTE</span>
		</div>

		<div class="hero-columns">
			<!-- 左栏：修长先锋大标题与下载通道 -->
			<div class="hero-left">
				<div class="hero-pill">
					<span class="pulse-dot"></span>
					<span>PRECISION ACADEMIC TYPESETTING</span>
				</div>

				<h1 class="hero-title">
					The Rigor<br />
					of&nbsp;Academics.<br />
					<span class="title-italic">The Precision</span><br />
					of&nbsp;Machinery.
				</h1>

				<div class="actions-group">
					<!-- 主下载按钮组 -->
					<div class="btn-row">
						<a
							href="https://github.com/sylvester1001/samara/releases"
							target="_blank"
							rel="noreferrer"
							class="primary-download-btn"
						>
							{#if detectedOS === 'macos'}
								{@render appleIcon('size-5')}
								<span>Download for macOS</span>
							{:else if detectedOS === 'linux'}
								{@render linuxIcon('size-5')}
								<span>Download for Linux</span>
							{:else}
								{@render windowsIcon('size-5')}
								<span>Download for Windows</span>
							{/if}
						</a>

						<a href="/" class="secondary-web-btn">
							<span>Launch Web Terminal</span>
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
									title="Copy Command"
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
					<!-- 四角取景器切角标定 (明日方舟 Crop Marks) -->
					<div class="corner-mark top-left"></div>
					<div class="corner-mark top-right"></div>
					<div class="corner-mark bottom-left"></div>
					<div class="corner-mark bottom-right"></div>

					<!-- 顶部标尺 -->
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
							Strict adherence to standard Booktabs format. Zero vertical lines. Precisely calibrated 1.0pt top and bottom rules with 0.5pt mid-rules for clean data hierarchy.
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
							Surgical formula injection with full selection preservation. One-click export to clean, dependency-free \begin&#123;booktabs&#125; code ready for Overleaf.
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
							Unpublished experimental data and intellectual assets remain 100% offline. Zero cloud transmission, zero telemetry, air-gapped confidential security.
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
						{@render appleIcon('size-5')}
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
						{@render windowsIcon('size-5')}
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
						{@render linuxIcon('size-5')}
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
		<div>TYPESET IN CORMORANT GARAMOND & JETBRAINS MONO. (C) 2026 SAMARA ENGINE.</div>
		<div class="footer-links">
			<a href="https://github.com/sylvester1001/samara" target="_blank" rel="noreferrer">GitHub</a>
			<a href="https://github.com/sylvester1001/samara/releases" target="_blank" rel="noreferrer">Releases</a>
			<a href="/" class="footer-cta">Launch Web Editor ↗</a>
		</div>
	</footer>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

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
		font-family: 'JetBrains Mono', 'Inter', 'Source Han Sans SC', 'PingFang SC', system-ui, sans-serif;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	/* NAVBAR */
	.landing-nav {
		width: 100%;
		height: 64px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.18);
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(2, 2, 241, 0.95);
		backdrop-filter: blur(12px);
		box-sizing: border-box;
		padding: 0 clamp(2.8rem, 5vw, 5.5rem);
	}

	.nav-inner {
		max-width: 1600px;
		width: 100%;
		height: 100%;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
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

	.nav-right-actions {
		display: flex;
		align-items: center;
		gap: 1.2rem;
	}

	.lang-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #ffffff;
		letter-spacing: 0.05em;
	}

	.lang-active {
		font-weight: 700;
		color: #ffffff;
	}

	.lang-sep {
		opacity: 0.4;
	}

	.lang-inactive {
		opacity: 0.5;
	}

	.nav-cta-btn {
		height: 36px;
		padding: 0 1.1rem;
		background: #ffffff;
		color: #0202f1;
		font-family: 'JetBrains Mono', 'Inter', 'Source Han Sans SC', sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transition: background 0.15s, transform 0.1s;
	}

	.nav-cta-btn:hover {
		background: #f0f0ff;
	}

	/* HERO */
	.hero-wrapper {
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
		padding: clamp(2rem, 3vh, 3.5rem) clamp(2.8rem, 5vw, 5.5rem) clamp(3rem, 5vh, 5rem);
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
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
		align-items: center;
		gap: clamp(1.2rem, 1.8vw, 2rem);
		width: 100%;
		box-sizing: border-box;
	}

	.hero-left {
		min-width: 0;
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

	/* 典雅现代书卷衬线 (Cormorant Garamond Light 300) - 超细发丝、空灵书卷 */
	.hero-title {
		font-family: 'Cormorant Garamond', Garamond, 'Georgia', serif;
		font-size: clamp(4.2rem, 3.2rem + 2.5vw, 6.4rem);
		line-height: 1.08;
		letter-spacing: -0.015em;
		color: #ffffff;
		margin: 0 0 2.2rem 0;
		font-weight: 300;
		font-feature-settings: "liga" 1, "dlig" 1;
	}

	.title-italic {
		font-family: 'Cormorant Garamond', Garamond, 'Georgia', serif;
		font-style: italic;
		font-weight: 300;
		opacity: 0.95;
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
		font-family: 'JetBrains Mono', 'Inter', 'Source Han Sans SC', sans-serif;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
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
		font-family: 'JetBrains Mono', 'Inter', 'Source Han Sans SC', sans-serif;
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
		min-width: 0;
		position: relative;
		width: 100%;
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
		padding: 7rem clamp(2.8rem, 5vw, 5.5rem);
		border-top: 1px solid rgba(0, 0, 0, 0.12);
		box-sizing: border-box;
	}

	.section-container {
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
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
		font-family: 'Cormorant Garamond', Garamond, 'Georgia', serif;
		font-size: 5rem;
		line-height: 0.95;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		margin: 0;
		color: #000000;
	}

	.eye-symbol {
		font-size: 2.6rem;
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
		padding: 2.2rem;
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
		font-family: 'Cormorant Garamond', Garamond, 'Georgia', serif;
		font-size: 2.4rem;
		margin: 0 0 1rem 0;
		color: #000000;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.05;
	}

	.card-desc {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
		padding: 7rem clamp(2.8rem, 5vw, 5.5rem);
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
		font-family: 'Cormorant Garamond', Garamond, 'Georgia', serif;
		font-size: 3.8rem;
		margin: 0;
		letter-spacing: 0.01em;
		font-weight: 400;
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
		font-family: 'Cormorant Garamond', Garamond, 'Georgia', serif;
		font-size: 2.6rem;
		margin: 0 0 2rem 0;
		font-weight: 400;
		letter-spacing: 0.01em;
	}

	.platform-download-btn {
		width: 100%;
		height: 44px;
		background: #ffffff;
		color: #0202f1;
		font-family: 'JetBrains Mono', 'Inter', 'Source Han Sans SC', sans-serif;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: background 0.15s;
	}

	.platform-download-btn:hover {
		background: #f0f0ff;
	}

	/* FOOTER */
	.landing-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		padding: 2.5rem clamp(2.8rem, 5vw, 5.5rem);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.55);
		text-transform: uppercase;
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1600px;
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

	/* RESPONSIVE (仅在小屏单栏堆叠时触发，其余全程平滑线性缩放) */
	@media (max-width: 999px) {
		.landing-nav {
			padding: 0 2rem;
		}

		.hero-wrapper {
			padding: 2.5rem 2rem 4rem;
		}

		.hero-columns {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.hero-left,
		.hero-right {
			width: 100%;
		}

		.hero-title {
			font-size: 3.6rem;
		}

		.features-wrapper,
		.platforms-wrapper,
		.landing-footer {
			padding-left: 2rem;
			padding-right: 2rem;
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
