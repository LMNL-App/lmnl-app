/**
 * Theme state management
 */
import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors } from '../constants/theme';
import { STORAGE_KEYS } from '../constants/config';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

function getEffectiveColorScheme(
  mode: ThemeMode,
  systemScheme: ColorSchemeName
): 'light' | 'dark' {
  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  colorScheme: 'light',
  colors: Colors.light,
  isInitialized: false,

  initialize: async () => {
    try {
      // Load saved preference
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.theme);
      const mode = (savedMode as ThemeMode) || 'system';

      // Get system color scheme
      const systemScheme = Appearance.getColorScheme();
      const colorScheme = getEffectiveColorScheme(mode, systemScheme);

      set({
        mode,
        colorScheme,
        colors: Colors[colorScheme],
        isInitialized: true,
      });

      // Listen for system theme changes
      Appearance.addChangeListener(({ colorScheme: newSystemScheme }) => {
        const { mode } = get();
        if (mode === 'system') {
          const newColorScheme = newSystemScheme === 'dark' ? 'dark' : 'light';
          set({
            colorScheme: newColorScheme,
            colors: Colors[newColorScheme],
          });
        }
      });
    } catch (error) {
      console.error('Theme initialization error:', error);
      set({ isInitialized: true });
    }
  },

  setMode: async (mode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.theme, mode);

      const systemScheme = Appearance.getColorScheme();
      const colorScheme = getEffectiveColorScheme(mode, systemScheme);

      set({
        mode,
        colorScheme,
        colors: Colors[colorScheme],
      });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  toggleTheme: async () => {
    const { colorScheme } = get();
    const newMode = colorScheme === 'light' ? 'dark' : 'light';
    await get().setMode(newMode);
  },
}));
