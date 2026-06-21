import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Light colors match PROFESSIONAL_THEME.colors
export const lightColors = {
  bg: '#FAFAFC',
  card: '#FFFFFF',
  primary: '#0B132B',
  primaryDark: '#050914',
  primaryLight: '#5A4FCF',
  googleBtn: '#FFFFFF',
  googleBtnText: '#1F2937',
  secondary: '#EBE7FF',
  inputBg: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  textDim: '#9CA3AF',
  border: '#E5E7EB',
  checkboxBg: '#5A4FCF',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#EF4444',
  warningBg: '#FEF2F2',
  pending: '#F59E0B',
  pendingBg: '#FEF3C7',
  surfaceDark: '#111827',
  logoOrange: '#5A4FCF',
  statsCyan: '#E0F2FE',
  statsPurple: '#F3E8FF',
  statsOrange: '#FEF3C7',
  cardBackgroundLight: '#F3F4F6',
};

export const darkColors = {
  bg: '#000000',
  card: '#111111',
  primary: '#FFFFFF',
  primaryDark: '#FFFFFF',
  primaryLight: '#5A4FCF',
  googleBtn: '#111111',
  googleBtnText: '#FFFFFF',
  secondary: '#222222',
  inputBg: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#A1A1AA',
  textDim: '#52525B',
  border: '#27272A',
  checkboxBg: '#5A4FCF',
  success: '#34D399',
  successBg: '#064E3B',
  warning: '#F87171',
  warningBg: '#7F1D1D',
  pending: '#FBBF24',
  pendingBg: '#78350F',
  surfaceDark: '#FFFFFF',
  logoOrange: '#5A4FCF',
  statsCyan: '#0C4A6E',
  statsPurple: '#581C87',
  statsOrange: '#78350F',
  cardBackgroundLight: '#2C2C2E',
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Load persisted preference
    async function loadTheme() {
      try {
        const persisted = await AsyncStorage.getItem('appTheme');
        if (persisted !== null) {
          setIsDarkMode(persisted === 'dark');
        } else {
          setIsDarkMode(false);
        }
      } catch (e) {
        console.log('Failed to load appTheme:', e);
        setIsDarkMode(false);
      }
    }
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    try {
      const newVal = !isDarkMode;
      setIsDarkMode(newVal);
      await AsyncStorage.setItem('appTheme', newVal ? 'dark' : 'light');
    } catch (e) {
      console.log('Failed to save appTheme:', e);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
