import { View, Text, TouchableWithoutFeedback, Image } from 'react-native';
import React, { use, useEffect, useState } from 'react';
import { GradientAvatar, LoadingModal, RoundSimButton, TitleBar } from '../../constant/Widget';
import { metaStyles } from '../../constant/Constants';
import { useData } from '../../hooks/MyProvider';
import {
  network_all,
  network_btc,
  network_key,
  network_mvc,
  createStorage,
} from '../../utils/AsyncStorageUtil';
import { eventBus, refreshHomeLoadingEvent } from '../../utils/EventBus';
import { navigate, reSets } from '../../base/NavigationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getRandomID,
  getRandomNum,
  getStorageCurrentWallet,
  setCurrentStorageWallet,
} from '@/utils/WalletUtils';
import {
  getBtcWallet,
  getCurrentBtcWallet,
  getCurrentMvcWallet,
  getMvcCreateWallet,
} from '@/wallet/wallet';
import { AddressType } from '@metalet/utxo-wallet-service';
import { useTranslation } from 'react-i18next';
import useWalletStore from '@/stores/useWalletStore';
import { isRegisterMetaID, userLogin } from '@/chat/com/metaIDUtils';

const storage = createStorage();

export default function ImportWalletNetWorkPage(props) {
  const { netWork, updateNetWork } = useData();
  const [selectMvcNetWork, setSelectMvcNetWork] = useState(true);
  const [selectBtcNetWork, setSelectBtcNetWork] = useState(true);

  const [isShowLoading, setIsShowLoading] = useState(false);
  const { mvcPath, updateMvcPath } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { mvcAddress, updateMvcAddress } = useData();
  const { btcAddress, updateBtcAddress } = useData();
  const { btcSameAsMvcAddress, updateBtcSameAsMvcAddress } = useData();
  const { setCurrentWallet } = useWalletStore();
  const { needRefreshApp, updateNeedRefreshApp } = useData();
  const { switchAccount, updateSwitchAccount } = useData();
  const { reloadWebKey, updateReloadKey } = useData();

  const { t } = useTranslation();

  useEffect(() => {
    console.log('ImportWalletNetPage useEffect', selectMvcNetWork);
  }, []);

  async function changeNetwork() {
    console.log('ImportWalletNetPage 11111:', selectMvcNetWork);

    if (selectBtcNetWork == false && selectMvcNetWork == false) {
      return;
    }
    if (selectBtcNetWork && selectMvcNetWork == false) {
      await storage.set(network_key, network_btc);
      updateNetWork(network_btc);
    } else if (selectMvcNetWork && selectBtcNetWork == false) {
      await storage.set(network_key, network_mvc);
      updateNetWork(network_mvc);
    } else if (selectBtcNetWork && selectMvcNetWork) {
      await storage.set(network_key, network_all);
      updateNetWork(network_all);
    }
    console.log('ImportWalletNetPage useEffect', selectMvcNetWork);

    const walletBean = await getStorageCurrentWallet();
    const seed = metaletWallet.currentBtcWallet.getSeed();
    const mvcWallet = await getMvcCreateWallet(walletBean, seed);

    const btcSameAsLegacyWallet = await getBtcWallet(AddressType.SameAsMvc);
    const currentBtcWallet = await getCurrentBtcWallet();

    console.log('btcSameAsLegacyWallet:', btcSameAsLegacyWallet.getAddress());

    metaletWallet.currentBtcWallet = currentBtcWallet;
    metaletWallet.currentMvcWallet = mvcWallet;
    metaletWallet.btcSameAsWallet = btcSameAsLegacyWallet;

    updateBtcSameAsMvcAddress(btcSameAsLegacyWallet.getAddress());
    updateMvcAddress(mvcWallet.getAddress());
    updateBtcAddress(currentBtcWallet.getAddress());

    updateMetaletWallet(metaletWallet);

    // await setCurrentStorageWallet(walletBean, parseInt(mvcPath));
    setCurrentWallet({ btcWallet: currentBtcWallet, mvcWallet: mvcWallet });
    const isResister = await isRegisterMetaID();
    if (isResister) {
      // navigate('SplashPage');
      console.log('用户已经注册过MetaID,直接登录');
      userLogin().then(() => {
        // updateNeedRefreshApp(getRandomID());
        // updateSwitchAccount(getRandomID());
        // navigate('SplashPage');

        // updateSwitchAccount(getRandomID());
        // updateReloadKey(getRandomNum());

        // navigate('Tabs');

        updateSwitchAccount(getRandomID());
        updateReloadKey(getRandomNum());
        reSets('Tabs');
        // navigate('Tabs');
      });

      // reSets('Tabs');
    } else {
      navigate('PeoInfoPage');
    }

    // props.navigation.navigate("CongratulationsPage", {
    //   type:t("w_import_success") ,
    //   type3: ":sldkfj",
    // });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <LoadingModal
        isShow={isShowLoading}
        isCancel={true}
        event={() => {
          setIsShowLoading(false);
        }}
      />
      <View style={{ flex: 1 }}>
        <TitleBar title={t('w_please_select_network')} />

        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 20,
              marginVertical: 20,
              backgroundColor: '#F5F7F9',
              borderRadius: 10,
              padding: 10,
            },
          ]}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              setSelectBtcNetWork(!selectBtcNetWork);
              // changeNetwork(network_btc);
              // setSelectMvcNetWork(false);
              // setSelectBtcNetWork(true);
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginVertical: 10,
                alignItems: 'center',
                marginHorizontal: 20,
              }}
            >
              <Image
                source={require('../../../image/meta_btc_icon.png')}
                style={{ width: 30, height: 30 }}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={metaStyles.defaultText}> Bitcoin</Text>
                {/* <Text style={{ marginTop: 10 }}>{}</Text> */}
              </View>

              <View style={{ flex: 1 }} />

              {selectBtcNetWork && (
                <Image
                  source={require('../../../image/wallets_select_icon.png')}
                  style={{ width: 15, height: 15 }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 20,
              marginVertical: 10,
              backgroundColor: '#F5F7F9',
              borderRadius: 10,
              padding: 10,
            },
          ]}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              // if (selectBtcNetWork === true) {
              //   setSelectBtcNetWork(false);
              // }
              // if
              // (selectMvcNetWork === true) {
              //   setSelectMvcNetWork(false);
              // }
              setSelectMvcNetWork(!selectMvcNetWork);
              // setSelectBtcNetWork(false);
              console.log('ImportWalletNetPage useEffect', selectMvcNetWork);

              // changeNetwork(network_mvc);
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 20,
                marginVertical: 10,
              }}
            >
              <Image
                source={require('../../../image/logo_space.png')}
                style={{ width: 30, height: 30 }}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={metaStyles.defaultText}> Microvisionchain</Text>
                <View
                  style={{
                    marginTop: 3,
                    backgroundColor: 'rgba(247, 147, 26, 0.2)',
                    borderRadius: 10,
                    width: 90,
                    alignItems: 'center',
                    paddingVertical: 2,
                    marginLeft: 5,
                  }}
                >
                  <Text style={{ fontSize: 8, color: '#FF981C' }}>Bitcoin sidechain </Text>
                </View>
              </View>

              <View style={{ flex: 1 }} />

              {selectMvcNetWork && (
                <Image
                  source={require('@image/wallets_select_icon.png')}
                  style={{ width: 15, height: 15 }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        <TouchableWithoutFeedback
          onPress={() => {
            navigate('ImportWalletSelectAddressPage');
          }}
        >
          <Image
            source={require('@image/import_mvc_address_icon.png')}
            style={{ marginLeft: 25, marginTop: 10, width: 150, height: 15 }}
          />
        </TouchableWithoutFeedback>

        <View style={{ flex: 1 }} />

        <View style={{ marginHorizontal: 20, marginBottom: 40 }}>
          <RoundSimButton
            title={t('c_confirm')}
            textColor="#333"
            event={() => {
              changeNetwork();
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
