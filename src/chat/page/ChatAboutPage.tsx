import { View, Text, Image, TouchableWithoutFeedback, Platform } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TitleBar, ToastView } from '@/constant/Widget';
import { metaStyles, themeColor } from '@/constant/Constants';
import Constants from 'expo-constants';
import { openBrowser } from '@/utils/WalletUtils';
import { useTranslation } from 'react-i18next';
import { navigate } from '@/base/NavigationService';

export default function ChatAboutPage() {
  const versionCode = Constants.expoConfig?.android.versionCode;
  const buildNumber = Constants.expoConfig?.ios.buildNumber;
  const platformNow = Platform.OS;
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1 }}>
        <TitleBar />
        <View style={{ padding: 20, flex: 1 }}>
          <View style={{ alignItems: 'center', alignContent: 'center' }}>
            <Image
              source={require('../../../assets/icon.png')}
              style={{ width: 103, height: 103, borderRadius: 17 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 25, fontWeight: 'bold', marginTop: 20 }}>
              {t('chat_name_idchat')}
            </Text>
          </View>

          <TouchableWithoutFeedback
            onPress={() => {
              if (platformNow == 'ios') {
                ToastView({ text: buildNumber.toString(), type: 'info' });
              } else {
                ToastView({ text: versionCode.toString(), type: 'info' });
              }
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginTop: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* <Image
                source={require("../../../image/settings_about_icon.png")}
                style={{ width: 45, height: 45 }}
              /> */}
              <Text style={{ marginLeft: 10, color: '#333', fontSize: 16 }}>{t('s_version')}</Text>
              <View style={{ flex: 1 }} />
              <Text style={metaStyles.defaultText}>{Constants.expoConfig?.version}</Text>
            </View>
          </TouchableWithoutFeedback>

          {/* <TouchableWithoutFeedback
            onPress={() => {
              openBrowser("https://metalet.space/terms-of-service");
            }}
          >
            <View
              style={{
                flexDirection: "row",
                marginTop: 30,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ marginLeft: 10, color: "#333", fontSize: 16 }}>
              {t("s_terms_of_service")}
              </Text>
              <View style={{ flex: 1 }} />

              <Image
                source={require("../../../image/share_open_icon.png")}
                style={{ width: 20, height: 20, marginLeft: 5 }}
              />
            </View>
          </TouchableWithoutFeedback> */}

          <TouchableWithoutFeedback
            onPress={() => {
              // url: require('@assets/privacy.html'),
              // openBrowser("https://metalet.space/privacy-policy");
              navigate('WebViewPage', {
                url: 'https://idchat.io/userprivacy/en',
              });
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginTop: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ marginLeft: 10, color: '#333', fontSize: 16 }}>
                {t('s_privacy_policy')}
              </Text>
              <View style={{ flex: 1 }} />

              <Image
                source={require('../../../image/share_open_icon.png')}
                style={{ width: 20, height: 20, marginLeft: 5 }}
              />
            </View>
          </TouchableWithoutFeedback>

          <View style={{ flex: 1 }} />

          <TouchableWithoutFeedback
            onPress={() => {
              openBrowser('https://idchat.io/');
            }}
          >
            <Text
              style={{
                marginBottom: 40,
                textAlign: 'center',
                fontSize: 16,
                color: '#333',
              }}
            >
              {t('s_official')}
            </Text>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </SafeAreaView>
  );
}
