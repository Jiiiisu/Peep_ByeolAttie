import {View, Text, SafeAreaView, TouchableOpacity, Image} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Logo from '../../assets/images/Logo.svg';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView
      className="flex-1 flex justify-around bg-default-1
  ">
      <View className="space-y-4">
        <Logo height={hp(7)} />
        <View>
          <Text className="text-center font-bold text-black font-Regular text-[20px]">
            당신의 스마트 파트너,
          </Text>
          <Text className="text-center font-bold text-black font-Regular text-[20px]">
            삐약삐약이 도와드릴게요!
          </Text>
        </View>
      </View>
      <View className="items-center">
        <Image
          source={require('../../assets/images/Peep(1-1).png')}
          style={{width: wp(45), height: hp(30)}}
        />
      </View>
      <TouchableOpacity
        className="bg-orange-default mx-5 p-4 rounded-2xl"
        onPress={() => navigation.replace('Home')}
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
