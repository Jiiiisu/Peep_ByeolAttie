import * as tmImage from '@teachablemachine/image';

const URL = './my_model/';

let model = null;

// 모델 로드 함수
export const loadModel = async () => {
  if (!model) {
    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';
    model = await tmImage.load(modelURL, metadataURL);
  }
};

// 이미지 파일로 예측 수행 함수
export const predictImage = async file => {
  if (!model) {
    await loadModel();
  }

  // eslint-disable-next-line no-undef
  const image = new Image();
  image.src = URL.createObjectURL(file);

  return new Promise(resolve => {
    image.onload = async () => {
      const predictions = await model.predict(image);
      resolve(predictions); // 예측 결과 반환
    };
  });
};

// `getImage` 함수로 이미지 파일을 받아 예측 결과를 콘솔에 출력하는 함수
export const getImage = async () => {
  try {
    // 이미지 파일 선택
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async event => {
      const file = event.target.files[0];
      if (file) {
        const predictions = await predictImage(file);
        console.log('Prediction Results:', predictions);
      }
    };
    fileInput.click(); // 파일 선택 창을 열기
  } catch (error) {
    console.error('Error running model:', error);
  }
};
