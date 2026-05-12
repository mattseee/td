/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:              'var(--bg)',
        surface:         'var(--surface)',
        'surface-2':     'var(--surface-2)',
        border:          'var(--border)',
        'border-2':      'var(--border-2)',
        accent:          'var(--accent)',
        'accent-hover':  'var(--accent-hover)',
        'accent-soft':   'var(--accent-soft)',
        'accent-text':   'var(--accent-text)',
        'brand-red':     'var(--brand-red)',
        'brand-navy':    'var(--brand-navy)',
        text:            'var(--text)',
        'text-muted':    'var(--text-muted)',
        'text-subtle':   'var(--text-subtle)',
        success:         'var(--success)',
        'success-soft':  'var(--success-soft)',
        danger:          'var(--danger)',
        'danger-soft':   'var(--danger-soft)',
        warning:         'var(--warning)',
        'warning-soft':  'var(--warning-soft)',
        info:            'var(--info)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      screens: {
        tablet:  '768px',
        desktop: '1024px',
        wide:    '1440px',
        '2xl':   '1536px',
      },
    },
  },
  plugins: [],
}
