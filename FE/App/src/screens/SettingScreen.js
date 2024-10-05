import React, {useEffect, useState} from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';
import {useTTS} from '../constants/TTSContext';
import {AccessibilityInfo} from 'react-native';

export default function SettingScreen() {
  const {isTTSEnabled, toggleTTS} = useTTS();
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(screenReaderEnabled => {
      setIsScreenReaderEnabled(screenReaderEnabled);
      if (screenReaderEnabled) {
        toggleTTS(true);
      }
    });
  }, []);

  return (
    <View className="felx-1 p-5 bg-default-1">
      <Text className="mb-5" accessible={false}>
        설정
      </Text>
      <View className="flex-row justify-between items-center mb-4">
        <Text accessible={false}>TTS 사용</Text>
        <Switch
          value={isTTSEnabled}
          onValueChange={value => !isScreenReaderEnabled && toggleTTS(value)}
          disabled={isScreenReaderEnabled}
          accessibilityLabel="TTS 사용 여부 설정"
          accessibilityHint={
            isScreenReaderEnabled
              ? '스크린 리더가 활성화되어 있어 TTS가 자동으로 켜져 있습니다.'
              : 'TTS 기능을 켜거나 끕니다.'
          }
        />
      </View>
      {isScreenReaderEnabled && (
        <Text className="mt-3" accessible={false}>
          스크린 리더가 활성화되어 있어 TTS가 자동으로 켜져 있습니다.
        </Text>
      )}
    </View>
  );
}
