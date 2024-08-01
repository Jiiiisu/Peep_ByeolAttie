import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';

const MyComponent = () => {
  const [responseData, setResponseData] = useState('');

  const fetchDataFromSpring = () => {
    fetch('http://10.0.2.2:8080/data')
      .then(response => response.text())
      .then(data => {
        setResponseData(data);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  return (
    <View>
      <Text>{responseData}</Text>
      <Button title="스프링 데이터 가져오기" onPress={fetchDataFromSpring} />
    </View>
  );
};

export default MyComponent;
