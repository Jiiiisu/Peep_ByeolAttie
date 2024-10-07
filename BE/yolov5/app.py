from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import cv2
import numpy as np
import io
import json
from keras.models import load_model
from PIL import Image, ImageOps
from pathlib import Path
import sys


import pathlib
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

# Set up the app
app = Flask(__name__)
CORS(app)

# Load YOLOv5 model
yolov5_path = Path("C:/Users/Y/Desktop/yolo/1001/yolov5")
sys.path.append(str(yolov5_path))

from models.common import DetectMultiBackend
from utils.general import check_img_size, non_max_suppression, scale_boxes
from utils.torch_utils import select_device

weights = "best.pt"
device = select_device("")
model = DetectMultiBackend(weights, device=device)
stride, names, pt = model.stride, model.names, model.pt
imgsz = check_img_size((640, 640), s=stride)

# Load Keras model
keras_model = load_model("./keras_model.h5", compile=False)
class_names = open("./labels.txt", "r", encoding="utf-8").readlines()

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    img_bytes = file.read()
    img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
    
    # Preprocess image
    img = cv2.resize(img, (imgsz[0], imgsz[1]))
    img = img.transpose((2, 0, 1))[::-1]  # HWC to CHW, BGR to RGB
    img = np.ascontiguousarray(img)
    img = torch.from_numpy(img).to(device)
    img = img.float() / 255.0
    img = img.unsqueeze(0)

    # Inference
    pred = model(img)
    
    # Apply NMS (Non-Maximum Suppression)
    pred = non_max_suppression(pred, conf_thres=0.4, iou_thres=0.5, max_det=1000)

    # Process detections
    detections = []
    for i, det in enumerate(pred):  # per image
        if len(det):
            det[:, :4] = scale_boxes(imgsz, det[:, :4], img.shape[2:]).round()
            for *xyxy, conf, cls in reversed(det):
                if conf >= 0.7:  # Confidence threshold
                    # Extract bounding box coordinates
                    x1, y1, x2, y2 = map(int, xyxy)  # Convert to int
                    label = names[int(cls)]  # Get class label
                    confidence = float(conf)  # Convert confidence to float

                    # Add detection info to list
                    detections.append({
                        "label": label,
                        "confidence": confidence,
                        "bbox": [x1, y1, x2, y2]
                    })

    # Determine if any detections were made
    result = len(detections) > 0

    return jsonify({"result": result, "detections": detections})

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

    prediction = keras_model.predict(data)
    index = np.argmax(prediction)

    # Extract class name and confidence score
    class_name = class_names[index][2:].strip()  # Clean up class name
    confidence_score = float(prediction[0][index])

    # Return result in JSON format
    result = {
        'class': class_name,
        'confidence': confidence_score
    }

    #return jsonify(result, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
