//http://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01
//    const url = `http://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01?serviceKey=bTAuWEKoJRuYcmnYTmepxErOJfsnMbnq%2BGbC5uFiu3ht9ybOhxR2TdfqIlVQT5bQtXvU5hXV6kkTTp1XyXJjmA%3D%3D&item_name=${encodeURIComponent(requestName)}`;
import { parseString } from 'xml2js';

// XML을 비동기적으로 파싱하는 함수
const parseXml = (xmlString) => {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// API에서 정보를 가져오는 함수
export const GetInfoByName = async (requestName) => {
  try {
    // API URL 생성
    const url = `http://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01?serviceKey=bTAuWEKoJRuYcmnYTmepxErOJfsnMbnq%2BGbC5uFiu3ht9ybOhxR2TdfqIlVQT5bQtXvU5hXV6kkTTp1XyXJjmA%3D%3D&item_name=${encodeURIComponent(requestName)}`;
    console.log(url);

    // API 요청
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(responseText);
    console.log('\n\n\n');

    // XML 데이터 파싱
    const result = await parseXml(responseText);

    // totalCount 추출
    const totalCount = Math.min(parseInt(result.response.body[0].totalCount[0], 10), 10);

    // ITEM_NAME, ENTP_NAME, CHART, ITEM_IMAGE, CLASS_NAME, ETC_OTC_NAME, DRUG_SHAPE, COLOR_CLASS1 추출 및 배열 생성
    const items = result.response.body[0].items[0].item;
    const stringArray = [];

    for (let i = 0; i < totalCount; i++) {
      const item = items[i];
      const row = [
        item.ITEM_NAME[0],
        item.ENTP_NAME[0],
        item.CHART[0],
        item.ITEM_IMAGE[0],
        item.CLASS_NAME[0],
        item.ETC_OTC_NAME[0],
        item.DRUG_SHAPE ? item.DRUG_SHAPE[0] : 'N/A',
        item.COLOR_CLASS1 ? item.COLOR_CLASS1[0] : 'N/A'
      ];
      stringArray.push(row);
    }

    // 배열 데이터를 문자열로 변환
    return concatenate(stringArray);
  } catch (error) {
    console.error(error);
    return '';
  }
};

// 데이터를 문자열로 합치는 함수
const concatenate = (data) => {
  return data
    .map(row => row.join(','))
    .join(';');
};
