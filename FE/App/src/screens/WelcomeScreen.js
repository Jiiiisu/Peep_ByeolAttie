import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Logo from '../../assets/images/Logo.svg';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const onboardingData = [
    {
      image: require('../../assets/images/Peep(2-1).png'),
      title: '환영합니다',
      description: '우리 앱의 멋진 기능들을 만나보세요.',
    },
    {
      image: require('../../assets/images/Peep(2-1).png'),
      title: '쉽고 빠르게',
      description: '간단한 조작으로 원하는 것을 빠르게 찾아보세요.',
    },
    {
      image: require('../../assets/images/Peep(1-1).png'),
      title: '',
      description: '당신의 스마트 파트너,\n삐약삐약이 도와드릴게요!',
    },
  ];

  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.navigate('Home');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  // Render
  function renderHeader() {
    return (
      <View className="flex-row p-8 items-center z-10">
        <TouchableOpacity
          className="absolute top-5 right-1"
          onPress={handleSkip}>
          <Text className="text-orange-default text-[24px] font-Regular">
            건너뛰기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 px-5 bg-default-1">
      {renderHeader()}
      <View className="flex-1 items-center justify-between p-5">
        <Image
          source={onboardingData[currentPage].image}
          style={{width: wp(100), height: hp(50)}}
          resizeMode="contain"
        />

        <View>
          {onboardingData[currentPage].title && (
            <Text className="text-gray-800 text-[28px] font-ExtraBold mt-8 mb-2 text-center">
              {onboardingData[currentPage].title}
            </Text>
          )}
          {onboardingData[currentPage].description && (
            <Text className="text-[24px] font-Regular mb-8 text-gray-600 text-center">
              {onboardingData[currentPage].description}
            </Text>
          )}
        </View>

        <View className="flex-row mb-5">
          {onboardingData.map((_, index) => (
            <View
              key={index}
              className={`w-2.5 h-2.5 rounded-full bg-gray-200 mx-1 ${
                index === currentPage ? 'bg-orange-default' : ''
              }`}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        className="bg-orange-default p-4 mb-8 rounded-xl"
        onPress={handleNext}
        activeOpacity={0.7}>
        <Text className="text-white text-[24px] font-ExtraBold self-center">
          {currentPage === onboardingData.length - 1 ? '시작하기' : '다음'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
