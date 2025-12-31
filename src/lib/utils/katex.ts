import katex from 'katex';

const LATEX_PATTERN = /\$([^$]+)\$/g;

export function hasLatex(content: string): boolean {
	return LATEX_PATTERN.test(content);
}

export function renderLatex(content: string): string {
	if (!hasLatex(content)) {
		return escapeHtml(content);
	}

	return content.replace(LATEX_PATTERN, (_, latex) => {
		try {
			return katex.renderToString(latex, {
				throwOnError: false,
				displayMode: false
			});
		} catch {
			return `<span class="katex-error">${escapeHtml(latex)}</span>`;
		}
	});
}

function escapeHtml(text: string): string {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}
