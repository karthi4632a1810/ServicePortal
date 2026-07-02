export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemePreference;
  accentColor: string;
  sidebarColor: string | null;
  backgroundColor: string | null;
  compactMode: boolean;
  animations: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  accentColor: '#2563EB',
  sidebarColor: null,
  backgroundColor: null,
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

export const SIDEBAR_COLORS = [
  { color: '#0f1c35', label: 'Navy' },
  { color: '#090d1a', label: 'Midnight' },
  { color: '#1e293b', label: 'Slate' },
  { color: '#0f172a', label: 'Ink' },
] as const;

export const BACKGROUND_COLORS = [
  { color: '#f0f4f8', label: 'Mist' },
  { color: '#ffffff', label: 'White' },
  { color: '#f8fafc', label: 'Snow' },
  { color: '#0b0f1a', label: 'Dark' },
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

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const linear = [r, g, b].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
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

export function applySidebarColor(color: string | null | undefined) {
  const root = document.documentElement;
  if (!color) {
    root.style.removeProperty('--sidebar');
    root.style.removeProperty('--sidebar-foreground');
    root.style.removeProperty('--sidebar-accent');
    root.style.removeProperty('--sidebar-border');
    return;
  }

  const isDarkSidebar = relativeLuminance(color) < 0.25;
  root.style.setProperty('--sidebar', color);
  root.style.setProperty('--sidebar-foreground', isDarkSidebar ? '#e2e8f0' : '#0f172a');
  root.style.setProperty('--sidebar-accent', isDarkSidebar ? mixHex(color, 0.1) : darkenHex(color, 0.06));
  root.style.setProperty('--sidebar-border', isDarkSidebar ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)');
}

export function applyBackgroundColor(color: string | null | undefined) {
  const root = document.documentElement;
  if (!color) {
    root.style.removeProperty('--background');
    return;
  }
  root.style.setProperty('--background', color);
}

export function applyFavicon(accentColor: string) {
  const bg = accentColor.replace('#', '');
  const href = `https://placehold.co/32x32/${bg}/FFFFFF?text=P`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', accentColor);
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
  applySidebarColor(preferences.sidebarColor);
  applyBackgroundColor(preferences.backgroundColor);
  applyFavicon(preferences.accentColor);
  applyCompactMode(preferences.compactMode);
  applyAnimations(preferences.animations);
  return effectiveTheme;
}
