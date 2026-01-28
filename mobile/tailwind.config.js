/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class", // NativeWind handles this automatically with useColorScheme
  theme: {
    extend: {
      colors: {
        // Brand colors (same in light/dark)
        primary: "#B06D1E",
        secondary: "#F3961D33",
        accent: "#F29A2C",
        chatBg: "#F3961D",
        
        // Semantic colors - use these for theme-aware styling
        // Light mode values (dark: variants override in dark mode)
        background: {
          DEFAULT: "#FFFAF2",
          dark: "#000000",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1C1B1F",
        },
        "surface-secondary": {
          DEFAULT: "#F5F5F5",
          dark: "#2C2C2E",
        },
        "surface-tertiary": {
          DEFAULT: "#EEEEEE",
          dark: "#3A3A3C",
        },
        
        // Text colors
        label: {
          DEFAULT: "#000000",
          dark: "#FFFFFF",
        },
        "label-secondary": {
          DEFAULT: "#6B7280",
          dark: "#9CA3AF",
        },
        "label-tertiary": {
          DEFAULT: "#9CA3AF",
          dark: "#6B7280",
        },
        
        // Border/separator colors
        border: {
          DEFAULT: "#EAEAEB",
          dark: "#3A3A3C",
        },
        separator: {
          DEFAULT: "#E5E5EA",
          dark: "#38383A",
        },
        
        // Legacy - kept for backward compatibility
        gray: "#9A9CA0",
        dark: "#1D2733",
        light: {
          100: "#F9F9FC",
          200: "#EAEAEB"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
      spacing: {
        // Responsive spacing using our design tokens
        // These can be used as: p-xs, m-sm, gap-md, etc.
        'xxs': '2px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
        '5xl': '64px',
        'screen-padding': '20px',
        'card-padding': '16px',
      },
      fontSize: {
        // Typography system - use these instead of arbitrary values
        'display': ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'h1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-medium': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'body-semibold': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'callout': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'subheadline': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'caption-sm': ['11px', { lineHeight: '14px', fontWeight: '400' }],
        'button-lg': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'button': ['16px', { lineHeight: '21px', fontWeight: '600' }],
        'button-sm': ['14px', { lineHeight: '18px', fontWeight: '600' }],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'card': '16px',
        'button': '12px',
        'input': '10px',
        'badge': '8px',
      },
      minHeight: {
        'button-sm': '36px',
        'button': '48px',
        'button-lg': '56px',
        'input-sm': '40px',
        'input': '48px',
        'input-lg': '56px',
        'touch-target': '44px', // iOS/Android minimum touch target
      },
      minWidth: {
        'touch-target': '44px',
      },
    },
  },
  plugins: [],
}