import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#4A5FE0',
        ink: '#0F1419',
        sub: '#536471',
        hairline: '#EFF3F4',
      },
    },
  },
  plugins: [],
};

export default config;
