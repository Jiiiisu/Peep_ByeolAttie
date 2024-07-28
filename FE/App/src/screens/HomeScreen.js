import React, { useState, useEffect } from 'react';
import { View, Image, Text, PermissionsAndroid, Platform, Alert } from 'react-native';
import {ScrollView, TouchableOpacity} from 'react-native-gesture-handler';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {SafeAreaView} from 'react-native-safe-area-context';
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';
import Features from '../components/Features';
import {dummyMessages} from '../constants';
import {useNavigation} from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [results, setResults] = useState([]);
  const [assistantResponse, setText] = useState('');

  useEffect(() => {
    const initVoice = async () => {
      try {
        await Voice.isAvailable();
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;
        // 다른 이벤트 리스너들...
      } catch (e) {
        console.error('Failed to initialize Voice module', e);
      }
    };
    initVoice();

    // TTS 초기화
    Tts.setDefaultLanguage('ko-KR');
    Tts.setDefaultVoice('ko-KR-language');

    Tts.getInitStatus().then(() => {
      console.log('TTS engine initialized');
    }, (err) => {
      if (err.code === 'no_engine') {
        console.log('No TTS engine installed');
      } else {
        console.log('TTS initialization failed');
      }
    });
    // 퍼미션 요청
    requestMicrophonePermission();

    Tts.addEventListener('tts-start', (event) => console.log('TTS start', event));
    Tts.addEventListener('tts-finish', (event) => console.log('TTS finish', event));
    Tts.addEventListener('tts-cancel', (event) => console.log('TTS cancel', event));

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for speech recognition.',
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

  const onSpeechResults = (e) => {
    console.log('onSpeechResults: ', e);
    // 음성 인식 결과를 메시지에 추가
    if (e && e.value && Array.isArray(e.value) && e.value.length > 0) {
      setResults(e.value);
      const userMessage = e.value[0];
      //setMessages([...messages, {role: 'user', content: e.value[0]}]);
      setMessages(prevMessages => [...prevMessages, {role: 'user', content: userMessage}]);

      let assistantResponse;

      // '카메라' 음성 명령 처리
      if (userMessage.toLowerCase().includes('카메라')) {
        assistantResponse = '카메라를 켭니다';
        navigation.navigate('Camera')
      } else {
        // 여기서 서버로 메시지를 보내고 응답을 받는 로직을 추가해야 합니다.
        // 예시로 더미 응답을 사용합니다.
        assistantResponse = '음성 인식 결과를 받았습니다. 이것은 예시 응답입니다.';
      }
      
      // 응답을 메시지에 추가하고 음성으로 출력
      setMessages(prevMessages => [
        ...prevMessages,
        {role: 'user', content: userMessage},
        {role: 'assistant', content: assistantResponse},
      ]);
      
      Tts.speak(assistantResponse, {
        iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 1.0,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
      }).catch((error) => {
        console.error('TTS error:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          {role: 'system', content: 'TTS 오류가 발생했습니다.'},
        ]);
      });
    } else {
      console.log('No speech results');
      setMessages(prevMessages => [
        ...prevMessages,
        {role: 'system', content: '음성이 감지되지 않았습니다. 다시 시도해주세요.'},
      ]);
      Tts.speak('알아들을 수 없습니다', {
        iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 1.0,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
      }).catch(error => {
        console.error('TTS error:', error);
      });
    }
  };

  const onSpeechError = e => {
    console.error('Speech recognition error:', e);
    console.error('Error code:', e.error.code);
    console.error('Error message:', e.error.message);
    if (e.error.code === '5') {
      console.log('Client side error. Restarting voice recognition.');
      startListening(); // 자동으로 다시 시작
    }
    setMessages(prevMessages => [
      ...prevMessages,
      {role: 'system', content: `Error: ${e.error.message}`},
    ]);
    setRecording(false);  // 에러 발생 시 recording 상태 리셋
    Alert.alert('Speech Recognition Error', `Error: ${e.error.message}`);
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
    } catch (e) {
      console.error('startListening error: ', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setRecording(false);
    } catch (e) {
      console.error('stopListening error: ', e);
    } finally {
      // 추가적인 정리 작업이 필요하다면 여기에 작성
    }
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1 flex mx-5">
        <View className="flex-row justify-center">
          {/* 상단 타이틀 or 아이콘 다시 설정 예정*/}
          <Text
            style={{fontSize: wp(10)}}
            className="text-center font-bold text-orange-default">
            삐약삐약
          </Text>
        </View>
        {messages.length > 0 ? (
          <View className="space-y-2 flex-1">
            <Text
              style={{fontSize: wp(5)}}
              className="text-gray-700 font-semibold ml-1">
              Assistant
            </Text>
            <View
              style={{height: hp(58)}}
              className="bg-neutral-200 rounded-3xl p-4">
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
                        <Text>{message.content}</Text>
                      </View>
                    );
                  } else if (message.role === 'user') {
                    return (
                      <View key={index} className="flex-row justify-end">
                        <View
                          style={{ width: wp(70) }}
                          className="bg-white rounded-xl p-2 rounded-tr-none">
                          <Text>{message.content}</Text>
                        </View>
                      </View>
                    );
                  } else if (message.role === 'system') {
                    return (
                      <View key={index} className="flex-row justify-center">
                        <View
                          style={{ width: wp(70) }}
                          className="bg-red-200 rounded-xl p-2">
                          <Text>{message.content}</Text>
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
                          <Text>{message.content}</Text>
                        </View>
                      </View>
                    );
                  }
                })}
              </ScrollView>
            </View>
          </View>
        ) : (
          <Features />
        )}
        <View className="flex justify-center items-center">
          {recording ? (
            <TouchableOpacity onPress={stopListening}>
              <Image
                className="rounded-full"
                source={require('../../assets/images/voiceLoading.png')}
                style={{width: 100, height: 100}}
              />
              {/* png -> gif or lottie 애니메이션 추가 예정 */}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startListening}>
              <Image
                className="rounded-full"
                source={require('../../assets/images/recording.png')}
                style={{width: 100, height: 100}}
              />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}