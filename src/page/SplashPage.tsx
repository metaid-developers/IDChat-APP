import { View, Text, Image, TextInput, ImageBackground, Dimensions, Platform } from 'react-native';
import React, { use, useEffect } from 'react';
import { metaStyles, setShowPayCode, themeColor } from '../constant/Constants';
import { useData } from '../hooks/MyProvider';
import {
  AsyncStorageUtil,
  account_select_key,
  wallet_mode_cold,
  wallet_mode_hot,
  wallet_mode_observer,
  wallet_password_key,
  wallets_key,
} from '../utils/AsyncStorageUtil';
import { AddressType, Chain, CoinType, Net } from '@metalet/utxo-wallet-service';
// import { BtcWallet, MvcWallet } from "@metalet/utxo-wallet-sdk";
import { MetaletWalletManager } from '../wallet/MetaletWalletManager';
import { TypeTest } from '../wallet/TypeTest';
import MetaletWallet from '../wallet/MetaletWallet';
import { WalletBean } from '../bean/WalletBean';
import { Buffer } from 'buffer';
import { getCurrentBtcWallet, getCurrentMvcWallet } from '../wallet/wallet';
import {
  getCurrentWalletAccount,
  getRandomID,
  getRandomNum,
  getStorageCurrentWallet,
  getWalletBeans,
  getWalletMode,
  getWalletNetwork,
  setWalletNetwork,
} from '../utils/WalletUtils';
import { goBack, navigate, reSets } from '../base/NavigationService';
import useNetworkStore from '@/stores/useNetworkStore';
import { BTC_NETWORK } from './SettingsPage';
import { UpdateData } from '@/api/type/Update';
import { fetchCheckUpgrade } from '@/api/metaletservice';
import Constants from 'expo-constants';
import useUserStore from '@/stores/useUserStore';
import { isRegisterMetaID, isUserLogin } from '@/chat/com/metaIDUtils';

export default function SplashPage(props) {
  const { myWallet, updateMyWallet } = useData();
  const { walletManager, updateWalletManager } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { network, switchNetwork } = useNetworkStore();
  const { walletMode, updateWalletMode } = useData();
  const { isShowPay, updateIsShowPay } = useData();
  const platformNow = Platform.OS;
  const versionCode = Constants.expoConfig?.android.versionCode;
  const buildNumber = Constants.expoConfig?.ios.buildNumber;

  const { needRefreshApp, updateNeedRefreshApp } = useData();
  let needRefresh = true;
  const { switchAccount, updateSwitchAccount } = useData();
  const { reloadWebKey, updateReloadKey } = useData();

  useEffect(() => {
    try {
      needRefresh = true;
      console.log('initDataBase', '自主刷新' + needRefreshApp);
      checkUpgrade();
      initDataBase();
      needRefresh = false;
    } catch (e) {
      console.log('initDataBase error', e);
    }
  }, []);

  useEffect(() => {
    try {
      if (needRefreshApp == '123') {
        return;
      }
      setTimeout(() => {
        if (needRefresh) {
          checkUpgrade();
          initDataBase();
          console.log('needRefreshApp111', needRefreshApp);
        }
      }, 1000);
    } catch (e) {
      console.log('initDataBase error', e);
    }
  }, [needRefreshApp]);

  async function initDataBase() {
    const network = await getWalletNetwork();
    if (network) {
      switchNetwork(network as Net);
    } else {
      await setWalletNetwork(BTC_NETWORK);
      switchNetwork(BTC_NETWORK);
    }

    const walletBean = await getStorageCurrentWallet();
    const account = await getCurrentWalletAccount();
    // console.log("walletBean", walletBean);
    // console.log("account", account);

    const password = await AsyncStorageUtil.getItem(wallet_password_key);
    if (password && password == '199333') {
      setShowPayCode(0);
    }

    if (walletBean && account) {
      updateMyWallet(walletBean);
      // console.log("walletBean", walletBean);

      const isCold = await getWalletMode();
      // const isColdTest = await getWalletModeTest();
      // console.log("isColdTest", isColdTest);

      // if (isCold == wallet_mode_hot||isCold==undefined||isCold==null||isCold=="") {
      //   const btcWallet = await getCurrentBtcWallet();
      //   const mvcWallet = await getCurrentMvcWallet();
      //   let metaletWallet = new MetaletWallet();
      //   metaletWallet.currentBtcWallet = btcWallet;
      //   metaletWallet.currentMvcWallet = mvcWallet;
      //   updateMetaletWallet(metaletWallet);
      //   updateWalletMode(wallet_mode_hot);
      // } else

      if (isCold == wallet_mode_cold) {
        const btcWallet = await getCurrentBtcWallet();
        const mvcWallet = await getCurrentMvcWallet();
        let metaletWallet = new MetaletWallet();
        metaletWallet.currentBtcWallet = btcWallet;
        metaletWallet.currentMvcWallet = mvcWallet;
        updateMetaletWallet(metaletWallet);
        updateWalletMode(wallet_mode_cold);
      } else if (isCold == wallet_mode_observer) {
        updateWalletMode(wallet_mode_observer);
      } else {
        const btcWallet = await getCurrentBtcWallet();
        const mvcWallet = await getCurrentMvcWallet();
        let metaletWallet = new MetaletWallet();
        metaletWallet.currentBtcWallet = btcWallet;
        metaletWallet.currentMvcWallet = mvcWallet;
        updateMetaletWallet(metaletWallet);
        updateWalletMode(wallet_mode_hot);
      }

      // props.navigation.navigate("Tabs");
      // reSets()
      // navigate("Tabs",{destory:true});
      // console.log("initDataBase 重置页面", "initDataBase");
      // const useInfo = useUserStore.getState().userInfo;

      // if (useInfo == null || useInfo == undefined) {

      // } else {

      // }

      const isLogin = await isUserLogin();
      if (isLogin) {
        console.log('myWallet 当前的选中钱包：');
        updateSwitchAccount(getRandomID());
        updateReloadKey(getRandomNum());
        reSets('Tabs');
      } else {
        console.log('myWallet111');
        props.navigation.navigate('WelcomeWalletPage');
      }
    } else {
      props.navigation.navigate('WelcomeWalletPage');
    }
  }

  function goToHome() {
    setTimeout(() => {
      if (myWallet == null) {
        props.navigation.navigate('WelcomeWalletPage');
      } else {
        console.log('myWallet 当前的选中钱包：', myWallet);
        props.navigation.navigate('Tabs');
      }
    }, 200);
  }

  async function checkUpgrade() {
    // updateIsShowPay(1);
    // if (platformNow === 'android') {
    //   const check: UpdateData = await fetchCheckUpgrade('android');
    //   console.log(JSON.stringify(check));
    //   const showCode = check.data.aavc;
    //   updateIsShowPay(1);
    //   // if (versionCode >= showCode) {
    //   //   updateIsShowPay(0);
    //   // } else {
    //   //   updateIsShowPay(1);
    //   // }
    // } else {
    //   // iavc 比当前版本大 1 为下一次更新的版本号
    //   const check: UpdateData = await fetchCheckUpgrade('ios');
    //   console.log(JSON.stringify(check));
    //   // const showCode = check.data.iavc;
    //   const showCode = check.data.iavc;
    //   console.log('showCode', showCode);
    //   if (parseFloat(buildNumber) >= showCode) {
    //     updateIsShowPay(0);
    //     console.log('no GO');
    //   } else {
    //     updateIsShowPay(1);
    //   }
    // }
    updateIsShowPay(0);
  }

  // async function checkUpgrade() {
  //   // updateIsShowPay(1);
  //   if (platformNow === "android") {
  //     const check: UpdateData = await fetchCheckUpgrade("android");
  //     // console.log(JSON.stringify(check));
  //     const showCode = check.data.android1;
  //     console.log("showCode",showCode);
  //     if(showCode){
  //       updateIsShowPay(showCode);
  //     }else{
  //       updateIsShowPay(1);
  //     }

  //   } else {
  //     const check: UpdateData = await fetchCheckUpgrade("ios");
  //     // console.log(JSON.stringify(check));
  //     const codeVersion = check.data.ios;
  //     const showCode = check.data.android;
  //     updateIsShowPay(showCode);
  //   }
  // }

  return (
    // <ImageBackground source={require("../../assets/splash.png")}>

    // <View style={{ flex: 1 }} />
    // </ImageBackground>
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: themeColor,
      }}
    >
      <Image
        source={require('@assets/icon.png')}
        style={{ width: 200, height: 200 ,borderRadius:20}}
      />

      {/* <Image
        source={require('../../assets/splash.png')}
        style={{ width: '100%', height: '100%' }}
      /> */}
      {/* <Text
        style={[{ marginTop: 10 }, { fontWeight: "bold" }, { fontSize: 22 }]}
      >
        METALET
      </Text> */}
    </View>
  );
}
