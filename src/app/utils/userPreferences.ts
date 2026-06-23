export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemePreference;
  accentColor: string;
  compactMode: boolean;
  animations: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  accentColor: '#2563EB',
  compactMode: false,
  animations: true,
};

export const ACCENT_COLORS = [
  { color: '#2563EB', label: 'Blue' },
  { color: '#7C3AED', label: 'Purple' },
  { color: '#059669', label: 'Emerald' },
  { color: '#DC2626', label: 'Red' },
  { color: '#D97706', label: 'Amber' },
] as const;

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function mixHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function darkenHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const dark = (channel: number) => Math.max(0, Math.round(channel * (1 - amount)));
  return `rgb(${dark(r)}, ${dark(g)}, ${dark(b)})`;
}

export function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyTheme(theme: ThemePreference) {
  const effective = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', effective === 'dark');
  return effective;
}

export function applyAccentColor(color: string, isDark: boolean) {
  const root = document.documentElement;
  const primary = isDark ? mixHex(color, 0.15) : color;
  const { r, g, b } = hexToRgb(color);

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--ring', primary);
  root.style.setProperty('--sidebar-primary', mixHex(color, 0.35));
  root.style.setProperty('--sidebar-ring', primary);
  root.style.setProperty('--chart-1', primary);
  root.style.setProperty('--secondary', `rgba(${r}, ${g}, ${b}, ${isDark ? 0.25 : 0.15})`);
  root.style.setProperty('--secondary-foreground', isDark ? mixHex(color, 0.55) : darkenHex(color, 0.25));
  root.style.setProperty('--accent', `rgba(${r}, ${g}, ${b}, ${isDark ? 0.2 : 0.08})`);
  root.style.setProperty('--accent-foreground', isDark ? mixHex(color, 0.45) : color);
}

export function applyCompactMode(compact: boolean) {
  document.documentElement.classList.toggle('compact', compact);
}

export function applyAnimations(enabled: boolean) {
  document.documentElement.classList.toggle('no-animations', !enabled);
}

export function applyUserPreferences(preferences: UserPreferences) {
  const effectiveTheme = applyTheme(preferences.theme);
  applyAccentColor(preferences.accentColor, effectiveTheme === 'dark');
  applyCompactMode(preferences.compactMode);
  applyAnimations(preferences.animations);
  return effectiveTheme;
}
