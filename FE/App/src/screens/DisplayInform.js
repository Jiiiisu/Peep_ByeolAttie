import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {GetInfoByName, GetDetailedInfo} from './getInform';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {speak} from './ScheduleVoiceHandler';
import {useTTS} from '../constants/TTSContext';

const DisplayInform = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const {isTTSEnabled} = useTTS();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [className, setClassName] = useState('');
  const [efcyQesitm, setEfcyQesitm] = useState('');
  const [useMethodQesitm, setUseMethodQesitm] = useState('');
  const [atpnWarnQesitm, setAtpnWarnQesitm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const nameOfMDN = '지엘타이밍정';
      try {
        const infoResult = await GetInfoByName(nameOfMDN);
        const detailResult = await GetDetailedInfo(nameOfMDN);

        const splitInfo = infoResult.split('^');
        const splitDetail = detailResult.split('^');

        setName(splitInfo[0] || '');
        setImage(splitInfo[3] || '');
        setClassName(splitInfo[4] || '');

        setEfcyQesitm(splitDetail[1] || '');
        setUseMethodQesitm(splitDetail[2] || '');
        setAtpnWarnQesitm(splitDetail[3] || '');
      } catch (err) {
        setError('약물 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    if (!loading && isTTSEnabled) {
      startSpeak();
    }
  }, [loading, isTTSEnabled]);

  const startSpeak = async () => {
    const fullText = `${name}. 이 약은 ${className}입니다. 
    효능: ${efcyQesitm}
    사용법: ${useMethodQesitm}`;
    speak(fullText);
  };

  // Render
  function renderHeader() {
    return (
      <View className="flex-row mt-4 px-2 items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="뒤로 가기"
          accessibilityHint="이전 화면으로 돌아갑니다">
          <Icon name="navigate-before" size={30} color="#000" />
        </TouchableOpacity>
        <Text className="text-black text-[24px] font-Regular ml-3">
          상세 정보
        </Text>
      </View>
    );
  }

  if (loading)
    return (
      <View className="flex-1 bg-default-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FF9F23" />
      </View>
    );
  if (error)
    return <Text className="text-black text-[24px] font-Regular">{error}</Text>;

  return (
    <View className="flex-1 bg-default-1">
      {renderHeader()}
      <ScrollView
        ref={scrollViewRef}
        className="px-5 flex-1"
        contentContainerStyle={{paddingBottom: 20}}>
        {image && (
          <Image
            source={{uri: image}}
            className="mb-2 self-center"
            resizeMode="contain"
            style={{width: wp(60), height: hp(20)}}
          />
        )}

        {name && (
          <Text
            className="text-black text-[30px] font-ExtraBold mb-4 self-center"
            accessible={false}>
            {name}
          </Text>
        )}

        <InfoSection title="분류" content={className} />
        <InfoSection title="효능" content={efcyQesitm} />
        <InfoSection title="사용법" content={useMethodQesitm} />
        {atpnWarnQesitm && (
          <InfoSection title="경고" content={atpnWarnQesitm} />
        )}
      </ScrollView>

      <View className="px-5">
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          className="bg-orange-default p-4 mb-8 rounded-xl"
          accessible={true}
          accessibilityLabel="확인"
          accessibilityHint="홈 화면으로 돌아갑니다">
          <Text
            className="text-white text-[24px] font-ExtraBold self-center"
            accessible={false}>
            확인
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const InfoSection = ({title, content, onPress}) => {
  if (!content) return null;
  return (
    <View className="flex-1 mb-4 bg-white rounded-lg p-4 shadow-md">
      <Text
        className="text-black text-[26px] font-Bold mb-2"
        accessible={false}>
        {title}
      </Text>
      <Text
        className="text-gray-800 text-[24px] font-Regular leading-8"
        accessible={false}>
        {content}
      </Text>
    </View>
  );
};

export default DisplayInform;
