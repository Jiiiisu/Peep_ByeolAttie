import os
import sys
from pathlib import Path
import io
import json
import cv2
import numpy as np
import torch
import tensorflow as tf
from PIL import Image
from flask import Flask, request, Response
from flask_cors import CORS
from models.common import DetectMultiBackend
from utils.general import check_img_size, non_max_suppression, scale_boxes
from utils.torch_utils import select_device
from tensorflow.keras.models import load_model

import pathlib
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)

yolov5_path = Path("C:/Users/Y/Desktop/yolo/1001/yolov5")
sys.path.append(str(yolov5_path))

class PillDetectionApp:
    def __init__(self, base_dir="/home/ubuntu/flask"):
        self.app = Flask(__name__)
        CORS(self.app)
        self.app.config['JSON_AS_ASCII'] = False
        self.app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

        # Setup routes
        self.app.route('/detect', methods=['POST'])(self.detect)
        self.app.route('/predict', methods=['POST'])(self.predict)

        # Load models
        self.setup_models(base_dir)

    def setup_models(self, base_dir):
        # Clear any existing TensorFlow sessions
        tf.keras.backend.clear_session()

        # YOLO Model Setup
        BASE_DIR = Path(base_dir)
        sys.path.append(str(BASE_DIR))

        weights = "best.pt"
        self.device = select_device("")
        self.yolo_model = DetectMultiBackend(weights, device=self.device)
        self.stride = self.yolo_model.stride
        self.names = self.yolo_model.names
        self.imgsz = check_img_size((640, 640), s=self.stride)

        # Keras Model Setup
        self.keras_model = load_model("./keras_model.h5", compile=False)
        with open("./labels.txt", "r", encoding="utf-8") as f:
            self.class_names = f.readlines()

    def cleanup_resources(self):
        # Clear CUDA cache if using GPU
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Clear TensorFlow session
        tf.keras.backend.clear_session()

    def detect_and_crop_pill(self, img, output_size=(224, 224)):
        try:
            blurred = cv2.GaussianBlur(img, (7, 7), 0)
            edges = cv2.Canny(blurred, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if not contours:
                return None

            largest_contour = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest_contour)

            max_side = max(w, h)
            center_x, center_y = x + w // 2, y + h // 2
            half_side = max_side // 2 + 10

            x1 = max(0, center_x - half_side)
            y1 = max(0, center_y - half_side)
            x2 = min(img.shape[1], center_x + half_side)
            y2 = min(img.shape[0], center_y + half_side)

            cropped_img = img[y1:y2, x1:x2]
            resized_img = cv2.resize(cropped_img, output_size, interpolation=cv2.INTER_AREA)

            return resized_img

        except Exception as e:
            print(f"Crop exception: {e}")
            return None
    
    def detect(self):
        print("Detect start")
        try:
            if 'image' not in request.files:
                return Response(
                    json.dumps({"error": "No image file provided"}),
                    status=400,
                    content_type='application/json; charset=utf-8'
                )

            file = request.files['image']
            image = Image.open(io.BytesIO(file.read()))
            if image.mode != 'RGB':
                image = image.convert('RGB')

            img = np.array(image)
            original_shape = img.shape
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            img_resized = cv2.resize(img, (self.imgsz[0], self.imgsz[1]))
            img_resized = img_resized.transpose((2, 0, 1))[::-1]
            img_resized = np.ascontiguousarray(img_resized)
            img_resized = torch.from_numpy(img_resized).to(self.device)
            img_resized = img_resized.float() / 255.0
            img_resized = img_resized.unsqueeze(0)

            with torch.no_grad():
                pred = self.yolo_model(img_resized)
                pred = non_max_suppression(pred, conf_thres=0.4, iou_thres=0.5, max_det=1000)

            detections = []
            for i, det in enumerate(pred):
                if len(det):
                    det[:, :4] = scale_boxes((self.imgsz[0], self.imgsz[1]), det[:, :4], original_shape).round()

                    for *xyxy, conf, cls in reversed(det):
                        if conf >= 0.7:
                            x1, y1, x2, y2 = map(int, xyxy)
                            label = self.names[int(cls)]
                            confidence = float(conf)
                            detections.append({
                                "label": label,
                                "confidence": confidence,
                                "bbox": [x1, y1, x2, y2]
                            })

            result = len(detections) > 0
            print("Detect End")
            
            self.cleanup_resources()
            return Response(
                json.dumps({"result": result, "detections": detections}),
                content_type='application/json; charset=utf-8'
            )

        except Exception as e:
            self.cleanup_resources()
            print(f"Error processing image: {str(e)}")
            return Response(
                json.dumps({'error': f'Image processing error: {str(e)}'}),
                status=500,
                content_type='application/json; charset=utf-8'
            )

    def predict(self):
        print("Predict start")
        try:
            if 'image' not in request.files:
                return Response(
                    json.dumps({'error': 'No image provided'}),
                    status=400,
                    content_type='application/json; charset=utf-8'
                )

            # 파일 로딩 및 이미지 전처리 로깅
            file = request.files['image']
            print(f"Received image file: {file.filename}")
            
            image = Image.open(io.BytesIO(file.read()))
            print(f"Image mode: {image.mode}, Size: {image.size}")

            if image.mode != 'RGB':
                image = image.convert('RGB')
                print("Converted image to RGB mode")

            img = np.array(image)
            print(f"NumPy array shape: {img.shape}")
            
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

            # 알약 검출 및 크롭
            cropped_img = self.detect_and_crop_pill(img)
            if cropped_img is None:
                print("Failed to crop pill from image")
                self.cleanup_resources()
                return Response(
                    json.dumps({'error': 'Failed to crop pill from image'}),
                    status=400,
                    content_type='application/json; charset=utf-8'
                )
            print(f"Cropped image shape: {cropped_img.shape}")

            # 이미지 전처리
            img = cropped_img.astype('float32') / 255.0
            img = np.expand_dims(img, axis=0)
            print(f"Preprocessed image shape: {img.shape}")

            # 클래스 이름 로딩 확인
            print(f"Number of class names: {len(self.class_names)}")
            
            # 예측 수행
            with tf.device('/CPU:0'):
                prediction = self.keras_model.predict(img, verbose=0)
            print(f"Prediction shape: {prediction.shape}")
            print(f"Raw prediction values: {prediction}")

            # 예측 결과 처리
            if len(prediction) == 0 or len(prediction[0]) == 0:
                raise ValueError("Empty prediction result")

            index = np.argmax(prediction)
            print(f"Predicted index: {index}")

            # 인덱스 유효성 검사
            if index >= len(self.class_names):
                raise IndexError(f"Predicted index {index} is out of range for {len(self.class_names)} classes")

            class_name = self.class_names[index][2:].strip()
            confidence_score = float(prediction[0][index])
            
            print(f"Predicted class: {class_name}")
            print(f"Confidence score: {confidence_score}")

            results = [{
                'pill_number': 1,
                'class': class_name,
                'confidence': confidence_score
            }]

            print("Predict end")
            print(f"Final results: {results}")

            self.cleanup_resources()
            return Response(
                json.dumps(
                    results,
                    ensure_ascii=False,
                    indent=2
                ),
                content_type='application/json; charset=utf-8'
            )

        except Exception as e:
            self.cleanup_resources()
            print(f"Error processing image: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            
            return Response(
                json.dumps(
                    {'error': f'Image processing error: {str(e)}',
                     'error_type': str(type(e)),
                     'traceback': traceback.format_exc()},
                    ensure_ascii=False
                ),
                content_type='application/json; charset=utf-8'
            ), 500

    def run(self, host='0.0.0.0', port=5000):
        self.app.run(host=host, port=port, debug=False, threaded=True)

if __name__ == '__main__':
    pill_app = PillDetectionApp()
    pill_app.run()