export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  border: string;
  text: string;
}

export const colorThemes: ColorTheme[] = [
  {
    name: 'Gothic Wiki',
    primary: '#d4af37',
    secondary: 'rgb(20, 7, 5)',
    accent: '#ecebe8',
    bg: '#1a1a1a',
    border: '#ecebe8',
    text: '#e8e8e8'
  },
  {
    name: 'Old Camp',
    primary: '#cd7f32',
    secondary: '#8b4513',
    accent: '#daa520',
    bg: '#2d2416',
    border: '#a0522d',
    text: '#f5deb3'
  },
  {
    name: 'New Camp',
    primary: '#228b22',
    secondary: '#006400',
    accent: '#32cd32',
    bg: '#1a2e1a',
    border: '#2e8b57',
    text: '#98fb98'
  },
  {
    name: 'Swamp Camp',
    primary: '#4b0082',
    secondary: '#2e0854',
    accent: '#8a2be2',
    bg: '#1a0a2e',
    border: '#6a0dad',
    text: '#e6e6fa'
  },
  {
    name: 'Fire Mage',
    primary: '#ff4500',
    secondary: '#8b0000',
    accent: '#ff6347',
    bg: '#2d0a0a',
    border: '#dc143c',
    text: '#ffe4e1'
  },
  {
    name: 'Water Mage',
    primary: '#00ced1',
    secondary: '#008b8b',
    accent: '#40e0d0',
    bg: '#0a2e2e',
    border: '#20b2aa',
    text: '#e0ffff'
  }
];

export const defaultTheme = colorThemes[0];

export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function getThemeFromCustomColor(customColor: string): ColorTheme {
  return {
    name: 'Custom',
    primary: customColor,
    secondary: adjustBrightness(customColor, -0.4),
    accent: adjustBrightness(customColor, 0.2),
    bg: adjustBrightness(customColor, -0.7),
    border: adjustBrightness(customColor, -0.2),
    text: adjustBrightness(customColor, 0.8)
  };
}
