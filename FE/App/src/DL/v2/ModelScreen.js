import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import * as tf from '@tensorflow/tfjs';
import {bundleResourceIO} from '@tensorflow/tfjs-react-native';
import {useRoute} from '@react-navigation/native';

function ModelScreen({route}) {
  const {imagePath} = route.params;

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await tf.loadLayersModel(
          bundleResourceIO(modelJson, modelWeights),
        );
        console.log('Model loaded');

        // 이미지 파일 경로 지정
        const imagePath = '/image/test.png';
        const image = document.createElement('img');
        image.src = imagePath;

        image.onload = async () => {
          // 이미지 전처리
          const tensor = tf.browser
            .fromPixels(image)
            .resizeBilinear([224, 224])
            .expandDims()
            .toFloat()
            .div(tf.scalar(255)); // Normalize

          // 모델 예측
          const predictions = model.predict(tensor);
          predictions.print();
          const result = predictions.argMax(-1).dataSync()[0];
          console.log('Predicted class:', result);
        };
      } catch (error) {
        console.error('Error loading the model', error);
      }
    };

    loadModel();
  }, [imagePath]);

  return (
    <View>
      <Text>Model Screen</Text>
    </View>
  );
}

export default ModelScreen;
