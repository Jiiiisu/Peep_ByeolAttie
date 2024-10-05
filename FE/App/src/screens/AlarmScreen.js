import React, {useEffect} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {speak} from './ScheduleVoiceHandler';
import {useTheme} from '../constants/ThemeContext';

export default function AlarmScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {drugName, dosage, time} = route.params;
  const {colorScheme, toggleTheme} = useTheme();

  useEffect(() => {
    startSpeak();
  }, []);

  const startSpeak = async () => {
    const fullText = `${drugName} 복용 시간입니다!
    ${dosage} 복용하세요.
    복용하셨다면 복용 완료 버튼을 눌러주세요.`;
    speak(fullText);
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-default-1 dark:bg-neutral-900 p-8">
      <Text
        className="text-[30px] font-ExtraBold mb-3 text-gray-800 dark:text-white"
        accessible={false}>
        {drugName} 복용 시간입니다!
      </Text>
      <View
        className="bg-white dark:bg-gray-800 p-5 rounded-lg w-full mb-5 shadow"
        accessible={false}>
        <View className="flex-row">
          <Icon
            name="alarm"
            size={30}
            color={colorScheme === 'dark' ? '#ffffff' : '#EA580C'}
          />
          <Text
            className="text-[30px] font-ExtraBold text-orange-default dark:text-orange-600 pl-2"
            accessible={false}>
            {time}
          </Text>
        </View>

        <View className="border-b-2 border-b-orange-default dark:border-b-orange-600 mt-3 mb-3" />
        <View className="rounded-lg w-full pb-2">
          <Text
            className="text-[28px] font-ExtraBold mb-2 text-gray-600 dark:text-gray-300"
            accessible={false}>
            {drugName}
          </Text>
          <Text
            className="text-[26px] font-Bold mb-2 text-gray-600 dark:text-gray-300"
            accessible={false}>
            {dosage}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-orange-default dark:bg-orange-600 p-4 rounded-2xl"
          onPress={() => BackHandler.exitApp()}
          activeOpacity={0.7}
          accessibilityLabel="복용 완료"
          accessibilityHint="이 버튼을 눌러서 화면을 종료합니다.">
          <Text
            className="text-white text-[24px] font-ExtraBold self-center"
            accessible={false}>
            복용 완료
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
