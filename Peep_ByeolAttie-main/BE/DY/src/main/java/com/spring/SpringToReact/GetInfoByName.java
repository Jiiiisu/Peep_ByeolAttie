package com.spring.SpringToReact;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

public class GetInfoByName {
    public static String getInfo(String requestName) throws IOException {
        StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01"); /*URL*/
        urlBuilder.append("?" + URLEncoder.encode("serviceKey", "UTF-8") + "=bTAuWEKoJRuYcmnYTmepxErOJfsnMbnq%2BGbC5uFiu3ht9ybOhxR2TdfqIlVQT5bQtXvU5hXV6kkTTp1XyXJjmA%3D%3D"); /*Service Key*/
        urlBuilder.append("&" + URLEncoder.encode("item_name", "UTF-8") + "=" + URLEncoder.encode(requestName, "UTF-8")); /*품목명*/
        URL url = new URL(urlBuilder.toString());
        System.out.println(url);

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-type", "application/xml");
        System.out.println("Response code: " + conn.getResponseCode());

        BufferedReader rd;
        if (conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300) {
            rd = new BufferedReader(new InputStreamReader((conn.getInputStream()), "UTF-8"));
        } else {
            rd = new BufferedReader(new InputStreamReader((conn.getErrorStream()), "UTF-8"));
        }
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = rd.readLine()) != null) {
            sb.append(line);
        }
        rd.close();
        conn.disconnect();

        // 출력
        System.out.println(sb.toString());
        System.out.println("\n\n\n");
        String xmlData = sb.toString();
        String[][] stringArray = new String[0][];
        try {
            // XML 파싱 준비
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(new InputSource(new StringReader(xmlData)));


            // totalCount 값을 가져오기
            String totalCountString = getValueByTagName(document.getDocumentElement(), "totalCount");
            int totalCount = Integer.parseInt(totalCountString);
            if (totalCount > 10) totalCount = 10;

            // 이중 배열 생성
            stringArray = new String[totalCount][6];

            // ITEM_NAME, ENTP_NAME, CHART, ITEM_IMAGE, CLASS_NAME, ETC_OTC_NAME 추출
            NodeList itemList = document.getElementsByTagName("item");
            // ITEM_NAME, ENTP_NAME, CHART, ITEM_IMAGE, CLASS_NAME, ETC_OTC_NAME 추출 및 이중 배열에 넣기
            int row = 0; // 행 인덱스
            for (int i = 0; i < itemList.getLength(); i++) {
                Node itemNode = itemList.item(i);
                if (itemNode.getNodeType() == Node.ELEMENT_NODE) {
                    Element itemElement = (Element) itemNode;
                    stringArray[row][0] = getValueByTagName(itemElement, "ITEM_NAME");
                    stringArray[row][1] = getValueByTagName(itemElement, "ENTP_NAME");
                    stringArray[row][2] = getValueByTagName(itemElement, "CHART");
                    stringArray[row][3] = getValueByTagName(itemElement, "ITEM_IMAGE");
                    stringArray[row][4] = getValueByTagName(itemElement, "CLASS_NAME");
                    stringArray[row][5] = getValueByTagName(itemElement, "ETC_OTC_NAME");
                    row++; // 다음 행으로 이동
                }
            }
            // 생성된 배열 출력 (테스트용)
            for (String[] strings : stringArray) {
                for (String string : strings) {
                    System.out.print(string + " ");
                }
                System.out.println();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        // 데이터를 문자열로 합치기
        return concatenate(stringArray);
    }

    public static void main(String[] args) throws IOException {
        String result;
        String nameOfMDN = "게루삼정";
        result = getInfo(nameOfMDN);
        System.out.print(result);

    }

    // 태그 이름으로부터 해당 요소의 텍스트 값을 가져오는 메서드
    private static String getValueByTagName(Element element, String tagName) {
        NodeList nodeList = element.getElementsByTagName(tagName);
        if (nodeList.getLength() > 0) {
            Node node = nodeList.item(0);
            return node.getTextContent();
        }
        return "";
    }
    public static String concatenate(String[][] data) {
        StringBuilder sb = new StringBuilder();

        for (String[] row : data) {
            for (String item : row) {
                sb.append(item).append(","); // 각 항목을 쉼표로 구분하여 추가
            }
            sb.deleteCharAt(sb.length() - 1); // 마지막 쉼표 제거
            sb.append(";"); // 각 행을 세미콜론으로 구분
        }
        sb.deleteCharAt(sb.length() - 1); // 마지막 세미콜론 제거

        return sb.toString();
    }
}