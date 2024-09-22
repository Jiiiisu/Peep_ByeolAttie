import React, {useState, useEffect} from 'react';
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
import { speak } from './ScheduleVoiceHandler';
import Back from '../../assets/images/Back.svg';
import Close from '../../assets/images/Close.svg';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function InputScreen({route}) {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  useEffect(() => {
    if (route.params?.isVoiceMode) {
      setIsVoiceMode(route.params.isVoiceMode);
    }
    if (route.params?.recognizedDrugName) {
      setName(route.params.recognizedDrugName);
    }
    if (route.params?.recognizedDosage) {
      setDosage(route.params.recognizedDosage);
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
  }, [route.params]);

  const startVoiceInput = async () => {
    await speak('입력된 정보를 확인해 주세요. 약 이름은 ' + name + '이고, 복용량은 1회 ' + dosage + '알입니다. 맞으면 예, 틀리면 아니오라고 말씀해 주세요.');
    startListening();
  };

  const startListening = async () => {
    try {
      await Voice.start('ko-KR');
    } catch (e) {
      console.error('Failed to start voice recognition', e);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e) => {
    if (e.value && e.value.length > 0) {
      const result = e.value[0].toLowerCase();
      if (result.includes('예') || result.includes('네')) {
        handleNext();
      } else if (result.includes('아니오') || result.includes('아니요')) {
        speak('정보를 수정하려면 화면의 입력란을 터치하세요.');
      } else {
        speak('죄송합니다. 다시 한 번 말씀해 주세요.');
        startListening();
      }
    }
  };

  const handleNext = () => {
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
      <View
        className="flex-row p-4 items-center justify-between z-10"
        style={{
          paddingHorizontal: 10,
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Back />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
          <Close />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-default-1">
      {renderHeader()}
      <View className="flex-1 p-5">
        <Text className="text-black text-[24px] font-Regular">1/2</Text>
        <Text className="mb-2 text-black text-[30px] font-ExtraBold">
          약 정보
        </Text>
        <ScrollView className="flex-1 mt-5 space-y-10">
          <View className="space-y-2">
            <Text className="mt-2 text-black text-[24px] font-Regular text-center">
              복용할 약의 이름을 입력해 주세요
            </Text>
            <TextInput
              className="bg-default-2 p-3 rounded-full mt-1 text-center text-black text-[24px] font-ExtraBold"
              value={name}
              onChangeText={setName}
              placeholder="입력해 주세요"
            />
          </View>

          <View className="space-y-2">
            <Text className="mt-2 text-black text-[24px] font-Regular text-center">
              한 번에 복용하는 약의 양을 입력해 주세요
            </Text>
            <View className="flex-row items-center justify-center mt-1">
              <Text className="mt-2 text-black text-[24px] font-Bold text-center">
                1회
              </Text>
              <TextInput
                className="border-2 border-brown-2 rounded p-2 mx-2 w-14 text-center text-black text-[24px] font-ExtraBold"
                value={dosage}
                onChangeText={setDosage}
                keyboardType="numeric"
              />
              <Text className="mt-2 text-black text-[24px] font-Bold text-center">
                알
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="mt-2">
          <TouchableOpacity
            className={`p-4 rounded-xl space-y-2 ${
              !name || !dosage ? 'bg-gray-200' : 'bg-orange-default'
            }`}
            onPress={handleNext}
            disabled={!name || !dosage}>
            <Text className="text-white text-[24px] font-Bold text-center">
              다음
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}