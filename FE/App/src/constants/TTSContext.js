import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AccessibilityInfo} from 'react-native';

const TTSContext = createContext();

export const TTSProvider = ({children}) => {
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);

  useEffect(() => {
    const initTTSSettings = async () => {
      try {
        const storedSetting = await AsyncStorage.getItem('isTTSEnabled');
        const screenReaderEnabled =
          await AccessibilityInfo.isScreenReaderEnabled();

        if (screenReaderEnabled) {
          setIsTTSEnabled(true);
        } else if (storedSetting !== null) {
          setIsTTSEnabled(JSON.parse(storedSetting));
        }
      } catch (e) {
        console.error('Failed to load TTS settings', e);
      }
    };

    initTTSSettings();
  }, []);

  const toggleTTS = async value => {
    setIsTTSEnabled(value);
    try {
      await AsyncStorage.setItem('isTTSEnabled', JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save TTS settings', e);
    }
  };

  return (
    <TTSContext.Provider value={{isTTSEnabled, toggleTTS}}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => useContext(TTSContext);
