import os
import cv2
import numpy as np

# 이미지 경로 지정 필요
img = cv2.imread(r'C:\Users\User\Desktop\Peep_Project\Peep_ByeolAttie\FE\App\src\DL\images\a.png')

if img is None:
    print("이미지를 불러오지 못했습니다.")
    exit()

# 이미지를 HSV 색상 공간으로 변환
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# 알약 색상 범위 설정 (테스트 필요)
lower_color = np.array([0, 50, 50])   # 색상 하한값 (조정 필요)
upper_color = np.array([30, 255, 255]) # 색상 상한값 (조정 필요)

# 색상 범위에 해당하는 부분을 이진 마스크로 생성
mask = cv2.inRange(hsv, lower_color, upper_color)

# 모폴로지 연산을 통한 노이즈 제거
kernel = np.ones((5, 5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

# 윤곽선 찾기
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# 검출된 알약 이미지를 저장할 리스트
test = []

# 모든 윤곽선 순회하며 조건에 맞는 알약 검출
for contour in contours:
    # 윤곽선의 외곽 사각형 영역 계산
    x, y, w, h = cv2.boundingRect(contour)

    # 면적 조건 설정 (너무 작거나 큰 것 배제)
    area = cv2.contourArea(contour)
    if area > 500:  # 최소 면적 필터
        # 정사각형 크롭: 가로와 세로 중 더 긴 쪽으로 확장
        max_side = max(w, h)
        margin = 20  # 여유 공간 설정

        # 중심을 기준으로 정사각형 범위 계산
        center_x, center_y = x + w // 2, y + h // 2
        half_side = (max_side // 2) + margin

        # 이미지 경계를 넘지 않도록 조정된 정사각형 좌표 계산
        x1 = max(0, center_x - half_side)
        y1 = max(0, center_y - half_side)
        x2 = min(img.shape[1], center_x + half_side)
        y2 = min(img.shape[0], center_y + half_side)

        # 정사각형이 중앙에 유지되는지 보정 (좌표 부족 시 이동)
        if x2 - x1 < max_side + 2 * margin:
            diff = (max_side + 2 * margin) - (x2 - x1)
            if x1 - diff >= 0:
                x1 -= diff
            else:
                x2 += diff

        # 이미지 크롭 후 저장
        cropped_img = img[y1:y2, x1:x2].copy()
        if cropped_img.size > 0:
            test.append(cropped_img)

# 저장할 경로 생성 및 크롭한 이미지 저장(경로 지정해줘야함)
output_dir = r'C:\Users\User\Desktop\Peep_Project\Peep_ByeolAttie\FE\App\src\DL\images'
os.makedirs(output_dir, exist_ok=True)

for num, img in enumerate(test):
    output_path = os.path.join(output_dir, f'after_{num}.png')
    cv2.imwrite(output_path, img)

print(f"{len(test)}개의 이미지가 저장되었습니다.")


