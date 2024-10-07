import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { AppState, BackHandler } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import DrawerNavigator from './src/navigations/DrawerNavigator';
import { ThemeProvider } from './src/constants/ThemeContext';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';

export default function App() {
  const navigationRef = useRef();
  const routeNameRef = useRef();
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);

  const stopTtsAndVoice = useCallback(() => {
    if (isSpeakingRef.current) {
      Tts.stop();
      isSpeakingRef.current = false;
    }
    if (isListeningRef.current) {
      Voice.destroy();
      isListeningRef.current = false;
    }
  }, []);

  useEffect(() => {
    // TTS 초기화
    Tts.setDefaultLanguage('ko-KR');
    Tts.setDefaultRate(0.5);

    Tts.addEventListener('tts-start', () => {
      isSpeakingRef.current = true;
    });
    Tts.addEventListener('tts-finish', () => {
      isSpeakingRef.current = false;
    });
    Tts.addEventListener('tts-cancel', () => {
      isSpeakingRef.current = false;
    });

    Voice.onSpeechStart = () => {
      isListeningRef.current = true;
    };
    Voice.onSpeechEnd = () => {
      isListeningRef.current = false;
    };

    // 앱 상태 변화 감지
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopTtsAndVoice();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // 뒤로가기 버튼 처리
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // 클린업 함수
    return () => {
      appStateSubscription.remove();
      backHandler.remove();
      stopTtsAndVoice();
      Tts.removeAllListeners();
      Voice.removeAllListeners();
    };
  }, [stopTtsAndVoice]);

  const handleBackPress = useCallback(() => {
    if (!navigationRef.current) return false;

    const currentRoute = navigationRef.current.getCurrentRoute();

    stopTtsAndVoice();

    switch (currentRoute.name) {
      case 'Schedule':
        // Schedule 화면에서 홈으로 이동
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home', params: { resetVoice: true } }],
          })
        );
        return true;
      case 'Input2':
        // Input2 화면에서 Input1로 이동
        navigationRef.current.navigate('Input1', { resetVoice: true });
        return true;
      case 'Input1':
        // Input1 화면에서 Schedule로 이동
        navigationRef.current.navigate('Schedule', { resetVoice: true });
        return true;
      default:
        return false;
    }
  }, [stopTtsAndVoice]);

  const handleNavigationStateChange = useCallback((state) => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current.getCurrentRoute().name;

    if (previousRouteName !== currentRouteName) {
      stopTtsAndVoice();

      // 화면 전환 시 상태 초기화
      if (currentRouteName === 'Home') {
        // 홈 화면으로 돌아갈 때 네비게이션 스택 초기화
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home', params: { resetVoice: true } }],
          })
        );
      }

      // 화면별 초기화 로직
      switch (currentRouteName) {
        case 'Home':
          // HomeScreen 초기화 로직
          navigationRef.current.setParams({ resetVoice: true });
          break;
        case 'Schedule':
          // ScheduleScreen 초기화 로직
          navigationRef.current.setParams({ resetVoice: true });
          break;
        case 'Input1':
        case 'Input2':
          // InputScreen 초기화 로직
          navigationRef.current.setParams({ resetVoice: true });
          break;
        // 다른 화면들에 대한 초기화 로직 추가
      }
    }

    routeNameRef.current = currentRouteName;
  }, [stopTtsAndVoice]);

  return (
    <ThemeProvider>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={handleNavigationStateChange}
        onReady={() => {
          routeNameRef.current = navigationRef.current.getCurrentRoute().name;
        }}
      >
        <DrawerNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}