import { browser } from '$app/environment';

export type UiTheme = 'avant-garde' | 'classic';

class UiThemeStore {
	theme = $state<UiTheme>('avant-garde');

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('tablix-ui-theme') as UiTheme | null;
			if (saved === 'classic' || saved === 'avant-garde') {
				this.theme = saved;
			}
			this.apply();
		}
	}

	setTheme(theme: UiTheme) {
		this.theme = theme;
		if (browser) {
			localStorage.setItem('tablix-ui-theme', theme);
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
