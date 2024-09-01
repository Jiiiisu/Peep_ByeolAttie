import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { ToastAndroid, Platform } from 'react-native';

let isListening = false;
let timeoutId = null;
let isCancelled = false;

export const handleScheduleVoice = async (navigation) => {
  // Voice 모듈 초기화 및 이벤트 리스너 설정
  isCancelled = false;

  const cleanupAndNavigate = (screenName, params = {}) => {
    isCancelled = true;
    stopListening();
    Tts.stop();
    clearTimeout(timeoutId);
    navigation.navigate(screenName, params);
  };

  const initVoice = async () => {
    try {
      await Voice.destroy();
      await Voice.removeAllListeners();
      await Voice.isAvailable();

      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = (e) => handleSpeechResults(e, navigation);
      Voice.onSpeechError = handleSpeechError;
    } catch (e) {
      console.error('Failed to init Voice module', e);
    }
  };

  const onSpeechStart = (e) => {
    if (isCancelled) return;
    console.log('onSpeechStart: ', e);
    clearTimeout(timeoutId);
  };

  const onSpeechEnd = (e) => {
    if (isCancelled) return;
    console.log('onSpeechEnd: ', e);
  };

  const handleSpeechResults = (e, navigation) => {
    if (isCancelled) return;
    console.log('Speech results:', e);
    if (e.value && e.value.length > 0) {
      const result = e.value[0].toLowerCase();
      if (result.includes('음성')) {
        cleanupAndNavigate('Input1');
        askForMedicationName();
      } else if (result.includes('텍스트')) {
        cleanupAndNavigate('Input1');
      } else if (result.includes('취소')) {
        cleanupAndNavigate('Home', { resetVoice: true }); // 취소 후 음성 인식 초기화
      } else {
        Tts.speak('잘못 들었습니다. 다시 말씀해 주세요.');
        setTimeout(askForInputMethod, 2000);
      }
    }
  };

  const handleSpeechError = (e) => {
    if (isCancelled) return;
    console.error('Speech recognition error:', e);
    
    // 특정 에러 코드를 무시하고 계속 진행
    if (e.error.code === '5') { //e.error.code === '7' || e.error.code === '5' 이렇게 작성하면 계속 무한 음성인식 루프 돔
      console.log('Ignoring error and continuing...');
      // Toast 메시지로 사용자에게 알림 (Android)
      if (Platform.OS === 'android') {
        ToastAndroid.show('음성 인식 중 문제가 발생했습니다. 다시 시도합니다.', ToastAndroid.SHORT);
      }
      // iOS의 경우 필요하다면 다른 방식의 알림을 사용할 수 있음.
      
      // 음성 인식을 다시 시작
      if (!isCancelled) setTimeout(startListeningForInputMethod, 1000);
    } else {
      // 다른 에러의 경우 기존 로직 유지
      stopListening();
      if (!isCancelled) setTimeout(askForInputMethod, 2000);
    }
  };

  const askForInputMethod = () => {
    if (isCancelled) return;
    Tts.speak('음성으로 입력하시려면 음성, 텍스트로 입력하시려면 텍스트, 취소하시려면 취소를 입력하세요', {
      iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    });
    if (!isCancelled) timeoutId = setTimeout(startListeningForInputMethod, 8000);
  };

  const startListeningForInputMethod = async () => {
    if (isCancelled) return;
    try {
      await Voice.start('ko-KR');
      isListening = true;
      
      // 6초 후에 음성 인식 결과가 없으면 다시 안내 메시지 출력
      timeoutId = setTimeout(() => {
        if (isListening) {
          stopListening();
          askForInputMethod();
        //   Tts.speak('음성으로 입력하시려면 음성, 텍스트로 입력하시려면 텍스트, 취소하시려면 취소를 입력하세요', {
        //     iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
        //     androidParams: {
        //       KEY_PARAM_PAN: -1,
        //       KEY_PARAM_VOLUME: 1.0,
        //       KEY_PARAM_STREAM: 'STREAM_MUSIC',
        //     },
        //   });
        }
      }, 6000);
    } catch (e) {
      console.error('Failed to start voice recognition', e);
      // 에러 발생 시 재시도
      if (!isCancelled) setTimeout(startListeningForInputMethod, 1000);
    }
  };

  const askForMedicationName = () => {
    if (isCancelled) return;
    Tts.speak('복용할 약의 이름을 입력하세요', {
      iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    });
    if (!isCancelled) setTimeout(startListeningForMedication, 3000);
  };

  const startListeningForMedication = async () => {
    if (isCancelled) return;
    try {
      await Voice.start('ko-KR');
      isListening = true;
    } catch (e) {
      console.error('Failed to start voice recognition', e);
    }
  };

  const stopListening = async () => {
    if (isListening) {
      try {
        await Voice.stop();
        isListening = false;
        clearTimeout(timeoutId);
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
  };
};

export const handleMedicationVoiceResult = (result, navigation) => {
  // 여기서 약 이름을 처리하는 로직을 구현합니다.
  // 예: 데이터베이스에 저장하거나 다음 단계로 진행
  if (result && result.length > 0) {
    console.log('Medication name:', result);
    // 음성으로 인식된 약 이름을 InputScreen1로 전달
    navigation.navigate('Input1', { recognizedDrugName: result });
  }
};