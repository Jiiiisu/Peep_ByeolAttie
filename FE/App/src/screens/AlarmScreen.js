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
import {useTTS} from '../constants/TTSContext';

export default function AlarmScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {drugName, dosage, time} = route.params;
  const {isTTSEnabled} = useTTS();

  useEffect(() => {
    if (isTTSEnabled) {
      startSpeak();
    }
  }, [isTTSEnabled]);

  const startSpeak = async () => {
    const fullText = `${drugName} 복용 시간입니다!
    ${dosage} 복용하세요.
    복용하셨다면 버튼을 눌러주세요.`;
    speak(fullText);
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-default-1 p-8">
      <Text className="text-[30px] font-ExtraBold mb-3 text-gray-800">
        {drugName} 복용 시간입니다!
      </Text>
      <View className="bg-white p-5 rounded-lg w-full mb-5 shadow">
        <View className="flex-row">
          <Icon name="alarm" size={30} color="#FF9F23" />
          <Text className="text-[30px] font-ExtraBold text-orange-default pl-2">
            {time}
          </Text>
        </View>

        <View className="border-b-2 border-b-orange-default mt-3 mb-3" />
        <View className="rounded-lg w-full pb-2">
          <Text className="text-[28px] font-ExtraBold mb-2 text-gray-600">
            {drugName}
          </Text>
          <Text className="text-[26px] font-Bold mb-2 text-gray-600">
            {dosage}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-orange-default p-4 rounded-2xl"
          onPress={() => BackHandler.exitApp()}
          activeOpacity={0.7}>
          <Text className="text-white text-[24px] font-ExtraBold self-center">
            먹었어요
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
