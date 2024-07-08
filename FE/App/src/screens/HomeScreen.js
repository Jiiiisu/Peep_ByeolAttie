import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import Voice from 'react-native-voice';
import Features from '../components/Features';
import { dummyMessages } from '../constants';

export default function HomeScreen() {
  const [recording, setRecording] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e) => {
    setResults(e.value);
    // 음성 인식 결과를 메시지에 추가
    setMessages([...messages, { role: 'user', content: e.value[0] }]);
  };

  const onSpeechError = (e) => {
    console.error(e);
  };

  const startListening = async () => {
    try {
      await Voice.start('ko-KR');
      setRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setRecording(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1 flex mx-5">
        <View className="flex-row justify-center">
          <Text
            style={{fontSize: wp(10)}}
            className="text-center font-bold text-orange-default">
            삐약삐약
          </Text>
        </View>
        {messages.length > 0 ? (
          <View className="space-y-2 flex-1">
            <Text
              style={{fontSize: wp(5)}}
              className="text-gray-700 font-semibold ml-1">
              Assistant
            </Text>
            <View
              style={{height: hp(58)}}
              className="bg-neutral-200 rounded-3xl p-4">
              <ScrollView
                bounces={false}
                className="space-y-4"
                showsVerticalScrollIndicator={false}>
                {messages.map((message, index) => {
                  if (message.role == 'assistant') {
                    return (
                      <View
                        key={index}
                        style={{width: wp(70)}}
                        className="bg-orange-200 rounded-xl p-2 rounded-tl-none">
                        <Text>{message.content}</Text>
                      </View>
                    );
                  } else {
                    return (
                      <View key={index} className="flex-row justify-end">
                        <View
                          style={{width: wp(70)}}
                          className="bg-white rounded-xl p-2 rounded-tr-none">
                          <Text>{message.content}</Text>
                        </View>
                      </View>
                    );
                  }
                })}
              </ScrollView>
            </View>
          </View>
        ) : (
          <Features />
        )}
        <View className="flex justify-center items-center">
          {recording ? (
            <TouchableOpacity onPress={stopListening}>
              <Image
                className="rounded-full"
                source={require('../../assets/images/voiceLoading.png')}
                style={{width: 100, height: 100}}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startListening}>
              <Image
                className="rounded-full"
                source={require('../../assets/images/recording.png')}
                style={{width: 100, height: 100}}
              />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}