import { browser } from '$app/environment';
import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { isLocale, LOCALES, type Locale, type TranslationKey, type TranslationSchema } from './types';

const STORAGE_KEY = 'samara-locale';

const catalogs: Record<Locale, TranslationSchema> = {
	en,
	'zh-CN': zhCN,
	'zh-TW': zhTW
};

function detectLocale(): Locale {
	if (!browser) return 'en';
	const saved = localStorage.getItem(STORAGE_KEY);
	if (isLocale(saved)) return saved;

	const lang = navigator.language.toLowerCase();
	if (lang.startsWith('zh-tw') || lang.startsWith('zh-hk') || lang.startsWith('zh-hant')) {
		return 'zh-TW';
	}
	if (lang.startsWith('zh')) return 'zh-CN';
	return 'en';
}

function lookup(schema: TranslationSchema, key: string): string | undefined {
	let current: unknown = schema;
	for (const segment of key.split('.')) {
		if (current == null || typeof current !== 'object') return undefined;
		current = (current as Record<string, unknown>)[segment];
	}
	return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (_, name: string) =>
		params[name] != null ? String(params[name]) : `{${name}}`
	);
}

class I18nStore {
	locale = $state<Locale>('en');

	constructor() {
		if (browser) {
			this.locale = detectLocale();
			this.apply();
		}
	}

	setLocale(locale: Locale) {
		this.locale = locale;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, locale);
			this.apply();
		}
	}

	apply() {
		if (!browser) return;
		document.documentElement.setAttribute('lang', this.locale);
	}

	t(key: TranslationKey, params?: Record<string, string | number>): string {
		const current = lookup(catalogs[this.locale], key);
		const fallback = this.locale === 'en' ? undefined : lookup(catalogs.en, key);
		return interpolate(current ?? fallback ?? key, params);
	}
}

export const i18n = new I18nStore();

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
	return i18n.t(key, params);
}

export type { Locale, TranslationKey, TranslationSchema };
export { LOCALES, isLocale };
