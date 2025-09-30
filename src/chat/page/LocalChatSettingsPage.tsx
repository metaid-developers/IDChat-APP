import { View, Text, Image, TouchableWithoutFeedback, Modal, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseView, Line, LoadingModal, QRScanner, TitleBar, VerifyModal } from '@/constant/Widget';
import { metaStyles, themeColor } from '@/constant/Constants';
import Constants from 'expo-constants';
import { navigate } from '@/base/NavigationService';
import useNetworkStore from '@/stores/useNetworkStore';
import { getRandomID, setWalletNetwork } from '@/utils/WalletUtils';
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

export const BTC_NETWORK = 'mainnet';
export const BTC_NETWORK_TEST = 'testnet';

export default function LocalChatSettingsPage(props: any) {
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

  // const currentAddressType = metaletWallet.currentBtcWallet!.getAddressType()!;
  // console.log(
  //   "addressType-----",
  //   metaletWallet.currentBtcWallet!.getAddressType()!
  // );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <LoadingModal
        isShow={isShowLoading}
        isCancel={true}
        event={() => {
          setIsShowLoading(false);
        }}
      />

      <Modal visible={isShowNetwork} transparent={true}>
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
              marginHorizontal: 30,
              padding: 30,
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <Text style={metaStyles.largeDefaultLittleText}>{t('s_select_network')}</Text>

              <View style={{ flex: 1 }} />

              <CloseView
                event={() => {
                  setShowNetwork(false);
                }}
              />
            </View>

            <TouchableWithoutFeedback
              onPress={async () => {
                setShowNetwork(false);
                setIsShowLoading(true);
                await setWalletNetwork(BTC_NETWORK);
                switchNetwork(BTC_NETWORK);
                updateNeedInitWallet(getRandomID());
                setTimeout(() => {
                  setIsShowLoading(false);
                }, 100);
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 30,
                  alignItems: 'center',
                  height: 50,
                }}
              >
                <Text style={{ color: '#333333', fontSize: 18 }}>Mainnet</Text>

                <View style={{ flex: 1 }} />

                {network == BTC_NETWORK && (
                  <Image
                    source={require('@image/wallets_select_icon.png')}
                    style={{ padding: 8, width: 20, height: 20 }}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPress={async () => {
                setShowNetwork(false);
                setIsShowLoading(true);
                await setWalletNetwork(BTC_NETWORK_TEST);
                switchNetwork(BTC_NETWORK_TEST);
                updateNeedInitWallet(getRandomID());
                setTimeout(() => {
                  setIsShowLoading(false);
                }, 100);
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 50,
                }}
              >
                <Text style={{ color: '#333333', fontSize: 18 }}>Testnet</Text>

                <View style={{ flex: 1 }} />

                {network == BTC_NETWORK_TEST && (
                  <Image
                    source={require('@image/wallets_select_icon.png')}
                    style={{ padding: 8, width: 20, height: 20 }}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </Modal>

      <Modal visible={isLanguage} transparent={true}>
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
              marginHorizontal: 30,
              padding: 30,
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <Text style={metaStyles.largeDefaultLittleText}>{t('s_select_language')}</Text>

              <View style={{ flex: 1 }} />

              <CloseView
                event={() => {
                  setIsLanguage(false);
                }}
              />
            </View>

            <TouchableWithoutFeedback
              onPress={async () => {
                AsyncStorageUtil.setItem(wallet_language_key, 'en');
                i18n.changeLanguage('en');
                updateWalletLanguage('en');
                setIsShowLoading(true);
                setIsLanguage(false);
                setTimeout(() => {
                  setIsShowLoading(false);
                  i18n.changeLanguage('en');
                }, 1000);
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 30,
                  alignItems: 'center',
                  height: 50,
                }}
              >
                <Text style={{ color: '#333333', fontSize: 18 }}>English</Text>

                <View style={{ flex: 1 }} />

                {walletLanguage == 'en' && (
                  <Image
                    source={require('@image/wallets_select_icon.png')}
                    style={{ padding: 8, width: 20, height: 20 }}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPress={async () => {
                AsyncStorageUtil.setItem(wallet_language_key, 'zh');
                updateWalletLanguage('zh');
                setIsLanguage(false);
                setIsShowLoading(true);
                setTimeout(() => {
                  setIsShowLoading(false);
                  i18n.changeLanguage('zh');
                }, 1000);
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 50,
                }}
              >
                <Text style={{ color: '#333333', fontSize: 18 }}>中文简体</Text>

                <View style={{ flex: 1 }} />

                {walletLanguage == 'zh' && (
                  <Image
                    source={require('@image/wallets_select_icon.png')}
                    style={{ padding: 8, width: 20, height: 20 }}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </Modal>

      <Modal visible={isDisclaimer} transparent={true}>
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
              paddingTop: 25,
              marginHorizontal: 20,
              paddingBottom: 15,
              height: '80%',
            }}
          >
            <Text style={[metaStyles.defaultText18, { textAlign: 'center' }]}>
              {t('s_disclaimer')}
            </Text>

            <Line />

            <ScrollView>
              <Text style={[metaStyles.defaultText, { marginTop: 15 }]}>
                {t('m_disclaimer')}
                {/* Use of this wallet is at your own risk and discretion. The
                wallet is not liable for any losses incurred as a result of
                using the wallet. {"\n"}
                {"\n"}
                The wallet does not guarantee the continuity and stability of
                its functions and services, and may be interrupted or terminated
                due to force majeure, hacker attacks, technical failures, policy
                changes, or other factors. {"\n"}
                {"\n"}
                Users should comply with local laws and regulations, and the
                wallet is not responsible for any consequences resulting from
                users' violation of laws and regulations. {"\n"}
                {"\n"}
                Users should properly safeguard their private keys and mnemonic
                phrases, and bear any losses incurred due to the loss or theft
                of private keys or mnemonic phrases. */}
              </Text>
            </ScrollView>

            {/* <RoundSimButton textColor="#fff" title={"OK"} event={()=>{
            setIsShowBackUp(false)
           }}/> */}

            <TouchableWithoutFeedback
              onPress={async () => {
                setIsDisclaimer(false);
              }}
            >
              <Text
                style={[
                  metaStyles.largeDefaultLittleText,
                  { textAlign: 'center', color: themeColor },
                ]}
              >
                {t('s_ok')}
              </Text>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </Modal>

      <VerifyModal
        isShow={isShowVerify}
        eventCancel={() => {
          setIsShowVerify(false);
        }}
        event={() => {
          setIsShowVerify(false);
          navigate('BackupPage');
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
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 20,
              alignItems: 'center',
            }}
          >
            <TitleBar title={t('s_settings')} />
          </View>

          <View style={{ marginHorizontal:20, flex: 1 }}>
            <TouchableWithoutFeedback
              onPress={() => {
                setIsLanguage(true);
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
             
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('s_language')}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={metaStyles.defaultText}>
                  {walletLanguage == 'en' ? 'English' : '中文简体'}
                </Text>
                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20, marginLeft: 5 }}
                />
              </View>
            </TouchableWithoutFeedback>
          

            {/* <TouchableWithoutFeedback
              onPress={() => {
                 navigate('PushPage');
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
             
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  Push Notifications
                </Text>
                <View style={{ flex: 1 }} />
                
              </View>
            </TouchableWithoutFeedback> */}

            <TouchableWithoutFeedback
              onPress={() => {
                // setIsShowVerify(true);
                navigate('ChatAboutPage');
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
               
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {/* {t('s_backup_wallet')} */}
                  About the APP
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
