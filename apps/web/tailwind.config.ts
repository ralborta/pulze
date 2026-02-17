import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pulze: {
          cyan: {
            DEFAULT: '#00D9FF',
            50: '#E5F9FF',
            100: '#CCF3FF',
            300: '#66E5FF',
            500: '#00D9FF',
            700: '#00A3CC',
            900: '#006D99',
          },
          blue: {
            DEFAULT: '#4A90E2',
            50: '#EBF3FC',
            100: '#D7E7F9',
            300: '#8BB5ED',
            500: '#4A90E2',
            700: '#2E6AB8',
            900: '#1B4580',
          },
          dark: {
            DEFAULT: '#0A0E1A',
            navy: '#0A0E1A',
            blue: '#151B2E',
            slate: '#1A2847',
          },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 217, 255, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
