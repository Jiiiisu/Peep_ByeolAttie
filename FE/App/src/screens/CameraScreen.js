import {
  View,
  Text,
  Linking,
  Image,
  ScrollView,
  NativeModules,
} from 'react-native';
import React, {useRef, useState, useCallback, useEffect} from 'react';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useFrameProcessor} from 'react-native-vision-camera';
import {runOnJS} from 'react-native-reanimated';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {Shadow} from 'react-native-shadow-2';
import {speak} from './ScheduleVoiceHandler'; // speak함수 import
import RNFS from 'react-native-fs'; // react-native-fs 임포트
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../constants/ThemeContext';

const {CustomMlkitOcrModule} = NativeModules;

export default function CameraScreen() {
  const navigation = useNavigation();
  const {colorScheme, toggleTheme} = useTheme();

  // Camera
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef(null);
  const [imageData, setImageData] = useState('');
  const [takePhotoClicked, setTakePhotoClicked] = useState(true);
  const [recognizedText, setRecognizedText] = useState('');
  const lastProcessedTime = useRef(0);
  const [serverResponse, setServerResponse] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakTimeoutRef = useRef(null);
  const lastSpokenText = useRef('');

  useEffect(() => {
    const setupCamera = async () => {
      try {
        await requestCameraPermission();
      } catch (error) {
        console.error('Setup error:', error);
      }
    };

    setupCamera();
  }, []);

  // Handler
  const requestCameraPermission = React.useCallback(async () => {
    const Permission = await Camera.requestCameraPermission();
    console.log(Permission);
    if (Permission === 'denied') {
      await Linking.openSettings();
    }
  }, []);

  // Send image to server
  const sendImageToServer = async imagePath => {
    const formData = new FormData();
    formData.append('image', {
      uri: `file://${imagePath}`,
      name: 'image.jpg',
      type: 'image/jpeg',
    });

    try {
      //'http://192.168.45.44:5000/detect' or 'http://10.30.0.179:5000/detect'
      const response = await fetch('http://10.30.0.179:5000/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log('Server response:', result.result);
      setServerResponse(result.result);
    } catch (error) {
      console.error('Error sending image to server:', error);
    }
  };

  // Capture and send image every 3 seconds
  const captureAndSendImage = useCallback(async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off',
        });

        console.log('Photo taken:', photo);
        await sendImageToServer(photo.path);
      } catch (error) {
        console.error('Error capturing or sending image:', error);
      }
    }
  }, [camera]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      captureAndSendImage();
    }, 3000); // Capture image every 3 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [captureAndSendImage]);

  const cleanRecognizedText = text => {
    // 각 줄을 개별적으로 처리
    const cleanedLines = text.split('\n').map(line => {
      // 각 줄의 앞뒤 공백 제거 및 연속된 공백을 하나로 줄임
      return line.trim().replace(/\s+/g, ' ');
    });

    // 빈 줄 제거 및 결과 합치기
    return cleanedLines.filter(line => line.length > 0).join('\n');
  };

  const processFrame = useCallback(
    async frame => {
      if (isSpeaking) {
        return; // TTS가 진행 중이면 처리 중단
      }

      try {
        const currentTime = Date.now();
        if (currentTime - lastProcessedTime.current < 3000) {
          // 3초마다 처리
          return;
        }
        lastProcessedTime.current = currentTime;

        //console.log('Processing frame:', frame);

        const photo = await camera.current.takePhoto({
          qualityPrioritization: 'quality', //빠른 속도를 위해 quality에서 speed로 수정. 'speed'와 'quality' 사이의 균형을 원하면 balanced로 수정
          flash: 'off', //off나 auto로 설정. 플래시 작동한 뒤에 초점 나가는 현장 있음
          enableAutoStabilization: true,
        });

        const tempFilePath = `${
          RNFS.CachesDirectoryPath
        }/temp_frame_${Date.now()}.jpg`;
        await RNFS.moveFile(photo.path, tempFilePath);

        console.log('Starting custom OCR detection');
        const customResult = await CustomMlkitOcrModule.recognizeText(
          tempFilePath,
        );
        console.log('Custom OCR result:', customResult.text);

        const cleanedText = cleanRecognizedText(customResult.text);
        //setRecognizedText(cleanedText || 'No text recognized');

        // 인식된 텍스트를 음성으로 출력
        if (
          cleanedText &&
          cleanedText !== 'No text recognized' &&
          cleanedText !== lastSpokenText.current
        ) {
          setIsSpeaking(true);
          lastSpokenText.current = cleanedText;
          setRecognizedText(cleanedText || 'No text recognized'); // 화면에 표시할 텍스트 업데이트

          // 7초 타이머 설정
          speakTimeoutRef.current = setTimeout(() => {
            setIsSpeaking(false);
            lastSpokenText.current = '';
          }, 7000);

          try {
            await speak(cleanedText);
          } catch (error) {
            console.error('TTS Error:', error);
          } finally {
            // speak 함수가 7초 이내에 완료되면 타이머를 취소하고 isSpeaking을 false로 설정
            clearTimeout(speakTimeoutRef.current);
            setIsSpeaking(false);
            lastSpokenText.current = '';
          }
        }

        await RNFS.unlink(tempFilePath);
      } catch (error) {
        console.error('OCR Error:', error);
        if (error.message) console.error('Error message:', error.message);
        if (error.code) console.error('Error code:', error.code);
        setRecognizedText('OCR Error occurred');
      }
    },
    [camera, isSpeaking],
  );

  useEffect(() => {
    console.log('Recognized Text:', recognizedText);

    return () => {
      // 컴포넌트 언마운트 시 타이머 정리
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
    };
  }, [recognizedText]);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    runOnJS(processFrame)(frame);
  }, []);

  const takePicture = async () => {
    if (camera != null) {
      const photo = await camera.current.takePhoto();
      const imagePath = photo.path;

      // 사진을 특정 폴더에 저장하는 로직 추가
      //const destinationPath = `${RNFS.DocumentDirectoryPath}/images/1.png`;
      const destinationPath = `${
        RNFS.DocumentDirectoryPath
      }/images/photo_${Date.now()}.png`; //매번 새로운 파일 이름으로 저장하도록 수정

      try {
        // 디렉토리 생성(존재하지 않으면)
        const dirPath = `${RNFS.DocumentDirectoryPath}/images`;
        if (!(await RNFS.exists(dirPath))) {
          await RNFS.mkdir(dirPath);
        }

        // 사진 이동
        await RNFS.moveFile(imagePath, destinationPath);
        setImageData(destinationPath);
        setTakePhotoClicked(false);

        // 이미지 전송
        console.log('사진 저장됨:', destinationPath);
      } catch (error) {
        console.log('사진 저장 중 오류 발생:', error);
      }
    }
  };

  // Render
  function renderHeader() {
    return (
      <View className="flex-row mt-4 px-2 items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          accessible={true}
          accessibilityLabel="뒤로 가기"
          accessibilityHint="홈 화면으로 돌아갑니다">
          <Icon
            name="navigate-before"
            size={30}
            color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
        <Text
          className="text-black dark:text-white text-[24px] font-Regular ml-3"
          accessible={false}>
          카메라
        </Text>
      </View>
    );
  }

  function renderCamera() {
    if (device == null) {
      return <View className="flex-1" />;
    } else {
      return (
        <View className="flex-1 pt-4">
          {takePhotoClicked ? (
            <View className="flex-1">
              {/* Camera */}
              <Camera
                className="flex-1"
                ref={camera}
                device={device}
                isActive={true}
                photo={true}
                frameProcessor={frameProcessor} //frameProcessor 추가
                frameProcessorFps={1} // 초당 1번 프레임 처리
              />

              {/* Take Photo Button */}
              <View className="absolute items-center bottom-8 left-0 right-0">
                <TouchableOpacity
                  className="rounded-full items-center justify-center bg-white"
                  style={{
                    width: wp(20),
                    height: hp(10),
                  }}
                  onPress={() => {
                    takePicture();
                  }}>
                  <Icon
                    name="camera-alt"
                    size={30}
                    color="#000"
                    accessible={false}
                  />
                </TouchableOpacity>
              </View>

              {/* Camera State */}
              <View
                className="absolute top-0 left-0 right-0 z-10"
                style={{
                  height: hp(30),
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  paddingVertical: 15,
                  paddingHorizontal: 10,
                }}>
                <ScrollView>
                  <Text
                    style={{fontSize: wp(4), color: 'white'}}
                    accessible={false}>
                    {recognizedText || 'Scanning...'}
                  </Text>
                </ScrollView>
              </View>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center">
              {imageData !== '' && (
                <Image
                  source={{uri: 'file://' + imageData}}
                  style={{width: wp(90), height: hp(70)}}
                />
              )}
              <TouchableOpacity
                className="self-center rounded border-2 justify-center items-center"
                style={{width: wp(90), height: hp(10)}}
                onPress={() => {
                  setTakePhotoClicked(true);
                }}>
                <Text accessible={false}>다시찍기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
  }

  return (
    <View className="flex-1 bg-default-1 dark:bg-neutral-900">
      {renderHeader()}
      {renderCamera()}
    </View>
  );
}
