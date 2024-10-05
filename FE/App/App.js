import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import DrawerNavigator from './src/navigations/DrawerNavigator';
import {ThemeProvider} from './src/constants/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
