import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, TouchableOpacity, Animated, Platform} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {request, PERMISSIONS, RESULTS, check} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {speak} from './ScheduleVoiceHandler';

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

  const requestPermissions = async () => {
    const permissions = [
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
    ];

    if (Platform.Version >= 33) {
      permissions.push(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    } else {
      permissions.push(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      permissions.push(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
    }

    try {
      for (const permission of permissions) {
        const status = await check(permission);
        console.log(`${permission} status: ${status}`);

        if (status !== RESULTS.GRANTED) {
          await request(permission);
        }
      }
    } catch (error) {
      console.error('권한 요청 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCurrentPage(0);
      startSpeak(0);
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

  const startSpeak = async page => {
    if (page < 1) {
      const fullText = `${onboardingData[page].title} ${onboardingData[page].description}`;
      speak(fullText);
    } else {
      const fullText = `${onboardingData[page].description}`;
      speak(fullText);
    }
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      fadeOut();
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        fadeIn();
      }, 300);
      startSpeak(currentPage + 1);
    } else {
      requestPermissions();
      AsyncStorage.setItem('alreadyLaunched', 'true');
      navigation.navigate('Home');
    }
  };

  // Render
  function renderHeader() {
    return (
      <View className="top-0 left-0 right-0 flex-row items-center justify-center my-8 z-10">
        {onboardingData.map((_, index) => (
          <View
            key={index}
            className={`w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 mx-1 ${
              index === currentPage
                ? 'bg-orange-default dark:bg-orange-600'
                : ''
            }`}
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 px-5 bg-default-1 dark:bg-neutral-900">
      {renderHeader()}
      <View className="flex-1 items-center justify-around p-5">
        <Animated.Image
          source={onboardingData[currentPage].image}
          style={{width: wp(80), height: hp(50), opacity: fadeAnim}}
          resizeMode="contain"
          className="self-center"
        />

        <View>
          {onboardingData[currentPage].title && (
            <Text
              className="text-orange-default dark:text-orange-600 text-[28px] font-ExtraBold mb-2 text-center"
              accessible={false}
              importantForAccessibility="no">
              {onboardingData[currentPage].title}
            </Text>
          )}
          {onboardingData[currentPage].description && (
            <Text
              className="text-[24px] font-Regular text-gray-600 mb-5 dark:text-gray-300 text-center"
              accessible={false}
              importantForAccessibility="no">
              {onboardingData[currentPage].description}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        className="bg-orange-default dark:bg-orange-600 p-4 mb-8 rounded-xl"
        onPress={handleNext}
        activeOpacity={0.7}
        accessibilityLabel={
          currentPage === onboardingData.length - 1 ? '시작하기' : '다음'
        }
        accessibilityHint={
          currentPage === onboardingData.length - 1
            ? '삐약삐약 앱 사용을 시작합니다'
            : '다음 페이지로 이동합니다'
        }>
        <Text
          className="text-white text-[24px] font-ExtraBold self-center"
          accessible={false}>
          {currentPage === onboardingData.length - 1 ? '시작하기' : '다음'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
