import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  card: string;
  border: string;
  text: string;
  secondaryText: string;
  placeholder: string;
  accent: string;
  danger: string;
}

const LIGHT: ThemeColors = {
  background: '#fff',
  card: '#f2f2f2',
  border: '#ddd',
  text: '#111',
  secondaryText: '#666',
  placeholder: '#999',
  accent: '#2f6fed',
  danger: '#d33',
};

const DARK: ThemeColors = {
  background: '#000',
  card: '#1c1c1e',
  border: '#3a3a3c',
  text: '#f2f2f2',
  secondaryText: '#aaa',
  placeholder: '#888',
  accent: '#5b93ff',
  danger: '#ff6b60',
};

export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? DARK : LIGHT;
}
