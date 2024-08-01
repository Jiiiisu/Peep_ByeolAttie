import {View, Text, SafeAreaView, TouchableOpacity} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView className="flex-1 flex justify-around bg-default-default">
      <View className="space-y-2">
        <Text
          style={{fontSize: wp(10)}}
          className="text-center font-bold text-orange-default">
          삐약삐약
        </Text>
      </View>
      <TouchableOpacity
        className="bg-orange-default mx-5 p-4 rounded-2xl"
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.7}>
        <Text
          style={{fontSize: wp(6)}}
          className="text-center font-bold text-white">
          시작하기
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
