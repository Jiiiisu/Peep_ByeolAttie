from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import subprocess
import re  # 정규식을 사용하기 위해 추가

app = Flask(__name__)

UPLOAD_FOLDER = './uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image uploaded'}), 400

    image = request.files['image']
    if image.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400

    # 이미지 파일을 저장할 경로
    filename = secure_filename(image.filename)
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    image.save(image_path)

    # detect2.py 실행
    try:
        result = subprocess.run(
            ['python', 'detect2.py', '--weights', '/content/best.pt', '--imgsz', '640', 
             '--conf-thres', '0.4', '--iou-thres', '0.5', '--source', image_path, 
             '--save-csv', '--save-crop', '--project', '/content/runs/detect', 
             '--name', 'pill_detection', '--exist-ok'], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True
        )
        
        # 출력에서 신뢰도 값 추출
        output = result.stdout
        print("Detect Output:", output)  # 여기에 추가
        print(output)  # 디버깅을 위해 출력 내용 확인
        confidence_match = re.search(r'Detected pills with confidence (\d+\.\d+)', output)

        if confidence_match:
            confidence = float(confidence_match.group(1))
            
            # 신뢰도에 따른 응답
            if confidence >= 0.9:
                return jsonify({'success': True, 'confidence': confidence})
            else:
                return jsonify({'success': False, 'confidence': confidence})
        else:
            return jsonify({'success': False, 'message': 'Confidence not found in output'}), 500

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)  # 저장 폴더가 없으면 생성
    app.run(debug=True)
