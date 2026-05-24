export interface AppThemeColors {
  bg: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryLight: string;
  primaryBg: string;
  primaryBorder: string;
  gold: string;
  goldLight: string;
  goldBorder: string;
  danger: string;
  info: string;
  purple: string;
  warning: string;
  statsBg: string;
  shadowColor: string;
  overlay: string;
}

export const lightColors: AppThemeColors = {
  bg: '#FDF8F2',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAFA',
  surfaceTertiary: '#F9F9F9',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',
  border: '#F0F0F0',
  borderLight: '#F5F5F5',
  primary: '#2D7D46',
  primaryLight: '#E8F5E9',
  primaryBg: '#F0FFF4',
  primaryBorder: '#C6F6D5',
  gold: '#D4A574',
  goldLight: '#FFF8F0',
  goldBorder: '#FFE4C4',
  danger: '#E85D4C',
  info: '#4682B4',
  purple: '#9370DB',
  warning: '#F59E0B',
  statsBg: '#F6FFED',
  shadowColor: '#2D7D46',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors: AppThemeColors = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceSecondary: '#1C2128',
  surfaceTertiary: '#1E232A',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textInverse: '#FFFFFF',
  border: '#21262D',
  borderLight: '#292E36',
  primary: '#3FB950',
  primaryLight: '#1A2E1F',
  primaryBg: '#162718',
  primaryBorder: '#2D4A35',
  gold: '#D4A574',
  goldLight: '#2A2218',
  goldBorder: '#4A3A28',
  danger: '#F85149',
  info: '#58A6FF',
  purple: '#A371F7',
  warning: '#D29922',
  statsBg: '#161B22',
  shadowColor: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
};
