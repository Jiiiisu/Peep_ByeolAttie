import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HelpScreen from '../screens/HelpScreen';
import SettingScreen from '../screens/SettingScreen';
import CameraScreen from '../screens/CameraScreen';

const Stack = createStackNavigator();

function AppNavigation() {
  console.log(Stack);
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Setting" component={SettingScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigation;
