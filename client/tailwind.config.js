/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        s1: 'var(--s1)',
        s2: 'var(--s2)',
        t1: 'var(--t1)',
        t2: 'var(--t2)',
        t3: 'var(--t3)',
        border: 'var(--border)',
        acc: 'var(--acc)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'eq-1': 'eq 1.2s ease-in-out infinite',
        'eq-2': 'eq 1.4s ease-in-out infinite 0.2s',
        'eq-3': 'eq 1.1s ease-in-out infinite 0.4s',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        eq: {
          '0%, 100%': { height: '3px' },
          '50%': { height: '14px' },
        }
      }
    },
  },
  plugins: [],
}
