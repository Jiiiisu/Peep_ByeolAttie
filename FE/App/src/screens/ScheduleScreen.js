import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation, useRoute} from '@react-navigation/native';
import hashSum from 'hash-sum';
import {
  handleScheduleVoice,
  cleanupAndNavigate,
} from '../screens/ScheduleVoiceHandler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Logo from '../../assets/images/Logo.svg';
import {useTheme} from '../constants/ThemeContext';
import Tts from 'react-native-tts';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {colorScheme, toggleTheme} = useTheme();

  const [drugList, setDrugList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');

  useEffect(() => {
    if (route.params?.resetInputs) {
      // 입력값 초기화
      setName('');
      setDosage('');
      // 다른 필요한 상태 초기화
    }

    const unsubscribe = navigation.addListener('focus', () => {
      fetchDrugList();

      // stopTTS 파라미터 확인
      if (route.params?.stopTTS) {
        // TTS 중지 및 파라미터 제거
        Tts.stop();
        navigation.setParams({ stopTTS: undefined });
      } else {
        setTimeout(() => {
          if (route.params?.startVoiceHandler) {
            handleScheduleVoice(navigation, () => {});
          } else {
            handleScheduleVoice(navigation, () => {}, false);
          }
        }, 1000);
      }
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
    setModalVisible(false);
  };

  const cancelNotifications = drugInfo => {
    drugInfo.times.forEach(time => {
      drugInfo.days.forEach(day => {
        const hashId = hashSum(`${drugInfo.name}-${day}-${time}`);
        const notificationId = Math.abs(hashId.hashCode()) % 1000000;
        PushNotification.cancelLocalNotification({
          id: notificationId.toString(),
        });
      });
    });
  };

  String.prototype.hashCode = function () {
    let hash = 0,
      i,
      chr;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return hash;
  };

  const handleEdit = (item, index) => {
    navigation.navigate('Input1', {editItem: item, editIndex: index});
    setModalVisible(false);
  };

  const formatDays = days => {
    if (!days || days.length === 0) return '정보를 불러올 수 없습니다.';
    if (days.length === 7) return '매일';
    if (days.length === 1) return `${days[0]}요일`;
    return days.join('/');
  };

  const handleAddMedication = (isVoiceMode = false) => {
    cleanupAndNavigate(navigation, () => {}, 'Input1', {
      resetInputs: true,
      isVoiceMode,
    });
  };

  const renderItem = ({item, index}) => (
    <View
      className="bg-orange-100 dark:bg-gray-800 p-5 m-2 rounded-2xl"
      accessible={true}
      accessibilityLabel={`약 이름:${item.name}
      복용 요일:${formatDays(item.days)}
      복용량:${item.dosage}`}>
      <View className="flex-row justify-between">
        <Text
          className="text-[28px] font-ExtraBold text-orange-default dark:text-white"
          accessible={false}>
          {item.name}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedItemIndex(index);
            setModalVisible(true);
          }}
          accessibilityLabel="더 보기 버튼"
          accessibilityHint="이 항목에 대한 추가 옵션을 엽니다.">
          <Icon
            name="more-vert"
            size={30}
            color={colorScheme === 'dark' ? '#fff' : '#FF9F23'}
          />
        </TouchableOpacity>
      </View>
      <View className="border-b-2 border-b-orange-default dark:border-b-white mt-3 mb-3" />
      <View className="flex-row justify-between items-center">
        <Text
          className="text-[24px] font-Bold text-orange-default dark:text-white"
          accessible={false}>
          {formatDays(item.days)}
        </Text>
        <Text
          className="text-[24px] font-Bold text-orange-default dark:text-white"
          accessible={false}>
          {item.dosage}
        </Text>
      </View>
      {item.additionalInfo && item.additionalInfo.trim() !== '' && (
        <Text
          className="text-[24px] font-Bold text-orange-default dark:text-white"
          accessible={false}>
          ※{item.additionalInfo}
        </Text>
      )}
    </View>
  );

  return (
    <View className="relative flex-1 bg-default-1 dark:bg-neutral-900">
      <View className="absolute top-0 left-0 right-0 flex-row items-center justify-center my-8 z-10">
        <Text
          className="text-orange-default dark:text-white text-[32px] font-ExtraBold"
          accessible={false}
          importantForAccessibility="no">
          삐약삐약
        </Text>
      </View>
      <View className="absolute top-0 right-0 my-8 px-4 z-10">
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          accessibilityLabel="메뉴 열기"
          accessibilityHint="앱의 메뉴를 엽니다">
          <Icon
            name="menu"
            size={30}
            color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
      </View>
      <FlatList
        data={drugList}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        className="p-2 mt-24"
      />
      <TouchableOpacity
        onPress={() => handleAddMedication(false)}
        className="bg-orange-default dark:bg-orange-600 p-5 m-4 rounded-full self-end"
        activeOpacity={0.7}
        accessibilityLabel="일정 추가 버튼"
        accessibilityHint="일정을 추가합니다">
        <View className="flex-row items-center space-x-1">
          <Icon name="add" size={30} color="#fff" />
        </View>
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}>
          <View className="bg-white dark:bg-neutral-800 rounded-lg p-4 m-4 absolute bottom-0 left-0 right-0">
            <TouchableOpacity
              className="p-3 w-full"
              onPress={() =>
                handleEdit(drugList[selectedItemIndex], selectedItemIndex)
              }
              accessibilityLabel="일정 수정 버튼"
              accessibilityHint="일정을 수정합니다">
              <Text
                className="text-[24px] font-Regular text-center text-blue-500 dark:text-blue-400"
                accessible={false}>
                수정
              </Text>
            </TouchableOpacity>
            <View className="border-b-2 border-gray-200 dark:border-gray-600 mt-2 mb-2" />
            <TouchableOpacity
              className="p-3 w-full"
              onPress={() => handleDelete(selectedItemIndex)}
              accessibilityLabel="일정 삭제 버튼"
              accessibilityHint="일정을 삭제합니다">
              <Text
                className="text-[24px] font-Regular text-center text-red-500 dark:text-red-400"
                accessible={false}>
                삭제
              </Text>
            </TouchableOpacity>
            <View className="border-b-2 border-gray-200 dark:border-gray-600 mt-2 mb-2" />
            <TouchableOpacity
              className="p-3 w-full"
              onPress={() => setModalVisible(false)}
              accessibilityLabel="닫기 버튼"
              accessibilityHint="더보기 메뉴를 닫습니다">
              <Text
                className="text-[24px] font-Regular text-center text-black dark:text-white"
                accessible={false}>
                닫기
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
