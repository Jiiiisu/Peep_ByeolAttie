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
import os

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

def crop_image(img):
    # Convert to HSV color space
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Define color range for pills (adjust as needed)
    lower_color = np.array([0, 50, 50])
    upper_color = np.array([30, 255, 255])

    # Create binary mask
    mask = cv2.inRange(hsv, lower_color, upper_color)

    # Morphological operations
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    cropped_images = []

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        if area > 500:
            max_side = max(w, h)
            margin = 20
            center_x, center_y = x + w // 2, y + h // 2
            half_side = (max_side // 2) + margin

            x1 = max(0, center_x - half_side)
            y1 = max(0, center_y - half_side)
            x2 = min(img.shape[1], center_x + half_side)
            y2 = min(img.shape[0], center_y + half_side)

            if x2 - x1 < max_side + 2 * margin:
                diff = (max_side + 2 * margin) - (x2 - x1)
                if x1 - diff >= 0:
                    x1 -= diff
                else:
                    x2 += diff

            cropped_img = img[y1:y2, x1:x2].copy()
            if cropped_img.size > 0:
                cropped_images.append(cropped_img)

    return cropped_images

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
    img_bytes = file.read()
    img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)

    # Crop the image
    cropped_images = crop_image(img)

    if not cropped_images:
        return jsonify({'error': 'No pills detected in the image'}), 400

    # Process each cropped image
    results = []
    for i, cropped_img in enumerate(cropped_images):
        # Convert to PIL Image
        pil_image = Image.fromarray(cv2.cvtColor(cropped_img, cv2.COLOR_BGR2RGB))

        # Resize and preprocess
        size = (224, 224)
        image = ImageOps.fit(pil_image, size, Image.Resampling.LANCZOS)
        image_array = np.asarray(image)
        normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1

        data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
        data[0] = normalized_image_array

        # Predict
        prediction = keras_model.predict(data)
        index = np.argmax(prediction)

        # Extract class name and confidence score
        class_name = class_names[index][2:].strip()
        confidence_score = float(prediction[0][index])

        results.append({
            'pill_number': i + 1,
            'class': class_name,
            'confidence': confidence_score
        })

    return json.dumps(results, ensure_ascii=False)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)