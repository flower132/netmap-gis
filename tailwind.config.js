/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gis: {
          950: '#060a12',
          900: '#0b1220',
          850: '#0d1526',
          800: '#111a2e',
          750: '#141f36',
          700: '#1a2640',
          600: '#223055',
          500: '#2d3d66',
          400: '#4a5d8a',
          300: '#7a8fb0',
          200: '#a8b8d0',
          100: '#dce4f0',
        },
        status: {
          active: '#10b981',
          inactive: '#ef4444',
          maintenance: '#f59e0b',
          planning: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      screens: {
        xs: '480px',
      },
      zIndex: {
        map: '0',
        'map-overlay': '10',
        sidebar: '20',
        header: '30',
        drawer: '40',
        'drawer-panel': '50',
        dropdown: '60',
        modal: '70',
      },
    },
  },
  plugins: [],
}
