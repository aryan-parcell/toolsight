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
					light: '#FFFFFF',
					dark: '#090909',
					cyan: '#00E5FF',
					surfaceLight: '#FAFAFA',
					surfaceDark: '#222222',
					borderLight: '#EAEAEA',
					borderDark: '#272727',
					textLight: '#000000',
					textDark: '#FFFFFF',
					headingLight: '#111111',
					headingDark: '#F5F5F5',
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}