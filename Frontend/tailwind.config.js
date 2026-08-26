/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: '#0C447C',
          light: '#378ADD',
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
          DEFAULT: '#A32D2D',
          light: '#E24B4A',
          tint: '#FCEBEB',
        },
        seafloor: {
          DEFAULT: '#444441',
          light: '#888780',
          tint: '#F1EFE8',
        },
        abyss: '#0A1628',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(226, 75, 74, 0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(226, 75, 74, 0)' },
        },
        sonarPing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        rowSlide: {
          '0%': { width: '0%' },
          '100%': { width: '3px' },
        },
      },
      animation: {
        waveMove: 'waveMove 4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        fillBar: 'fillBar 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        bioPulse: 'bioPulse 2s ease-in-out infinite',
        sonarPing: 'sonarPing 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
