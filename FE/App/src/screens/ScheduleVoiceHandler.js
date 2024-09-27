import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { ToastAndroid, Platform } from 'react-native';

let isListening = false;
let timeoutId = null;
let isCancelled = false;
let isVoiceMode = false;  // 음성모드 or 텍스트모드 상태 변수
let isSpeaking = false; //TTS가 말하고 있는지 추적하는 변수

export const handleScheduleVoice = async (navigation, resetVoiceState) => {
  // Voice 모듈 초기화 및 이벤트 리스너 설정
  isCancelled = false;
  let medicationName = '';
  let currentStep = 'inputMethod';

  const cleanupAndNavigate = (screenName, params = {}) => {
    isCancelled = true;
    stopListening();
    Tts.stop();
    clearTimeout(timeoutId);
    Voice.destroy().then(Voice.removeAllListeners);
    if (typeof resetVoiceState === 'function') {
      resetVoiceState(); // HomeScreen에서 전달받은 함수 호출
    }
    if (screenName === 'Home') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home', params: { ...params, resetVoice: true } }],
      });
    } else {
      navigation.navigate(screenName, { ...params, isVoiceMode }); // isVoiceMode 상태를 전달
    }
  };

  const initVoice = async () => {
    try {
      await Voice.destroy();
      await Voice.removeAllListeners();
      await Voice.isAvailable();

      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      //Voice.onSpeechResults = (e) => handleSpeechResults(e, navigation, resetVoiceState);
      Voice.onSpeechResults = handleSpeechResults;
      Voice.onSpeechError = handleSpeechError;
    } catch (e) {
      console.error('Failed to init Voice module', e);
    }
  };

  const onSpeechStart = (e) => {
    //if (isCancelled) return;
    console.log('onSpeechStart: ', e);
    isListening = true;
    clearTimeout(timeoutId);
  };

  const onSpeechEnd = (e) => {
    //if (isCancelled) return;
    console.log('onSpeechEnd: ', e);
    isListening = false;
  };

  const handleSpeechResults = async (e) => {
    console.log('handleSpeechResults: ', e);
    if (e.value && e.value.length > 0) {
      const result = e.value[0].toLowerCase();
      console.log('Recognized speech:', result);
      //clearTimeout(timeoutId);  // 음성 인식 결과가 있으면 타임아웃 취소

      // 음성 출력 내용이 포함되어 있다면 무시
      if (result.includes('입력하시려면 음성 ')) { //'입력하시려면 음성 텍스트로 입력하시려면 텍스트 취소하시려면 취소를 입력하세요' 은 음성인식에서 제외
        console.log('Ignoring TTS interference');
        startListening();
        return;
      }

      if (result.includes('음성')) {
        isVoiceMode = true;  // 음성 모드로 설정
        // Input1로 화면 전환
        setTimeout(() => {
          cleanupAndNavigate('Input1', { isVoiceMode });
        }, 2000);
        currentStep = 'name';
      } else if (result.includes('텍스트')) {
        isVoiceMode = false;  // 텍스트 모드로 설정
        cleanupAndNavigate('Input1');
      } else if (result.includes('취소')) {
        await speak('알림 설정을 취소합니다');
        setTimeout(() => {
          cleanupAndNavigate('Home', { resetVoice: true, cancelledFromSchedule: true });
        }, 2000);
      } else {
        await speak('잘못 들었습니다. 다시 말씀해 주세요.');
        await askForInputMethod();
      }
      // switch (currentStep) {
      //   case 'inputMethod':
      //     if (result.includes('음성')) {
      //       isVoiceMode = true;  // 음성 모드로 설정
      //       // Input1로 화면 전환
      //       setTimeout(() => {
      //         cleanupAndNavigate('Input1', { isVoiceMode });
      //       }, 2000);
      //       currentStep = 'name';
      //     } else if (result.includes('텍스트')) {
      //       isVoiceMode = false;  // 텍스트 모드로 설정
      //       cleanupAndNavigate('Input1');
      //     } else if (result.includes('취소')) {
      //       await speak('알림 설정을 취소합니다');
      //       setTimeout(() => {
      //         cleanupAndNavigate('Home', { resetVoice: true, cancelledFromSchedule: true });
      //       }, 2000);
      //     } else {
      //       await speak('잘못 들었습니다. 다시 말씀해 주세요.');
      //       await askForInputMethod();
      //     }
      //     break;
      // }
    } else {
      console.log('No speech results');
      await speak('음성이 인식되지 않았습니다. 다시 말씀해 주세요.')
      if (currentStep === 'inputMethod') {
        await askForInputMethod();
      } else {
        startListening();
      }
    }
  };

  const handleSpeechError = (e) => {
    if (isCancelled) return;
    console.error('Speech recognition error:', e);
    
    // 특정 에러 코드를 무시하고 계속 진행
    if (e.error.code === '7' || e.error.code === '5') { //e.error.code === '7' || e.error.code === '5' 이렇게 작성하면 계속 무한 음성인식 루프 돔 .보통 error 5만 재시도 할것
      console.log('Client side error. Restarting voice recognition.');
      // Toast 메시지로 사용자에게 알림 (Android)
      if (Platform.OS === 'android') {
        ToastAndroid.show('음성 인식 중 문제가 발생했습니다. 다시 시도합니다.', ToastAndroid.SHORT);
      }
      // iOS의 경우 필요하다면 다른 방식의 알림을 사용할 수 있음.
      
      // 음성 인식을 다시 시작
      if (!isCancelled) setTimeout(startListening, 1000);
    } else {
      // 다른 에러의 경우 기존 로직 유지
      stopListening();
      speak('음성 인식에 문제가 발생했습니다. 다시 시도합니다.');
      if (!isCancelled) setTimeout(askForInputMethod, 2000);
    }
    isListening = false;
  };

  const askForInputMethod = async () => {
    if (isCancelled) return;
    await speak('음성으로 입력하시려면 음성, 텍스트로 입력하시려면 텍스트, 취소하시려면 취소를 입력하세요');
    // 음성 출력이 끝난 후 1초 대기 후 음성 인식 시작
    startListening();
    //if (!isCancelled) timeoutId = setTimeout(startListening, 1000);
    // Tts.addEventListener('tts-finish', () => {
    //   if (!isCancelled) timeoutId = setTimeout(startListening, 1000);
    // });
  };

  const startListening = async () => {
    //if (isCancelled || isSpeaking) return;
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

  const stopListening = async () => {
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
    isVoiceMode = false;  // 음성 모드 초기화
  };
};

// Tts 초기화 함수 추가
export const initTts = async () => {
  try {
    await Tts.setDefaultLanguage('ko-KR');
    await Tts.setDefaultVoice('ko-KR-SMTf00');  // 또는 'ko-KR-default'
    const voices = await Tts.voices();
    const availableVoices = voices.filter(v => v.language === 'ko-KR');

    Tts.addEventListener('tts-start', (event) => console.log('TTS start', event));
    Tts.addEventListener('tts-finish', (event) => console.log('TTS finish', event));
    Tts.addEventListener('tts-cancel', (event) => console.log('TTS cancel', event));
    
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
export const speak = async (text) => {
  if (text == null || text.trim() === '') { //text가 Null인 경우 대처
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

    Tts.addEventListener('tts-finish', (event) => {
      resolve(event);
    });

    Tts.addEventListener('tts-error', (event) => {
      reject(event);
    });
  });
};

// export const handleMedicationVoiceResult = (result, navigation) => {
//   // 여기서 약 이름을 처리하는 로직을 구현합니다.
//   // 예: 데이터베이스에 저장하거나 다음 단계로 진행
//   if (result && result.length > 0) {
//     console.log('Medication name:', result);
//     // 음성으로 인식된 약 이름을 InputScreen1로 전달
//     navigation.navigate('Input1', { recognizedDrugName: result });
//   }
// };