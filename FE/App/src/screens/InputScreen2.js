import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WheelPicker from 'react-native-wheely';
import {useNavigation} from '@react-navigation/native';
import PushNotification from 'react-native-push-notification';
import Delete from '../../assets/images/Close.svg';
import Back from '../../assets/images/Back.svg';
import Close from '../../assets/images/Close.svg';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function InputScreen2({route}) {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);

    if (route.params) {
      const {name, dosage, editItem} = route.params;
      setName(name);
      setDosage(dosage);
      if (editItem) {
        const {times, days, additionalInfo} = editItem;
        setTimes(times);
        setSelectedDays(days);
        setAdditionalInfo(additionalInfo);
      }
    }
    createNotificationChannel(); // 채널 생성
  }, [route.params]);

  const createNotificationChannel = () => {
    PushNotification.createChannel({
      channelId: 'schedule-channel',
      channelName: 'Schedule Notifications',
    });
  };

  const handleSave = async () => {
    const drugInfo = {
      name,
      dosage: `1회 ${dosage}알`,
      times,
      days: selectedDays.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)),
      additionalInfo,
    };

    try {
      const existingData = await AsyncStorage.getItem('drugList');
      let drugList = existingData ? JSON.parse(existingData) : [];

      if (route.params?.editIndex !== undefined) {
        drugList[route.params.editIndex] = drugInfo;
      } else {
        drugList.push(drugInfo);
      }

      await AsyncStorage.setItem('drugList', JSON.stringify(drugList));
      scheduleNotifications(drugInfo); // 알림 예약
      navigation.navigate('Schedule');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const scheduleNotifications = drugInfo => {
    const currentDate = new Date();

    drugInfo.times.forEach(time => {
      drugInfo.days.forEach(day => {
        const notificationTime = new Date(currentDate);
        notificationTime.setHours(parseInt(time.split(':')[0]));
        notificationTime.setMinutes(parseInt(time.split(':')[1]));
        notificationTime.setSeconds(0);

        const dayIndex = DAYS.indexOf(day);
        const todayIndex = currentDate.getDay(); // 0: 일, 1: 월 ...

        // 오늘 날짜에 해당 요일이면 알림 시간에 오늘 날짜를 설정
        if (dayIndex === todayIndex) {
          if (notificationTime > currentDate) {
            PushNotification.localNotificationSchedule({
              channelId: 'schedule-channel',
              title: `약 복용 알림: ${drugInfo.name}`,
              message: `약을 복용할 시간입니다: ${time}`,
              date: notificationTime,
              allowWhileIdle: true,
              repeatType: 'week',
              userInfo: {
                drugName: drugInfo.name,
                dosage: drugInfo.dosage,
                time: time,
              },
            });
          }

          console.log(
            `알림 설정됨: ${drugInfo.name} - ${notificationTime} (오늘)`,
          );
        } else {
          // 오늘 날짜가 아닌 경우, 다음 해당 요일로 설정
          notificationTime.setDate(
            notificationTime.getDate() + ((dayIndex - todayIndex + 7) % 7),
          );
          PushNotification.localNotificationSchedule({
            channelId: 'schedule-channel',
            title: `약 복용 알림: ${drugInfo.name}`,
            message: `약을 복용할 시간입니다: ${time}`,
            date: notificationTime,
            allowWhileIdle: true,
            repeatType: 'week',
            userInfo: {
              drugName: drugInfo.name,
              dosage: drugInfo.dosage,
              time: time,
            },
          });
          console.log(
            `알림 설정됨: ${drugInfo.name} - ${notificationTime} (다음 ${day})`,
          );
        }
      });
    });
  };

  const handleAddTime = () => {
    setShowTimePicker(true);
  };

  const handleTimeSelect = () => {
    setTimes([...times, selectedTime]);
    setShowTimePicker(false);
  };

  const handleTimeDelete = time => {
    setTimes(times.filter(t => t !== time));
  };

  const toggleDay = day => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const hours = Array.from({length: 24}, (_, i) =>
    i.toString().padStart(2, '0'),
  );
  const minutes = Array.from({length: 60}, (_, i) =>
    i.toString().padStart(2, '0'),
  );

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
        <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
          <Close />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-default-1">
      {renderHeader()}
      <View className="flex-1 p-5">
        <Text className="text-black text-[24px] font-Regular">2/2</Text>
        <Text className="mb-2 text-black text-[30px] font-ExtraBold">
          복약 일정
        </Text>
        <ScrollView className="flex-1 mt-5 space-y-10">
          <View className="space-y-2">
            <Text className="mt-2 text-black text-[24px] font-Regular text-center">
              어떤 요일에 약을 복용하는지 입력해 주세요
            </Text>
            <View className="flex-row justify-between mt-2">
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedDays.includes(day)
                      ? 'bg-orange-default'
                      : 'border-2 border-default-2 '
                  }`}
                  onPress={() => toggleDay(day)}>
                  <Text
                    className={
                      selectedDays.includes(day)
                        ? 'text-white text-[24px] font-Bold text-center'
                        : 'text-black text-[24px] font-Bold text-center'
                    }>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="space-y-2">
            <Text className="mt-2 text-black text-[24px] font-Regular text-center">
              약을 복용하는 시간을 입력해 주세요
            </Text>
            {times.map((time, index) => (
              <View
                key={index}
                className="bg-default-2 p-3 rounded-full flex-row items-center justify-between mt-1">
                <Text className="text-black text-[24px] font-ExtraBold text-center flex-1">
                  {time}
                </Text>
                <TouchableOpacity onPress={() => handleTimeDelete(time)}>
                  <Delete className="w-6 h-6" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              className="bg-orange-default p-4 rounded-xl space-y-2 mt-1"
              onPress={handleAddTime}>
              <Text className=" text-white text-[24px] font-Bold text-center">
                추가
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-2">
            <Text className="mt-2 text-black text-[24px] font-Regular text-center">
              추가로 필요한 정보를 입력해 주세요
            </Text>
            <TextInput
              className="bg-default-2 p-3 rounded-full mt-1 text-center text-black text-[20px] font-ExtraBold"
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder="알레르기 정보나 주의 사항"
              multiline
            />
          </View>
        </ScrollView>

        <View className="mt-2">
          <TouchableOpacity
            className={`p-4 rounded-xl space-y-2 ${
              times.length === 0 || selectedDays.length === 0
                ? 'bg-gray-200'
                : 'bg-orange-default'
            }`}
            onPress={handleSave}
            disabled={times.length === 0 || selectedDays.length === 0}>
            <Text className="text-white text-[24px] font-Bold text-center">
              {route.params?.editIndex !== undefined ? '수정' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showTimePicker} transparent={true} animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
            <View className="flex-1 justify-end items-center bg-black/40">
              <TouchableWithoutFeedback>
                <View className="bg-white rounded-t-3xl p-5 shadow-lg w-full">
                  <View className="flex-row items-center justify-center mt-2">
                    <WheelPicker
                      selectedIndex={parseInt(selectedTime.split(':')[0])}
                      options={hours}
                      onChange={index =>
                        setSelectedTime(
                          `${hours[index]}:${selectedTime.split(':')[1]}`,
                        )
                      }
                    />
                    <Text className="text-[24px] font-Regular">:</Text>
                    <WheelPicker
                      selectedIndex={parseInt(selectedTime.split(':')[1])}
                      options={minutes}
                      onChange={index =>
                        setSelectedTime(
                          `${selectedTime.split(':')[0]}:${minutes[index]}`,
                        )
                      }
                    />
                  </View>
                  <TouchableOpacity
                    className="bg-orange-default p-4 rounded-xl space-y-2 mt-1"
                    onPress={handleTimeSelect}>
                    <Text className=" text-white text-[24px] font-Bold text-center">
                      확인
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </View>
  );
}
