import { browser } from '$app/environment';

export type UiTheme = 'avant-garde' | 'classic';

export interface ThemeFeatures {
	borderTrace: boolean;
	reticleCorners: boolean;
	lineSliceTransition: boolean;
}

export const themeFeatures: Record<UiTheme, ThemeFeatures> = {
	'avant-garde': {
		borderTrace: true,
		reticleCorners: true,
		lineSliceTransition: true
	},
	'classic': {
		borderTrace: false,
		reticleCorners: false,
		lineSliceTransition: false
	}
};

class UiThemeStore {
	theme = $state<UiTheme>('avant-garde');

	constructor() {
		if (browser) {
			const saved = (localStorage.getItem('samara-ui-theme') || localStorage.getItem('tablix-ui-theme')) as UiTheme | null;
			if (saved === 'classic' || saved === 'avant-garde') {
				this.theme = saved;
			}
			this.apply();
		}
	}

	setTheme(theme: UiTheme) {
		this.theme = theme;
		if (browser) {
			localStorage.setItem('samara-ui-theme', theme);
			this.apply();
		}
	}

	toggle() {
		this.setTheme(this.theme === 'avant-garde' ? 'classic' : 'avant-garde');
	}

	apply() {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', this.theme);
	}
}

export const uiTheme = new UiThemeStore();
