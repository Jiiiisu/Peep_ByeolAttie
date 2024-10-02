module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    // rules에 다음과 같이 추가
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
};
