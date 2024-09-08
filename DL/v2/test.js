import React, { useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

function App() {

  useEffect(() => {
    // 모델 로드
    const loadModel = async () => {
      try {
        const model = await tf.loadLayersModel('/model/model.json');
        console.log('Model loaded');

        // 이미지 파일 경로 지정 
        const imagePath = '/image/test.png'; 
        const image = document.createElement('img');
        image.src = imagePath;

        image.onload = async () => {
          // 이미지 전처리
          const tensor = tf.browser.fromPixels(image)
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
  }, []);

  return null; // UI를 렌더링하지 않음
}