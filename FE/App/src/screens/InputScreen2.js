import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  ToastAndroid,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import PushNotification from 'react-native-push-notification';
import Voice from '@react-native-voice/voice';
import hashSum from 'hash-sum';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TimePicker from '../components/TimePicker';
import {useTheme} from '../constants/ThemeContext';
import {useSpeech} from '../constants/SpeechContext';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function InputScreen2({route}) {
  const navigation = useNavigation();
  const {colorScheme, toggleTheme} = useTheme();
  const {speak, stopSpeech} = useSpeech();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentStep, setCurrentStep] = useState('days');

  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);

    // 하드웨어 백 버튼 이벤트 처리
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleGoBack,
    );

    if (route.params) {
      const {name, dosage, editItem, isVoiceMode: voiceMode} = route.params;
      setName(name);
      setDosage(dosage);
      setIsVoiceMode(voiceMode);
      if (editItem) {
        const {times, days, additionalInfo} = editItem;
        setTimes(times);
        setSelectedDays(days);
        setAdditionalInfo(additionalInfo);
      }
    }
    createNotificationChannel(); // 채널 생성
    initVoice();

    if (isVoiceMode) {
      startVoiceInput();
    }

    return () => {
      backHandler.remove(); // 이벤트 리스너 제거
    };
  }, [route.params, isVoiceMode, currentStep, handleGoBack]);

  const initVoice = async () => {
    try {
      await Voice.destroy();
      await Voice.removeAllListeners();
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
    } catch (e) {
      console.error('Failed to init Voice module', e);
    }
  };

  const createNotificationChannel = () => {
    PushNotification.createChannel({
      channelId: 'schedule-channel',
      channelName: 'Schedule Notifications',
    });
  };

  const startVoiceInput = async () => {
    console.log('Starting voice input for step:', currentStep);
    let message = '';
    switch (currentStep) {
      case 'days':
        message =
          '어떤 요일에 약을 복용하는지 말씀해 주세요. 예를 들어, 월수금, 일주일';
        break;
      case 'times':
        message =
          '약을 복용하는 시간을 말씀해 주세요. 예를 들어 23시, 저녁 7시';
        break;
      case 'additionalTime':
        message = '예약 시간을 추가하시려면 추가, 없으시면 다음을 말씀해주세요';
        break;
      case 'additionalInfo':
        message =
          '추가로 필요한 정보를 말씀해 주세요. 알레르기 정보나 주의 사항, 복용 주기 등';
        break;
      case 'confirmation':
        message = '저장하시겠습니까? 저장 또는 아니오로 대답해 주세요.';
        break;
    }

    try {
      await speak(message);
      setTimeout(() => startListening(), 500); // TTS 종료 후 약간의 지연을 두고 음성 인식 시작
    } catch (error) {
      console.error('Error in startVoiceInput:', error);
      startListening();
    }
  };

  const startListening = async () => {
    try {
      await Voice.start('ko-KR');
    } catch (e) {
      console.error('Failed to start voice recognition', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Failed to stop voice recognition', e);
    }
  };

  const onSpeechResults = e => {
    //시스템 콜백 함수(다른 함수에서 따로 호출하지 않음)
    if (e.value && e.value.length > 0) {
      const result = e.value[0].toLowerCase();
      console.log('Recognized speech:', result);
      handleVoiceInput(result);
    }
  };

  const onSpeechError = useCallback(
    async e => {
      console.error('Speech recognition error:', e);
      if (e.error.code === '7' || e.error.code === '5') {
        console.log('No speech input detected. Restarting voice recognition.');
        ToastAndroid.show(
          '죄송합니다. 다시 한 번 말씀해 주세요.',
          ToastAndroid.SHORT,
        );
        console.log('No speech results');
        try {
          await speak('음성이 인식되지 않았습니다. 다시 말씀해 주세요.');
          console.log('TTS finished, restarting voice input');
          await startVoiceInput();
        } catch (error) {
          console.error('Error in speech error handling:', error);
        }
      } else {
        ToastAndroid.show(
          '음성 인식 중 문제가 발생했습니다. 다시 시도합니다.',
          ToastAndroid.SHORT,
        );
        await startVoiceInput();
      }
    },
    [startVoiceInput],
  );

  const handleVoiceInput = input => {
    switch (currentStep) {
      case 'days':
        handleDaysInput(input);
        break;
      case 'times':
        handleTimesInput(input);
        break;
      case 'additionalTime':
        handleAdditionalTimeInput(input);
        break;
      case 'additionalInfo':
        handleAdditionalInfoInput(input);
        break;
      case 'confirmation':
        handleConfirmation(input);
        break;
    }
  };

  const handleDaysInput = input => {
    const recognizedDays = input
      .toLowerCase()
      .split(/[,\s]+/)
      .map(day => day.replace(/요일/g, ''));

    if (recognizedDays.includes('일주일')) {
      //매일은 발음이 너무 어려움
      setSelectedDays(DAYS);
      console.log('일주일로 설정되었습니다.');
      setCurrentStep('times');
      //setTimeout(() => startVoiceInput(), 1000);
      return;
    }

    const validDays = recognizedDays.filter(day => DAYS.includes(day));

    if (validDays.length > 0) {
      console.log('요일을 입력받았습니다. 다음 질문으로 넘어갑니다');
      validDays.forEach(day => toggleDay(day));
      setCurrentStep('times');
      //setTimeout(() => startVoiceInput(), 1000);
    } else {
      speak(
        '인식된 요일이 없습니다. 어떤 요일에 약을 복용하는지 다시 말씀해 주세요.',
      );
      setTimeout(() => startListening(), 3000);
    }
  };

  const handleTimesInput = async input => {
    const timeKeywords = {
      아침: '08:00',
      점심: '12:00',
      저녁: '19:00',
    };

    const koreanToArabic = koreanNumber => {
      const koreanNumbers = {
        일: 1,
        이: 2,
        삼: 3,
        사: 4,
        오: 5,
        육: 6,
        칠: 7,
        팔: 8,
        구: 9,
        십: 10,
        십일: 11,
        십이: 12,
        십삼: 13,
        십사: 14,
        십오: 15,
        십육: 16,
        십칠: 17,
        십팔: 18,
        십구: 19,
        이십: 20,
        이십일: 21,
        이십이: 22,
        이십삼: 23,
        이십사: 24,
        한: 1,
        두: 2,
        세: 3,
        네: 4,
        다섯: 5,
        여섯: 6,
        일곱: 7,
        여덟: 8,
        아홉: 9,
        열: 10,
        열한: 11,
        열두: 12,
        열세: 13,
        열네: 14,
        열다섯: 15,
        열여섯: 16,
        열일곱: 17,
        열여덟: 18,
        열아홉: 19,
        스물: 20,
        스물한: 21,
        스물두: 22,
        스물세: 23,
        스물네: 24,
      };
      return koreanNumbers[koreanNumber] || parseInt(koreanNumber);
    };

    const convertTime = (hours, minutes, period) => {
      hours = koreanToArabic(hours);
      minutes = minutes ? koreanToArabic(minutes) : 0;

      if (period === '오후' || period === '저녁' || period === '밤') {
        if (hours < 12) hours += 12;
      } else if (period === '오전' || period === '아침' || period === '새벽') {
        if (hours === 12) hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    };

    const processTimePhrase = phrase => {
      if (timeKeywords[phrase]) {
        return timeKeywords[phrase];
      }

      const match = phrase.match(
        /^(아침|점심|저녁|오전|오후|밤|새벽)?\s*(\d{1,2}|[일이삼사오육칠팔구십]+)시\s*(반|(\d{1,2}|[일이삼사오육칠팔구십]+)\s*분?)?$/,
      );
      if (match) {
        const [_, period, hours, minutesPart] = match;
        let processedMinutes = 0;
        if (minutesPart) {
          if (minutesPart === '반') {
            processedMinutes = 30;
          } else {
            processedMinutes = koreanToArabic(
              minutesPart.replace(/\s*분?$/, ''),
            );
          }
        }
        return convertTime(hours, processedMinutes, period);
      }

      return null;
    };

    const processPairKeywords = (word1, word2) => {
      if (timeKeywords[word1] && timeKeywords[word2]) {
        return [timeKeywords[word1], timeKeywords[word2]];
      }
      return null;
    };

    const times = input
      .toLowerCase()
      .split(/[,]+/)
      .map(t => t.trim());

    const convertedTimes = times.flatMap(phrase => {
      const time = processTimePhrase(phrase);
      return time ? [time] : [];
    });

    if (convertedTimes.length > 0) {
      console.log('시간을 입력받았습니다. 다음 질문으로 넘어갑니다');
      console.log('인식된 시간:', convertedTimes);

      setTimes(prevTimes => {
        const updatedTimes = [...prevTimes, ...convertedTimes];
        console.log('업데이트된 시간 목록:', updatedTimes);
        return updatedTimes;
      });

      await setCurrentStep('additionalTime'); // 추가 시간 입력 단계로 변경
      //startVoiceInput(); // 다음 단계로 진행
    } else {
      await speak(
        '인식된 시간이 없습니다. 약을 복용하는 시간을 다시 말씀해 주세요.',
      );
      setTimeout(() => startListening(), 3000);
    }
  };

  const handleAdditionalTimeInput = async input => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('추가')) {
      await setCurrentStep('times'); // 다시 시간 입력 단계로
    } else if (lowerInput.includes('다음') || lowerInput.includes('아니요')) {
      await setCurrentStep('additionalInfo'); // 여기서 additionalInfo 단계로 넘어감
    } else {
      await speak('추가 또는 다음이라고 말씀해 주세요.');
    }
  };

  const handleAdditionalInfoInput = async input => {
    setAdditionalInfo(input);
    console.log('추가 정보 입력 완료');

    await setCurrentStep('confirmation'); //await로 상태를 변환한 뒤에 TTS출력 가능함
  };

  const handleConfirmation = input => {
    const lowerInput = input.toLowerCase();
    if (
      lowerInput.includes('저장') ||
      lowerInput.includes('자장') ||
      lowerInput.includes('저자') ||
      lowerInput.includes('예')
    ) {
      handleSave();
    } else if (
      lowerInput.includes('아니') ||
      lowerInput.includes('아니오') ||
      lowerInput.includes('아니요') ||
      lowerInput.includes('노')
    ) {
      speak('입력이 취소되었습니다. 일정 페이지로 돌아갑니다.');
      setTimeout(() => {
        navigation.navigate('Schedule', {startVoiceHandler: true});
      }, 2000);
    } else {
      speak('저장 또는 아니오로 대답해 주세요.');
      setTimeout(() => startListening(), 3000);
    }
  };

  const resetInputs = () => {
    setSelectedDays([]);
    setTimes([]);
    setAdditionalInfo('');
  };

  const resetVoiceState = () => {
    setIsVoiceMode(false);
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
        cancelNotifications(drugList[route.params.editIndex]); // 알림 삭제
        drugList[route.params.editIndex] = drugInfo;
      } else {
        drugList.push(drugInfo);
      }

      await AsyncStorage.setItem('drugList', JSON.stringify(drugList));
      scheduleNotifications(drugInfo); // 알림 예약
      if (isVoiceMode) {
        await speak('약 정보가 저장되었습니다. 일정 페이지로 돌아갑니다.');
      }
      // 네비게이션 수정 및 파라미터 초기화
      navigation.navigate('Schedule', {
        resetInputs: true,
        name: '',
        dosage: '',
        isVoiceMode: true,
      });
      //navigation.navigate('Schedule');
    } catch (error) {
      console.error('Error saving data:', error);
      if (isVoiceMode) {
        speak('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
        startVoiceInput();
      }
    }
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

  const scheduleNotifications = drugInfo => {
    const currentDate = new Date();

    drugInfo.times.forEach((time, timeIndex) => {
      drugInfo.days.forEach((day, dayIndex) => {
        const notificationTime = new Date(currentDate);
        notificationTime.setHours(parseInt(time.split(':')[0]));
        notificationTime.setMinutes(parseInt(time.split(':')[1]));
        notificationTime.setSeconds(0);

        const dayIndexValue = DAYS.indexOf(day);
        const todayIndex = currentDate.getDay(); // 0: 일, 1: 월 ...

        const hashId = hashSum(`${drugInfo.name}-${day}-${time}`); // 해시값 생성
        const notificationId = Math.abs(hashId.hashCode()) % 1000000; // 해시값을 6자리 숫자로 변환

        // 오늘 날짜에 해당 요일이면 알림 시간에 오늘 날짜를 설정
        if (dayIndexValue === todayIndex) {
          if (notificationTime > currentDate) {
            // 현재 시간이 알림 시간보다 빠르면 오늘로 설정
            scheduleNotification(
              notificationId,
              drugInfo,
              notificationTime,
              time,
              '오늘',
            );
          } else {
            // 현재 시간이 알림 시간보다 느리면 다음 해당 요일로 설정
            notificationTime.setDate(notificationTime.getDate() + 7);
            scheduleNotification(
              notificationId,
              drugInfo,
              notificationTime,
              time,
              `다음 ${day}`,
            );
          }
        } else {
          // 오늘 날짜가 아닌 경우, 다음 해당 요일로 설정
          notificationTime.setDate(
            notificationTime.getDate() + ((dayIndexValue - todayIndex + 7) % 7),
          );
          scheduleNotification(
            notificationId,
            drugInfo,
            notificationTime,
            time,
            `다음 ${day}`,
          );
        }
      });
    });
  };

  const scheduleNotification = (
    notificationId,
    drugInfo,
    notificationTime,
    time,
    dayLabel,
  ) => {
    PushNotification.localNotificationSchedule({
      channelId: 'schedule-channel',
      id: notificationId.toString(),
      title: `삐약삐약`,
      message: `${drugInfo.name} 복용 시간입니다!`,
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
      `${notificationId}: ${drugInfo.name} - ${notificationTime} (${dayLabel})`,
    );
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

  const handleAddTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
    setShowTimePicker(true);
  };

  const handleTimeSelect = () => {
    setTimes(prevTimes => [...prevTimes, selectedTime]);
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

  // 뒤로 가기 버튼 처리 (기존 함수를 수정)
  const handleGoBack = useCallback(() => {
    navigation.navigate('Input1', {
      name: route.params?.name,
      dosage: route.params?.dosage,
      isVoiceMode: route.params?.isVoiceMode,
    });
    return true; // 이벤트를 소비했음을 나타냄
  }, [navigation, route.params]);

  // Render
  function renderHeader() {
    return (
      <View className="flex-row mt-8 px-4 items-center justify-between z-10">
        <TouchableOpacity
          onPress={handleGoBack}
          accessibilityLabel="뒤로 가기"
          accessibilityHint="약 이름과 복용량을 다시 설정합니다"
          accessibilityOrder={2}>
          <Icon
            name="navigate-before"
            size={30}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Schedule')}
          accessibilityLabel="닫기"
          accessibilityHint="현재 화면을 닫고 일정 목록으로 이동합니다"
          accessibilityOrder={3}>
          <Icon
            name="close"
            size={30}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-default-1 dark:bg-neutral-900">
      {renderHeader()}
      <View className="flex-1 p-5">
        <Text
          className="text-black dark:text-white text-[24px] font-Regular"
          accessible={false}
          importantForAccessibility="no">
          2/2
        </Text>
        <Text
          className="mb-2 text-black dark:text-white text-[30px] font-ExtraBold"
          accessible={false}
          importantForAccessibility="no">
          복약 일정
        </Text>
        <ScrollView
          className="flex-1 mt-5 space-y-10"
          accessible={false}
          importantForAccessibility="no">
          <View className="space-y-2">
            <Text
              className="mt-2 text-black dark:text-white text-[24px] font-Regular text-center"
              accessible={false}
              importantForAccessibility="no">
              어떤 요일에 약을 복용하는지 입력해 주세요
            </Text>
            <View className="flex-row justify-between mt-2">
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedDays.includes(day)
                      ? 'bg-orange-default dark:bg-orange-600'
                      : 'border-2 border-default-2 dark:border-neutral-700'
                  }`}
                  onPress={() => toggleDay(day)}
                  accessible={false}
                  importantForAccessibility="no">
                  <Text
                    className={
                      selectedDays.includes(day)
                        ? 'text-white text-[24px] font-Bold text-center'
                        : 'text-black dark:text-white text-[24px] font-Bold text-center'
                    }
                    accessible={false}
                    importantForAccessibility="no">
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="space-y-2">
            <Text
              className="mt-2 text-black dark:text-white text-[24px] font-Regular text-center"
              accessible={false}
              importantForAccessibility="no">
              약을 복용하는 시간을 입력해 주세요
            </Text>
            {times.map((time, index) => (
              <View
                key={index}
                className="bg-default-2 dark:bg-neutral-800 p-3 rounded-full flex-row items-center justify-between mt-1">
                <Text
                  className="text-black dark:text-white text-[24px] font-ExtraBold text-center flex-1"
                  accessible={false}
                  importantForAccessibility="no">
                  {time}
                </Text>
                <TouchableOpacity
                  onPress={() => handleTimeDelete(time)}
                  accessible={false}
                  importantForAccessibility="no">
                  <Icon
                    name="clear"
                    size={30}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              className="bg-orange-default dark:bg-orange-600 p-4 rounded-xl space-y-2 mt-1"
              onPress={handleAddTime}
              accessible={false}
              importantForAccessibility="no">
              <Text
                className="text-white text-[24px] font-Bold text-center"
                accessible={false}
                importantForAccessibility="no">
                추가
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-2">
            <Text
              className="mt-2 text-black dark:text-white text-[24px] font-Regular text-center"
              accessible={false}
              importantForAccessibility="no">
              추가로 필요한 정보를 입력해 주세요
            </Text>
            <TextInput
              className="bg-default-2 dark:bg-neutral-800 p-3 rounded-full mt-1 text-center text-black dark:text-white text-[20px] font-ExtraBold"
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder="알레르기 정보나 주의 사항"
              placeholderTextColor={
                colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
              }
              multiline
              accessible={false}
              importantForAccessibility="no"
            />
          </View>
        </ScrollView>

        <View className="mt-2">
          <TouchableOpacity
            className={`p-4 rounded-xl space-y-2 ${
              times.length === 0 || selectedDays.length === 0
                ? 'bg-gray-200 dark:bg-gray-700'
                : 'bg-orange-default dark:bg-orange-600'
            }`}
            onPress={handleSave}
            disabled={
              times.length === 0 || selectedDays.length === 0 || isVoiceMode
            }
            accessibilityOrder={1}
            accessible={true}
            accessibilityLabel="저장"
            accessibilityHint="모든 정보를 입력한 후 저장할 수 있습니다.">
            <Text className="text-white text-[24px] font-Bold text-center">
              {route.params?.editIndex !== undefined ? '수정' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showTimePicker} transparent={true} animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
            <View className="flex-1 justify-end items-center bg-black/40">
              <TouchableWithoutFeedback>
                <View className="bg-white dark:bg-neutral-800 rounded-t-3xl p-5 shadow-lg w-full">
                  <TimePicker
                    initialHour={
                      selectedTime ? selectedTime.split(':')[0] : '00'
                    }
                    initialMinute={
                      selectedTime ? selectedTime.split(':')[1] : '00'
                    }
                    onTimeChange={newTime => {
                      // newTime을 문자열 형식으로 변환하여 저장
                      const formattedTime = `${newTime
                        .getHours()
                        .toString()
                        .padStart(2, '0')}:${newTime
                        .getMinutes()
                        .toString()
                        .padStart(2, '0')}`;
                      setSelectedTime(formattedTime);
                    }}
                    width={300}
                    buttonHeight={60}
                    visibleCount={3}
                  />
                  <TouchableOpacity
                    className="bg-orange-default dark:bg-orange-600 p-4 rounded-xl space-y-2 mt-4"
                    onPress={handleTimeSelect}
                    accessibilityLabel="시간 선택 확인"
                    accessibilityHint="선택한 시간을 확인합니다.">
                    <Text
                      className="text-white text-[24px] font-Bold text-center"
                      accessible={false}>
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
