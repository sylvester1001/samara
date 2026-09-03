import { browser } from '$app/environment';

function detectPlatform(): 'macos' | 'windows' | 'linux' | 'unknown' {
	if (!browser) return 'unknown';

	const ua = navigator.userAgent.toLowerCase();
	if (ua.includes('mac')) return 'macos';
	if (ua.includes('win')) return 'windows';
	if (ua.includes('linux')) return 'linux';
	return 'unknown';
}

export const platform = detectPlatform();
export const isMac = platform === 'macos';
export const isWindows = platform === 'windows';

/** Whether the app runs inside a Tauri webview */
export const isTauri = browser && '__TAURI_INTERNALS__' in window;
