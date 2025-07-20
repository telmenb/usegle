import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',

	theme: {
		extend: {
			screens: {
				'xs': '375px',
				'sm': '768px',
				'md': '1024px',
				'lg': '1920px',
				'xl': '2560px',
			},
			colors: {
				'light-background': '#f8f8f8',
				'dark-background': '#292d33',
				'primary': '#a8b87a',
				'primary-dark': '#758547',
				'secondary': '#d0caa9',
				'secondary-dark': '#56502f'
			},
			spacing: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
				'18': '4.5rem', // 72px for xl sizes
			},
			fontSize: {
				'5xl': ['3rem', { lineHeight: '1' }], // 48px for xl board text
			}
		}
	},

	plugins: [typography]
} satisfies Config;
