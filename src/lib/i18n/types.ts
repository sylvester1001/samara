import type { TranslationSchema } from './locales/en';

export type Locale = 'zh-CN' | 'zh-TW' | 'en';

export const LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en'];

export function isLocale(value: string | null | undefined): value is Locale {
	return value === 'zh-CN' || value === 'zh-TW' || value === 'en';
}

type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}.${P}`
		: never
	: never;

type Leaves<T> = T extends object
	? {
			[K in keyof T]-?: K extends string
				? T[K] extends object
					? Join<K, Leaves<T[K]>>
					: K
				: never;
		}[keyof T]
	: never;

export type TranslationKey = Leaves<TranslationSchema>;
export type { TranslationSchema };
