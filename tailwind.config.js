export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0891B2',
        primaryLight: '#22D3EE',
        primaryDark: '#0E7490',
        secondary: '#6366F1',
        accent: '#F59E0B',
        background: '#FFFFFF',
        backgroundDark: '#F9FAFB',
        text: '#1F2937',
        textLight: '#6B7280',
        textMuted: '#9CA3AF',
        border: '#E5E7EB',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        info: '#3B82F6'
      },
      fontFamily: {
        sans: ["'Inter'", 'sans-serif']
      }
    }
  },
  plugins: []
};