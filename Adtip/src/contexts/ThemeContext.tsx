import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getThemeColors, COLORS } from '../constants/colors';

type ThemeContextType = {
  isDarkMode: boolean;
  colors: typeof COLORS;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: COLORS,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === 'dark');

  // Update theme when device color scheme changes
  useEffect(() => {
    setIsDarkMode(deviceColorScheme === 'dark');
  }, [deviceColorScheme]);

  // Get colors based on current theme
  const colors = getThemeColors(isDarkMode);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Set dark mode directly
  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        colors,
        toggleTheme,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
