import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation, useRoute} from '@react-navigation/native';
import hashSum from 'hash-sum';
import {handleScheduleVoice} from '../screens/ScheduleVoiceHandler';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [drugList, setDrugList] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDrugList();
      if (route.params?.startVoiceHandler) {
        setTimeout(() => {
          handleScheduleVoice(navigation, () => {});
        }, 1000); // 화면 전환 후 약간의 지연을 두고 음성 안내 시작
      }
      //handleScheduleVoice(navigation);
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const fetchDrugList = async () => {
    try {
      const storedData = await AsyncStorage.getItem('drugList');
      if (storedData) {
        setDrugList(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error fetching drug list:', error);
    }
  };

  const handleDelete = index => {
    Alert.alert('삭제 확인', '정말 삭제하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '확인',
        onPress: async () => {
          const drugToDelete = drugList[index];
          const newList = drugList.filter((_, i) => i !== index);

          setDrugList(newList);
          try {
            await AsyncStorage.setItem('drugList', JSON.stringify(newList));
            cancelNotifications(drugToDelete);
          } catch (error) {
            console.error('Error saving updated list:', error);
          }
        },
      },
    ]);
  };

  const cancelNotifications = drugInfo => {
    drugInfo.times.forEach(time => {
      drugInfo.days.forEach(day => {
        const hashId = hashSum(`${drugInfo.name}-${day}-${time}`); // 해시값 생성
        const notificationId = Math.abs(hashId.hashCode()) % 1000000; // 해시값을 6자리 숫자로 변환
        PushNotification.cancelLocalNotification({
          id: notificationId.toString(),
        });
      });
    });
  };

  // 해시값 -> 숫자
  String.prototype.hashCode = function () {
    let hash = 0,
      i,
      chr;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      hash = (hash << 5) - hash + chr; // 해시값 계산
      hash |= 0; // 32비트 정수로 변환
    }
    return hash;
  };

  const handleEdit = (item, index) => {
    navigation.navigate('Input1', {editItem: item, editIndex: index});
  };

  const formatDays = days => {
    if (!days || days.length === 0) return '정보를 불러올 수 없습니다.';
    if (days.length === 7) return '매일';
    if (days.length === 1) return `${days[0]}요일`;
    return days.join('/');
  };

  const renderItem = ({item, index}) => (
    <View className="bg-yellow-default p-5 m-2 rounded-2xl">
      <Text className="text-[28px] font-ExtraBold text-orange-default">
        {item.name}
      </Text>
      <View className="border-b-2 border-b-orange-default mt-3 mb-3" />
      <View className="flex-row justify-between items-center">
        <Text className="text-[24px] font-Bold text-orange-default">
          {formatDays(item.days)}
        </Text>
        <Text className="text-[24px] font-Bold text-orange-default">
          {item.dosage}
        </Text>
      </View>
      {item.additionalInfo && item.additionalInfo.trim() !== '' && (
        <Text className="text-[24px] font-Bold text-orange-default">
          {item.additionalInfo}
        </Text>
      )}
      <View className="flex-row justify-end mt-2">
        <TouchableOpacity
          className="bg-blue-500 p-2 rounded mr-2"
          onPress={() => handleEdit(item, index)}>
          <Text className="text-white font-bold">수정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-500 p-2 rounded"
          onPress={() => handleDelete(index)}>
          <Text className="text-white font-bold">삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 p-2 bg-default-1">
      <FlatList
        data={drugList}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
      <View className="space-y-2">
        <TouchableOpacity
          onPress={() => navigation.navigate('Input1')}
          className="bg-orange-50 p-4 rounded-xl space-y-2">
          <View className="flex-row items-center space-x-1">
            {/* 아이콘 추가 */}
            <Text
              style={{fontSize: wp(4.8)}}
              className="font-semibold text-gray-700">
              일정 추가
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
