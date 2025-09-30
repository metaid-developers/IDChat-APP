import { View, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TitleBar } from '@/constant/Widget';
import WebView from 'react-native-webview';

export default function WebViewPage(props) {
  const url = props.route.params.url;
  const [uri, setURI] = useState(url);
  useEffect(() => {
    setURI(url);
    console.log('WebViewPage useEffect读取到的初始化传入链接： ', url);
  }, [url]);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TitleBar />
        <WebView
          style={{ flex: 1 }}
          originWhitelist={['*']}
          //   source={require('../../../assets/privacy.html')}
          source={url.includes('https') ? { uri } : uri}
        />
      </View>
    </SafeAreaView>
  );
}
