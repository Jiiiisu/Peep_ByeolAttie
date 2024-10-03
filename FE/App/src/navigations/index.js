import React, {useState, useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingScreen from '../screens/SettingScreen';
import CameraScreen from '../screens/CameraScreen';
import InputScreen1 from '../screens/InputScreen1';
import InputScreen2 from '../screens/InputScreen2';
import AlarmScreen from '../screens/AlarmScreen';
import DisplayInform from '../screens/DisplayInform';
import {Platform} from 'react-native';

const Stack = createStackNavigator();

function AppNavigation() {
  const navigation = useNavigation();
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
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);

        if (notification.userInteraction) {
          // notification.data에서 약 정보 가져오기
          const drugInfo = notification.data || {};

          // TestScreen으로 약 정보를 전달
          navigation.navigate('Alarm', {
            drugName: drugInfo.drugName,
            dosage: drugInfo.dosage,
            time: drugInfo.time,
          });
        }
      },

      requestPermissions: Platform.OS === 'ios',
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
      <Stack.Screen name="Input1" component={InputScreen1} />
      <Stack.Screen name="Input2" component={InputScreen2} />
      <Stack.Screen name="Help" component={WelcomeScreen} />
      <Stack.Screen name="Setting" component={SettingScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Alarm" component={AlarmScreen} />
      <Stack.Screen name="Inform" component={DisplayInform} />
    </Stack.Navigator>
  );
}

export default AppNavigation;
