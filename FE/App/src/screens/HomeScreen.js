import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Image,
  Text,
  PermissionsAndroid,
  Platform,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import {ScrollView, TouchableOpacity} from 'react-native-gesture-handler';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {SafeAreaView} from 'react-native-safe-area-context';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {initTts, speak} from './ScheduleVoiceHandler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Logo from '../../assets/images/Logo.svg';
import Recording from '../../assets/images/Recording.svg';
import RecordingDark from '../../assets/images/Recording(Dark).svg';
import Stop from '../../assets/images/Stop.svg';
import StopDark from '../../assets/images/Stop(Dark).svg';
import {useTheme} from '../constants/ThemeContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [results, setResults] = useState([]);
  const [assistantResponse, setText] = useState('');
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const voiceInitialized = useRef(false);
  const [cancelledFromSchedule, setCancelledFromSchedule] = useState(false); //'취소' 후 다시 시작할 때의 동작을 위한 상태변수
  const {colorScheme, toggleTheme} = useTheme();

  const resetVoiceState = useCallback(() => {
    setRecording(false);
    setIsTtsSpeaking(false);
    Tts.stop();
    Voice.stop();
  }, []);

  const initVoice = useCallback(async () => {
    try {
      await Voice.destroy();
      await Voice.removeAllListeners();
      await Voice.isAvailable();
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      voiceInitialized.current = true;
    } catch (e) {
      console.error('Failed to initialize Voice module', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const resetVoice = route.params?.resetVoice ?? false;
      const cancelledFromSchedule =
        route.params?.cancelledFromSchedule ?? false;

      if (resetVoice) {
        resetHomeScreen();
        if (cancelledFromSchedule) {
          setCancelledFromSchedule(true);
          // // 스케줄 취소 후 돌아왔을 때 새로운 음성 인식 세션 시작
          // setTimeout(() => {
          //   initVoice();
          //   startListening();
          // }, 1000);
        } else {
          setRecording(false); // 취소가 아닌 경우에도 recording 상태 초기화
        }
        // 파라미터를 사용한 후에는 초기화해주는 것이 좋습니다.
        navigation.setParams({
          resetVoice: undefined,
          cancelledFromSchedule: undefined,
        });
      }

      const onBackPress = () => {
        if (messages.length > 0) {
          resetHomeScreen();
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        //resetVoiceState(); //계속 오류 5,7 발생해서 과부화 걸림
        // 화면에서 벗어날 때 정리 작업
        Voice.destroy().then(Voice.removeAllListeners);
        Tts.stop();
      };
    }, [
      route.params,
      navigation,
      resetHomeScreen,
      initVoice,
      startListening,
      messages,
    ]),
  );

  const resetHomeScreen = useCallback(() => {
    setMessages([]);
    setResults([]);
    setRecording(false);
    setCancelledFromSchedule(false);
    resetVoiceState();
  }, [resetVoiceState]);

  useEffect(() => {
    const setup = async () => {
      await initVoice();
      await requestMicrophonePermission();
      await initTts(); //Tts 초기화
    };
    setup();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      Tts.stop();
    };
  }, [initVoice]);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message:
              'This app needs access to your microphone for speech recognition.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Microphone permission granted');
        } else {
          console.log('Microphone permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const onSpeechStart = e => {
    console.log('onSpeechStart', e);
    setRecording(true);
  };

  const onSpeechEnd = e => {
    console.log('onSpeechEnd', e);
    setRecording(false);
  };

  const onSpeechError = e => {
    console.error('Speech recognition error:', e);
    if (e.error.code === '5' || e.error.code === '7') {
      console.log('Client side error. Restarting voice recognition.');
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          '음성 인식 중 문제가 발생했습니다. 다시 시도합니다.',
          ToastAndroid.SHORT,
        );
      }
      setTimeout(startListening, 1000); // 자동으로 다시 시작
    }
    setMessages(prevMessages => [
      ...prevMessages,
      {role: 'system', content: `Error: ${e.error.message}`},
    ]);
    setRecording(false); // 에러 발생 시 recording 상태 리셋
    //Alert.alert('Speech Recognition Error', `Error: ${e.error.message}`); //확인창 팝업해서 일일이 클릭해야 해서 제외함
  };

  const onSpeechResults = async e => {
    console.log('onSpeechResults: ', e);
    // 음성 인식 결과를 메시지에 추가
    //if (e && e.value && Array.isArray(e.value) && e.value.length > 0) {
    if (e.value && e.value.length > 0) {
      setResults(e.value);
      const userMessage = e.value[0].toLowerCase();
      setMessages(prevMessages => [
        ...prevMessages,
        {role: 'user', content: userMessage},
      ]);

      let assistantResponse;

      if (cancelledFromSchedule) {
        // 스케줄 취소 후 돌아온 경우, 모든 명령어를 직접 처리
        setCancelledFromSchedule(false);
        setRecording(true); // 음성 인식 시작 시 recording 상태를 true로 설정
        //setRecording(false);
        // 여기에 추가 코드 작성
        await speak('안녕하세요. 무엇을 도와드릴까요?');
        setMessages(prevMessages => [
          ...prevMessages,
          {role: 'assistant', content: '안녕하세요. 무엇을 도와드릴까요?'},
        ]);

        // 기존의 명령어 처리 로직을 그대로 실행
        handleVoiceCommand(userMessage);
      } else {
        // 기존의 일반적인 명령어 처리 로직
        handleVoiceCommand(userMessage);
      }
    }
  };

  // 기존의 명령어 처리 로직을 별도의 함수로 분리
  const handleVoiceCommand = async userMessage => {
    let assistantResponse = '';

    // '카메라' 음성 명령 처리
    if (userMessage.includes('카메라')) {
      assistantResponse = '카메라를 켭니다';
      await stopListening();
      navigation.navigate('Camera');
    } else if (userMessage.includes('일정')) {
      assistantResponse = '일정 관리 페이지로 이동합니다';
      await stopListening();
      setMessages(prevMessages => [
        ...prevMessages,
        {role: 'assistant', content: assistantResponse},
      ]);
      try {
        await speak(assistantResponse);
        setTimeout(() => {
          navigation.navigate('Schedule', {startVoiceHandler: true});
        }, 2000);
      } catch (error) {
        console.error('TTS error:', error);
      }
    } else {
      // 다른 명령어에 대한 처리
      assistantResponse = '죄송합니다. 이해하지 못했습니다.';
      setMessages(prevMessages => [
        ...prevMessages,
        {role: 'assistant', content: assistantResponse},
      ]);
      try {
        await speak(assistantResponse);
      } catch (error) {
        console.error('TTS error:', error);
      }
    }
  };

  const startListening = async () => {
    try {
      console.log('Starting voice recognition');
      await Voice.start('ko-KR');
      //await Voice.start('en-US');
      setRecording(true);
    } catch (e) {
      console.error('startListening error: ', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setRecording(false);
      //resetVoiceState();
    } catch (e) {
      console.error('stopListening error: ', e);
    } finally {
      setRecording(false); // 확실히 recording 상태를 false로 설정
    }
  };

  return (
    <View className="relative flex-1 bg-default-1 dark:bg-neutral-900">
      <View className="absolute top-0 left-0 right-0 flex-row items-center justify-center my-8 z-10">
        <Logo width={wp(40)} height={hp(5)} />
      </View>
      <View className="absolute top-0 right-0 my-8 px-4 z-10">
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          accessibilityLabel="메뉴 열기"
          accessibilityHint="앱의 메뉴를 엽니다">
          <Icon
            name="menu"
            size={30}
            color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
      </View>
      <SafeAreaView className="flex-1 mx-5 mt-24">
        {messages.length > 0 ? (
          <View className="flex-1 space-y-2">
            <View
              style={{height: hp(58)}}
              className="p-4 rounded-3xl bg-default-2 dark:bg-gray-800">
              <ScrollView
                bounces={false}
                className="space-y-4"
                showsVerticalScrollIndicator={false}>
                {messages.map((message, index) => (
                  <View
                    key={index}
                    className={`${
                      message.role === 'assistant'
                        ? 'bg-orange-200 dark:bg-orange-600 rounded-xl p-2 rounded-tl-none'
                        : message.role === 'user'
                        ? 'bg-white dark:bg-gray-600 rounded-xl p-2 rounded-tr-none self-end'
                        : 'bg-red-200 dark:bg-red-600 rounded-xl p-2 items-center self-center'
                    }`}
                    style={{width: wp(70)}}>
                    <Text
                      className="text-black dark:text-white text-[24px] font-Regular"
                      accessible={false}>
                      {message.content}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View className="items-center">
            <Image
              source={require('../../assets/images/Peep(2-1).png')}
              style={{width: wp(60), height: hp(40)}}
              resizeMode="contain"
            />
          </View>
        )}
        <View className="flex justify-center items-center mb-10 absolute bottom-0 left-0 right-0">
          <TouchableOpacity
            onPress={recording ? stopListening : startListening}
            disabled={isTtsSpeaking}
            accessibilityLabel={recording ? '녹음 중지' : '녹음 시작'}
            accessibilityHint={
              recording ? '녹음을 중지합니다.' : '녹음을 시작합니다.'
            }>
            {recording ? (
              colorScheme === 'dark' ? (
                <StopDark height={hp(10)} opacity={isTtsSpeaking ? 0.5 : 1} />
              ) : (
                <Stop height={hp(10)} opacity={isTtsSpeaking ? 0.5 : 1} />
              )
            ) : colorScheme === 'dark' ? (
              <RecordingDark
                height={hp(10)}
                opacity={isTtsSpeaking ? 0.5 : 1}
              />
            ) : (
              <Recording height={hp(10)} opacity={isTtsSpeaking ? 0.5 : 1} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
