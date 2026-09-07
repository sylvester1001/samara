/**
 * 复制文本到剪贴板，带有完备的回退机制（兼容桌面端 WebView、浏览器及各种安全上下文）
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
	if (typeof window === 'undefined') return false;

	// 1. 优先尝试现代 Clipboard API
	if (navigator?.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (e) {
			console.warn('navigator.clipboard.writeText failed, falling back to execCommand:', e);
		}
	}

	// 2. 传统 textarea + execCommand 兜底方案
	try {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.top = '0';
		textArea.style.left = '-9999px';
		textArea.style.opacity = '0';
		textArea.setAttribute('readonly', '');
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		const successful = document.execCommand('copy');
		document.body.removeChild(textArea);
		return successful;
	} catch (err) {
		console.error('execCommand copy fallback failed:', err);
		return false;
	}
}
