import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',

	theme: {
		extend: {
			colors: {
				'light-background': '#f8f8f8',
				'dark-background': '#292d33',
				'primary': '#a8b87a',
				'primary-dark': '#758547',
				'secondary': '#d0caa9',
				'secondary-dark': '#56502f'
			}
		}
	},

	plugins: [typography]
} satisfies Config;
