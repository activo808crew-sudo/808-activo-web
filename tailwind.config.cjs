/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {

      /* ---------------------------------- */
      /*           FONDO GAMER              */
      /* ---------------------------------- */
      backgroundImage: {
        'gaming-bg': "radial-gradient(circle at 50% 0%, rgba(88, 28, 135, 0.25), transparent 70%), #0a0319",
      },

      /* ---------------------------------- */
      /*        ANIMACIONES CUSTOM          */
      /* ---------------------------------- */
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideDown: {
          '0%': { transform: "translateY(-20px)", opacity: 0 },
          '100%': { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.35s cubic-bezier(.16,.84,.44,1)',
      },

      /* ---------------------------------- */
      /*          COLORES EXTRA             */
      /* ---------------------------------- */
      colors: {
        brand: {
          purple: "#8b5cf6",
          dark: "#0a0319",
        },
      },

      /* ---------------------------------- */
      /*         SOMBRAS CUSTOM             */
      /* ---------------------------------- */
      boxShadow: {
        'purple-glow': "0 0 20px rgba(139, 92, 246, 0.5)",
      },

      /* ---------------------------------- */
      /*            FUENTES MONO            */
      /* ---------------------------------- */
      fontFamily: {
        mono: ["Roboto Mono", "monospace"],
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
