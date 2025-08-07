import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './electron/preload.ts'
  ],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;



