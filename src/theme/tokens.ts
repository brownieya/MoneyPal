import { Platform } from 'react-native';

export const colors = {
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

export const shadows = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  android: {
    elevation: 3,
  },
  default: {},
});
