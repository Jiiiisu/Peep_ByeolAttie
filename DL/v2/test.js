const tf = require('@tensorflow/tfjs-node'); // TensorFlow.js Node.js 버전 사용
const fs = require('fs');
const path = require('path');

// 서버와 클라이언트 소통
const fs = require('fs');
const express = require('express');

const app = express();
const upload = multer({ dest: 'Image/' }); // 업로드된 파일을 저장할 폴더

// 모델 파일 경로
const modelPath = path.join(__dirname,'model.json');

// 이미지 파일 경로
const imagePath = path.join(__dirname, 'image', 'test.png');

// 이미지 로드 및 전처리
async function loadImageAndPreprocess(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageTensor = tf.node.decodeImage(imageBuffer, 3); // RGB 이미지로 디코딩
  const resizedImage = tf.image.resizeBilinear(imageTensor, [224, 224]); // 모델의 입력 크기에 맞게 조정
  const normalizedImage = resizedImage.expandDims(0).toFloat().div(tf.scalar(255)); // Normalize the image
  return normalizedImage;
}

// 모델 로드 및 예측
async function run(imagePath) {
  // 모델 로드
  const model = await tf.loadLayersModel(`file://${modelPath}`);
  console.log('Model loaded');

  // 이미지 로드 및 전처리
  const imgTensor = await loadImageAndPreprocess(imagePath);

  // 예측
  const predictions = model.predict(imgTensor);
  predictions.print();

  // 예측 결과 처리 (예: 클래스 이름 추출)
  const result = predictions.argMax(-1).dataSync();
  console.log('Predicted class:', result[0]);

  return resuit[0];
}

// 이미지 업로드 및 모델 예측 API
app.post('/predict', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;

  try {
    const prediction = await run(imagePath);
    res.json({ predictedClass: prediction });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while processing the image.');
  }
});

// 서버 실행
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// 실행
// run().catch(console.error);
