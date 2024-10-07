from flask import Flask, request, jsonify
from flask_cors import CORS
from keras.models import load_model
from PIL import Image, ImageOps
import numpy as np
import io
import json

# np.set_printoptions(suppress=True)

app = Flask(__name__)
CORS(app)

model = load_model("./keras_model.h5", compile=False)
class_names = open("./labels.txt", "r", encoding="utf-8").readlines()

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    image_bytes = file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    size = (224, 224)
    image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
    image_array = np.asarray(image)
    normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1

    data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
    data[0] = normalized_image_array

    prediction = model.predict(data)
    index = np.argmax(prediction)

    # 클래스명에서 불필요한 문자를 제거 (주석 처리된 코드와 동일한 처리)
    class_name = class_names[index][2:]  # 여기서 class_name[2:]를 사용
    confidence_score = float(prediction[0][index])

    # 한글이 깨지지 않도록 ensure_ascii=False 설정
    result = {
        'class': class_name.strip(),  # 클래스명을 반환
        # 'confidence': confidence_score
    }

    # json.dumps로 JSON 생성, ensure_ascii=False 옵션을 통해 한글이 깨지지 않게 함
    return json.dumps(result, ensure_ascii=False)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)