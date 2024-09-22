import {View, Text, Linking, Image} from 'react-native';
import React, {useRef, useState} from 'react';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {TouchableOpacity} from 'react-native-gesture-handler';
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

  React.useEffect(() => {
    requestCameraPermission();
  }, []);

  // Handler
  const requestCameraPermission = React.useCallback(async () => {
    const Permission = await Camera.requestCameraPermission();
    console.log(Permission);
    if (Permission === 'denied') {
      await Linking.openSettings();
    }
  }, []);

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
                photo
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
                    style={{
                      width: wp(90),
                    }}>
                    <Text style={{fontSize: wp(4.8)}}> camera state </Text>
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
