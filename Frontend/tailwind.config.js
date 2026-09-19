/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sonar: {
          bg: '#101214',
          surface: '#181B1F',
          panel: '#242930',
          border: 'rgba(185, 192, 200, 0.24)',
          'border-strong': 'rgba(217, 119, 50, 0.45)',
          cyan: '#D97732',
          aqua: '#D97732',
          green: '#B9C0C8',
          dark: '#181B1F',
        },
        ocean: {
          DEFAULT: '#181B1F',
          deep: '#101214',
          medium: '#242930',
          light: '#D97732',
          tint: '#E8E5DF',
        },
        reef: {
          DEFAULT: '#B9C0C8',
          light: '#E8E5DF',
          tint: '#242930',
        },
        bio: {
          DEFAULT: '#D97732',
          light: '#E49A63',
          tint: '#3A2A20',
        },
        hazard: {
          DEFAULT: '#B94A48',
          light: '#D47774',
          tint: '#3A2424',
        },
        seafloor: {
          DEFAULT: '#242930',
          light: '#B9C0C8',
          tint: '#E8E5DF',
        },
        abyss: '#101214',
        white: '#E8E5DF',
        cyan: { 200: '#E8E5DF', 300: '#E8E5DF', 400: '#D97732', 500: '#D97732', 600: '#B85F25', 900: '#3A2A20', 950: '#2A211C' },
        emerald: { 400: '#B9C0C8', 500: '#B9C0C8', 600: '#8F98A2', 700: '#737C86', 950: '#242930' },
        green: { 400: '#B9C0C8', 500: '#B9C0C8', 600: '#8F98A2', 950: '#242930' },
        teal: { 300: '#E8E5DF', 400: '#D97732', 500: '#D97732', 950: '#2A211C' },
        lime: { 400: '#B9C0C8', 500: '#B9C0C8', 950: '#242930' },
        amber: { 200: '#E8B38A', 400: '#D97732', 500: '#D97732', 600: '#B85F25', 950: '#3A2A20' },
        rose: { 400: '#D47774', 500: '#B94A48', 600: '#B94A48', 700: '#8F3735', 950: '#3A2424' },
        red: { 400: '#D47774', 500: '#B94A48', 600: '#B94A48', 700: '#8F3735' },
        slate: { 300: '#B9C0C8', 400: '#B9C0C8', 500: '#8F98A2', 600: '#737C86', 700: '#59616B', 900: '#181B1F', 950: '#101214' },
      },
      fontFamily: {
        sans: ['var(--font-ui)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'sonar-cyan': '0 4px 16px rgba(0, 0, 0, 0.18)',
        'sonar-green': '0 4px 16px rgba(0, 0, 0, 0.18)',
        'sonar-red': '0 4px 16px rgba(0, 0, 0, 0.18)',
        'panel-glow': '0 8px 24px rgba(0, 0, 0, 0.18)',
      },
      keyframes: {
        waveMove: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '50%': { transform: 'translateX(-25%) translateY(-4px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fillBar: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--fill-width)' },
        },
        bioPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 59, 48, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 59, 48, 0)' },
        },
        sonarPing: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.8)', opacity: '0' },
        },
        scanSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        beamPass: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
      animation: {
        waveMove: 'waveMove 4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        fillBar: 'fillBar 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        bioPulse: 'bioPulse 2s ease-in-out infinite',
        sonarPing: 'sonarPing 2.4s cubic-bezier(0.1, 0.7, 0.1, 1) infinite',
        scanSweep: 'scanSweep 6s linear infinite',
        beamPass: 'beamPass 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
