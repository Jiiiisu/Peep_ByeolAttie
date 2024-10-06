from flask import Flask, request, jsonify
import torch
import cv2
import numpy as np
from pathlib import Path
import sys

import pathlib
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

# Add YOLOv5 directory to system path
yolov5_path = Path("C:/Users/Y/Desktop/yolo/1001/yolov5")
sys.path.append(str(yolov5_path))

from models.common import DetectMultiBackend
from utils.general import check_img_size, non_max_suppression, scale_boxes
from utils.torch_utils import select_device

app = Flask(__name__)

# Load YOLOv5 model
weights = "best.pt"
device = select_device("")
model = DetectMultiBackend(weights, device=device)
stride, names, pt = model.stride, model.names, model.pt
imgsz = check_img_size((640, 640), s=stride)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
