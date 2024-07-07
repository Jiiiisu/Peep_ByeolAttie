import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

function AppNavigation() {
  console.log(Stack);
  return (
    <Stack.Navigator screenOptions={{}} initialRouteName="Welcome">
      {/*<Stack.Screen name="Welcome" component={WelcomeScreen} />*/}
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigation;
