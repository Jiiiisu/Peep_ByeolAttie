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
import {handleScheduleVoice} from '../screens/ScheduleVoiceHandler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Logo from '../../assets/images/Logo.svg';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [drugList, setDrugList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDrugList();

      setTimeout(() => {
        if (route.params?.startVoiceHandler) {
          handleScheduleVoice(navigation, () => {});
        } else {
          handleScheduleVoice(navigation, () => {}, false);
        }
      }, 1000);
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

  const renderItem = ({item, index}) => (
    <View className="bg-yellow-default p-5 m-2 rounded-2xl">
      <View className="flex-row justify-between">
        <Text className="text-[28px] font-ExtraBold text-orange-default">
          {item.name}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedItemIndex(index);
            setModalVisible(true);
          }}>
          <Icon name="more-vert" size={30} color="#FF9F23" />
        </TouchableOpacity>
      </View>
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
    </View>
  );

  return (
    <View className="relative flex-1 bg-default-1">
      <View className="absolute top-0 left-0 right-0 flex-row items-center justify-center my-8 z-10">
        <Logo width={wp(40)} height={hp(5)} />
      </View>
      <View className="absolute top-0 right-0 my-8 px-4 z-10">
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={drugList}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        className="p-2 mt-24"
      />
      <TouchableOpacity
        onPress={() => navigation.navigate('Input1')}
        className="bg-orange-default p-5 m-4 rounded-full self-end"
        activeOpacity={0.7}>
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
          <View className="bg-white rounded-lg p-4 m-4 absolute bottom-0 left-0 right-0">
            <TouchableOpacity
              className="p-3"
              onPress={() =>
                handleEdit(drugList[selectedItemIndex], selectedItemIndex)
              }>
              <Text className="text-lg">수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-3"
              onPress={() => handleDelete(selectedItemIndex)}>
              <Text className="text-lg text-red-500">삭제</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
