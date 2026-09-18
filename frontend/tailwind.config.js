/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        navy: {
          DEFAULT: '#1800AD',
          50: '#F0EEFC',
          100: '#D6D1F7',
          200: '#ABA0EE',
          300: '#7A66E0',
          400: '#4A35D6',
          500: '#2A0DC4',
          600: '#1800AD',
          700: '#120082',
          900: '#0A0050',
        },
        gold: {
          DEFAULT: '#FB1D36',
          50: '#FFEEF0',
          100: '#FED3D7',
          200: '#FEA6AE',
          300: '#FD7884',
          400: '#FC4A5E',
          500: '#FB1D36',
          600: '#E0102A',
          700: '#B80E22',
        },
        alibaba: {
          DEFAULT: '#A62BF2',
          50: '#F8EEFE',
          100: '#EFDAFC',
          200: '#DDAEFA',
          300: '#CA82F7',
          400: '#B855F5',
          500: '#A62BF2',
          600: '#8F1ED9',
          700: '#7818B3',
        },
        brandYellow: {
          DEFAULT: '#FDFB36',
          50: '#FFFEF0',
          100: '#FFFCC2',
          200: '#FEFA94',
          300: '#FEF965',
          400: '#FDFA4B',
          500: '#FDFB36',
          600: '#E0DE1A',
        },
        primary: {
          DEFAULT: '#1800AD',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F8F9FA',
          foreground: '#1800AD',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: '#A62BF2',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
