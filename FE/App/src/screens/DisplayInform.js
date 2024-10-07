import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {ScrollView} from 'react-native-gesture-handler';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {GetInfoByName, GetDetailedInfo} from './getInform';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {speak} from './ScheduleVoiceHandler';
import {useTheme} from '../constants/ThemeContext';

const DisplayInform = ({route}) => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const {colorScheme} = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [className, setClassName] = useState('');
  const [efcyQesitm, setEfcyQesitm] = useState('');
  const [useMethodQesitm, setUseMethodQesitm] = useState('');
  const [atpnWarnQesitm, setAtpnWarnQesitm] = useState('');

  const fetchData = async medicineName => {
    setLoading(true);
    setError(null);
    try {
      const infoResult = await GetInfoByName(medicineName);
      const detailResult = await GetDetailedInfo(medicineName);

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

  const startSpeak = async () => {
    const fullText = `${name}. 이 약은 ${className}입니다. 
    효능: ${efcyQesitm}
    사용법: ${useMethodQesitm}`;
    speak(fullText);
  };

  useFocusEffect(
    useCallback(() => {
      const medicineName = route.params?.medicineName;
      if (medicineName) {
        fetchData(medicineName);
      }
    }, [route.params?.medicineName]),
  );

  useEffect(() => {
    if (!loading && !error) {
      startSpeak();
    }
  }, [loading, error, name, className, efcyQesitm, useMethodQesitm]);

  if (loading)
    return (
      <View className="flex-1 bg-default-1 dark:bg-neutral-900 items-center justify-center">
        <ActivityIndicator
          size="large"
          color={colorScheme ? '#FF9F23' : '#EA580C'}
        />
      </View>
    );
  if (error)
    return (
      <View className="flex-1 bg-default-1 dark:bg-neutral-900 items-center justify-center">
        <Text
          className="text-black dark:text-white text-[24px] pb-2 font-Regular"
          accessible={false}
          importantForAccessibility="no">
          {error}
        </Text>
        <Text
          className="text-black dark:text-white text-[24px] font-Regular"
          accessible={false}
          importantForAccessibility="no">
          앱을 다시 시작해주세요
        </Text>
      </View>
    );

  // Render
  function renderHeader() {
    return (
      <View className="flex-row mt-4 px-2 items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="뒤로 가기"
          accessibilityHint="이전 화면으로 돌아갑니다">
          <Icon
            name="navigate-before"
            size={30}
            color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
        <Text
          className="text-black dark:text-white text-[24px] font-Regular ml-3"
          accessible={false}
          importantForAccessibility="no">
          상세 정보
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-default-1 dark:bg-neutral-900">
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
            className="text-black dark:text-white text-[30px] font-ExtraBold mb-4 self-center"
            accessible={false}
            importantForAccessibility="no">
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
          className="bg-orange-default dark:bg-orange-600 p-4 mb-8 rounded-xl"
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

const InfoSection = ({title, content}) => {
  if (!content) return null;
  return (
    <View className="flex-1 mb-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <Text
        className="text-black dark:text-white text-[26px] font-Bold mb-2"
        accessible={false}
        importantForAccessibility="no">
        {title}
      </Text>
      <Text
        className="text-gray-800 dark:text-gray-200 text-[24px] font-Regular leading-8"
        accessible={false}
        importantForAccessibility="no">
        {content}
      </Text>
    </View>
  );
};

export default DisplayInform;
