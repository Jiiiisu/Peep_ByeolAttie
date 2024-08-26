import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';

let isListening = false;

export const handleScheduleVoice = async (navigation) => {
  // Voice 모듈 초기화 및 이벤트 리스너 설정
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
    console.log('onSpeechStart: ', e);
  };

  const onSpeechEnd = (e) => {
    console.log('onSpeechEnd: ', e);
  };

  const handleSpeechResults = (e, navigation) => {
    console.log('Speech results:', e);
    if (e.value && e.value.length > 0) {
      const result = e.value[0];
      if (result.includes('1') || result.toLowerCase().includes('음성')) {
        //stopListening();
        askForMedicationName();
      } else if (result.includes('2') || result.toLowerCase().includes('텍스트')) {
        stopListening();
        navigation.navigate('Input1');
      }else {
        //Tts.speak('잘못 들었습니다. 다시 말씀해 주세요.');
        Tts.speak('잘못 들었습니다.');
        setTimeout(startListeningForInputMethod, 2000);
      }
    }
  };

  const handleSpeechError = (e) => {
    console.error('Speech recognition error:', e);
    stopListening();
  };

  const askForInputMethod = () => {
    Tts.speak('음성으로 입력하시려면 음성, 텍스트로 입력하시려면 텍스트를 입력하세요', {
      iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    });
    setTimeout(startListeningForInputMethod, 3000);
  };

  const startListeningForInputMethod = async () => {
    try {
      await Voice.start('ko-KR');
      isListening = true;
    } catch (e) {
      console.error('Failed to start voice recognition', e);
    }
  };

  const askForMedicationName = () => {
    Tts.speak('복용할 약의 이름을 입력하세요', {
      iosVoiceId: 'com.apple.ttsbundle.Yuna-compact',
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    });
    setTimeout(startListeningForMedication, 3000);
  };

  const startListeningForMedication = async () => {
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
      } catch (e) {
        console.error('Failed to stop voice recognition', e);
      }
    }
  };

  // Voice 모듈 초기화
  await initVoice();

  // 입력 방법 묻기
  setTimeout(askForInputMethod, 1000);

  // 컴포넌트가 언마운트될 때 Voice 모듈 정리
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
};

export const handleMedicationVoiceResult = (result, navigation) => {
  // 여기서 약 이름을 처리하는 로직을 구현합니다.
  // 예: 데이터베이스에 저장하거나 다음 단계로 진행
  if (e.value && e.value.length > 0) {
    const result = e.value[0];
    console.log('Medication name:', result);
    // 음성으로 인식된 약 이름을 InputScreen1로 전달
    navigation.navigate('Input1', { recognizedDrugName: result });
  }
};