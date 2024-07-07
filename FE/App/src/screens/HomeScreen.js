import {View, Image} from 'react-native';
import React, {useState} from 'react';
import {TouchableOpacity} from 'react-native-gesture-handler';

export default function HomeScreen() {
  const [recording, setRecording] = useState(false);
  return (
    <View>
      {/* tailwindcss 사용 안 되는 문제 발생, 문제 해결되면 버튼 3개 추가 */}
      {recording ? (
        <TouchableOpacity>
          <Image
            source={require('../../assets/images/voiceLoading.png')}
            style={{width: 100, height: 100}}
          />{' '}
          {/* png -> gif or lottie 애니메이션 추가 예정 */}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity>
          <Image
            source={require('../../assets/images/recording.png')}
            style={{width: 100, height: 100}}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
