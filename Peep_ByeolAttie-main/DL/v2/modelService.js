import {
  getModel,
  convertBase64ToTensor,
  startPrediction,
} from '../helpers/tensor-helper';
import { cropPicture } from '../helpers/image-helper';
import { launchImageLibrary } from 'react-native-image-picker'; // expo 대신 react-native-image-picker 사용

const RESULT_MAPPING = ["게루삼정 200mg/PTP", "아로나민골드정 72.2mg/PTP", "낙센정 250mg/PTP", "게보린정 300mg/PTP", "베아제정", "타이레놀정500mg", "어린이용타이레놀정 80mg", "알비정400mg/PTP", "암씨롱큐정 300mg/PTP", "코트리나캡슐 50mg/PTP", "이소켓서방정 40mg", "아사콜디알정 400mg", "씨콜드코프정 200mg/PTP", "펙소나딘정 120mg", "자누메트정 50/1000mg", "스티아론정(티아넵틴나트륨)", "텔미트렌정 80mg", "로베글리타존황산염", "올로스타정 20/20mg", "제라타딘정(로라타딘)", "부로멜장용정(브로멜라인)", "에소듀오정 20/800mg", "피레스코정 400mg", "엑스원알정 5/160/10mg", "인베가서방정 6mg", "엔비젯정10/40mg 43.4mg/PTP", "삼성아스피린장용정 100mg", "엘스테인정(에르도스테인)", "투탑스플러스정 80/10/12.5mg", "테잘바이정 40/5mg"];

// 딥러닝 실행 함수
export const runDeepLearning = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 1,
    includeBase64: true,
  });

  if (result.didCancel) {
    console.log('User cancelled image picker');
  } else if (result.error) {
    console.log('ImagePicker Error: ', result.error);
  } else {
    const imageData = result.assets[0]; // imageData는 {uri, width, height, base64} 포함
    await processImagePrediction(imageData); // 이미지 예측 처리 함수 호출
  }
};

// 이미지 예측 처리 함수
const processImagePrediction = async (imageData) => {
  const croppedData = await cropPicture(imageData, 300); // 이미지 자르기
  if (!croppedData || !croppedData.base64) {
    console.error('Cropped data is invalid or undefined');
    return;
  }

  const model = await getModel(); // 모델 가져오기
  const tensor = await convertBase64ToTensor(croppedData.base64); // base64를 텐서로 변환
  const prediction = await startPrediction(model, tensor); // 예측 실행
  const highestPredictionIndex = prediction.indexOf(Math.max(...prediction)); // 가장 높은 예측값 찾기
  console.log('Predicted Shape:', RESULT_MAPPING[highestPredictionIndex]); // 결과 출력
};

