import { View, Text, Image, TouchableWithoutFeedback, Modal, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CloseView,
  Line,
  LoadingModal,
  QRScanner,
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
  getWalletBeans,
  setWalletNetwork,
} from '@/utils/WalletUtils';
import {
  AsyncStorageUtil,
  wallet_language_key,
  wallet_mode_cold,
  wallet_mode_hot,
  wallet_mode_observer,
  wallets_key,
} from '@/utils/AsyncStorageUtil';
import { useTranslation } from 'react-i18next';
import i18n from '@/language/i18n';
import { AddressType } from '@metalet/utxo-wallet-sdk';
import { useData } from '@/hooks/MyProvider';
import * as Clipboard from 'expo-clipboard';
import { getCurrentWallet } from '@/lib/wallet';
import { WalletBean } from '@/bean/WalletBean';

export const BTC_NETWORK = 'mainnet';
export const BTC_NETWORK_TEST = 'testnet';

export default function ChatWalletSettingsPage(props: any) {
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

  const [isShowBackUp, setIsShowBackUp] = useState(false);
  const [walletBackUp, setWalletBackUp] = useState('');
  const [mvcPath, setMvcPath] = useState('');
  const { isBackUp, updateSetIsBackUp } = useData();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <LoadingModal
        isShow={isShowLoading}
        isCancel={true}
        event={() => {
          setIsShowLoading(false);
        }}
      />

      <Modal transparent={true} visible={isShowBackUp}>
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
              paddingTop: 30,
              marginHorizontal: 20,
              paddingBottom: 15,
            }}
          >
            <Text style={[metaStyles.defaultText18, { textAlign: 'center' }]}>
              {t('s_backup_wallet_title')}
            </Text>

            <Line />

            <Text style={[metaStyles.grayTextdefault66, { marginTop: 20 }]}>Mnemonic Phrase</Text>
            <Text style={[metaStyles.defaultText, { marginTop: 20 }]}>{walletBackUp}</Text>

            <TouchableWithoutFeedback
              onPress={() => {
                setIsShowBackUp(false);
                Clipboard.setString(walletBackUp);
                ToastView({ text: 'Copy Successful' });
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                <Text style={[metaStyles.grayTextdefault66]}>Copy Mnemonic</Text>

                <Image
                  source={require('../../../image/meta_copy_icon.png')}
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                />
              </View>
            </TouchableWithoutFeedback>

            <Text style={[metaStyles.grayTextdefault66, { marginTop: 20 }]}>
              MVC Derivation Path
            </Text>
            <Text style={[metaStyles.defaultText, { marginTop: 10, marginBottom: 30 }]}>
              m/44'/{mvcPath}'/0'/0/0
            </Text>

            {/* <RoundSimButton textColor="#fff" title={"OK"} event={()=>{
               setIsShowBackUp(false)
              }}/> */}

            <TouchableWithoutFeedback
              onPress={async () => {
                setIsShowBackUp(false);
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
        event={async () => {
          setIsShowVerify(false);
          // navigate('BackupPage');

          const currentWallet: WalletBean = await getStorageCurrentWallet();
          setWalletBackUp(currentWallet.mnemonic);
          setMvcPath(currentWallet.mvcTypes.toString());
          setIsShowBackUp(true);
          updateSetIsBackUp(true)

          const wallets = await getWalletBeans();
          const wallet = wallets.find((itemWallet) => {
            console.log(itemWallet.mnemonic);
            if (itemWallet.mnemonic == currentWallet.mnemonic) {
              return itemWallet;
            }
          });
          wallet.isBackUp = true;
          await AsyncStorageUtil.updateItem(wallets_key, wallets);
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
          <View style={{ margin: 20, flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 20,
                alignItems: 'center',
              }}
            >
              <Text style={[{ textAlign: 'left' }, metaStyles.titleText]}>{t('s_settings')}</Text>

              <View style={{ flex: 1 }} />
              {/* <TouchableWithoutFeedback
                onPress={() => {
                  // setIsScan(true);
                  navigate("ScanPage");
                }}
              >
                <Image
                  source={require("../../image/scan_icon.png")}
                  style={{ width: 25, height: 25 }}
                />
              </TouchableWithoutFeedback> */}
            </View>

            <TouchableWithoutFeedback
              onPress={() => {
                setIsShowVerify(true);
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
                <Image
                  source={require('@image/settings_backup_icon.png')}
                  style={{ width: 45, height: 45 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('s_backup_wallet')}
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

            <TouchableWithoutFeedback
              onPress={() => {
                navigate('SecurityPage');
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
                <Image
                  source={require('@image/settings_safe_icon.png')}
                  style={{ width: 45, height: 45 }}
                />
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('s_security')}
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
                setIsDisclaimer(true);
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
                {/* <Image
                  source={require("../../image/settings_about_icon.png")}
                  style={{ width: 45, height: 45 }}
                /> */}
                <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>
                  {t('s_disclaimer')}
                </Text>
                <View style={{ flex: 1 }} />

                <Image
                  source={require('@image/list_icon_ins.png')}
                  style={{ width: 20, height: 20, marginLeft: 5 }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
