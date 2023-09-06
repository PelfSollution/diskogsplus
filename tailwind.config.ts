import type { Config } from 'tailwindcss'

const config: Config = {
  mode: 'jit',
  prefix: 'tw-',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        '-4': '-1rem',
        '-3': '-0.75rem',
        '-2': '-0.5rem',
        '-1': '1rem',
        '1': '0.25rem',
        '0.25': '0.0625rem', // 0.25 * 0.25 = 0.0625rem
        '0.75': '0.1875rem', // 0.75 * 0.25 = 0.1875rem
        '1.25': '0.3125rem', // 1.25 * 0.25 = 0.3125rem
        '1.50': '0.375rem', // 1.5 * 0.25 = 0.375rem
        '2.25': '0.5625rem', // 2.25 * 0.25 = 0.5625rem
        '2.50': '0.625rem', // 2.5 * 0.25 = 0.625rem
        '2.75': '0.6875rem', // 2.75 * 0.25 = 0.6875rem
        '3': '0.75rem', // 3 * 0.25 = 0.75rem
        '12.5': '3.125rem',  // 12.5 * 0.25 = 3.125rem
        '15': '3.75rem', // 15 * 0.25 = 3.75rem
        '18': '4.5rem',     // 18 * 0.25 = 4.5rem
      },
      borderWidth: {
        '10': '10px',
        '30': '30px',
        '40': '40px',
      },
      colors: {
        /* tus colores aquí... */
      },
      borderRadius: {
        /* tus valores de borderRadius aquí... */
      },
      keyframes: {
        /* tus keyframes aquí... */
      },
      animation: {
        /* tus animaciones aquí... */
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config;
