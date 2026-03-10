/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orchestra: {
          red: '#e40e20',        // Rouge Orchestra — CTA, accents marque
          'red-dark': '#b50b19', // Variante sombre — texte sur fond clair (WCAG AA)
          'red-light': '#f04050',// Variante hover
          'red-bg': '#fdf0f1',   // Fond très clair pour badges/zones colorées
        },
      },
      fontFamily: {
        // Alphakind — police des titres Orchestra (usage : uppercase, @font-face dans index.css)
        display: ['Alphakind', 'ui-rounded', 'system-ui', 'sans-serif'],
        // General Sans — police du corps de texte Orchestra (graisses 400 + 600, @font-face dans index.css)
        sans: ['General Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
