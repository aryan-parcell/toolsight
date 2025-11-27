/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				mono: ['Roboto', 'monospace'],
			},
			colors: {
				axiom: {
					cyan: '#00E5FF',
					dark: '#09090B',
					surfaceDark: '#18181B',
					borderDark: '#27272A',
					textDark: '#A1A1AA',
					light: '#FFFFFF',
					surfaceLight: '#FAFAFA',
					borderLight: '#EAEAEA',
					textLight: '#444444',
					headingLight: '#111111'
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}