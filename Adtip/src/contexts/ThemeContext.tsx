import React, {createContext, useState, useContext, useEffect} from 'react';
import {useColorScheme} from 'react-native';
import {getThemeColors, COLORS} from '../constants/colors';
import { Theme, getTheme } from '../theme/GlobalTheme';

type ThemeContextType = {
  isDarkMode: boolean;
  colors: typeof COLORS;
  theme: Theme;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: COLORS,
  theme: getTheme(false), // Default to light theme
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === 'dark');

  // Update theme when device color scheme changes
  useEffect(() => {
    setIsDarkMode(deviceColorScheme === 'dark');
  }, [deviceColorScheme]);

  // Get colors based on current theme (legacy)
  const colors = getThemeColors(isDarkMode);
  
  // Get full theme object (new)
  const theme = getTheme(isDarkMode);

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
        theme,
        toggleTheme,
        setDarkMode,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};
