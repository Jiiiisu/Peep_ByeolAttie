import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useSpeech } from '../constants/SpeechContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Voice from '@react-native-voice/voice';
import { useTheme } from '../constants/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

export default function QRBarcodeScanner() {
  const { speak, stopSpeech } = useSpeech();
  const navigation = useNavigation();
  const { colorScheme } = useTheme();
  const [isProcessingEnabled, setIsProcessingEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [detectedLink, setDetectedLink] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const isMountedRef = useRef(true);
  const cameraRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      setIsProcessingEnabled(true);
      Voice.onSpeechResults = onSpeechResults;

      return () => {
        setIsProcessingEnabled(false);
        stopSpeech();
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, [stopSpeech, onSpeechResults])
  );

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      isMountedRef.current = false;
      Voice.destroy().then(Voice.removeAllListeners).catch(console.error);
    };
  }, []);

  const isValidUrl = (string) => {
    try {
      // http:// 또는 https://가 없는 경우 추가
      const urlString = string.toLowerCase();
      const hasProtocol = urlString.startsWith('http://') || urlString.startsWith('https://');
      const urlToCheck = hasProtocol ? string : `https://${string}`;
      
      new URL(urlToCheck);
      return true;
    } catch (_) {
      console.log('URL 검증 실패:', string);
      return false;
    }
  };

  const handleBarCodeScanned = useCallback(async ({ data, type }) => {
    if (!isProcessingEnabled) return;
    
    setIsProcessingEnabled(false);
    // 여기서 전역 변수로 저장
    global.lastScannedLink = data;  // 추가
    setDetectedLink(data);
    
    try {
      console.log('스캔된 원본 데이터:', data);
      console.log('URL 검증 전 데이터 타입:', typeof data);
      
      // 여기에 recognizedText 설정 추가
      setRecognizedText(`스캔된 링크: ${data}`);
      
      if (data && data.trim() !== '' && isValidUrl(data)) {
        const message = '링크가 감지되었습니다. 이동하시려면 이동, 아니라면 아니오를 말씀해주세요.';
        await speak(message);
        startListening();
      } else {
        console.log('유효하지 않은 QR 코드:', data);
        await speak('인식된 QR 코드가 유효하지 않습니다. 다른 QR 코드를 스캔해 주세요.');
        setIsProcessingEnabled(true);
      }
    } catch (error) {
      console.error('QR 코드 스캔 오류:', error);
      setIsProcessingEnabled(true);
    }
  }, [speak, isProcessingEnabled]);

  const startListening = async () => {
    setIsListening(true);
    try {
      await Voice.start('ko-KR');
    } catch (error) {
      console.error('음성 인식 시작 오류:', error);
      setIsListening(false);
      setIsProcessingEnabled(true);
    }
  };

  const onSpeechResults = useCallback(async (e) => {
    try {
      const userResponse = e.value[0].toLowerCase();
      console.log('Speech recognition result:', userResponse);
  
      if (userResponse.includes('이동')) {
        console.log('사용자가 이동을 선택했습니다. 링크로 이동합니다.');
        
        // global.lastScannedLink 사용
        const currentLink = global.lastScannedLink;
        console.log('현재 처리할 링크:', currentLink);
  
        if (currentLink && currentLink.trim() !== '') {
          let formattedLink = currentLink.trim();
          console.log('처리된 링크:', formattedLink);
  
          try {
            // canOpenURL 검사 제거하고 바로 시도
            await Linking.openURL(formattedLink);
          } catch (err) {
            console.error("링크 열기 실패:", err);
            await speak("이 링크를 열 수 없습니다. 다른 QR 코드를 스캔해 주세요.");
          }
        } else {
          console.log("유효하지 않은 URL입니다.");
          await speak("유효하지 않은 링크입니다. 다른 QR 코드를 스캔해 주세요.");
        }
      } else if (userResponse.includes('아니오')) {
        console.log('사용자가 이동을 거부했습니다. 스캐닝을 계속합니다.');
        await speak("알겠습니다. 다른 QR 코드를 스캔해 주세요.");
      }
    } catch (error) {
      console.error('음성 인식 결과 처리 오류:', error);
      await speak("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsListening(false);
      setIsProcessingEnabled(true);
    }
  }, [speak]);

  const renderHeader = useCallback(() => (
    <View className="flex-row mt-4 px-2 items-center z-10">
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        accessible={true}
        accessibilityLabel="뒤로 가기"
        accessibilityHint="이전 화면으로 돌아갑니다">
        <Icon
          name="arrow-back"
          size={30}
          color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
        />
      </TouchableOpacity>
      <Text
        className="text-black dark:text-white text-[24px] font-Regular ml-3"
        accessible={false}
        importantForAccessibility="no">
        QR/바코드 스캐너
      </Text>
    </View>
  ), [navigation, colorScheme]);

  return (
    <View className="flex-1 bg-default-1 dark:bg-neutral-900">
      {renderHeader()}
      <View style={styles.container}>
        <RNCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          type={RNCamera.Constants.Type.back}
          onBarCodeRead={isProcessingEnabled ? handleBarCodeScanned : null}
          captureAudio={false}
        />
        <View className="absolute top-0 left-0 right-0 z-10" style={{
          height: hp(30),
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          paddingVertical: 15,
          paddingHorizontal: 10,
        }}>
          <Text style={{fontSize: wp(4), color: 'white'}} accessible={false} importantForAccessibility="no">
            {recognizedText || 'QR 코드나 바코드를 스캔하세요...'}
          </Text>
        </View>
        {isListening && (
          <View style={styles.listeningOverlay}>
            <Text style={styles.listeningText}>듣고 있습니다...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listeningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});