import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import {ToastAndroid, Platform} from 'react-native';
import {CommonActions} from '@react-navigation/native';

let isListening = false;
let timeoutId = null;
let isCancelled = false;
let isVoiceMode = false; // 음성모드 or 텍스트모드 상태 변수
let isSpeaking = false; //TTS가 말하고 있는지 추적하는 변수

export const cleanupAndNavigate = (
  navigation,
  resetVoiceState,
  screenName,
  params = {},
) => {
  isCancelled = true;
  stopListening();
  Tts.stop();
  clearTimeout(timeoutId);
  Voice.destroy().then(Voice.removeAllListeners);
  if (typeof resetVoiceState === 'function') {
    resetVoiceState(); // HomeScreen에서 전달받은 함수 호출
  }

  const commonParams = {
    ...params,
    isVoiceMode: params.isVoiceMode || false,
    resetInputs: true, // 이 플래그를 추가하여 InputScreen1에서 입력값 초기화를 트리거합니다.
  };

  switch (screenName) {
    case 'Home':
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: screenName, params: {resetVoice: true}}],
        }),
      );
      break;
    case 'Input1':
      navigation.dispatch(
        CommonActions.navigate({
          name: screenName,
          params: {
            ...commonParams,
            name: '',
            dosage: '',
          },
        }),
      );
      break;
    default:
      navigation.dispatch(
        CommonActions.navigate({
          name: screenName,
          params: commonParams,
        }),
      );
  }
};

export const handleScheduleVoice = async (navigation, resetVoiceState) => {
  // Voice 모듈 초기화 및 이벤트 리스너 설정
  isCancelled = false;
  let currentStep = 'inputMethod';

  const initVoice = async () => {
    try {
      await Voice.destroy();
      await Voice.removeAllListeners();
      await Voice.isAvailable();

      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = handleSpeechResults;
      Voice.onSpeechError = handleSpeechError;
    } catch (e) {
      console.error('Failed to init Voice module', e);
    }
  };

  const onSpeechStart = e => {
    console.log('onSpeechStart: ', e);
    isListening = true;
    clearTimeout(timeoutId);
  };

  const onSpeechEnd = e => {
    console.log('onSpeechEnd: ', e);
    isListening = false;
  };

  const handleSpeechResults = async e => {
    console.log('handleSpeechResults: ', e);
    if (e.value && e.value.length > 0) {
      const result = e.value[0].toLowerCase();
      console.log('Recognized speech:', result);

      // 음성 출력 내용이 포함되어 있다면 무시
      if (result.includes('입력하시려면 음성 ')) {
        //'입력하시려면 음성 텍스트로 입력하시려면 텍스트 취소하시려면 취소를 입력하세요' 은 음성인식에서 제외
        console.log('Ignoring TTS interference');
        startListening();
        return;
      }

      if (result.includes('음성')) {
        isVoiceMode = true; // 음성 모드로 설정
        // Input1로 화면 전환
        await cleanupAndNavigate(navigation, resetVoiceState, 'Input1', {
          isVoiceMode,
        });
        currentStep = 'name';
      } else if (result.includes('텍스트')) {
        isVoiceMode = false; // 텍스트 모드로 설정
        cleanupAndNavigate(navigation, resetVoiceState, 'Input1', {
          isVoiceMode: false,
        });
      } else if (result.includes('취소')) {
        await speak('알림 설정을 취소합니다');
        // 네비게이션 스택 초기화 및 TTS 중지 플래그 전달
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {name: 'Home'},
              {
                name: 'Schedule',
                params: {resetVoice: true, stopTTS: true},
              },
            ],
          }),
        );

        isCancelled = true;
        stopListening();
        Voice.destroy().then(Voice.removeAllListeners);
        if (typeof resetVoiceState === 'function') {
          resetVoiceState();
        }
        // 여기서 함수 실행을 종료합니다.
        return;
      } else {
        await speak('잘못 들었습니다. 다시 말씀해 주세요.');
        await askForInputMethod();
      }
    } else {
      console.log('No speech results');
      await speak('음성이 인식되지 않았습니다. 다시 말씀해 주세요.');
      if (currentStep === 'inputMethod') {
        await askForInputMethod();
      } else {
        startListening();
      }
    }
  };

  const handleSpeechError = async e => {
    if (isCancelled) return;
    console.error('Speech recognition error:', e);

    // 특정 에러 코드를 무시하고 계속 진행
    if (e.error.code === '7' || e.error.code === '5') {
      //e.error.code === '7' || e.error.code === '5' 이렇게 작성하면 계속 무한 음성인식 루프 돔 .보통 error 5만 재시도 할것
      console.log('Client side error. Restarting voice recognition.');
      // Toast 메시지로 사용자에게 알림 (Android)
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          '음성 인식 중 문제가 발생했습니다. 다시 시도합니다.',
          ToastAndroid.SHORT,
        );
      }
      console.log('No speech results');
      await speak('음성이 인식되지 않았습니다. 다시 말씀해 주세요.');
      if (currentStep === 'inputMethod') {
        await askForInputMethod();
      } else {
        startListening();
      }
      // 음성 인식을 다시 시작
      //if (!isCancelled) setTimeout(startListening, 1000);
    } else {
      // 다른 에러의 경우 기존 로직 유지
      stopListening();
      await speak('음성 인식에 문제가 발생했습니다. 다시 시도합니다.');
      await askForInputMethod();
    }
    isListening = false;
  };

  const askForInputMethod = async () => {
    if (isCancelled) return;
    await speak(
      '음성으로 입력하시려면 음성, 텍스트로 입력하시려면 텍스트, 취소하시려면 취소를 입력하세요',
    );
    // 음성 출력이 끝난 후 1초 대기 후 음성 인식 시작
    startListening();
    //if (!isCancelled) timeoutId = setTimeout(startListening, 1000);
    // Tts.addEventListener('tts-finish', () => {
    //   if (!isCancelled) timeoutId = setTimeout(startListening, 1000);
    // });
  };

  const startListening = async () => {
    if (isCancelled) return; // 취소된 경우 음성 인식 시작하지 않음
    try {
      console.log('Starting voice recognition');
      await Voice.start('ko-KR');
      isListening = true;

      timeoutId = setTimeout(() => {
        if (isListening) {
          stopListening();
          speak('응답이 없습니다. 다시 한 번 말씀해 주세요.');
          setTimeout(askForInputMethod, 2000);
        }
      }, 7000);
    } catch (e) {
      console.error('Failed to start voice recognition', e);
      if (!isCancelled) setTimeout(startListening, 1000);
    }
  };

  // Voice 모듈 초기화
  await initVoice();
  // 입력 방법 묻기
  if (!isCancelled) setTimeout(askForInputMethod, 1000);

  // 컴포넌트가 언마운트될 때 Voice 모듈 정리
  return () => {
    isCancelled = true;
    Voice.destroy().then(Voice.removeAllListeners);
    clearTimeout(timeoutId);
    Tts.stop();
    if (typeof resetVoiceState === 'function') {
      resetVoiceState(); // 컴포넌트 언마운트 시 상태 초기화
    }
    isVoiceMode = false; // 음성 모드 초기화
    isVoiceRecognitionEnabled = true; // 컴포넌트 언마운트 시 음성 인식 상태 초기화
  };
};

export const stopListening = async () => {
  if (isListening) {
    try {
      await Voice.stop();
      isListening = false;
      clearTimeout(timeoutId);
      if (typeof resetVoiceState === 'function') {
        resetVoiceState(); // 음성 인식 중지 시 상태 초기화
      }
    } catch (e) {
      console.error('Failed to stop voice recognition', e);
    }
  }
};

// Tts 초기화 함수 추가
export const initTts = async () => {
  try {
    await Tts.setDefaultLanguage('ko-KR');
    await Tts.setDefaultVoice('ko-KR-SMTf00'); // 또는 'ko-KR-default'
    const voices = await Tts.voices();
    const availableVoices = voices.filter(v => v.language === 'ko-KR');

    Tts.addEventListener('tts-start', event => console.log('TTS start', event));
    Tts.addEventListener('tts-finish', event =>
      console.log('TTS finish', event),
    );
    Tts.addEventListener('tts-cancel', event =>
      console.log('TTS cancel', event),
    );

    if (availableVoices.length > 0) {
      await Tts.setDefaultVoice(availableVoices[0].id);
    } else {
      console.warn('No Korean voices found. Using default voice.');
    }

    await Tts.setDefaultRate(0.5);
    await Tts.setDefaultPitch(1.0);

    console.log('TTS initialized successfully');
  } catch (error) {
    console.error('Failed to initialize TTS:', error);
  }
};

// Tts speak 함수 추가
export const speak = async text => {
  if (text == null || text.trim() === '') {
    //text가 Null인 경우 대처
    console.warn('Attempted to speak null or empty text');
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    isSpeaking = true;
    Tts.speak(text, {
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
      onDone: () => {
        isSpeaking = false;
        resolve();
      },
      onStart: () => {
        console.log('TTS started');
      },
    });

    Tts.addEventListener('tts-finish', event => {
      resolve(event);
    });

    Tts.addEventListener('tts-error', event => {
      reject(event);
    });
  });
};

export const resetVoiceRecognition = () => {
  isVoiceRecognitionEnabled = true;
};
