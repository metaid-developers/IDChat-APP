const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo || {};

  return {
    ...expo,
    extra: {
      ...expo.extra,
      nativeIdchatMockAccountState: process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_ACCOUNT_STATE,
      nativeIdchatMockEmptyList: process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST,
      nativeIdchatMockScenario: process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO,
    },
  };
};
