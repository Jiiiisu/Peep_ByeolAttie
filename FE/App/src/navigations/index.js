import React, {useState, useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HelpScreen from '../screens/HelpScreen';
import SettingScreen from '../screens/SettingScreen';
import CameraScreen from '../screens/CameraScreen';

const Stack = createStackNavigator();

function AppNavigation() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('alreadyLaunched').then(value => {
      if (value === null) {
        AsyncStorage.setItem('alreadyLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) {
    return null; // 또는 로딩 화면을 표시할 수 있습니다.
  }

  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={isFirstLaunch ? 'Welcome' : 'Home'}>
      {isFirstLaunch && (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      )}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Setting" component={SettingScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigation;
