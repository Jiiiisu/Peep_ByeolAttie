from flask import Flask, request, jsonify
from flask_cors import CORS
from keras.models import load_model
from PIL import Image, ImageOps
import numpy as np
import io

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
    class_name = class_names[index]
    confidence_score = float(prediction[0][index])

    return jsonify({
        'class': class_name.strip(),
        'confidence': confidence_score
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
'''
data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)

# 이미지 경로 나중에 지정
image = Image.open("./images/image.png").convert("RGB")

size = (224, 224)
image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)

image_array = np.asarray(image)

normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1

data[0] = normalized_image_array

prediction = model.predict(data)
index = np.argmax(prediction)
class_name = class_names[index]
confidence_score = prediction[0][index]

print("Class:", class_name[2:], end="")
print("Confidence Score:", confidence_score)
'''