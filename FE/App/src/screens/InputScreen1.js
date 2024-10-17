import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../constants/ThemeContext';
import {useSpeech} from '../constants/SpeechContext';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function InputScreen({route}) {
  const navigation = useNavigation();
  const {colorScheme, toggleTheme} = useTheme();
  const {speak, stopSpeech} = useSpeech();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  useFocusEffect(
    useCallback(() => {
      const onFocus = () => {
        if (route.params?.resetInputs) {
          setName('');
          setDosage('');
          setCurrentStep('name');
        } else if (route.params?.name && route.params?.dosage) {
          setName(route.params.name);
          setDosage(route.params.dosage);
        }
        setIsVoiceMode(route.params?.isVoiceMode || false);
        initializeScreen();
      };

      onFocus();

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
        stopSpeech();
      };
    }, [route.params, stopSpeech]),
  );

  useEffect(() => {
    // 상태가 변경될 때마다 AsyncStorage에 저장
    const saveState = async () => {
      await AsyncStorage.setItem('inputName', name);
      await AsyncStorage.setItem('inputDosage', dosage);
    };
    saveState();
  }, [name, dosage]);

  // useEffect(() => {
  //   if (isVoiceMode && currentStep) {
  //     startVoiceInput();
  //   }
  // }, [isVoiceMode, currentStep]);
  useEffect(() => {
    initializeScreen();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isVoiceMode, currentStep]);

  const initializeScreen = async () => {
    if (route.params?.editItem) {
      const {name, dosage} = route.params.editItem;
      setName(name);
      const match = dosage.match(/1회 (\d+)알/);
      if (match) {
        setDosage(match[1]);
      }
    }

    await initVoice();

    if (route.params?.isVoiceMode) {
      startVoiceInput();
      //setCurrentStep('name');
    }
  };

  const initVoice = async () => {
    try {
      await Voice.destroy();
      await Voice.removeAllListeners();
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
    } catch (e) {
      console.error('Failed to init Voice module', e);
    }
  };

  const startVoiceInput = async () => {
    if (currentStep === 'name') {
      setTimeout(async () => {
        await speak('복용할 약의 이름을 말씀해 주세요.');
        startListening();
      }, 2000);
    } else if (currentStep === 'dosage') {
      setTimeout(async () => {
        await speak('한 번에 복용하는 약의 양을 말씀해 주세요.');
        startListening();
      }, 2000);
    } else if (currentStep === 'confirmation') {
      setTimeout(async () => {
        await speak(
          `입력된 정보를 확인해 주세요. 약 이름은 ${name}이고, 복용량은 1회 ${dosage}알입니다. 맞으면 맞아요, 틀리면 아니오라고 말씀해 주세요.`,
        );
        startListening();
      }, 2000);
    }
  };

  const startListening = async () => {
    try {
      await Voice.start('ko-KR');
    } catch (e) {
      console.error('Failed to start voice recognition', e);
    }
  };

  const onSpeechResults = async e => {
    if (e.value && e.value.length > 0) {
      const result = e.value[0].toLowerCase();
      console.log('Recognized speech:', result);
      handleVoiceInput(result);
    }
  };

  const onSpeechError = async e => {
    console.error('Speech recognition error:', e);
    if (e.error.code === '7' || e.error.code === '5') {
      console.log('No speech input detected. Restarting voice recognition.');
      ToastAndroid.show(
        '죄송합니다. 다시 한 번 말씀해 주세요.',
        ToastAndroid.SHORT,
      );
      console.log('No speech results');
      await speak('음성이 인식되지 않았습니다. 다시 말씀해 주세요.');
      await startVoiceInput();
    } else {
      //speak('음성 인식에 문제가 발생했습니다. 다시 시도합니다.');
      ToastAndroid.show(
        '음성 인식 중 문제가 발생했습니다. 다시 시도합니다.',
        ToastAndroid.SHORT,
      );
      await startVoiceInput();
    }
  };

  const handleVoiceInput = useCallback(
    input => {
      switch (currentStep) {
        case 'name':
          handleNameInput(input);
          break;
        case 'dosage':
          handleDosageInput(input);
          break;
        case 'confirmation':
          handleConfirmation(input);
          break;
      }
    },
    [currentStep],
  );

  const handleNameInput = input => {
    if (input.length > 0) {
      console.log('약 이름을 입력받았습니다. 다음 질문으로 넘어갑니다');
      setName(input);
      setCurrentStep('dosage');
      //setTimeout(() => startVoiceInput(), 1000);
    } else {
      speak('인식된 약 이름이 없습니다. 약 이름을 다시 말씀해 주세요.');
      setTimeout(() => startListening(), 3000);
    }
  };

  const handleDosageInput = input => {
    let dosage = input.replace(/[^가-힣0-9\s]/g, ''); //const상수 타입으로 지정하면 TypeError: "dosage" is read-only오류 발생

    // 한국어 숫자를 아라비아 숫자로 변환하는 함수
    const koreanToArabic = koreanNumber => {
      const koreanNumbers = {
        영: 0,
        하나: 1,
        한: 1,
        반: 1,
        둘: 2,
        두: 2,
        무: 2,
        부: 2,
        셋: 3,
        세: 3,
        넷: 4,
        네: 4,
        내: 4,
        다섯: 5,
        다서: 5,
        여섯: 6,
        여서: 6,
        녀서: 6,
        일곱: 7,
        여덟: 8,
        여덜: 8,
        아홉: 9,
        열: 10,
      };

      return koreanNumbers[koreanNumber] || koreanNumber; // 해당하지 않는 값은 그대로 반환
    };
    // 복용량 문자열에서 한국어 숫자를 찾아 변환
    dosage = dosage.replace(
      /(영|하나|한|둘|두|셋|세|넷|네|다섯|여섯|일곱|여덟|아홉|열)/g,
      match => {
        return koreanToArabic(match);
      },
    );

    // '개','계', '게', '알' 앞의 숫자만 남김. 발음이 계,게 로 인식될 수도 있기 때문
    dosage = dosage.replace(/개|계|게|알|활/g, ''); // 개, 알 모두 '알'로 처리 or 필터링 ''
    console.log('변환된 dosage: ', dosage);

    if (dosage.length > 0) {
      console.log(
        '복용할 약의 갯수를 입력받았습니다. 확인 질문으로 넘어갑니다',
      );
      setDosage(dosage);
      setCurrentStep('confirmation');
      //setTimeout(() => startVoiceInput(), 1000);
    } else {
      speak(
        '인식된 약 갯수가 없습니다. 복용할 약의 갯수를 다시 말씀해 주세요.',
      );
      setTimeout(() => startListening(), 3000);
    }
    //startVoiceInput();
  };

  const handleConfirmation = async input => {
    if (
      input.includes('맞아요') ||
      input.includes('네') ||
      input.includes('예')
    ) {
      handleNext();
    } else if (
      input.includes('아니오') ||
      input.includes('아니') ||
      input.includes('노')
    ) {
      setCurrentStep('name');
      //startVoiceInput();
    } else {
      await speak('맞아요 또는 아니오로 대답해 주세요.')
        .then(() => {
          startListening();
        })
        .catch(error => {
          console.error('speak error:', error);
        });
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Failed to stop voice recognition', e);
    }
  };

  const handleNext = () => {
    //stopListening(); //handleNext()호출하는 onSpeechResults()함수에서 stopListening()호출 했음.
    navigation.navigate('Input2', {
      name,
      dosage,
      editItem: route.params?.editItem,
      editIndex: route.params?.editIndex,
      isVoiceMode,
    });
  };

  // Render
  function renderHeader() {
    return (
      <View className="flex-row mt-8 px-4 items-center justify-end z-10">
        <TouchableOpacity
          onPress={() => navigation.navigate('Schedule')}
          accessibilityLabel="닫기"
          accessibilityHint="현재 화면을 닫고 일정 목록 화면으로 이동합니다"
          accessibilityOrder={2}>
          <Icon
            name="close"
            size={30}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-default-1 dark:bg-neutral-900">
      {renderHeader()}
      <View className="flex-1 p-5">
        <Text
          className="text-black dark:text-white text-[24px] font-Regular"
          accessible={false}
          importantForAccessibility="no">
          1/2
        </Text>
        <Text
          className="mb-2 text-black dark:text-white text-[30px] font-ExtraBold"
          accessible={false}
          importantForAccessibility="no">
          약 정보
        </Text>
        <ScrollView
          className="flex-1 mt-5 space-y-10"
          accessible={false}
          importantForAccessibility="no">
          <View
            className="space-y-2"
            accessible={false}
            importantForAccessibility="no">
            <Text
              className="mt-2 text-black dark:text-white text-[24px] font-Regular text-center"
              accessible={false}
              importantForAccessibility="no">
              복용할 약의 이름을 입력해 주세요
            </Text>
            <TextInput
              className="bg-default-2 dark:bg-gray-700 p-3 rounded-full mt-1 text-center text-black dark:text-white text-[24px] font-ExtraBold"
              value={name}
              accessible={false}
              importantForAccessibility="no"
              onChangeText={setName}
              placeholder="입력해 주세요"
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
            />
          </View>

          <View className="space-y-2" accessible={false}>
            <Text
              className="mt-2 text-black dark:text-white text-[24px] font-Regular text-center"
              accessible={false}
              importantForAccessibility="no">
              한 번에 복용하는 약의 양을 입력해 주세요
            </Text>
            <View
              className="flex-row items-center justify-center mt-1"
              accessible={false}>
              <Text
                className="mt-2 text-black dark:text-white text-[24px] font-Bold text-center"
                accessible={false}
                importantForAccessibility="no">
                1회
              </Text>
              <TextInput
                className="border-2 border-brown-2 dark:border-gray-600 rounded p-2 mx-2 w-14 text-center text-black dark:text-white text-[24px] font-ExtraBold"
                value={dosage}
                onChangeText={setDosage}
                keyboardType="numeric"
                accessible={false}
                importantForAccessibility="no"
              />
              <Text
                className="mt-2 text-black dark:text-white text-[24px] font-Bold text-center"
                accessible={false}
                importantForAccessibility="no">
                알
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="mt-2">
          <TouchableOpacity
            className={`p-4 rounded-xl space-y-2 ${
              !name || !dosage
                ? 'bg-gray-200 dark:bg-gray-700'
                : 'bg-orange-default dark:bg-orange-600'
            }`}
            onPress={handleNext}
            disabled={!name || !dosage || isVoiceMode}
            accessibilityOrder={1}
            accessible={true}
            accessibilityLabel="다음"
            accessibilityHint="모든 정보를 입력한 후 다음으로 넘어갈 수 있습니다.">
            <Text
              className="text-white text-[24px] font-Bold text-center"
              accessible={false}>
              다음
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
