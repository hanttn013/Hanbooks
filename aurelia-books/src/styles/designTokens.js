export const APP_THEMES = [
  { id: 'warm-cream', label: 'Ivory', bg: '#F7F1E7', surface: '#FFFDF8', text: '#163B37', accent: '#E98243' },
  { id: 'forest', label: 'Forest', bg: '#172C25', surface: '#203B32', text: '#EEF6EF', accent: '#E7A35F' },
  { id: 'indigo', label: 'Indigo', bg: '#252E5D', surface: '#333D6D', text: '#F1F3FF', accent: '#E8B96A' },
  { id: 'night', label: 'Night', bg: '#11141D', surface: '#1B2030', text: '#F3EBDD', accent: '#E98243' },
  { id: 'sepia', label: 'Sepia', bg: '#F1E4C3', surface: '#FBF1D8', text: '#3B2F0A', accent: '#9A6A2E' },
];

export const THEME_ALIASES = {
  'pure-white': 'warm-cream',
  'vintage-paper': 'sepia',
  'dark-gray': 'night',
  'amoled-black': 'night',
  ocean: 'warm-cream',
  'midnight-blue': 'indigo',
  'blue-333d6d': 'indigo',
  'violet-4647ae': 'indigo',
  'green-1a312c': 'forest',
  'navy-111844': 'indigo',
};

export const READER_FONTS = [
  {
    id: 'Georgia',
    label: 'Georgia',
    stack: 'Georgia, "Times New Roman", serif',
  },
  {
    id: 'Literary Serif',
    label: 'Literary Serif',
    stack: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
  },
  {
    id: 'System Sans',
    label: 'System Sans',
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  {
    id: 'System Serif',
    label: 'System Serif',
    stack: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  },
];

export function normalizeTheme(theme) {
  if (APP_THEMES.some(item => item.id === theme)) return theme;
  return THEME_ALIASES[theme] || 'warm-cream';
}

export function getThemeById(theme) {
  const normalized = normalizeTheme(theme);
  return APP_THEMES.find(item => item.id === normalized) || APP_THEMES[0];
}

export function normalizeFont(font) {
  if (READER_FONTS.some(item => item.id === font)) return font;
  if (font === 'Merriweather' || font === 'EB Garamond' || font === 'Noto Serif' || font === 'Times New Roman') {
    return 'Georgia';
  }
  return 'Georgia';
}

export function getFontStack(font) {
  return READER_FONTS.find(item => item.id === normalizeFont(font))?.stack || READER_FONTS[0].stack;
}
