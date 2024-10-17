import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import Tts from 'react-native-tts';

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const isSpeakingRef = useRef(false);

  const initTts = useCallback(async () => {
    try {
      await Tts.setDefaultLanguage('ko-KR');
      await Tts.setDefaultVoice('ko-KR-SMTf00'); // 또는 'ko-KR-default'
      const voices = await Tts.voices();
      const availableVoices = voices.filter(v => v.language === 'ko-KR');

      Tts.addEventListener('tts-start', event => console.log('TTS start', event));
      Tts.addEventListener('tts-finish', event => console.log('TTS finish', event));
      Tts.addEventListener('tts-cancel', event => console.log('TTS cancel', event));

      if (availableVoices.length > 0) {
        await Tts.setDefaultVoice(availableVoices[0].id);
      } else {
        console.warn('No Korean voices found. Using default voice.');
      }

      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);

      console.log('TTS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
    }
  }, []);

  const speak = useCallback(async (text) => {
    if (text == null || text.trim() === '' || isSpeakingRef.current) {
      console.warn('Attempted to speak null or empty text');
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      isSpeakingRef.current = true;
      Tts.speak(text, {
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 1.0,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
        onDone: () => {
          isSpeakingRef.current = false;
          resolve();
        },
        onStart: () => {
          console.log('TTS started');
        },
      });

      Tts.addEventListener('tts-finish', event => {
        isSpeakingRef.current = false;
        resolve(event);
      });

      Tts.addEventListener('tts-error', event => {
        isSpeakingRef.current = false;
        reject(event);
      });
    });
  }, []);

  const stopSpeech = useCallback(() => {
    if (isSpeakingRef.current) {
      Tts.stop();
      isSpeakingRef.current = false;
    }
  }, []);

  useEffect(() => {
    initTts();
    return () => {
      Tts.stop();
      Tts.removeAllListeners();
    };
  }, [initTts]);

  return (
    <SpeechContext.Provider value={{ speak, stopSpeech }}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (context === undefined) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};