import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, Image, TouchableOpacity, Animated} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const onboardingData = [
    {
      image: require('../../assets/images/Onboarding_First.png'),
      title: '환영합니다',
      description: '약 복용을 더욱 쉽게 도와드릴게요!',
    },
    {
      image: require('../../assets/images/Onboarding_Camera.png'),
      title: '알약 정보 검색',
      description:
        '이제 카메라로 알약을 찍어\n약 정보를 빠르게 검색할 수 있습니다.',
    },
    {
      image: require('../../assets/images/Onboarding_Alarm.png'),
      title: '복용 일정 등록',
      description: '정해진 시간에\n약을 잊지 않고 복용하세요!',
    },
    {
      image: require('../../assets/images/Onboarding_Voice.png'),
      title: '음성 명령',
      description: '모든 기능을 음성 명령으로\n쉽게 이용해보세요.',
    },
    {
      image: require('../../assets/images/Onboarding_Last.png'),
      title: '',
      description: '당신의 스마트 파트너,\n삐약삐약이 도와드릴게요!',
    },
  ];

  const [currentPage, setCurrentPage] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setCurrentPage(0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCurrentPage(0);
    }, []),
  );

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      fadeOut();
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        fadeIn();
      }, 300);
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
        <Animated.Image
          source={onboardingData[currentPage].image}
          style={{width: wp(80), height: hp(50), opacity: fadeAnim}}
          resizeMode="contain"
          className="self-center"
        />

        <View>
          {onboardingData[currentPage].title && (
            <Text className="text-orange-default text-[28px] font-ExtraBold mt-8 mb-2 text-center">
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
