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
    if (Permission === 'denied') await Linking.openSettings();
  }, []);

  const takePicture = async () => {
    if (camera != null) {
      const photo = await camera.current.takePhoto();
      setImageData(photo.path);
      setTakePhotoClicked(false);
      console.log(photo.path);
    }
  };

  // Render
  function renderHeader() {
    return (
      <View
        className="flex-row py-4 items-center bg-white z-10"
        style={{
          paddingHorizontal: 10,
        }}>
        {/* Close Button */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{fontSize: wp(4.8)}}>X</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text className="flex-1 mx-5 font-bold" style={{fontSize: wp(4.8)}}>
          Camera
        </Text>
      </View>
    );
  }

  function renderCamera() {
    if (device == null) {
      return <View className="flex-1"></View>;
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
