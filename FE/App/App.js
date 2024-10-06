import * as React from 'react';
import {useEffect} from 'react';
import {AppState} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import DrawerNavigator from './src/navigations/DrawerNavigator';
import {ThemeProvider} from './src/constants/ThemeContext';
import Tts from 'react-native-tts';

export default function App() {
  useEffect(() => {
    // TTS 초기화
    Tts.setDefaultLanguage('ko-KR');
    Tts.setDefaultRate(0.5);

    // 앱 상태 변화 감지
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        Tts.stop();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // 클린업 함수
    return () => {
      appStateSubscription.remove();
      Tts.stop();
    };
  }, []);

  const handleNavigationStateChange = () => {
    // 네비게이션 상태가 변경될 때마다 TTS를 중지합니다
    Tts.stop();
  };

  return (
    <ThemeProvider>
      <NavigationContainer onStateChange={handleNavigationStateChange}>
        <DrawerNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
