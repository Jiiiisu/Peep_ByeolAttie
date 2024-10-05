import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useRoute} from '@react-navigation/native';
import Voice from '@react-native-voice/voice';
import {speak} from './ScheduleVoiceHandler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../constants/ThemeContext';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function InputScreen({route}) {
  const navigation = useNavigation();
  const {colorScheme, toggleTheme} = useTheme();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentStep, setCurrentStep] = useState('name');

  useEffect(() => {
    // if (route.params?.name) {
    //   setName(route.params.name);
    // } else setName('');
    
    // if (route.params?.dosage) {
    //   setDosage(route.params.dosage);
    // } else setDosage('');

    if (route.params?.isVoiceMode) {
      setIsVoiceMode(route.params.isVoiceMode);
    }
    if (route.params?.editItem) {
      const {name, dosage} = route.params.editItem;
      setName(name);
      const match = dosage.match(/1회 (\d+)알/);
      if (match) {
        setDosage(match[1]);
      } else {
        setDosage('');
      }
    }

    if (isVoiceMode) {
      startVoiceInput();
    }

    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [route.params, isVoiceMode, currentStep]);

  const startVoiceInput = async () => {
    if (currentStep === 'name') {
      await speak('복용할 약의 이름을 말씀해 주세요.')
        .then(() => {
          //speak내용이 실행이 되지 않아서 speak함수 호출 후 바로 startListening을 호출한 것이 원인일 수 있음.
          startListening();
        })
        .catch(error => {
          console.error('speak error:', error);
        });
    } else if (currentStep === 'dosage') {
      await speak('한 번에 복용하는 약의 양을 말씀해 주세요.')
        .then(() => {
          startListening();
        })
        .catch(error => {
          console.error('speak error:', error);
        });
    } else if (currentStep === 'confirmation') {
      await speak(
        `입력된 정보를 확인해 주세요. 약 이름은 ${name}이고, 복용량은 1회 ${dosage}알입니다. 맞으면 맞아요, 틀리면 아니오라고 말씀해 주세요.`,
      )
        .then(() => {
          startListening();
        })
        .catch(error => {
          console.error('speak error:', error);
        });
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

  const handleVoiceInput = input => {
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
  };

  const handleNameInput = input => {
    setName(input);
    setCurrentStep('dosage');
    //startVoiceInput();
  };

  const handleDosageInput = input => {
    let dosage = input.replace(/[^가-힣0-9\s]/g, ''); //const상수 타입으로 지정하면 TypeError: "dosage" is read-only오류 발생

    // 한국어 숫자를 아라비아 숫자로 변환하는 함수
    const koreanToArabic = koreanNumber => {
      const koreanNumbers = {
        영: 0,
        하나: 1,
        한: 1,
        둘: 2,
        두: 2,
        무: 2,
        셋: 3,
        세: 3,
        넷: 4,
        네: 4,
        다섯: 5,
        여섯: 6,
        일곱: 7,
        여덟: 8,
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
    dosage = dosage.replace(/개|계|게|알/g, ''); // 개, 알 모두 '알'로 처리 or 필터링 ''
    console.log('변환된 dosage: ', dosage);

    setDosage(dosage);
    setCurrentStep('confirmation');
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
      <View className="flex-row mt-8 px-4 items-center justify-between z-10">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            name="navigate-before"
            size={30}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
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
          accessible={false}>
          1/2
        </Text>
        <Text
          className="mb-2 text-black dark:text-white text-[30px] font-ExtraBold"
          accessible={false}>
          약 정보
        </Text>
        <ScrollView className="flex-1 mt-5 space-y-10">
          <View className="space-y-2">
            <Text
              className="mt-2 text-black dark:text-white text-[24px] font-Regular text-center"
              accessible={false}>
              복용할 약의 이름을 입력해 주세요
            </Text>
            <TextInput
              className="bg-default-2 dark:bg-gray-700 p-3 rounded-full mt-1 text-center text-black dark:text-white text-[24px] font-ExtraBold"
              value={name}
              onChangeText={setName}
              placeholder="입력해 주세요"
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
              accessible={false}
            />
          </View>

          <View className="space-y-2">
            <Text
              className="mt-2 text-black dark:text-white text-[24px] font-Regular text-center"
              accessible={false}>
              한 번에 복용하는 약의 양을 입력해 주세요
            </Text>
            <View className="flex-row items-center justify-center mt-1">
              <Text
                className="mt-2 text-black dark:text-white text-[24px] font-Bold text-center"
                accessible={false}>
                1회
              </Text>
              <TextInput
                className="border-2 border-brown-2 dark:border-gray-600 rounded p-2 mx-2 w-14 text-center text-black dark:text-white text-[24px] font-ExtraBold"
                value={dosage}
                onChangeText={setDosage}
                keyboardType="numeric"
                accessible={false}
              />
              <Text
                className="mt-2 text-black dark:text-white text-[24px] font-Bold text-center"
                accessible={false}>
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
            disabled={!name || !dosage}
            accessible={false}>
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
