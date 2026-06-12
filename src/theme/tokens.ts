import { ColorSchemeName, Platform, useColorScheme } from 'react-native';

const lightColors = {
  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  primary: '#2563EB',
  primaryMuted: '#DBEAFE',
  success: '#0F766E',
  successMuted: '#CCFBF1',
  warning: '#B45309',
  warningMuted: '#FEF3C7',
  danger: '#DC2626',
  dangerMuted: '#FEE2E2',
  overlay: 'rgba(15, 23, 42, 0.42)',
  shadow: '#0F172A',
  chartTrack: '#E5E7EB',
  selectionSurface: '#F8FBFF',
};

const darkColors = {
  background: '#0B1220',
  surface: '#111827',
  surfaceMuted: '#172036',
  border: '#243041',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  primary: '#60A5FA',
  primaryMuted: '#172554',
  success: '#5EEAD4',
  successMuted: '#103A39',
  warning: '#FBBF24',
  warningMuted: '#3B2A11',
  danger: '#F87171',
  dangerMuted: '#3B1D24',
  overlay: 'rgba(2, 6, 23, 0.68)',
  shadow: '#020617',
  chartTrack: '#243041',
  selectionSurface: '#0F1B33',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
};

export const typography = {
  hero: 30,
  title: 24,
  section: 18,
  body: 14,
  caption: 12,
};

export type AppTheme = ReturnType<typeof createTheme>;

export function createTheme(colorScheme?: ColorSchemeName) {
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    spacing,
    radius,
    typography,
    shadows: Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: isDark ? 20 : 16,
        shadowOffset: {
          width: 0,
          height: 10,
        },
      },
      android: {
        elevation: isDark ? 2 : 3,
      },
      default: {},
    }),
  };
}

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return createTheme(colorScheme);
}
