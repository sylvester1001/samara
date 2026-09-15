import katex from 'katex';

const LATEX_TEST_PATTERN = /\$[^$]+\$/;
const LATEX_GLOBAL_PATTERN = /\$([^$]+)\$/g;
const LATEX_CACHE_LIMIT = 500;
const latexCache = new Map<string, string>();

export function hasLatex(content: string): boolean {
	if (!content || !content.includes('$')) return false;
	return LATEX_TEST_PATTERN.test(content);
}

export function renderLatex(content: string): string {
	if (!hasLatex(content)) {
		return escapeHtml(content);
	}

	const cached = latexCache.get(content);
	if (cached !== undefined) return cached;

	const rendered = content.replace(LATEX_GLOBAL_PATTERN, (_, latex) => {
		try {
			return katex.renderToString(latex, {
				throwOnError: false,
				displayMode: false
			});
		} catch {
			return `<span class="katex-error">${escapeHtml(latex)}</span>`;
		}
	});

	if (latexCache.size >= LATEX_CACHE_LIMIT) {
		const oldest = latexCache.keys().next().value;
		if (oldest !== undefined) latexCache.delete(oldest);
	}
	latexCache.set(content, rendered);
	return rendered;
}

function escapeHtml(text: string): string {
	if (!text) return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
