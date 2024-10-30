import os
import cv2
import numpy as np

def detect_and_crop_pill(image_path, output_dir, output_size=(224, 224)):
    # 1. 이미지 로드
    img = cv2.imread(image_path)
    if img is None:
        print("이미지를 불러오지 못했습니다.")
        return False

    # 2. 가우시안 블러 적용 (노이즈 제거)
    blurred = cv2.GaussianBlur(img, (7, 7), 0)

    # 3. Canny 엣지 검출로 경계 탐지
    edges = cv2.Canny(blurred, 50, 150)

    # 4. 윤곽선 찾기
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        print("알약을 찾을 수 없습니다.")
        return False

    # 5. 가장 큰 윤곽선 찾기 (면적 기준)
    largest_contour = max(contours, key=cv2.contourArea)

    # 6. 경계 상자 계산
    x, y, w, h = cv2.boundingRect(largest_contour)

    # 7. 정사각형 크롭: 더 큰 쪽 기준으로 확장
    max_side = max(w, h)
    center_x, center_y = x + w // 2, y + h // 2
    half_side = max_side // 2 + 10  # 여유 공간 추가

    # 이미지 경계 넘지 않도록 조정
    x1 = max(0, center_x - half_side)
    y1 = max(0, center_y - half_side)
    x2 = min(img.shape[1], center_x + half_side)
    y2 = min(img.shape[0], center_y + half_side)

    # 8. 이미지 크롭
    cropped_img = img[y1:y2, x1:x2]

    # 9. 비율 유지하며 224x224로 리사이즈
    resized_img = cv2.resize(cropped_img, output_size, interpolation=cv2.INTER_AREA)

    # 10. 크롭된 이미지 저장
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'cropped_pill.png')
    cv2.imwrite(output_path, resized_img)

    print(f"크롭된 이미지가 {output_path}에 저장되었습니다.")
    return True

# 경로 설정
image_path = r'C:\Users\User\Desktop\Peep_Project\Peep_ByeolAttie\FE\App\src\DL\images\a.png'
output_dir = r'C:\Users\User\Desktop\Peep_Project\Peep_ByeolAttie\FE\App\src\DL\images'

# 함수 실행
success = detect_and_crop_pill(image_path, output_dir)

if not success:
    print("알약 크롭에 실패했습니다.")


