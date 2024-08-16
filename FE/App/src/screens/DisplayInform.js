// DisplayInform.js
import React from 'react';
import { View, Text } from 'react-native';
import { GetInfoByName } from './getInform';

const DisplayInform = () => {
  const [data, setData] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      const nameOfMDN = '게루삼정';
      const result = await GetInfoByName(nameOfMDN);
      setData(result);
    };
    fetchData();
  }, []);

  return (
    <View>
      <Text>{data}</Text>
    </View>
  );
};

export default DisplayInform;
