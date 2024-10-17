import requests

url = 'http://localhost:5000/detect'
files = {'image': open('C:/Users/Y/Desktop/yolo/1001/pill4.jpg', 'rb')}

response = requests.post(url, files=files)
result = response.json()

print(f"Detection result: {result['result']}")