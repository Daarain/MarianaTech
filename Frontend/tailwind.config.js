/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sonar: {
          bg: '#030712',
          surface: '#071120',
          panel: 'rgba(10, 25, 47, 0.75)',
          border: 'rgba(0, 240, 255, 0.2)',
          'border-strong': 'rgba(0, 240, 255, 0.45)',
          cyan: '#00F0FF',
          aqua: '#00D2E6',
          green: '#00FF9D',
          dark: '#050D1A',
        },
        ocean: {
          DEFAULT: '#0A192F',
          deep: '#030814',
          medium: '#0F2744',
          light: '#00F0FF',
          tint: '#E6F1FB',
        },
        reef: {
          DEFAULT: '#0F6E56',
          light: '#1D9E75',
          tint: '#E1F5EE',
        },
        bio: {
          DEFAULT: '#534AB7',
          light: '#7F77DD',
          tint: '#EEEDFE',
        },
        hazard: {
          DEFAULT: '#FF3B30',
          light: '#FF6B63',
          tint: '#FCEBEB',
        },
        seafloor: {
          DEFAULT: '#1E293B',
          light: '#64748B',
          tint: '#F1EFE8',
        },
        abyss: '#030712',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'sonar-cyan': '0 0 20px rgba(0, 240, 255, 0.25)',
        'sonar-green': '0 0 20px rgba(0, 255, 157, 0.25)',
        'sonar-red': '0 0 20px rgba(255, 59, 48, 0.25)',
        'panel-glow': '0 8px 32px 0 rgba(0, 10, 25, 0.5)',
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
