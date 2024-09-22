import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import { getImage } from '../DL/modelService';

export default function Features() {
  const navigation = useNavigation();
  return (
    <View className="space-y-2">
      <TouchableOpacity
        onPress={() => {getImage();}}
        className="bg-orange-50 p-4 rounded-xl space-y-2">
        <View className="flex-row items-center space-x-1">
          {/* 아이콘 추가 */}
          <Text
            style={{fontSize: wp(4.8)}}
            className="font-semibold text-gray-700">
            딥러닝 테스트
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Camera')}
        className="bg-orange-50 p-4 rounded-xl space-y-2">
        <View className="flex-row items-center space-x-1">
          {/* 아이콘 추가 */}
          <Text
            style={{fontSize: wp(4.8)}}
            className="font-semibold text-gray-700">
            카메라 테스트
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Schedule')}
        className="bg-orange-100 p-4 rounded-xl space-y-2">
        <View className="flex-row items-center space-x-1">
          {/* 아이콘 추가 */}
          <Text
            style={{fontSize: wp(4.8)}}
            className="font-semibold text-gray-700">
            복용 약 일정
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Help')}
        className="bg-orange-200 p-4 rounded-xl space-y-2">
        <View className="flex-row items-center space-x-1">
          {/* 아이콘 추가 */}
          <Text
            style={{fontSize: wp(4.8)}}
            className="font-semibold text-gray-700">
            도움말
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Setting')}
        className="bg-orange-300 p-4 rounded-xl space-y-2">
        <View className="flex-row items-center space-x-1">
          {/* 아이콘 추가 */}
          <Text
            style={{fontSize: wp(4.8)}}
            className="font-semibold text-gray-700">
            설정
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
