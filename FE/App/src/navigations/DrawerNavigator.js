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

const Drawer = createDrawerNavigator();

// 커스텀 드로어 콘텐츠 컴포넌트
const CustomDrawerContent = props => {
  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">메뉴</Text>
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-lg mb-2"
        onPress={() => props.navigation.navigate('Home')}>
        <Icon name="home" size={24} color="#000" />
        <Text className="text-lg ml-4">홈</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-lg mb-2"
        onPress={() => props.navigation.navigate('Schedule')}>
        <Icon name="schedule" size={24} color="#000" />
        <Text className="text-lg ml-4">복용 약 일정</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-lg mb-2"
        onPress={() => props.navigation.navigate('Camera')}>
        <Icon name="camera" size={24} color="#000" />
        <Text className="text-lg ml-4">카메라 테스트</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-lg mb-2"
        onPress={() => props.navigation.navigate('DisplayInform')}>
        <Icon name="book" size={24} color="#000" />
        <Text className="text-lg ml-4">약 정보 테스트</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-lg mb-2"
        onPress={() => props.navigation.navigate('Help')}>
        <Icon name="help" size={24} color="#000" />
        <Text className="text-lg ml-4">도움말</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-lg mb-2"
        onPress={() => props.navigation.navigate('Setting')}>
        <Icon name="settings" size={24} color="#000" />
        <Text className="text-lg ml-4">설정</Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: '#f0f0f0',
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
