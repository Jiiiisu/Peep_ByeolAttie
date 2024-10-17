import * as React from 'react';
import {useEffect, useRef, useCallback} from 'react';
import {AppState, BackHandler} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {CommonActions} from '@react-navigation/native';
import DrawerNavigator from './src/navigations/DrawerNavigator';
import {ThemeProvider} from './src/constants/ThemeContext';
import {SpeechProvider} from './src/constants/SpeechContext';
import Voice from '@react-native-voice/voice';

export default function App() {
  const navigationRef = useRef();
  const routeNameRef = useRef();
  const isListeningRef = useRef(false);

  const stopVoice = useCallback(() => {
    if (isListeningRef.current) {
      Voice.destroy();
      isListeningRef.current = false;
    }
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = () => {
      isListeningRef.current = true;
    };
    Voice.onSpeechEnd = () => {
      isListeningRef.current = false;
    };

    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopVoice();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => {
      appStateSubscription.remove();
      backHandler.remove();
      stopVoice();
      Voice.removeAllListeners();
    };
  }, [stopVoice]);

  const handleBackPress = useCallback(() => {
    if (!navigationRef.current) return false;

    const currentRoute = navigationRef.current.getCurrentRoute();

    stopVoice();

    switch (currentRoute.name) {
      case 'Schedule':
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Home', params: {resetVoice: true}}],
          }),
        );
        return true;
      case 'Input2':
        navigationRef.current.navigate('Input1', {resetVoice: true});
        return true;
      case 'Input1':
        navigationRef.current.navigate('Schedule', {resetVoice: true});
        return true;
      default:
        return false;
    }
  }, [stopVoice]);

  const handleNavigationStateChange = useCallback(
    state => {
      const previousRouteName = routeNameRef.current;
      const currentRouteName = navigationRef.current.getCurrentRoute().name;

      if (previousRouteName !== currentRouteName) {
        stopVoice();

        if (currentRouteName === 'Home') {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'Home', params: {resetVoice: true}}],
            }),
          );
        }

        switch (currentRouteName) {
          case 'Home':
          case 'Schedule':
          case 'Input1':
          case 'Input2':
            navigationRef.current.setParams({resetVoice: true});
            break;
        }
      }

      routeNameRef.current = currentRouteName;
    },
    [stopVoice],
  );

  return (
    <ThemeProvider>
      <SpeechProvider>
        <NavigationContainer
          ref={navigationRef}
          onStateChange={handleNavigationStateChange}
          onReady={() => {
            routeNameRef.current = navigationRef.current.getCurrentRoute().name;
          }}>
          <DrawerNavigator />
        </NavigationContainer>
      </SpeechProvider>
    </ThemeProvider>
  );
}