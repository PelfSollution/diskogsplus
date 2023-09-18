/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  prefix: 'tw-',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
      boxShadow: {
        'dark': 'rgba(0, 0, 0, 0.16) 0px 19px 38px, rgba(0, 0, 0, 0.16) 0px 15px 12px',
        'inner-red': 'inset 0 0 0 2px #FF0000',
        'dark-inner-red': 'rgba(0, 0, 0, 0.16) 0px 19px 38px, rgba(0, 0, 0, 0.16) 0px 15px 12px',
       'inset': 'inset 0 -2px 4px rgba(0, 0, 0, 0.6)'
      },
    
      spacing: {
        '-7': '-1.75rem',
        '-6': '-1.5rem',
        '-5': '-1.25rem',
        '-4': '-1rem',
        '-3': '-0.75rem',
        '-2': '-0.5rem',
        '1': '0.25rem',
        '0.25': '0.0625rem', // 0.25 * 0.25 = 0.0625rem
        '0.75': '0.1875rem', // 0.75 * 0.25 = 0.1875rem
        '1.25': '0.3125rem', // 1.25 * 0.25 = 0.3125rem
        '1.50': '0.375rem', // 1.5 * 0.25 = 0.375rem
        '2.25': '0.5625rem', // 2.25 * 0.25 = 0.5625rem
        '2.50': '0.625rem', // 2.5 * 0.25 = 0.625rem
        '2.75': '0.6875rem', // 2.75 * 0.25 = 0.6875rem
        '3': '0.75rem', // 3 * 0.25 = 0.75rem
        '3.25': '0.8125rem', // 3.25 * 0.25 = 0.8125rem
        '12.5': '3.125rem',  // 12.5 * 0.25 = 3.125rem
        '15': '3.75rem', // 15 * 0.25 = 3.75rem
        '18': '4.5rem',     // 18 * 0.25 = 4.5rem
      },
      borderWidth: {
        '5': '5px',
        '8': '8px',
        '10': '10px',
        '30': '30px',
        '40': '40px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cyan: {
          100: '#E0FEFE',
          200: '#B2FCFC',
          300: '#80F8F8',
          400: '#40F2F2',
          500: '#00ECEC',
          600: '#00D4D4',
          700: '#00BABA',
          800: '#009C9C',
          900: '#007D7D',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backfaceVisibility: { 
        'hidden': 'hidden',
        'visible': 'visible'
      },
      perspective: { 
        'none': 'none',
        'flip': '1000px'
      },
      rotate: {
        '0': '0deg',
        '180': '180deg',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        'flip': { 
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'flip': 'flip 0.6s',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      const newUtilities = {
        '.whitespace-pre-line': {
          'white-space': 'pre-line',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    }
  ],
}