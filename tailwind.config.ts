import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        script: ['var(--font-dancing)', 'Dancing Script', 'cursive'],
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-midnight':
          'linear-gradient(160deg, #1a0b2e 0%, #2d1b4e 30%, #4a2c6a 60%, #6b3d8c 100%)',
        'gradient-midnight-soft': 'linear-gradient(160deg, #1a0b2e 0%, #2d1b4e 50%, #3d2659 100%)',
        'gradient-rose-gold': 'linear-gradient(135deg, #FFB6C1 0%, #FFD700 100%)',
        'gradient-gold-rose': 'linear-gradient(135deg, #FFD700 0%, #FFB6C1 100%)',
        'gradient-pink-glow': 'linear-gradient(135deg, #FFE4EC 0%, #FFB6C1 100%)',
        'gradient-vault-rose': 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
        'gradient-vault-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'gradient-vault-purple': 'linear-gradient(135deg, #A855F7 0%, #6B21A8 100%)',
        'gradient-vault-blue': 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        'gradient-vault-rose2': 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)',
        'gradient-vault-amber': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        'gradient-vault-violet': 'linear-gradient(135deg, #C084FC 0%, #9333EA 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        midnight: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
          DEFAULT: '#1a0b2e',
        },
        rose: {
          soft: '#FFB6C1',
          deep: '#FF6B9D',
          blush: '#FFE4EC',
          petal: '#FF8FA3',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFE57F',
          deep: '#D4AF37',
          shimmer: '#F0D77B',
        },
        cream: {
          DEFAULT: '#FFF8F0',
          dark: '#FFF0E0',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'heart-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.12)' },
          '60%': { transform: 'scale(1)' },
        },
        'float-up': {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-10vh) scale(1)', opacity: '0' },
        },
        'float-gentle': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%': { transform: 'translateY(-15px) translateX(10px)' },
          '66%': { transform: 'translateY(10px) translateX(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        'gold-glow': {
          '0%, 100%': { textShadow: '0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.2)' },
          '50%': { textShadow: '0 0 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.3)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'shimmer-border': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'heart-beat': 'heart-beat 1.5s ease-in-out infinite',
        'float-gentle': 'float-gentle 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'gold-glow': 'gold-glow 3s ease-in-out infinite',
        twinkle: 'twinkle 2s ease-in-out infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        'shimmer-border': 'shimmer-border 3s ease infinite',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(255, 107, 157, 0.3)',
        'soft-lg': '0 8px 40px -8px rgba(255, 107, 157, 0.4)',
        gold: '0 4px 24px -4px rgba(255, 215, 0, 0.4)',
        'gold-lg': '0 8px 40px -8px rgba(255, 215, 0, 0.5)',
        glass: '0 8px 32px -8px rgba(26, 11, 46, 0.4)',
        'glass-lg': '0 16px 48px -8px rgba(26, 11, 46, 0.5)',
        'glow-rose': '0 0 30px rgba(255, 107, 157, 0.4)',
        'glow-gold': '0 0 30px rgba(255, 215, 0, 0.4)',
        'inner-glow': 'inset 0 1px 1px rgba(255,255,255,0.15)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
