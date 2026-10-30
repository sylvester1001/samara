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

	// Subtle, non-intrusive palette preset switcher for Specimen 01 & 02
	type PaletteKey = 'klein' | 'sage' | 'ochre';
	let activePalette = $state<PaletteKey>('klein');

	const palettes: Record<
		PaletteKey,
		{
			code: string;
			name: string;
			rowTint: string;
			cellPeak: string;
			cellSub: string;
			accentHex: string;
			badgeText: string;
			texColorDef: string;
			texRowMacro: string;
			texCellMacro: string;
		}
	> = {
		klein: {
			code: 'P-01',
			name: 'KLEIN SLATE',
			rowTint: '#E6ECFF',
			cellPeak: '#C7D6FF',
			cellSub: '#EEF2FF',
			accentHex: '#0202F1',
			badgeText: '#1E293B',
			texColorDef: '\\definecolor{samaraTint}{HTML}{E6ECFF}',
			texRowMacro: '\\rowcolor{samaraTint}',
			texCellMacro: '\\cellcolor{samaraPeak}'
		},
		sage: {
			code: 'P-02',
			name: 'BOTANICAL SAGE',
			rowTint: '#E2F2EA',
			cellPeak: '#BFE4D1',
			cellSub: '#EEF7F2',
			accentHex: '#0D6E52',
			badgeText: '#0F291E',
			texColorDef: '\\definecolor{samaraTint}{HTML}{E2F2EA}',
			texRowMacro: '\\rowcolor{samaraTint}',
			texCellMacro: '\\cellcolor{samaraPeak}'
		},
		ochre: {
			code: 'P-03',
			name: 'WARM OCHRE',
			rowTint: '#F9EBDD',
			cellPeak: '#F1D2B3',
			cellSub: '#FDF5ED',
			accentHex: '#B84A00',
			badgeText: '#331A08',
			texColorDef: '\\definecolor{samaraTint}{HTML}{F9EBDD}',
			texRowMacro: '\\rowcolor{samaraTint}',
			texCellMacro: '\\cellcolor{samaraPeak}'
		}
	};

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
	<!-- § 02 SPECIFICATION (EXPOSED ARCHITECTURAL BLUEPRINT × HUMANIST MONOGRAPH)           -->
	<!-- =================================================================================== -->
	<section id="features" class="spec-section">
		<!-- 顶部过渡机能警戒分界带 -->
		<div class="spec-transition-ribbon">
			<div class="ribbon-inner">
				<span>⌜ SECTION 02 // ARCHITECTURAL SPECIFICATION MONOGRAPH</span>
				<span class="hide-mobile">GRID SYSTEM: EXPOSED 1PX // COLORIMETRY: FULL-SPECTRUM</span>
				<span>TOLERANCE: ±0.00PT ⌝</span>
			</div>
		</div>

		<div class="spec-container">
			<!-- 贯穿式暴露网格总框 -->
			<div class="blueprint-frame">
				<!-- --------------------------------------------------------------------------- -->
				<!-- MONUMENTAL HEADER                                                           -->
				<!-- --------------------------------------------------------------------------- -->
				<div class="blueprint-header">
					<div class="bp-header-left">
						<div class="bp-tag-row">
							<span class="bp-section-badge">§ 02</span>
							<span class="bp-doc-code">DOC.REF // SMR-2026-ENG</span>
						</div>
						<h2 class="bp-main-title">
							Specification.<br />
							<span class="bp-title-italic">Form, Color &amp; Fidelity.</span>
						</h2>
					</div>

					<div class="bp-header-right">
						<div class="bp-abstract-label">// EDITORIAL ABSTRACT</div>
						<p class="bp-abstract-copy">
							Academic tables deserve the expressive depth of fine print editorial typography—without the friction of raw macro programming. Samara unites direct spreadsheet manipulation with full-spectrum chromatic styling, dual-stream code and graphics output, and universal data ingestion.
						</p>
						<div class="bp-header-metrics">
							<div class="bp-metric-cell">
								<span class="bp-metric-val">1:1</span>
								<span class="bp-metric-lbl">CANVAS-TO-CODE PARITY</span>
							</div>
							<div class="bp-metric-cell">
								<span class="bp-metric-val">600<small>DPI</small></span>
								<span class="bp-metric-lbl">VECTOR &amp; RASTER EXPORT</span>
							</div>
							<div class="bp-metric-cell">
								<span class="bp-metric-val">AST</span>
								<span class="bp-metric-lbl">BI-DIRECTIONAL PARSER</span>
							</div>
						</div>
					</div>
				</div>

				<!-- =========================================================================== -->
				<!-- MODULE 01: EXPRESSIVE PARAMETRIC CANVAS (所见即所得的富格式与色彩排印)         -->
				<!-- =========================================================================== -->
				<article class="bp-module">
					<!-- 左侧机能竖排导轨 -->
					<div class="bp-spine">
						<span class="spine-code">02.01</span>
						<span class="spine-line"></span>
						<span class="spine-text">PARAMETRIC STYLING &amp; COLORIMETRY</span>
					</div>

					<!-- 中栏：人文阐述与机能规格列表 -->
					<div class="bp-narrative">
						<div class="module-kicker">
							<span class="kicker-index">MODULE // 01</span>
							<span class="kicker-pill">DIRECT MANIPULATION</span>
						</div>

						<h3 class="module-title">
							Sculpt With Color<br />
							&amp; Structure.<br />
							<span class="module-title-italic">Like a Spreadsheet.</span>
						</h3>

						<p class="module-lead">
							Shape multi-tier headers, row highlights, heatmap cell fills, rule weights, and inline mathematical expressions directly on an interactive grid. Every visual refinement translates into publication-grade typography—no manual macro syntax required.
						</p>

						<!-- 硬核规格清单 -->
						<div class="spec-ledger">
							<div class="ledger-row">
								<span class="ledger-key">01 / CHROMATIC FILL</span>
								<span class="ledger-val">Full RGB/HEX row tints &amp; per-cell heatmap shading</span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">02 / BOOKTABS RULES</span>
								<span class="ledger-val">Calibrated top, mid, bottom &amp; trimmed <code>\cmidrule(lr)</code></span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">03 / TYPOGRAPHIC HIERARCHY</span>
								<span class="ledger-val">Bold/underline SOTA markers, alignment &amp; exact pt widths</span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">04 / NATIVE MATH</span>
								<span class="ledger-val">Live KaTeX rendering for inline symbols &amp; uncertainty bounds</span>
							</div>
						</div>
					</div>

					<!-- 右栏：重工机能外框 + 暖白学术出版纸张内胆 (Scheme A 核心高光舞台) -->
					<div class="bp-stage">
						<div class="tactical-chamber">
							<!-- 四角工业准星 -->
							<span class="chamber-corner tl"></span>
							<span class="chamber-corner tr"></span>
							<span class="chamber-corner bl"></span>
							<span class="chamber-corner br"></span>

							<!-- 顶部控制舱栏 (带克制、精致的色板切换开关，锦上添花) -->
							<div class="chamber-topbar">
								<div class="chamber-status">
									<span class="signal-dot"></span>
									<span>SPECIMEN STAGE // WYSIWYG PAPER VIEWPORT</span>
								</div>

								<div class="palette-switcher" role="group" aria-label="Color Palette Presets">
									<span class="switcher-label">PALETTE:</span>
									{#each Object.entries(palettes) as [key, p]}
										<button
											type="button"
											class="palette-chip {activePalette === key ? 'active' : ''}"
											onclick={() => (activePalette = key as PaletteKey)}
										>
											<span class="chip-swatch" style="background: {p.accentHex}"></span>
											<span>{p.name}</span>
										</button>
									{/each}
								</div>
							</div>

							<!-- 精密游标卡尺刻度条 -->
							<div class="cad-caliper-strip">
								<div class="caliper-col w-arch">
									<span>├ 145pt // LEFT-ALIGN</span>
								</div>
								<div class="caliper-col w-backbone">
									<span>├ 76pt // CENTER</span>
								</div>
								<div class="caliper-col w-metric">
									<span>├ 88pt // NUM-RIGHT</span>
								</div>
								<div class="caliper-col w-metric">
									<span>├ 88pt // NUM-RIGHT</span>
								</div>
								<div class="caliper-col w-loss">
									<span>├ 92pt // MATH ┤</span>
								</div>
							</div>

							<!-- 暖白学术出版纸张画布 (Humanist Editorial Paper Sheet) -->
							<div
								class="paper-sheet"
								style="--row-tint: {palettes[activePalette].rowTint}; --cell-peak: {palettes[activePalette].cellPeak}; --cell-sub: {palettes[activePalette].cellSub}; --accent-ink: {palettes[activePalette].accentHex}; --badge-ink: {palettes[activePalette].badgeText};"
							>
								<div class="paper-caption">
									<span class="caption-bold">Table 1.</span>
									<span class="caption-serif">
										Quantitative comparison of vision-language foundation architectures on standard multi-modal benchmarks. Best results are highlighted in
										<strong class="caption-highlight">tinted bold</strong>, second-best are <u>underlined</u>.
									</span>
								</div>

								<div class="paper-table-wrap">
									<table class="monograph-table">
										<thead>
											<tr class="m-toprule">
												<th rowspan="2" class="m-left">Architecture</th>
												<th rowspan="2" class="m-center">Params</th>
												<th colspan="2" class="m-center m-span-head">
													Zero-Shot Classification (%)
												</th>
												<th rowspan="2" class="m-right">
													Validation Loss (<span class="m-math"><i>L</i><sub>val</sub></span>) ↓
												</th>
											</tr>
											<tr class="m-cmidrule">
												<th class="m-right">ImageNet-1K ↑</th>
												<th class="m-right">COCO-Retrieval ↑</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td class="m-left m-model">ResNet-101 (Baseline)</td>
												<td class="m-center m-mono">44.5M</td>
												<td class="m-right m-mono">77.37</td>
												<td class="m-right m-mono">58.40</td>
												<td class="m-right m-mono">0.842 ± 0.015</td>
											</tr>
											<tr>
												<td class="m-left m-model">ViT-Large / 14</td>
												<td class="m-center m-mono">304.3M</td>
												<td class="m-right m-mono"><u>83.12</u></td>
												<td class="m-right m-mono">64.95</td>
												<td class="m-right m-mono">0.518 ± 0.009</td>
											</tr>
											<tr>
												<td class="m-left m-model">ConvNeXt-XL</td>
												<td class="m-center m-mono">350.0M</td>
												<td class="m-right m-mono">82.89</td>
												<td class="m-right m-mono cell-sub-shaded"><u>66.18</u></td>
												<td class="m-right m-mono"><u>0.491 ± 0.007</u></td>
											</tr>
											<tr class="m-row-tinted">
												<td class="m-left m-model m-bold">
													Samara-Former (Ours)
													<span class="sota-pill">SOTA</span>
												</td>
												<td class="m-center m-mono m-bold">118.2M</td>
												<td class="m-right m-mono m-bold cell-peak-shaded">86.45</td>
												<td class="m-right m-mono m-bold cell-peak-shaded">71.84</td>
												<td class="m-right m-mono m-bold">0.364 ± 0.004</td>
											</tr>
										</tbody>
									</table>
								</div>

								<!-- 纸张底部工程解剖标注条 -->
								<div class="paper-annotations">
									<div class="annot-chip">
										<span class="annot-dot"></span>
										<span>\toprule 0.08em</span>
									</div>
									<div class="annot-chip">
										<span class="annot-dot"></span>
										<span>\cmidrule(lr)&#123;3-4&#125;</span>
									</div>
									<div class="annot-chip active">
										<span class="annot-swatch" style="background: {palettes[activePalette].rowTint}"></span>
										<span>ROW FILL: {palettes[activePalette].rowTint}</span>
									</div>
									<div class="annot-chip active">
										<span class="annot-swatch" style="background: {palettes[activePalette].cellPeak}"></span>
										<span>CELL PEAK: {palettes[activePalette].cellPeak}</span>
									</div>
								</div>
							</div>

							<!-- 底部遥测状态栏 -->
							<div class="chamber-Bottombar">
								<span>FONT: COMPUTER MODERN SERIF + MONO</span>
								<span>DIRECT CELL SELECTION // LIVE COLOR PICKER</span>
								<span class="status-ok">● RENDER FIDELITY: 100%</span>
							</div>
						</div>
					</div>
				</article>

				<!-- =========================================================================== -->
				<!-- MODULE 02: DUAL-STREAM OUTPUT MANIFOLD (代码与多格式高清图片 1:1 共生输出)      -->
				<!-- =========================================================================== -->
				<article class="bp-module">
					<!-- 左侧机能竖排导轨 -->
					<div class="bp-spine">
						<span class="spine-code">02.02</span>
						<span class="spine-line"></span>
						<span class="spine-text">DUAL-STREAM OUTPUT MANIFOLD</span>
					</div>

					<!-- 中栏：人文阐述与双擎亮点 -->
					<div class="bp-narrative">
						<div class="module-kicker">
							<span class="kicker-index">MODULE // 02</span>
							<span class="kicker-pill">CODE &amp; GRAPHICS SYMMETRY</span>
						</div>

						<h3 class="module-title">
							Pure LaTeX Code.<br />
							Multi-Format Images.<br />
							<span class="module-title-italic">Identical by Design.</span>
						</h3>

						<p class="module-lead">
							Whether submitting source files to an academic journal or embedding crisp figures into slides, Word documents, or posters—Samara outputs both streams from the exact same visual state with zero metric or chromatic drift.
						</p>

						<div class="spec-ledger">
							<div class="ledger-row">
								<span class="ledger-key">STREAM A // NATIVE .TEX</span>
								<span class="ledger-val">Auto-synthesizes <code>\definecolor</code>, <code>\rowcolor</code>, <code>\cellcolor</code> &amp; <code>booktabs</code></span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">STREAM B // VECTOR .SVG</span>
								<span class="ledger-val">Resolution-independent Bézier curves for Illustrator, Figma &amp; Keynote</span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">STREAM C // RETINA .PNG / .JPG</span>
								<span class="ledger-val">Up to 600 DPI raster export with transparent or paper-white canvas</span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">STREAM D // CLIPBOARD BUS</span>
								<span class="ledger-val">One-click instant copy directly into PowerPoint, Word, or Overleaf</span>
							</div>
						</div>
					</div>

					<!-- 右栏：双擎工业分流舱 (左：带颜色宏的完整 LaTeX 代码 / 右：多格式高清图片矩阵) -->
					<div class="bp-stage">
						<div class="manifold-grid">
							<!-- 引擎舱 A：全样式原生 LaTeX 代码流 -->
							<div class="manifold-bay bay-code">
								<div class="bay-header">
									<div class="bay-title-group">
										<span class="bay-id">BAY A</span>
										<span class="bay-name">COMPILER-READY .TEX STREAM</span>
									</div>
									<span class="bay-badge">OVERLEAF &amp; ARXIV READY</span>
								</div>

								<div class="bay-code-viewport">
									<pre><code><span class="c-dim">% Auto-generated chromatic &amp; booktabs definitions</span>
<span class="c-kw">\usepackage</span>&#123;booktabs, multirow, colortbl, xcolor&#125;
<span class="c-hl">{palettes[activePalette].texColorDef}</span>
<span class="c-hl">\definecolor&#123;samaraPeak&#125;&#123;HTML&#125;&#123;{palettes[activePalette].cellPeak.replace('#', '')}&#125;</span>

<span class="c-kw">\begin</span>&#123;tabular&#125;&#123;l c r r r&#125;
  <span class="c-macro">\toprule</span>
  <span class="c-kw">\multirow</span>&#123;2&#125;*&#123;\textbf&#123;Architecture&#125;&#125; &amp; \multirow&#123;2&#125;*&#123;\textbf&#123;Params&#125;&#125; &amp;
  <span class="c-kw">\multicolumn</span>&#123;2&#125;&#123;c&#125;&#123;\textbf&#123;Zero-Shot (%)&#125;&#125; &amp; \textbf&#123;Loss&#125; \\
  <span class="c-macro">\cmidrule(lr)&#123;3-4&#125;</span>
   &amp; &amp; \textbf&#123;IN-1K&#125; &amp; \textbf&#123;COCO&#125; &amp; $\mathcal&#123;L&#125;_\text&#123;val&#125;$ \\
  <span class="c-macro">\midrule</span>
  ResNet-101 &amp; 44.5M &amp; 77.37 &amp; 58.40 &amp; 0.842 \\
  ViT-Large/14 &amp; 304.3M &amp; \underline&#123;83.12&#125; &amp; 64.95 &amp; 0.518 \\
  <span class="c-row-active">{palettes[activePalette].texRowMacro} \textbf&#123;Samara-Former&#125; &amp; \textbf&#123;118.2M&#125; &amp; {palettes[activePalette].texCellMacro}\textbf&#123;86.45&#125; &amp; {palettes[activePalette].texCellMacro}\textbf&#123;71.84&#125; &amp; \textbf&#123;0.364&#125; \\</span>
  <span class="c-macro">\bottomrule</span>
<span class="c-kw">\end</span>&#123;tabular&#125;</code></pre>
								</div>

								<div class="bay-footer">
									<span>✓ ZERO HAND-WRITTEN MACROS</span>
									<span>SYNCED WITH PALETTE: {palettes[activePalette].code}</span>
								</div>
							</div>

							<!-- 中央等位连接母线 -->
							<div class="manifold-conduit">
								<div class="conduit-rail"></div>
								<div class="conduit-node">
									<span class="node-eq">1:1</span>
									<span class="node-lbl">SYMMETRY</span>
								</div>
								<div class="conduit-rail"></div>
							</div>

							<!-- 引擎舱 B：多格式出版级图像导出矩阵 -->
							<div class="manifold-bay bay-graphics">
								<div class="bay-header">
									<div class="bay-title-group">
										<span class="bay-id">BAY B</span>
										<span class="bay-name">MULTI-FORMAT GRAPHICS BAY</span>
									</div>
									<span class="bay-badge orange">NO LATEX REQUIRED</span>
								</div>

								<!-- 光学透明网格上的高定图像卡片预览 -->
								<div class="graphics-specimen-well">
									<div class="checkerboard-label">OPTICAL ALPHA &amp; VECTOR LAYER PREVIEW</div>
									<div
										class="rendered-image-card"
										style="--row-tint: {palettes[activePalette].rowTint}; --cell-peak: {palettes[activePalette].cellPeak}; --accent-ink: {palettes[activePalette].accentHex};"
									>
										<!-- 矢量锚点装饰 -->
										<span class="vec-node tl"></span>
										<span class="vec-node tr"></span>
										<span class="vec-node bl"></span>
										<span class="vec-node br"></span>

										<div class="img-mini-rule thick"></div>
										<div class="img-mini-row head">
											<span>Architecture</span>
											<span class="text-right">IN-1K</span>
											<span class="text-right">COCO</span>
											<span class="text-right">Loss ↓</span>
										</div>
										<div class="img-mini-rule thin"></div>
										<div class="img-mini-row">
											<span>ViT-Large / 14</span>
											<span class="text-right"><u>83.12</u></span>
											<span class="text-right">64.95</span>
											<span class="text-right">0.518</span>
										</div>
										<div class="img-mini-row tinted">
											<span class="font-bold">Samara-Former</span>
											<span class="text-right font-bold peak-box">86.45</span>
											<span class="text-right font-bold peak-box">71.84</span>
											<span class="text-right font-bold">0.364</span>
										</div>
										<div class="img-mini-rule thick"></div>
									</div>
								</div>

								<!-- 四大导出格式硬核矩阵 -->
								<div class="format-matrix">
									<div class="format-slot">
										<div class="slot-top">
											<span class="slot-ext">.SVG</span>
											<span class="slot-tag">VECTOR</span>
										</div>
										<div class="slot-desc">Infinite scale curves for Illustrator, Figma &amp; PDF figures.</div>
									</div>

									<div class="format-slot">
										<div class="slot-top">
											<span class="slot-ext">.PNG</span>
											<span class="slot-tag">300 / 600 DPI</span>
										</div>
										<div class="slot-desc">Lossless retina bitmap with alpha transparency or paper fill.</div>
									</div>

									<div class="format-slot">
										<div class="slot-top">
											<span class="slot-ext">.JPG</span>
											<span class="slot-tag">PUBLICATION</span>
										</div>
										<div class="slot-desc">High-density flattened print specimen for manuscripts &amp; web.</div>
									</div>

									<div class="format-slot">
										<div class="slot-top">
											<span class="slot-ext">CTRL+C</span>
											<span class="slot-tag">CLIPBOARD</span>
										</div>
										<div class="slot-desc">Instant visual paste straight into PowerPoint, Word &amp; Notion.</div>
									</div>
								</div>

								<div class="bay-footer">
									<span>✓ PIXEL-EXACT TYPOGRAPHY</span>
									<span>TRANSPARENT / PAPER BACKGROUND</span>
								</div>
							</div>
						</div>
					</div>
				</article>

				<!-- =========================================================================== -->
				<!-- MODULE 03: UNIVERSAL INGESTION & AST REVERSE-PARSER (万物皆可导入与粘贴)       -->
				<!-- =========================================================================== -->
				<article class="bp-module bp-module-last">
					<!-- 左侧机能竖排导轨 -->
					<div class="bp-spine">
						<span class="spine-code">02.03</span>
						<span class="spine-line"></span>
						<span class="spine-text">UNIVERSAL DATA INGESTION</span>
					</div>

					<!-- 中栏：人文阐述与三通道导入能力 -->
					<div class="bp-narrative">
						<div class="module-kicker">
							<span class="kicker-index">MODULE // 03</span>
							<span class="kicker-pill">ZERO-FRICTION ONBOARDING</span>
						</div>

						<h3 class="module-title">
							Paste From Anywhere.<br />
							Reverse-Parse Old Code.<br />
							<span class="module-title-italic">Edit Instantly.</span>
						</h3>

						<p class="module-lead">
							Never build a table from scratch or count ampersands in legacy code again. Drop spreadsheet files, paste raw cell ranges from Excel, or feed existing LaTeX tables directly into Samara to reconstruct an editable visual grid in milliseconds.
						</p>

						<div class="spec-ledger">
							<div class="ledger-row">
								<span class="ledger-key">PORT 01 // SPREADSHEETS</span>
								<span class="ledger-val">Direct <code>Ctrl+V</code> from Excel, Numbers, WPS or <code>.xlsx</code> / <code>.csv</code> drop</span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">PORT 02 // LATEX AST PARSER</span>
								<span class="ledger-val">Reverse-engineers complex <code>\multicolumn</code> &amp; <code>\multirow</code> code into live cells</span>
							</div>
							<div class="ledger-row">
								<span class="ledger-key">PORT 03 // MARKDOWN &amp; LOGS</span>
								<span class="ledger-val">Ingests LLM Markdown tables, Pandas dataframes &amp; raw TSV streams</span>
							</div>
						</div>
					</div>

					<!-- 右栏：三通道战术解码器架构图 (Tri-Channel Ingestion Matrix) -->
					<div class="bp-stage">
						<div class="ingest-architecture">
							<!-- 顶部三路输入源端口 -->
							<div class="ingest-ports-grid">
								<!-- PORT 01: EXCEL / CSV -->
								<div class="ingest-port-card">
									<div class="port-head">
										<span class="port-num">IN_01</span>
										<span class="port-type">XLSX / CSV / CLIPBOARD</span>
									</div>
									<div class="port-title">Excel &amp; Spreadsheets</div>
									<div class="port-sample-box">
										<div class="excel-mock">
											<div class="ex-row ex-head">
												<span>A</span><span>B</span><span>C</span>
											</div>
											<div class="ex-row">
												<span>Model</span><span>Acc</span><span> F1 </span>
											</div>
											<div class="ex-row ex-sel">
												<span>Ours</span><span>86.4</span><span>91.2</span>
											</div>
										</div>
									</div>
									<div class="port-foot">DIRECT CTRL+V OR DRAG &amp; DROP</div>
								</div>

								<!-- PORT 02: LEGACY LATEX REVERSE PARSER -->
								<div class="ingest-port-card port-featured">
									<div class="port-head">
										<span class="port-num">IN_02</span>
										<span class="port-type">REVERSE AST PARSER</span>
									</div>
									<div class="port-title">Existing LaTeX Code</div>
									<div class="port-sample-box code-sample">
										<code>\multicolumn&#123;2&#125;&#123;c&#125;&#123;Score&#125; \\</code>
										<code>\cmidrule(lr)&#123;2-3&#125;</code>
										<code>Ours &amp; \textbf&#123;86.4&#125; &amp; 91.2 \\</code>
									</div>
									<div class="port-foot">RECONSTRUCTS SPANS &amp; STYLES</div>
								</div>

								<!-- PORT 03: MARKDOWN / TSV -->
								<div class="ingest-port-card">
									<div class="port-head">
										<span class="port-num">IN_03</span>
										<span class="port-type">MD / TSV / PYTHON</span>
									</div>
									<div class="port-title">Markdown &amp; Raw Logs</div>
									<div class="port-sample-box code-sample">
										<code>| Model | Acc  | F1   |</code>
										<code>|-------|------|------|</code>
										<code>| Ours  | 86.4 | 91.2 |</code>
									</div>
									<div class="port-foot">AUTO-DELIMITS &amp; CLEANS SYNTAX</div>
								</div>
							</div>

							<!-- 中央总线解码器汇流层 -->
							<div class="ingest-bus-bar">
								<div class="bus-line"></div>
								<div class="bus-processor">
									<span class="proc-dot"></span>
									<span>SAMARA AST DECODER // AUTO-SPAN &amp; STRUCTURE NORMALIZATION</span>
									<span class="proc-arrow">↓</span>
								</div>
								<div class="bus-line"></div>
							</div>

							<!-- 底部还原后的可视化工作台画布 -->
							<div class="ingest-output-deck">
								<div class="deck-meta">
									<span>OUTPUT // RECONSTRUCTED INTERACTIVE CANVAS</span>
									<span class="deck-ready">READY FOR VISUAL STYLING &amp; EXPORT</span>
								</div>

								<div class="reconstructed-grid-preview">
									<div class="rg-cell rg-head">Model Architecture</div>
									<div class="rg-cell rg-head text-center">Accuracy (%)</div>
									<div class="rg-cell rg-head text-center">F1-Score (%)</div>
									<div class="rg-cell rg-head text-right">Action</div>

									<div class="rg-cell rg-active">
										<span class="rg-handle">⋮⋮</span>
										<strong>Samara-Former (Ours)</strong>
									</div>
									<div class="rg-cell rg-active text-center">
										<span class="rg-val-highlight">86.45</span>
									</div>
									<div class="rg-cell rg-active text-center">
										<span class="rg-val-highlight">91.20</span>
									</div>
									<div class="rg-cell rg-active text-right">
										<span class="rg-tag">RESIZE / COLOR / EXPORT</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</article>
			</div>
		</div>
	</section>

	<!-- =================================================================================== -->
	<!-- § 03 PLATFORMS (TACTICAL DEPLOYMENT DOCK · 三联装工业部署坞)                          -->
	<!-- =================================================================================== -->
	<section id="platforms" class="platforms-wrapper">
		<div class="section-container">
			<div class="deploy-frame">
				<div class="deploy-header">
					<div class="deploy-header-left">
						<div class="deploy-sub">// § 03 · NATIVE &amp; WEB DEPLOYMENT</div>
						<h2 class="deploy-title">
							Engineered for Every<br />
							<span class="title-italic">Research Workstation.</span>
						</h2>
					</div>
					<div class="deploy-header-right">
						<div class="deploy-specs-badge">
							<span>RUST + TAURI CORE</span>
							<span>•</span>
							<span>100% OFFLINE CAPABLE</span>
							<span>•</span>
							<span>ZERO TELEMETRY</span>
						</div>
					</div>
				</div>

				<div class="platforms-grid">
					<!-- macOS -->
					<div class="platform-card">
						<div class="plat-top-bar">
							<span class="plat-bay-id">BAY 01 // DARWIN</span>
							<span class="plat-arch">ARM64 + INTEL</span>
						</div>
						<div class="plat-body">
							<div class="plat-icon-wrap">
								{@render appleIcon('size-7')}
							</div>
							<h3 class="platform-name">macOS</h3>
							<p class="plat-desc">Universal native binary for Apple Silicon (M1–M4) and Intel Macs. macOS 12.0+.</p>
						</div>
						<a
							href="https://github.com/sylvester1001/samara/releases"
							target="_blank"
							rel="noreferrer"
							class="platform-download-btn"
						>
							<span>Download .dmg Installer</span>
							<ArrowRight class="size-4" />
						</a>
					</div>

					<!-- Windows -->
					<div class="platform-card">
						<div class="plat-top-bar">
							<span class="plat-bay-id">BAY 02 // WIN32</span>
							<span class="plat-arch">X86_64 NATIVE</span>
						</div>
						<div class="plat-body">
							<div class="plat-icon-wrap">
								{@render windowsIcon('size-6')}
							</div>
							<h3 class="platform-name">Windows</h3>
							<p class="plat-desc">Lightweight native workstation installer for Windows 10 &amp; 11. Instant cold start.</p>
						</div>
						<a
							href="https://github.com/sylvester1001/samara/releases"
							target="_blank"
							rel="noreferrer"
							class="platform-download-btn"
						>
							<span>Download .msi Package</span>
							<ArrowRight class="size-4" />
						</a>
					</div>

					<!-- Linux -->
					<div class="platform-card">
						<div class="plat-top-bar">
							<span class="plat-bay-id">BAY 03 // LINUX</span>
							<span class="plat-arch">APPIMAGE / DEB</span>
						</div>
						<div class="plat-body">
							<div class="plat-icon-wrap">
								{@render linuxIcon('size-7')}
							</div>
							<h3 class="platform-name">Linux</h3>
							<p class="plat-desc">Portable AppImage &amp; CLI installer for Ubuntu, Arch, Fedora, and Debian distributions.</p>
						</div>
						<a
							href="https://github.com/sylvester1001/samara/releases"
							target="_blank"
							rel="noreferrer"
							class="platform-download-btn"
						>
							<span>Download AppImage</span>
							<ArrowRight class="size-4" />
						</a>
					</div>
				</div>

				<!-- 底部即开即用 Web Terminal 横向通栏 -->
				<div class="web-launch-banner">
					<div class="web-banner-left">
						<span class="web-live-tag">INSTANT BROWSER STATION</span>
						<span class="web-banner-text">Prefer zero installation? Run the full Samara typesetting engine directly in your browser.</span>
					</div>
					<a href="/" class="web-banner-btn">
						<span>Launch Web Application</span>
						<ArrowRight class="size-4" />
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- =================================================================================== -->
	<!-- FOOTER                                                                              -->
	<!-- =================================================================================== -->
	<footer class="landing-footer">
		<div>TYPESET IN CORMORANT GARAMOND &amp; JETBRAINS MONO. (C) 2026 SAMARA ENGINE.</div>
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
		display: inline-flex;
		flex-direction: column;
		align-self: flex-start;
		gap: 1.8rem;
		max-width: 100%;
	}

	.btn-row {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 1rem;
		width: 100%;
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

	/* =================================================================================== */
	/* § 02 SPECIFICATION (EXPOSED BLUEPRINT GRID × HUMANIST MONOGRAPH)                    */
	/* =================================================================================== */
	.spec-section {
		background-color: #06070c;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
		background-size: 48px 48px;
		color: #ffffff;
		position: relative;
		box-sizing: border-box;
		padding-bottom: 7rem;
	}

	/* 顶部机能过渡分界带 */
	.spec-transition-ribbon {
		background: #040509;
		border-top: 1px solid rgba(255, 255, 255, 0.22);
		border-bottom: 1px solid rgba(255, 255, 255, 0.14);
		padding: 0.65rem clamp(2.8rem, 5vw, 5.5rem);
	}

	.ribbon-inner {
		max-width: 1600px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.55);
	}

	.spec-container {
		max-width: 1600px;
		margin: 0 auto;
		padding: 4.5rem clamp(2.8rem, 5vw, 5.5rem) 0;
		box-sizing: border-box;
	}

	/* 暴露式工程蓝图主框架 */
	.blueprint-frame {
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(9, 11, 18, 0.88);
		backdrop-filter: blur(6px);
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
	}

	/* ----------------------------------------------------------------------------------- */
	/* MONUMENTAL HEADER                                                                   */
	/* ----------------------------------------------------------------------------------- */
	.blueprint-header {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		border-bottom: 1px solid rgba(255, 255, 255, 0.18);
	}

	.bp-header-left {
		padding: clamp(2.5rem, 4vw, 4rem);
		border-right: 1px solid rgba(255, 255, 255, 0.18);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.bp-tag-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		margin-bottom: 1.5rem;
	}

	.bp-section-badge {
		background: #0202f1;
		color: #ffffff;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 0.28rem 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.35);
	}

	.bp-doc-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.5);
	}

	.bp-main-title {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: clamp(3.4rem, 2.6rem + 2.2vw, 5.2rem);
		font-weight: 300;
		line-height: 0.98;
		letter-spacing: -0.015em;
		margin: 0;
		color: #ffffff;
	}

	.bp-title-italic {
		font-style: italic;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.88);
	}

	.bp-header-right {
		padding: clamp(2.5rem, 4vw, 4rem);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.015);
	}

	.bp-abstract-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: #ff4d00;
		margin-bottom: 1rem;
	}

	.bp-abstract-copy {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: clamp(1.25rem, 1.05rem + 0.5vw, 1.55rem);
		line-height: 1.48;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.88);
		margin: 0 0 2rem 0;
	}

	.bp-header-metrics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid rgba(255, 255, 255, 0.15);
		padding-top: 1.4rem;
		gap: 1rem;
	}

	.bp-metric-cell {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.bp-metric-val {
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.35rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.04em;
	}

	.bp-metric-val small {
		font-size: 0.7rem;
		opacity: 0.65;
		margin-left: 2px;
	}

	.bp-metric-lbl {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.56rem;
		letter-spacing: 0.14em;
		color: rgba(255, 255, 255, 0.5);
	}

	/* ----------------------------------------------------------------------------------- */
	/* BLUEPRINT MODULE GRID (SPINE + NARRATIVE + STAGE)                                   */
	/* ----------------------------------------------------------------------------------- */
	.bp-module {
		display: grid;
		grid-template-columns: 52px minmax(310px, 0.82fr) minmax(0, 1.45fr);
		border-bottom: 1px solid rgba(255, 255, 255, 0.18);
	}

	.bp-module-last {
		border-bottom: none;
	}

	/* 左侧竖排机能导轨 */
	.bp-spine {
		border-right: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(2, 2, 241, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 0;
		gap: 1rem;
		user-select: none;
	}

	.spine-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		font-weight: 700;
		color: #ffffff;
		background: #0202f1;
		padding: 0.25rem 0.35rem;
		letter-spacing: 0.06em;
	}

	.spine-line {
		width: 1px;
		height: 36px;
		background: rgba(255, 255, 255, 0.25);
	}

	.spine-text {
		writing-mode: vertical-rl;
		text-orientation: mixed;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		letter-spacing: 0.22em;
		color: rgba(255, 255, 255, 0.48);
		text-transform: uppercase;
	}

	/* 中栏：人文叙述与规格账本 */
	.bp-narrative {
		padding: clamp(2.2rem, 3.5vw, 3.5rem);
		border-right: 1px solid rgba(255, 255, 255, 0.15);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.module-kicker {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 1.2rem;
	}

	.kicker-index {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: #ff4d00;
	}

	.kicker-pill {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		letter-spacing: 0.14em;
		padding: 0.18rem 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.22);
		color: rgba(255, 255, 255, 0.75);
	}

	.module-title {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: clamp(2.4rem, 1.9rem + 1.1vw, 3.3rem);
		font-weight: 300;
		line-height: 1.04;
		letter-spacing: -0.01em;
		color: #ffffff;
		margin: 0 0 1.25rem 0;
	}

	.module-title-italic {
		font-style: italic;
		color: rgba(255, 255, 255, 0.85);
	}

	.module-lead {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		font-size: 0.9rem;
		line-height: 1.68;
		color: rgba(255, 255, 255, 0.68);
		margin: 0 0 2rem 0;
	}

	.spec-ledger {
		border-top: 1px solid rgba(255, 255, 255, 0.15);
		display: flex;
		flex-direction: column;
		margin-top: auto;
	}

	.ledger-row {
		display: flex;
		flex-direction: column;
		gap: 0.22rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.ledger-key {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: rgba(255, 255, 255, 0.9);
	}

	.ledger-val {
		font-family: 'Inter', -apple-system, sans-serif;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.58);
		line-height: 1.45;
	}

	.ledger-val code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		color: #93c5fd;
		background: rgba(2, 2, 241, 0.22);
		padding: 0.08rem 0.3rem;
	}

	/* 右栏舞台容器 */
	.bp-stage {
		padding: clamp(2rem, 3vw, 3.2rem);
		background: rgba(4, 5, 10, 0.65);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
	}

	/* ----------------------------------------------------------------------------------- */
	/* STAGE 01: TACTICAL CHAMBER + WARM ACADEMIC PAPER SPECIMEN                           */
	/* ----------------------------------------------------------------------------------- */
	.tactical-chamber {
		width: 100%;
		border: 1px solid rgba(255, 255, 255, 0.24);
		background: #0b0d15;
		position: relative;
		padding: 1.25rem;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
	}

	.chamber-corner {
		position: absolute;
		width: 9px;
		height: 9px;
		pointer-events: none;
	}

	.chamber-corner.tl { top: -3px; left: -3px; border-top: 2px solid #ffffff; border-left: 2px solid #ffffff; }
	.chamber-corner.tr { top: -3px; right: -3px; border-top: 2px solid #ffffff; border-right: 2px solid #ffffff; }
	.chamber-corner.bl { bottom: -3px; left: -3px; border-bottom: 2px solid #ffffff; border-left: 2px solid #ffffff; }
	.chamber-corner.br { bottom: -3px; right: -3px; border-bottom: 2px solid #ffffff; border-right: 2px solid #ffffff; }

	.chamber-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding-bottom: 0.85rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.14);
		margin-bottom: 0.75rem;
	}

	.chamber-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.75);
	}

	.signal-dot {
		width: 6px;
		height: 6px;
		background: #ff4d00;
		display: inline-block;
	}

	.palette-switcher {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.switcher-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		letter-spacing: 0.14em;
		color: rgba(255, 255, 255, 0.45);
		margin-right: 0.2rem;
	}

	.palette-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.18);
		color: rgba(255, 255, 255, 0.7);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		letter-spacing: 0.1em;
		padding: 0.25rem 0.55rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.palette-chip:hover {
		border-color: rgba(255, 255, 255, 0.5);
		color: #ffffff;
	}

	.palette-chip.active {
		background: #ffffff;
		color: #06070c;
		border-color: #ffffff;
		font-weight: 700;
	}

	.chip-swatch {
		width: 8px;
		height: 8px;
		display: inline-block;
	}

	/* 游标卡尺条 */
	.cad-caliper-strip {
		display: grid;
		grid-template-columns: 1.5fr 0.8fr 1fr 1fr 1.1fr;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.54rem;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.48);
		padding: 0.25rem 0.4rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 0.75rem;
	}

	.caliper-col {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* 暖白学术出版纸张切面 (Scheme A 核心质感) */
	.paper-sheet {
		background: #faf8f3;
		color: #111318;
		padding: clamp(1.4rem, 2.2vw, 2.2rem);
		border: 1px solid #d6d1c4;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.6),
			0 10px 30px rgba(0, 0, 0, 0.35);
	}

	.paper-caption {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: 0.98rem;
		line-height: 1.45;
		color: #1e2028;
		margin-bottom: 1rem;
	}

	.caption-bold {
		font-weight: 700;
		letter-spacing: 0.02em;
		margin-right: 0.3rem;
	}

	.caption-highlight {
		background: var(--row-tint);
		padding: 0 0.3rem;
		color: var(--badge-ink);
	}

	.paper-table-wrap {
		width: 100%;
		overflow-x: auto;
	}

	.monograph-table {
		width: 100%;
		border-collapse: collapse;
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: 0.96rem;
		color: #111318;
	}

	.monograph-table th {
		font-weight: 600;
		padding: 0.5rem 0.65rem;
		color: #0b0d13;
		letter-spacing: 0.01em;
	}

	.monograph-table td {
		padding: 0.52rem 0.65rem;
		color: #1e2430;
	}

	.m-toprule th {
		border-top: 2px solid #0b0d13;
	}

	.m-span-head {
		border-bottom: 1px solid #222630;
	}

	.m-cmidrule th {
		border-bottom: 1.2px solid #0b0d13;
	}

	.monograph-table tbody tr:last-child td {
		border-bottom: 2px solid #0b0d13;
	}

	.m-left { text-align: left; }
	.m-center { text-align: center; }
	.m-right { text-align: right; }

	.m-model {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: 1rem;
	}

	.m-mono {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.76rem;
		letter-spacing: -0.01em;
	}

	.m-bold {
		font-weight: 700 !important;
		color: #05070b !important;
	}

	.m-row-tinted td {
		background-color: var(--row-tint);
		transition: background-color 0.2s ease;
	}

	.cell-peak-shaded {
		background-color: var(--cell-peak) !important;
		transition: background-color 0.2s ease;
	}

	.cell-sub-shaded {
		background-color: var(--cell-sub) !important;
		transition: background-color 0.2s ease;
	}

	.sota-pill {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.08rem 0.35rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.55rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		background: var(--accent-ink);
		color: #ffffff;
		vertical-align: middle;
	}

	.paper-annotations {
		margin-top: 1.1rem;
		padding-top: 0.75rem;
		border-top: 1px dashed #c8c2b4;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.annot-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		letter-spacing: 0.08em;
		color: #3f4454;
		background: #efece3;
		border: 1px solid #d5cfc0;
		padding: 0.2rem 0.5rem;
	}

	.annot-chip.active {
		color: #0b0d13;
		font-weight: 600;
		border-color: #aba391;
	}

	.annot-dot {
		width: 5px;
		height: 5px;
		background: #0b0d13;
		border-radius: 50%;
	}

	.annot-swatch {
		width: 9px;
		height: 9px;
		border: 1px solid rgba(0, 0, 0, 0.25);
	}

	.chamber-Bottombar {
		margin-top: 0.75rem;
		padding-top: 0.65rem;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		letter-spacing: 0.14em;
		color: rgba(255, 255, 255, 0.5);
	}

	.status-ok {
		color: #38bdf8;
		font-weight: 700;
	}

	/* ----------------------------------------------------------------------------------- */
	/* STAGE 02: DUAL-STREAM OUTPUT MANIFOLD                                               */
	/* ----------------------------------------------------------------------------------- */
	.manifold-grid {
		width: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) auto minmax(0, 1.1fr);
		gap: 1rem;
		align-items: stretch;
	}

	.manifold-bay {
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: #0b0d15;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 1.15rem;
		min-width: 0;
	}

	.bay-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		margin-bottom: 0.9rem;
	}

	.bay-title-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bay-id {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.56rem;
		font-weight: 700;
		background: #0202f1;
		color: #ffffff;
		padding: 0.15rem 0.4rem;
		letter-spacing: 0.1em;
	}

	.bay-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #ffffff;
	}

	.bay-badge {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.54rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 0.18rem 0.45rem;
		border: 1px solid rgba(56, 189, 248, 0.45);
		color: #38bdf8;
	}

	.bay-badge.orange {
		border-color: rgba(255, 77, 0, 0.55);
		color: #ff6a2b;
	}

	.bay-code-viewport {
		background: #06080e;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.95rem;
		overflow-x: auto;
		flex: 1;
		display: flex;
		align-items: center;
	}

	.bay-code-viewport pre {
		margin: 0;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.66rem;
		line-height: 1.62;
		color: #cbd5e1;
	}

	.c-dim { color: #64748b; font-style: italic; }
	.c-kw { color: #93c5fd; font-weight: 600; }
	.c-macro { color: #38bdf8; font-weight: 700; }
	.c-hl {
		color: #fbbf24;
		background: rgba(251, 191, 36, 0.1);
		padding: 0 0.2rem;
	}
	.c-row-active {
		display: inline-block;
		background: rgba(2, 2, 241, 0.28);
		color: #ffffff;
		border-left: 2px solid #38bdf8;
		padding-left: 0.35rem;
	}

	.manifold-conduit {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.conduit-rail {
		width: 1px;
		flex: 1;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.1));
	}

	.conduit-node {
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: #0202f1;
		padding: 0.45rem 0.5rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.node-eq {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		font-weight: 700;
		color: #ffffff;
	}

	.node-lbl {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.46rem;
		letter-spacing: 0.16em;
		color: rgba(255, 255, 255, 0.8);
	}

	/* 光学图层与多格式矩阵 */
	.graphics-specimen-well {
		background-color: #080a10;
		background-image:
			linear-gradient(45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.04) 75%),
			linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.04) 75%);
		background-size: 16px 16px;
		background-position: 0 0, 0 8px, 8px -8px, -8px 0;
		border: 1px solid rgba(255, 255, 255, 0.12);
		padding: 0.85rem;
		margin-bottom: 0.85rem;
	}

	.checkerboard-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.52rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.45);
		margin-bottom: 0.55rem;
	}

	.rendered-image-card {
		background: #faf8f3;
		color: #111318;
		padding: 0.7rem 0.85rem;
		position: relative;
		border: 1px solid #38bdf8;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
	}

	.vec-node {
		position: absolute;
		width: 6px;
		height: 6px;
		background: #ffffff;
		border: 1.5px solid #0202f1;
	}
	.vec-node.tl { top: -4px; left: -4px; }
	.vec-node.tr { top: -4px; right: -4px; }
	.vec-node.bl { bottom: -4px; left: -4px; }
	.vec-node.br { bottom: -4px; right: -4px; }

	.img-mini-rule.thick { height: 1.5px; background: #111318; margin: 0.2rem 0; }
	.img-mini-rule.thin { height: 1px; background: #4b5563; margin: 0.2rem 0; }

	.img-mini-row {
		display: grid;
		grid-template-columns: 1.5fr 0.8fr 0.8fr 0.8fr;
		padding: 0.22rem 0.25rem;
		align-items: center;
	}

	.img-mini-row.head {
		font-weight: 700;
		font-family: 'Cormorant Garamond', Georgia, serif;
		font-size: 0.78rem;
	}

	.img-mini-row.tinted {
		background: var(--row-tint);
	}

	.peak-box {
		background: var(--cell-peak);
		padding: 0.05rem 0.2rem;
	}

	.format-matrix {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.55rem;
	}

	.format-slot {
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.025);
		padding: 0.65rem 0.75rem;
		transition: border-color 0.15s, background 0.15s;
	}

	.format-slot:hover {
		border-color: rgba(255, 255, 255, 0.45);
		background: rgba(255, 255, 255, 0.05);
	}

	.slot-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.3rem;
	}

	.slot-ext {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.78rem;
		font-weight: 700;
		color: #ffffff;
	}

	.slot-tag {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.52rem;
		letter-spacing: 0.12em;
		color: #38bdf8;
		font-weight: 600;
	}

	.slot-desc {
		font-family: 'Inter', -apple-system, sans-serif;
		font-size: 0.7rem;
		line-height: 1.38;
		color: rgba(255, 255, 255, 0.58);
	}

	.bay-footer {
		margin-top: 0.85rem;
		padding-top: 0.65rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.55rem;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.5);
	}

	/* ----------------------------------------------------------------------------------- */
	/* STAGE 03: UNIVERSAL INGESTION & AST REVERSE-PARSER                                  */
	/* ----------------------------------------------------------------------------------- */
	.ingest-architecture {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.ingest-ports-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.85rem;
	}

	.ingest-port-card {
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: #0b0d15;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.ingest-port-card.port-featured {
		border-color: rgba(56, 189, 248, 0.5);
		background: linear-gradient(180deg, rgba(2, 2, 241, 0.16) 0%, #0b0d15 100%);
	}

	.port-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.55rem;
	}

	.port-num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		font-weight: 700;
		padding: 0.12rem 0.4rem;
		background: rgba(255, 255, 255, 0.12);
		color: #ffffff;
		letter-spacing: 0.1em;
	}

	.port-featured .port-num {
		background: #ff4d00;
	}

	.port-type {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.52rem;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.5);
	}

	.port-title {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: 1.35rem;
		font-weight: 500;
		color: #ffffff;
		margin-bottom: 0.7rem;
	}

	.port-sample-box {
		background: #06080e;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.65rem;
		margin-bottom: 0.75rem;
		min-height: 76px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.code-sample {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		line-height: 1.55;
		color: #94a3b8;
		overflow-x: auto;
	}

	.code-sample code {
		display: block;
		white-space: nowrap;
	}

	.excel-mock {
		display: flex;
		flex-direction: column;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.ex-row {
		display: grid;
		grid-template-columns: 1.2fr 1fr 1fr;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.ex-row:last-child {
		border-bottom: none;
	}

	.ex-row span {
		padding: 0.15rem 0.35rem;
		border-right: 1px solid rgba(255, 255, 255, 0.08);
		color: #cbd5e1;
	}

	.ex-row.ex-head {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.45);
		font-size: 0.52rem;
		text-align: center;
	}

	.ex-row.ex-sel {
		background: rgba(16, 185, 129, 0.18);
		outline: 1px dashed #34d399;
	}

	.port-foot {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.52rem;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.48);
	}

	/* 中央总线解码条 */
	.ingest-bus-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bus-line {
		flex: 1;
		height: 1px;
		background: rgba(255, 255, 255, 0.2);
	}

	.bus-processor {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.4rem 0.9rem;
		background: #0202f1;
		border: 1px solid rgba(255, 255, 255, 0.4);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: #ffffff;
	}

	.proc-dot {
		width: 6px;
		height: 6px;
		background: #ffffff;
		border-radius: 50%;
	}

	.proc-arrow {
		font-size: 0.8rem;
	}

	/* 底部还原工作台 */
	.ingest-output-deck {
		border: 1px solid rgba(255, 255, 255, 0.22);
		background: #0b0d15;
		padding: 1.1rem;
	}

	.deck-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		letter-spacing: 0.14em;
		color: rgba(255, 255, 255, 0.55);
		margin-bottom: 0.75rem;
	}

	.deck-ready {
		color: #34d399;
		font-weight: 700;
	}

	.reconstructed-grid-preview {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr 1.2fr;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: #faf8f3;
		color: #111318;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
	}

	.rg-cell {
		padding: 0.55rem 0.75rem;
		border-right: 1px solid #d5cfc0;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.rg-cell.text-center { justify-content: center; }
	.rg-cell.text-right { justify-content: flex-end; border-right: none; }

	.rg-head {
		background: #efece3;
		border-bottom: 1.5px solid #111318;
		font-weight: 700;
		font-size: 0.65rem;
		color: #1e2430;
	}

	.rg-active {
		background: #e6ecff;
	}

	.rg-handle {
		color: #0202f1;
		font-weight: 700;
	}

	.rg-val-highlight {
		background: #c7d6ff;
		padding: 0.1rem 0.4rem;
		font-weight: 700;
		color: #0202f1;
	}

	.rg-tag {
		font-size: 0.54rem;
		letter-spacing: 0.08em;
		background: #0202f1;
		color: #ffffff;
		padding: 0.18rem 0.45rem;
		font-weight: 700;
	}

	/* =================================================================================== */
	/* § 03 PLATFORMS (TACTICAL DEPLOYMENT DOCK)                                           */
	/* =================================================================================== */
	.platforms-wrapper {
		background: #0202f1;
		color: #ffffff;
		padding: 6.5rem clamp(2.8rem, 5vw, 5.5rem);
		border-top: 1px solid rgba(255, 255, 255, 0.25);
		box-sizing: border-box;
	}

	.section-container {
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
	}

	.deploy-frame {
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: rgba(0, 0, 0, 0.22);
	}

	.deploy-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 2rem;
		padding: clamp(2.2rem, 3.5vw, 3.5rem);
		border-bottom: 1px solid rgba(255, 255, 255, 0.25);
	}

	.deploy-sub {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.72);
		margin-bottom: 0.75rem;
	}

	.deploy-title {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: clamp(3rem, 2.4rem + 1.5vw, 4.2rem);
		line-height: 1.02;
		margin: 0;
		font-weight: 300;
	}

	.deploy-specs-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.55rem 1rem;
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: rgba(0, 0, 0, 0.3);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		letter-spacing: 0.14em;
	}

	.platforms-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
	}

	.platform-card {
		border-right: 1px solid rgba(255, 255, 255, 0.25);
		padding: clamp(2rem, 3vw, 2.8rem);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		box-sizing: border-box;
		transition: background 0.15s;
	}

	.platform-card:last-child {
		border-right: none;
	}

	.platform-card:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.plat-top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.6);
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
		margin-bottom: 1.8rem;
	}

	.plat-arch {
		color: #ffffff;
		font-weight: 700;
	}

	.plat-icon-wrap {
		margin-bottom: 1rem;
		color: #ffffff;
	}

	.platform-name {
		font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
		font-size: 2.8rem;
		margin: 0 0 0.75rem 0;
		font-weight: 400;
		letter-spacing: 0.01em;
	}

	.plat-desc {
		font-family: 'Inter', -apple-system, sans-serif;
		font-size: 0.85rem;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.72);
		margin: 0 0 2.2rem 0;
	}

	.platform-download-btn {
		width: 100%;
		height: 46px;
		background: #ffffff;
		color: #0202f1;
		font-family: 'JetBrains Mono', 'Inter', sans-serif;
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.25rem;
		box-sizing: border-box;
		box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.35);
		transition: background 0.15s, transform 0.1s;
	}

	.platform-download-btn:hover {
		background: #f0f0ff;
		transform: translateY(-1px);
	}

	.web-launch-banner {
		border-top: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(0, 0, 0, 0.35);
		padding: 1.4rem clamp(2rem, 3vw, 2.8rem);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.web-banner-left {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.85rem;
	}

	.web-live-tag {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		background: #ff4d00;
		color: #ffffff;
		padding: 0.22rem 0.55rem;
	}

	.web-banner-text {
		font-family: 'Inter', -apple-system, sans-serif;
		font-size: 0.88rem;
		color: rgba(255, 255, 255, 0.88);
	}

	.web-banner-btn {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ffffff;
		text-decoration: none;
		border: 1px solid rgba(255, 255, 255, 0.5);
		padding: 0.6rem 1.2rem;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.15s;
	}

	.web-banner-btn:hover {
		background: rgba(255, 255, 255, 0.15);
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

	/* RESPONSIVE */
	@media (max-width: 1180px) {
		.bp-module {
			grid-template-columns: 44px 1fr;
		}

		.bp-spine {
			grid-row: span 2;
		}

		.bp-narrative {
			border-right: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.15);
		}

		.manifold-grid {
			grid-template-columns: 1fr;
		}

		.manifold-conduit {
			flex-direction: row;
			padding: 0.25rem 0;
		}

		.conduit-rail {
			width: 100%;
			height: 1px;
		}
	}

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

		.actions-group {
			width: 100%;
		}

		.btn-row {
			flex-wrap: wrap;
		}

		.hero-title {
			font-size: 3.6rem;
		}

		.spec-container,
		.platforms-wrapper,
		.landing-footer,
		.spec-transition-ribbon {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}

		.blueprint-header {
			grid-template-columns: 1fr;
		}

		.bp-header-left {
			border-right: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.18);
		}

		.bp-module {
			grid-template-columns: 1fr;
		}

		.bp-spine {
			display: none;
		}

		.ingest-ports-grid,
		.platforms-grid {
			grid-template-columns: 1fr;
		}

		.platform-card {
			border-right: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.25);
		}

		.reconstructed-grid-preview {
			grid-template-columns: 1fr 1fr;
		}

		.hide-mobile {
			display: none;
		}
	}
</style>
