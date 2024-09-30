import {View, Text, Linking, Image} from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {TouchableOpacity} from 'react-native-gesture-handler';
import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import MlkitOcr from 'react-native-mlkit-ocr';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {Shadow} from 'react-native-shadow-2';
import Back from '../../assets/images/Back.svg';

import RNFS from 'react-native-fs'; // react-native-fs 임포트

export default function CameraScreen() {
  const navigation = useNavigation();

  // Camera
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef(null);
  const [imageData, setImageData] = useState('');
  const [takePhotoClicked, setTakePhotoClicked] = useState(true);
  const [recognizedText, setRecognizedText] = useState('');
  const lastProcessedTime = useRef(0);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        await requestCameraPermission();
        await initializeOcr();
        // RNFS.requestPermission() 제거
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

  const checkMlkitOcr = async () => {
    try {
      const isAvailable = await MlkitOcr.isAvailable();
      console.log('MlkitOcr is available:', isAvailable);
    } catch (error) {
      console.error('Error checking MlkitOcr availability:', error);
    }
  };

  const initializeOcr = async () => {
    try {
      await MlkitOcr.init();
      console.log('MlkitOcr initialized');
      const result = await MlkitOcr.downloadModel('ko');
      console.log('Korean model download result:', result);

      // 모델 가용성 확인
      const availableModels = await MlkitOcr.getAvailableModels();
      console.log('Available models:', availableModels);
    } catch (error) {
      console.error('Error initializing MlkitOcr:', error);
    }
  };

  // 이미지를 서버로 옮기는 함수
  /*
  const sendImageToServer = async imagePath => {
    const formData = new FormData();
    formData.append('image', {
      uri: `file://${imagePath}`,
      name: '1.png',
      type: 'image/png',
    });

    try {
      const response = await fetch('http://10.0.2.2:3000/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log('Predicted class:', result.predictedClass);
    } catch (error) {
      console.error('Error sending image to server:', error);
    }
  };
   */

  const processFrame = useCallback(async (frame) => {
    try {
      const currentTime = Date.now();
      if (currentTime - lastProcessedTime.current < 2000) {
        // 2초마다 처리
        return;
      }
      lastProcessedTime.current = currentTime;

      console.log('Processing frame:', frame);

    // frame.toBase64() 대신 다른 방법 사용
    const tempFilePath = `${RNFS.CachesDirectoryPath}/temp_frame.jpg`;
    //await RNFS.writeFile(tempFilePath, frame.toBase64(), 'base64');
    //console.log('Temp file created:', tempFilePath);

    // VisionCamera의 takePhoto 메서드 사용
    const photo = await camera.current.takePhoto({
      qualityPrioritization: 'quality', // 'speed'에서 'quality'로 변경 
      flash: 'auto', // 'off'에서 'auto'로 변경
      enableAutoStabilization: true,
    });
    
    console.log('Photo taken:', photo);

    // 파일 이동
    await RNFS.moveFile(photo.path, tempFilePath);
    console.log('Temp file created:', tempFilePath);

    //const result = await MlkitOcr.detectFromUri(`file://${tempFilePath}`);
    const result = await MlkitOcr.detectFromUri(`file://${tempFilePath}`, {
      languages: ['ko', 'en'], // 한국어와 영어 모두 인식
      useGoogleCloudAPIs: false,
      shouldDetectBoundingBoxes: true,
      minimumTextHeight: 10,
    })
    console.log('OCR result:', result);

    await RNFS.unlink(tempFilePath);
    console.log('Temp file deleted');

    if (result && Array.isArray(result) && result.length > 0) {
      const text = result.map(block => block.text).join(' ');
      setRecognizedText(text);
    } else {
      setRecognizedText('No text recognized');
    }
  } catch (error) {
    console.error('OCR Error:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error.stack);
    setRecognizedText('OCR Error occurred');
    }
  }, [camera]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    runOnJS(processFrame)(frame);
  }, []);

  const takePicture = async () => {
    if (camera != null) {
      const photo = await camera.current.takePhoto();
      const imagePath = photo.path;

      // 사진을 특정 폴더에 저장하는 로직 추가
      const destinationPath = `${RNFS.DocumentDirectoryPath}/images/1.png`;
      const targetPath = `${RNFS.DocumentDirectoryPath}/your_project_folder/images/1.png`;

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
      <View
        className="flex-row p-4 items-center justify-between z-10"
        style={{
          paddingHorizontal: 10,
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Back />
        </TouchableOpacity>
      </View>
    );
  }

  function renderCamera() {
    if (device == null) {
      return <View className="flex-1" />;
    } else {
      return (
        <View className="flex-1">
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
                frameProcessorFps={1}
              />

              {/* Take Photo Button */}
              <View className="absolute items-center bottom-8 left-0 right-0">
                <TouchableOpacity
                  className="rounded-full items-center justify-center bg-white"
                  style={{
                    width: wp(17),
                    height: hp(10),
                  }}
                  onPress={() => {
                    takePicture();
                  }}>
                  <Text style={{fontSize: wp(4.8)}}>O</Text>
                </TouchableOpacity>
              </View>

              {/* Camera State */}
              <View
                className="absolute top-0 left-0 right-0 items-center z-10"
                style={{
                  height: hp(15),
                  paddingVertical: 15,
                }}>
                <Shadow>
                <View
                  className="flex-1 items-center justify-center rounded-2xl bg-white"
                  style={{ width: wp(90) }}
                >
                  <Text style={{ fontSize: wp(4), color: 'black', textAlign: 'center' }}>
                    {typeof recognizedText === 'string' ? recognizedText : 'Scanning...'}
                  </Text>
                </View>
              </Shadow>
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
                <Text>다시찍기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
  }

  return (
    <View className="flex-1">
      {renderHeader()}
      {renderCamera()}
    </View>
  );
}