import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StackNavigator from './StackNavigator';
import WelcomeScreen from '../screens/WelcomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingScreen from '../screens/SettingScreen';
import CameraScreen from '../screens/CameraScreen';
import DisplayInform from '../screens/DisplayInform';
import {useTheme} from '../constants/ThemeContext';

const Drawer = createDrawerNavigator();

// 커스텀 드로어 콘텐츠 컴포넌트
const CustomDrawerContent = props => {
  const {colorScheme, toggleTheme} = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={`flex-1 p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <Text
        className={`text-[30px] font-Bold mb-4 ${
          isDark ? 'text-white' : 'text-black'
        }`}>
        메뉴
      </Text>
      <TouchableOpacity
        className={`flex-row items-center p-3 rounded-lg mb-2 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
        onPress={() => props.navigation.navigate('Home')}>
        <Icon name="home" size={24} color={isDark ? '#fff' : '#000'} />
        <Text
          className={`text-[24px] font-Regular ml-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
          홈
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-row items-center p-3 rounded-lg mb-2 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
        onPress={() => props.navigation.navigate('Schedule')}>
        <Icon
          name="notifications-active"
          size={24}
          color={isDark ? '#fff' : '#000'}
        />
        <Text
          className={`text-[24px] font-Regular ml-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
          복용 약 일정
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-row items-center p-3 rounded-lg mb-2 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
        onPress={() => props.navigation.navigate('Camera')}>
        <Icon name="camera-alt" size={24} color={isDark ? '#fff' : '#000'} />
        <Text
          className={`text-[24px] font-Regular ml-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
          카메라
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-row items-center p-3 rounded-lg mb-2 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
        onPress={() => props.navigation.navigate('Help')}>
        <Icon name="help" size={24} color={isDark ? '#fff' : '#000'} />
        <Text
          className={`text-[24px] font-Regular ml-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
          도움말
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-row items-center p-3 rounded-lg mb-2 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
        onPress={() => props.navigation.navigate('Setting')}>
        <Icon name="settings" size={24} color={isDark ? '#fff' : '#000'} />
        <Text
          className={`text-[24px] font-Regular ml-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
          설정
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigator = () => {
  const {colorScheme} = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: isDark ? '#1F2937' : '#f0f0f0',
          width: 250,
        },
      }}>
      <Drawer.Screen name="Main" component={StackNavigator} />
      <Drawer.Screen name="Help" component={WelcomeScreen} />
      <Drawer.Screen name="Schedule" component={ScheduleScreen} />
      <Drawer.Screen name="Camera" component={CameraScreen} />
      <Drawer.Screen name="DisplayInform" component={DisplayInform} />
      <Drawer.Screen name="Setting" component={SettingScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
