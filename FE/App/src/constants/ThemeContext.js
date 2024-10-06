import React, {createContext, useContext, useEffect, useState} from 'react';
import {Appearance} from 'react-native';
import {useColorScheme as useNativeWindColorScheme} from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({children}) => {
  const {colorScheme, toggleColorScheme, setColorScheme} =
    useNativeWindColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [themePreference, setThemePreference] = useState('auto');

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('themePreference');
        if (savedPreference !== null) {
          setThemePreference(savedPreference);
          if (savedPreference !== 'auto') {
            setColorScheme(savedPreference);
          }
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [setColorScheme]);

  useEffect(() => {
    if (themePreference === 'auto') {
      const subscription = Appearance.addChangeListener(({colorScheme}) => {
        setColorScheme(colorScheme);
      });

      return () => subscription.remove();
    }
  }, [themePreference, setColorScheme]);

  const toggleTheme = async () => {
    let newTheme;
    if (themePreference === 'auto') {
      newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    } else {
      newTheme = 'auto';
    }

    setThemePreference(newTheme);
    if (newTheme === 'auto') {
      setColorScheme(Appearance.getColorScheme());
    } else {
      setColorScheme(newTheme);
    }

    try {
      await AsyncStorage.setItem('themePreference', newTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{colorScheme, toggleTheme, themePreference}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
