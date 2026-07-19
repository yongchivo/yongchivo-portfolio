/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				// same stack as tools.yongchivo.com
				sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
			},
			colors: {
				"brand-magenta": "#d946ef",
				"brand-purple": "#a855f7",
				"brand-cyan": "#22d3ee",
			},
		},
	},
	plugins: [require("@tailwindcss/typography"),require("daisyui")],
	daisyui: {
		themes: [
			{
				yongchivo: {
					"color-scheme": "dark",
					"base-100": "#0b0a14", // page background (Yongchivo Tools dark)
					"base-200": "#131120", // cards / raised surfaces
					"base-300": "#1c1a2e", // borders / deepest surface
					"base-content": "#e8e6f2", // body text, soft off-white
					"primary": "#d946ef", // magenta
					"primary-content": "#1a0521",
					"secondary": "#a855f7", // purple (tag badges)
					"secondary-content": "#180630",
					"accent": "#22d3ee", // cyan
					"accent-content": "#062a33",
					"neutral": "#1c1a2e",
					"neutral-content": "#e8e6f2",
					"info": "#22d3ee",
					"info-content": "#062a33",
					"success": "#34d399",
					"success-content": "#04271a",
					"warning": "#fbbf24",
					"warning-content": "#2a2005",
					"error": "#fb7185",
					"error-content": "#2d060d",
				},
			},
		],
		darkTheme: "dark", // name of one of the included themes for dark mode
		logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
	  }
}
