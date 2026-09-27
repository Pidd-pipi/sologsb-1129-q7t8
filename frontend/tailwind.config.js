/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#f6f1e7', deep: '#ece3d3', line: '#dbcfb8' },
        ink: { DEFAULT: '#221f1b', soft: '#4a453d', mute: '#837a6b' },
        seal: { DEFAULT: '#a8352a', soft: '#c45b4c', pale: '#f3e2df' },
        brass: { DEFAULT: '#8a6a34', soft: '#bb9553', pale: '#f0e7d5' },
        jade: { DEFAULT: '#2f6b5b', pale: '#e2efe9' },
      },
      fontFamily: {
        song: ['"Songti SC"', '"Noto Serif SC"', 'STSong', '"SimSun"', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      boxShadow: {
        press: '0 1px 0 rgba(34,31,27,0.20), inset 0 1px 0 rgba(255,255,255,0.55)',
        card: '0 2px 10px rgba(34,31,27,0.07)',
      },
      backgroundImage: {
        'paper-grain':
          'radial-gradient(circle at 20% 20%, rgba(168,53,42,0.04), transparent 55%), radial-gradient(circle at 80% 0%, rgba(138,106,52,0.05), transparent 45%)',
      },
    },
  },
  plugins: [],
};
