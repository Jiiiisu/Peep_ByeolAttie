import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import DrawerNavigator from './src/navigations/DrawerNavigator';
import {TTSProvider} from './src/constants/TTSContext';

export default function App() {
  return (
    <TTSProvider>
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </TTSProvider>
  );
}
