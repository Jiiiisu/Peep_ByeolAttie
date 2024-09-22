import React from 'react';
import {View, Text, SafeAreaView, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';

export default function AlarmScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {drugName, dosage, time} = route.params;

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-default-1 p-4">
      <Text className="text-2xl font-bold mb-5">약 복용 시간입니다</Text>
      <View className="bg-white p-5 rounded-lg w-full mb-5 shadow">
        <Text className="text-lg mb-2">약 이름: {drugName}</Text>
        <Text className="text-lg mb-2">복용량: {dosage}</Text>
        <Text className="text-lg mb-2">복용 시간: {time}</Text>
      </View>
      <TouchableOpacity
        className="bg-orange-default mx-5 p-4 rounded-2xl"
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.7}>
        <Text className="text-center font-bold text-white text-lg">확인</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
