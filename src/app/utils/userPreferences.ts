export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeAppearance {
  accentColor: string;
  sidebarColor: string | null;
  backgroundColor: string | null;
  surfaceColor: string | null;
}

export interface UserPreferences {
  theme: ThemePreference;
  appearanceLight: ThemeAppearance;
  appearanceDark: ThemeAppearance;
  compactMode: boolean;
  animations: boolean;
}

export const DEFAULT_LIGHT_APPEARANCE: ThemeAppearance = {
  accentColor: '#2563EB',
  sidebarColor: null,
  backgroundColor: null,
  surfaceColor: null,
};

export const DEFAULT_DARK_APPEARANCE: ThemeAppearance = {
  accentColor: '#3B82F6',
  sidebarColor: null,
  backgroundColor: null,
  surfaceColor: null,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  appearanceLight: { ...DEFAULT_LIGHT_APPEARANCE },
  appearanceDark: { ...DEFAULT_DARK_APPEARANCE },
  compactMode: false,
  animations: true,
};

export const DEFAULT_APPEARANCE_RESET: Pick<
  UserPreferences,
  'theme' | 'appearanceLight' | 'appearanceDark' | 'compactMode' | 'animations'
> = {
  theme: DEFAULT_PREFERENCES.theme,
  appearanceLight: { ...DEFAULT_LIGHT_APPEARANCE },
  appearanceDark: { ...DEFAULT_DARK_APPEARANCE },
  compactMode: DEFAULT_PREFERENCES.compactMode,
  animations: DEFAULT_PREFERENCES.animations,
};

function appearanceEquals(a: ThemeAppearance, b: ThemeAppearance): boolean {
  return a.accentColor.toUpperCase() === b.accentColor.toUpperCase()
    && a.sidebarColor === b.sidebarColor
    && a.backgroundColor === b.backgroundColor
    && a.surfaceColor === b.surfaceColor;
}

export function isDefaultAppearance(prefs: UserPreferences): boolean {
  return prefs.theme === DEFAULT_PREFERENCES.theme
    && appearanceEquals(prefs.appearanceLight, DEFAULT_LIGHT_APPEARANCE)
    && appearanceEquals(prefs.appearanceDark, DEFAULT_DARK_APPEARANCE)
    && prefs.compactMode === DEFAULT_PREFERENCES.compactMode
    && prefs.animations === DEFAULT_PREFERENCES.animations;
}

export function getAppearanceForTheme(
  preferences: UserPreferences,
  effectiveTheme: 'light' | 'dark',
): ThemeAppearance {
  return effectiveTheme === 'dark' ? preferences.appearanceDark : preferences.appearanceLight;
}

export function normalizeUserPreferences(raw: Partial<UserPreferences> | null | undefined): UserPreferences {
  const prefs = raw || {};
  const hasNested = prefs.appearanceLight || prefs.appearanceDark;

  if (hasNested) {
    return {
      theme: prefs.theme || DEFAULT_PREFERENCES.theme,
      appearanceLight: {
        accentColor: prefs.appearanceLight?.accentColor || DEFAULT_LIGHT_APPEARANCE.accentColor,
        sidebarColor: prefs.appearanceLight?.sidebarColor ?? null,
        backgroundColor: prefs.appearanceLight?.backgroundColor ?? null,
        surfaceColor: prefs.appearanceLight?.surfaceColor ?? null,
      },
      appearanceDark: {
        accentColor: prefs.appearanceDark?.accentColor || DEFAULT_DARK_APPEARANCE.accentColor,
        sidebarColor: prefs.appearanceDark?.sidebarColor ?? null,
        backgroundColor: prefs.appearanceDark?.backgroundColor ?? null,
        surfaceColor: prefs.appearanceDark?.surfaceColor ?? null,
      },
      compactMode: prefs.compactMode ?? DEFAULT_PREFERENCES.compactMode,
      animations: prefs.animations ?? DEFAULT_PREFERENCES.animations,
    };
  }

  // Legacy flat preferences (single palette for all themes)
  const legacy = prefs as UserPreferences & {
    accentColor?: string;
    sidebarColor?: string | null;
    backgroundColor?: string | null;
    surfaceColor?: string | null;
  };

  return {
    theme: legacy.theme || DEFAULT_PREFERENCES.theme,
    appearanceLight: {
      accentColor: legacy.accentColor || DEFAULT_LIGHT_APPEARANCE.accentColor,
      sidebarColor: legacy.sidebarColor ?? null,
      backgroundColor: legacy.backgroundColor ?? null,
      surfaceColor: legacy.surfaceColor ?? null,
    },
    appearanceDark: { ...DEFAULT_DARK_APPEARANCE },
    compactMode: legacy.compactMode ?? DEFAULT_PREFERENCES.compactMode,
    animations: legacy.animations ?? DEFAULT_PREFERENCES.animations,
  };
}

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

export const LIGHT_BACKGROUND_COLORS = [
  { color: '#f0f4f8', label: 'Mist' },
  { color: '#ffffff', label: 'White' },
  { color: '#f8fafc', label: 'Snow' },
  { color: '#e2e8f0', label: 'Cloud' },
] as const;

export const DARK_BACKGROUND_COLORS = [
  { color: '#0b0f1a', label: 'Dark' },
  { color: '#090d1a', label: 'Midnight' },
  { color: '#131929', label: 'PaperZero' },
  { color: '#1e293b', label: 'Slate' },
] as const;

export const LIGHT_SURFACE_COLORS = [
  { color: '#ffffff', label: 'White' },
  { color: '#f8fafc', label: 'Snow' },
  { color: '#f1f5f9', label: 'Mist' },
  { color: '#e2e8f0', label: 'Cloud' },
] as const;

export const DARK_SURFACE_COLORS = [
  { color: '#131929', label: 'PaperZero' },
  { color: '#1a2235', label: 'Slate panel' },
  { color: '#1e293b', label: 'Steel' },
  { color: '#0f172a', label: 'Ink' },
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

export function applyThemeAppearance(appearance: ThemeAppearance, isDark: boolean) {
  applyAccentColor(appearance.accentColor, isDark);
  applySidebarColor(appearance.sidebarColor);
  applyBackgroundColor(appearance.backgroundColor);
  applySurfaceColor(appearance.surfaceColor);
  applyFavicon(appearance.accentColor);
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

export function applySurfaceColor(color: string | null | undefined) {
  const root = document.documentElement;
  if (!color) {
    root.style.removeProperty('--card');
    root.style.removeProperty('--popover');
    root.style.removeProperty('--card-foreground');
    root.style.removeProperty('--popover-foreground');
    root.style.removeProperty('--input-background');
    root.style.removeProperty('--muted');
    return;
  }

  const isDarkSurface = relativeLuminance(color) < 0.4;
  const foreground = isDarkSurface ? '#e2e8f0' : '#0f172a';

  root.style.setProperty('--card', color);
  root.style.setProperty('--popover', color);
  root.style.setProperty('--card-foreground', foreground);
  root.style.setProperty('--popover-foreground', foreground);
  root.style.setProperty(
    '--input-background',
    isDarkSurface ? mixHex(color, 0.05) : mixHex(color, 0.02),
  );
  root.style.setProperty(
    '--muted',
    isDarkSurface ? mixHex(color, 0.14) : darkenHex(color, 0.04),
  );
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
  const normalized = normalizeUserPreferences(preferences);
  const effectiveTheme = applyTheme(normalized.theme);
  const appearance = getAppearanceForTheme(normalized, effectiveTheme);
  applyThemeAppearance(appearance, effectiveTheme === 'dark');
  applyCompactMode(normalized.compactMode);
  applyAnimations(normalized.animations);
  return effectiveTheme;
}
