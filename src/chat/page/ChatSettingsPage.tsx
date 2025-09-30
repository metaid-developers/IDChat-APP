import {
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  BackHandler,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AvatarImageView,
  CloseView,
  Line,
  LoadingModal,
  NormalAlertView,
  QRScanner,
  RoundSimButtonFlee,
  TitleBar,
  ToastView,
  VerifyModal,
} from '@/constant/Widget';
import { metaStyles, themeColor } from '@/constant/Constants';
import Constants from 'expo-constants';
import { navigate } from '@/base/NavigationService';
import useNetworkStore from '@/stores/useNetworkStore';
import {
  getRandomID,
  getStorageCurrentWallet,
  openBrowser,
  setWalletNetwork,
  updateStorageWallet,
} from '@/utils/WalletUtils';
import {
  AsyncStorageUtil,
  wallet_language_key,
  wallet_mode_cold,
  wallet_mode_hot,
  wallet_mode_observer,
} from '@/utils/AsyncStorageUtil';
import { useTranslation } from 'react-i18next';
import i18n from '@/language/i18n';
import { AddressType } from '@metalet/utxo-wallet-sdk';
import { useData } from '@/hooks/MyProvider';
import { useFocusEffect } from '@react-navigation/native';
import useUserStore from '@/stores/useUserStore';
import { getMetaIDUserImageUrl, getUserMetaIDInfo, isRegisterMetaID } from '../com/metaIDUtils';
import { getCurrentMvcWallet } from '@/wallet/wallet';
import { UerMetaIDInfo } from '@/api/type/UserMetaIDinfoBean';
import { isNotEmpty } from '@/utils/StringUtils';
import { eventBus, logout_Bus } from '@/utils/EventBus';
import { WalletBean } from '@/bean/WalletBean';
import { registerForPushNotificationsAsync } from '@/utils/PushUtils';
import { UpdateData } from '@/api/type/Update';
import { fetchCheckIDChatUpgrade, fetchCheckUpgrade } from '@/api/metaletservice';
import * as Clipboard from 'expo-clipboard';

export const BTC_NETWORK = 'mainnet';
export const BTC_NETWORK_TEST = 'testnet';

export default function ChatSettingsPage(props: any) {
  const [isShowVerify, setIsShowVerify] = useState(false);
  const [isShowNetwork, setShowNetwork] = useState(false);
  const [isLanguage, setIsLanguage] = useState(false);
  const { network, switchNetwork } = useNetworkStore();
  const [isShowLoading, setIsShowLoading] = useState(false);
  // const { needRefreshHome, updateNeedRefreshHome } = useData();
  const { needInitWallet, updateNeedInitWallet } = useData();
  const { walletMode, updateWalletMode } = useData();
  const [isScan, setIsScan] = useState(false);
  const [isDisclaimer, setIsDisclaimer] = useState(false);
  const { walletLanguage, updateWalletLanguage } = useData();
  const { mvcAddress, updateMvcAddress } = useData();
  const { btcAddress, updateBtcAddress } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();

  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState('');
  const [isShowLogout, setIsLogout] = useState(false);
  const [userName, setUserName] = useState('');
  const [userMetaID, setUserMetaID] = useState('');
  const { isBackUp, updateSetIsBackUp } = useData();

  const versionCode = Constants.expoConfig?.android.versionCode;
  const buildNumber = Constants.expoConfig?.ios.buildNumber;
  const platformNow = Platform.OS;
  const [updateUrl, setUpdateUrl] = useState('');
  const [hasUpdate, setUpdate] = useState(false);
  const { webLogout, updateWebLogout } = useData();

  // const currentAddressType = metaletWallet.currentBtcWallet!.getAddressType()!;
  // console.log(
  //   "addressType-----",
  //   metaletWallet.currentBtcWallet!.getAddressType()!
  // );

  useFocusEffect(
    React.useCallback(() => {
      const avatarLocalUri = useUserStore.getState().userInfo?.avatarLocalUri;
      console.log('avatarLocalUri ', avatarLocalUri);
      intUserMetaIDInfo();
      // setSelectedImage(avatarLocalUri);

      // Add event listener for back button press
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      // Clean up the event listener when the screen is unfocused or component unmounts
      return () => backHandler.remove();
    }, []),
  );

  // useFocusEffect(
  //   React.useCallback(() => {
  //     // console.log("Home page is focused");
  //     console.log('walletMid==', walletMode);

  //     // Add event listener for back button press
  //     const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
  //       BackHandler.exitApp();
  //       return true;
  //     });
  //     // Clean up the event listener when the screen is unfocused or component unmounts
  //     return () => backHandler.remove();
  //   }, []),
  // );

  useEffect(() => {
    intUserMetaIDInfo();
    checkUpgrade();
  }, []);

  async function intUserMetaIDInfo() {
    if (isRegisterMetaID()) {
      const metaIDInfo: UerMetaIDInfo = await getUserMetaIDInfo();
      console.log('metaIDInfo ', metaIDInfo);

      const currentStorageWallet: WalletBean = await getStorageCurrentWallet();

      if (isNotEmpty(metaIDInfo.name)) {
        setUserName(metaIDInfo.name);
        currentStorageWallet.userName = metaIDInfo.name;
        useUserStore.getState().setUserInfo({
          name: metaIDInfo.name,
          nameId: metaIDInfo.nameId,
          metaid: metaIDInfo.metaid,
        });
      }
      if (isNotEmpty(metaIDInfo.avatar)) {
        setSelectedImage(getMetaIDUserImageUrl(metaIDInfo.avatar));
        currentStorageWallet.avatarUrl = getMetaIDUserImageUrl(metaIDInfo.avatar);
      } else {
        setSelectedImage('');
      }

      if (isNotEmpty(metaIDInfo.metaid)) {
        setUserMetaID(metaIDInfo.metaid.slice(0, 8));
        currentStorageWallet.metaId = metaIDInfo.metaid.slice(0, 6);
      }

      updateStorageWallet(currentStorageWallet.id, currentStorageWallet);
      const currentStorageWalletRes: WalletBean = await getStorageCurrentWallet();
      // console.log('currentStorageWalletRes ', currentStorageWalletRes);

      registerForPushNotificationsAsync();
      initIsBackUp();
    }
  }

  async function initIsBackUp() {
    const walletBean = await getStorageCurrentWallet();
    if (walletBean.isBackUp == true) {
      updateSetIsBackUp(true);
    } else {
      updateSetIsBackUp(false);
    }
  }

  async function checkUpgrade() {
    //android 更新跟当前的应用的Code 保持一致即可
    if (platformNow === 'android') {
      const check: UpdateData = await fetchCheckIDChatUpgrade('android');
      console.log(JSON.stringify(check));
      const codeVersion = check.data.version_code;
      // setUpdateUrl(check.data.url);
      setUpdateUrl(check.data.apkUrl);
      if (codeVersion > versionCode) {
        setIsShowLoading(false);
        setUpdate(true);
      }
    } else {
      // 36 codeVersion改为当前版本
      const check: UpdateData = await fetchCheckIDChatUpgrade('ios');
      console.log(JSON.stringify(check));
      const codeVersion = check.data.version_code;
      setUpdateUrl(check.data.url);
      console.log('codeVersion', codeVersion);
      console.log('buildNumber', buildNumber);

      if (codeVersion > parseFloat(buildNumber)) {
        console.log('update  显示更新弹窗');
        setIsShowLoading(false);
        setUpdate(true);
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LoadingModal
        isShow={isShowLoading}
        isCancel={true}
        event={() => {
          setIsShowLoading(false);
        }}
      />

      {/* upgrade  */}
      <Modal visible={hasUpdate} transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 10,
              paddingHorizontal: 30,
              marginHorizontal: 25,
              paddingTop: 20,
              paddingBottom: 10,
            }}
          >
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* <Image
                        source={require("../../image/receive_mvc_icon.png")}
                        style={{ width: 50, height: 50 }}
                      /> */}

              <Text
                style={{
                  color: '#333',
                  textAlign: 'center',
                  lineHeight: 20,
                  marginTop: 20,
                  fontSize: 18,
                  fontWeight: 'bold',
                }}
              >
                New version
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 10,
              }}
            >
              <Text style={{ color: '#333', fontSize: 14 }}>
                New version available. Would you like to download the update now?
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 40,
                justifyContent: 'space-between',
              }}
            >
              <RoundSimButtonFlee
                title={'Cancel'}
                style={{
                  borderRadius: 10,
                  height: 40,
                  width: '45%',
                  borderWidth: 1,
                  borderColor: themeColor,
                }}
                color="#fff"
                textColor="#333"
                event={() => {
                  setUpdate(false);
                }}
              />

              <RoundSimButtonFlee
                title={'Confirm'}
                style={{ borderRadius: 10, height: 40, width: '45%' }}
                textColor="#333"
                event={() => {
                  setUpdate(false);
                  openBrowser(updateUrl);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <NormalAlertView
        isShow={isShowLogout}
        title={t('chat_settings_logout')}
        message={t('chat_logout_notice')}
        onConfirm={() => {
          setIsLogout(false);
          useUserStore.getState().clearUserInfo();
          eventBus.publish(logout_Bus, { data: '' });
          updateWebLogout(getRandomID());
          navigate('SplashPage');
        }}
        onCancel={() => {
          setIsLogout(false);
        }}
      />

      {isScan ? (
        <QRScanner
          handleScan={(data) => {
            setIsScan(false);
            console.log(data);
          }}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                marginTop: 20,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  marginTop: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* <AvatarImageView size={80} source={selectedImage!=null?{uri:selectedImage}:require('@image/avatar_default_icon.png')} /> */}
                <AvatarImageView
                  size={80}
                  source={
                    isNotEmpty(selectedImage)
                      ? {
                          uri: selectedImage,
                        }
                      : require('@image/avatar_default_icon.png')
                  }
                />
                <Text style={[metaStyles.titleText, { marginTop: 10 }]}> {userName}</Text>

                <TouchableWithoutFeedback
                  onPress={() => {
                    Clipboard.setString(userMetaID);
                    ToastView({ text: t('copy_success'), type: 'info' });
                  }}
                >
                  <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                    <Text style={[{ color: '#909399', fontSize: 13 }]}>{'MetaID'}</Text>
                    <Text style={[{ color: '#909399', fontSize: 13, marginLeft: 3 }]}>
                      {userMetaID}
                    </Text>
                    <Image
                      style={{ marginLeft: 3, width: 13, height: 13 }}
                      source={require('@image/meta_copy_icon.png')}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>

            <TouchableWithoutFeedback
              onPress={() => {
                navigate('DappWebsPage', { url: 'https://show.now' });
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                }}
              >
                <Image
                  source={require('@image/settings_buzz_icon.png')}
                  style={{ width: 30, height: 30 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {/* {t('chat_settings_settings')} */}
                  Buzz
                </Text>
                <View style={{ flex: 1 }} />
                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPress={() => {
                navigate('WalletTabs');
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fff',
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                }}
              >
                <Image
                  source={require('@image/chat_me_wallet_icon.png')}
                  style={{ width: 30, height: 30 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('chat_settings_my_wallet')}
                </Text>
                <View style={{ flex: 1 }} />

                {!isBackUp && (
                  <View
                    style={{
                      backgroundColor: '#FF505C33',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 33,
                    }}
                  >
                    <Text style={{ color: '#FF505C', fontSize: 12 }}>{t('s_backup_chat')}</Text>
                  </View>
                )}

                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </TouchableWithoutFeedback>
            <View
              style={{ width: '100%', height: 0.5, backgroundColor: 'rgba(191, 194, 204, 0.5)' }}
            />
            <TouchableWithoutFeedback
              onPress={() => {
                navigate('PeoEditInfoPage');
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                }}
              >
                <Image
                  source={require('@image/chat_me_edit_icon.png')}
                  style={{ width: 30, height: 30 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('chat_settings_edit_profile')}
                </Text>
                <View style={{ flex: 1 }} />
                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPress={() => {
                navigate('LocalChatSettingsPage');
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                }}
              >
                <Image
                  source={require('@image/chat_me_settings_icon.png')}
                  style={{ width: 30, height: 30 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('chat_settings_settings')}
                </Text>
                <View style={{ flex: 1 }} />
                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPress={() => {
                const rand = getRandomID();
                console.log('随机数' + rand);
                updateWebLogout(rand);
                navigate('SwitchAccountPage');
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                }}
              >
                <Image
                  source={require('@image/chat_me_switch_accout_icon.png')}
                  style={{ width: 30, height: 30 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('chat_settings_switch_account')}
                </Text>
                <View style={{ flex: 1 }} />
                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPress={() => {
                setIsLogout(true);
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                }}
              >
                <Image
                  source={require('@image/chat_me_logout_icon.png')}
                  style={{ width: 30, height: 30 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('chat_settings_logout')}
                </Text>
                <View style={{ flex: 1 }} />
                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
