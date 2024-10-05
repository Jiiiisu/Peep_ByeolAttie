import React, {useState} from 'react';
import {View, Text, Switch, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../constants/ThemeContext';

export default function SettingScreen() {
  const navigation = useNavigation();

  const {colorScheme, toggleTheme} = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(!isEnabled);

  // Render
  function renderHeader() {
    return (
      <View className="flex-row mt-4 px-2 items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          accessible={true}
          accessibilityLabel="뒤로 가기"
          accessibilityHint="홈 화면으로 돌아갑니다">
          <Icon
            name="navigate-before"
            size={30}
            color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
        <Text
          className="text-black dark:text-white text-[24px] font-Regular ml-3"
          accessible={false}>
          설정
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-default-1 dark:bg-neutral-900">
      {renderHeader()}
      <View className="flex-row justify-between items-center p-5">
        <Text
          className="text-[24px] font-Regular dark:text-white"
          accessible={true}>
          다크 모드 사용
        </Text>
        <Switch
          trackColor={{false: '#767577', true: '#FF9F23'}}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          value={colorScheme === 'dark'}
          onValueChange={toggleTheme}
          accessibilityLabel="다크 모드 사용 여부 설정"
          accessibilityHint={'다크 모드 기능을 켜거나 끕니다.'}
          style={{transform: [{scaleX: 1.2}, {scaleY: 1.2}]}}
        />
      </View>
    </View>
  );
}
