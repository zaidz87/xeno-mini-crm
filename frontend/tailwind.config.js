/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          bg: '#0F1117',
          surface: '#1A1D27',
          border: '#2A2D3A',
          primary: '#6366F1',
          primaryLight: '#818CF8',
          delivered: '#3B82F6',
          failed: '#EF4444',
          opened: '#F59E0B',
          clicked: '#10B981',
          sent: '#6B7280',
          textPrimary: '#F1F5F9',
          textSecondary: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
