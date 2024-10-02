import React, {useState, useEffect} from 'react';
import {View, Text, Image} from 'react-native';
import {GetInfoByName, GetDetailedInfo} from './getInform';
import {ScrollView} from 'react-native-gesture-handler';

const DisplayInform = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [className, setClassName] = useState('');
  const [detail, setDetail] = useState('');

  const [efcyQesitm, setEfcyQesitm] = useState('');
  const [useMethodQesitm, setUseMethodQesitm] = useState('');
  const [atpnWarnQesitm, setAtpnWarnQesitm] = useState('');
  const [atpnQesitm, setAtpnQesitm] = useState('');
  const [intrcQesitm, setIntrcQesitm] = useState('');
  const [seQesitm, setSeQesitm] = useState('');
  const [depositMethodQesitm, setDepositMethodQesitm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const nameOfMDN = '게루삼정';
      try {
        const infoResult = await GetInfoByName(nameOfMDN);
        const detailResult = await GetDetailedInfo(nameOfMDN);

        const splitInfo = infoResult.split('^');
        const splitDetail = detailResult.split('^');

        setName(splitInfo[0] || '');
        setImage(splitInfo[3] || '');
        setClassName(splitInfo[4] || '');

        setDetail(detailResult);

        setEfcyQesitm(splitDetail[1] || '');
        setUseMethodQesitm(splitDetail[2] || '');
        setAtpnWarnQesitm(splitDetail[3] || '');
        setAtpnQesitm(splitDetail[4] || '');
        setIntrcQesitm(splitDetail[5] || '');
        setSeQesitm(splitDetail[6] || '');
        setDepositMethodQesitm(splitDetail[7] || '');
      } catch (err) {
        setError('약물 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Text>로딩 중...</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <View className="flex-1 p-4 bg-default-1">
      {name && (
        <Text className="text-2xl font-bold mb-4 text-gray-800">{name}</Text>
      )}

      {image && (
        <Image
          source={{uri: image}}
          className="w-full h-48 mb-4"
          resizeMode="contain"
        />
      )}

      {detail ? (
        <ScrollView className="flex-1">
          <InfoSection title="분류" content={className} />
          <InfoSection title="효능" content={efcyQesitm} />
          <InfoSection title="사용법" content={useMethodQesitm} />
          {atpnWarnQesitm && (
            <InfoSection title="경고" content={atpnWarnQesitm} />
          )}
          <InfoSection title="주의사항" content={atpnQesitm} />
          <InfoSection title="상호작용" content={intrcQesitm} />
          <InfoSection title="부작용" content={seQesitm} />
          <InfoSection title="보관방법" content={depositMethodQesitm} />
        </ScrollView>
      ) : (
        <Text>약물 정보가 없습니다.</Text>
      )}
    </View>
  );
};

const InfoSection = ({title, content}) => {
  if (!content) return null;
  return (
    <View className="mb-4 bg-white rounded-lg p-4 shadow-md">
      <Text className="text-xl font-bold mb-2 text-gray-700">{title}</Text>
      <Text className="text-base text-gray-600 leading-6">{content}</Text>
    </View>
  );
};

export default DisplayInform;
