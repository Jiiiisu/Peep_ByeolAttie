import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Image,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
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
import Features from '../components/Features';
import {useNavigation, useFocusEffect, useRoute} from '@react-navigation/native';
import {initTts, speak } from './ScheduleVoiceHandler';
import Logo from '../../assets/images/Logo.svg';
import Recording from '../../assets/images/Recording.svg';
import Stop from '../../assets/images/Stop.svg';

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [results, setResults] = useState([]);
  const [assistantResponse, setText] = useState('');
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const voiceInitialized = useRef(false);
  const [showFeatures, setShowFeatures] = useState(true);

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
      if (resetVoice) {
        resetHomeScreen();
        // 파라미터를 사용한 후에는 초기화해주는 것이 좋습니다.
        navigation.setParams({ resetVoice: undefined });
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
      };
    }, [route.params, navigation, messages.length, recording, isTtsSpeaking, resetHomeScreen, resetVoiceState])
  );

  const resetHomeScreen = useCallback(() => {
    setShowFeatures(true);
    setMessages([]);
    setResults([]);
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

  const onSpeechStart = (e) => {
    console.log('onSpeechStart', e);
    setRecording(true);
  };

  const onSpeechEnd = (e) => {
    console.log('onSpeechEnd', e);
    setRecording(false);
  };

  const onSpeechError = e => {
    console.error('Speech recognition error:', e);
    if (e.error.code === '5' || e.error.code === '7') {
      console.log('Client side error. Restarting voice recognition.');
      if (Platform.OS === 'android') {
        ToastAndroid.show('음성 인식 중 문제가 발생했습니다. 다시 시도합니다.', ToastAndroid.SHORT);
      }
      setTimeout(startListening, 1000);// 자동으로 다시 시작
    }
    setMessages(prevMessages => [
      ...prevMessages,
      {role: 'system', content: `Error: ${e.error.message}`},
    ]);
    setRecording(false); // 에러 발생 시 recording 상태 리셋
    //Alert.alert('Speech Recognition Error', `Error: ${e.error.message}`); //확인창 팝업해서 일일이 클릭해야 해서 제외함
  };

  const onSpeechResults = async (e) => {
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

      // '카메라' 음성 명령 처리
      if (userMessage.includes('카메라')) {
        assistantResponse = '카메라를 켭니다';
        await stopListening();
        navigation.navigate('Camera');
      }
      else if (userMessage.includes('일정')){
        assistantResponse = '일정 관리 페이지로 이동합니다';
        await stopListening();
        setMessages(prevMessages => [
          ...prevMessages,
          {role: 'assistant', content: assistantResponse},
        ]);
        try {
          //await speak(assistantResponse);
          Tts.speak(assistantResponse, {
            iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
            androidParams: {
              KEY_PARAM_PAN: -1,
              KEY_PARAM_VOLUME: 1.0,
              KEY_PARAM_STREAM: 'STREAM_MUSIC',
            },
          });
          await Voice.destroy();  // Voice 모듈을 완전히 정지. 일정페이지 전환되면서 다음 음성인식이 진행이 안 되는 문졔 때문에 주석처리
          setTimeout(() => {
            navigation.navigate('Schedule', { startVoiceHandler: true });
          //handleScheduleVoice(navigation, resetVoiceState);
          }, 2000); // TTS가 끝나기를 기다린 후 화면 전환
        } catch (error) {
          console.error('TTS error:', error);
        }
        // setTimeout(() => {
        //   //navigation.navigate('Schedule');
        //   navigation.navigate('Schedule', { startVoiceHandler: true });
        //   //handleScheduleVoice(navigation, resetVoiceState); //handleScheduleVoice 함수를 호출할 때 resetVoiceState 함수를 명시적으로 전달
        // }, 2000); // TTS가 끝나기를 기다린 후 화면 전환
        // //return; // 여기서 함수 종료
      } else {
        // 여기서 서버로 메시지를 보내고 응답을 받는 로직을 추가해야 합니다.
        // 예시로 더미 응답을 사용합니다.
        setMessages(prevMessages => [
          ...prevMessages,
          {role: 'assistant', content: assistantResponse},
        ]);
        await speak(assistantResponse);
      }
    } else {
      console.log('No speech results');
      resetVoiceState();
    }
  };
  
  const startListening = async () => {
    try {
      console.log('Starting voice recognition');
      await Voice.start('ko-KR', {
        //EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 3000,
        //EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
        //EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
      });
      //await Voice.start('en-US');
      setRecording(true);
      setShowFeatures(false);
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
      // 추가적인 정리 작업이 필요하다면 여기에 작성
    }
  };

  return (
    <View className="flex-1 bg-default-1">
      <View className="my-10">
        <Logo height={hp(7)} />
      </View>
      <SafeAreaView className="flex-1 flex mx-5">
        {messages.length > 0 ? (
          <View className="space-y-2 flex-1">
            <Text
              style={{fontSize: wp(5)}}
              className="text-gray-700 font-semibold ml-1">
              Assistant
            </Text>
            <View
              style={{height: hp(58)}}
              className="bg-default-2 rounded-3xl p-4">
              <ScrollView
                bounces={false}
                className="space-y-4"
                showsVerticalScrollIndicator={false}>
                {messages.map((message, index) => {
                  if (message.role == 'assistant') {
                    // text response
                    return (
                      <View
                        key={index}
                        style={{width: wp(70)}}
                        className="bg-orange-200 rounded-xl p-2 rounded-tl-none">
                        <Text className="text-black text-[24px] font-Regular">
                          {message.content}
                        </Text>
                      </View>
                    );
                  } else if (message.role === 'user') {
                    return (
                      <View key={index} className="flex-row justify-end">
                        <View
                          style={{width: wp(70)}}
                          className="bg-white rounded-xl p-2 rounded-tr-none">
                          <Text className="text-black text-[24px] font-Regular">
                            {message.content}
                          </Text>
                        </View>
                      </View>
                    );
                  } else if (message.role === 'system') {
                    return (
                      <View key={index} className="flex-row justify-center">
                        <View
                          style={{width: wp(70)}}
                          className="bg-red-200 rounded-xl p-2 items-center">
                          <Text className="text-black text-[24px] font-Regular">
                            {message.content}
                          </Text>
                        </View>
                      </View>
                    );
                  } else {
                    // user input
                    return (
                      <View key={index} className="flex-row justify-end">
                        <View
                          style={{width: wp(70)}}
                          className="bg-white rounded-xl p-2 rounded-tr-none">
                          <Text className="text-black text-[24px] font-Regular">
                            {message.content}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                })}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View>
            <View className="items-center space-y-2">
              <View style={{width: wp(90)}} className="p-2">
                {Features()}
              </View>
              <Image
                source={require('../../assets/images/Peep(2-1).png')}
                style={{width: wp(60), height: hp(41)}}
              />
            </View>
          </View>
        )}
        <View className="flex justify-center items-center mb-10 absolute bottom-0 left-0 right-0">
          <TouchableOpacity 
            onPress={recording ? stopListening : startListening} 
            disabled={isTtsSpeaking}
          >
            {recording ? (
              <Stop height={hp(10)} opacity={isTtsSpeaking ? 0.5 : 1} />
            ) : (
              <Recording height={hp(10)} opacity={isTtsSpeaking ? 0.5 : 1} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}