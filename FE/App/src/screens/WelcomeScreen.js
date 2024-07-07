import {View, Text, SafeAreaView} from 'react-native';
import React from 'react';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView>
      {/* tailwindcss 사용 안 되는 문제 발생, 문제 해결되면 UI 추가 */}
      <View>
        <Text>삐약삐약</Text>
      </View>
      <TouchableOpacity>
        <Text>시작하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
