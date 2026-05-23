import { useUniwind } from 'uniwind';
import { lightColors, darkColors, type AppThemeColors } from '@/theme/colors';

export function useAppTheme(): AppThemeColors {
  const { theme } = useUniwind();
  return theme === 'dark' ? darkColors : lightColors;
}
