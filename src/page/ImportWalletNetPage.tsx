import {
  View,
  Text,
  TextInput,
  Image,
  Modal,
  Button,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import {
  RoundSimButton,
  TitleBar,
  useEasyToast,
  LoadingModal,
  // GradientAvatar,
} from '../constant/Widget';
import { SafeAreaView } from 'react-native-safe-area-context';
import { metaStyles, semiTransparentGray } from '../constant/Constants';
import EasyToast from 'react-native-easy-toast';
import { ActivityIndicator } from 'react-native-paper';

import { LinearGradient } from 'expo-linear-gradient';
import {
  CurrentAccountIDKey,
  CurrentWalletIDKey,
  wallets_key,
  walllet_address_type_key,
  createStorage,
} from '../utils/AsyncStorageUtil';

import { useData } from '../hooks/MyProvider';
import { AccountsOptions, WalletBean } from '../bean/WalletBean';
import { MetaletWalletManager } from '../wallet/MetaletWalletManager';
import { AddressType, Chain, CoinType } from '@metalet/utxo-wallet-service';
import { getRandomColorList } from '../utils/MetaFunUiils';
import MetaletWallet from '../wallet/MetaletWallet';
import { BtcWallet, MvcWallet } from '@metalet/utxo-wallet-service';
import {
  getRandomID,
  getStorageWallets,
  getWalletBeans,
  getWalletNetwork,
  isNoStorageWallet,
} from '../utils/WalletUtils';
import { useTranslation } from 'react-i18next';
import { navigate } from '@/base/NavigationService';
import useWalletStore from '@/stores/useWalletStore';

const storage = createStorage();
export default function ImportWalletNetPage({ route }) {
  const toastRef = useEasyToast('center');
  const [mnemonic, setMneMonic] = useState('');
  const { walletManager, updateWalletManager } = useData();

  // 当前钱包
  const { myWallet, updateMyWallet } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { mvcAddress, updateMvcAddress } = useData();
  const { btcAddress, updateBtcAddress } = useData();
  const { needInitWallet, updateNeedInitWallet } = useData();

  //import
  const { mvcPath, updateMvcPath } = useData();
  const { type } = route.params;

  const { t } = useTranslation();
  const { setCurrentWallet } = useWalletStore();

  // const showToast = useCallback(() => {
  //   toastRef.current?.show('Hello World!', 2000, () => console.log('Toast dismissed'));
  // }, [toastRef]);
  const closeModal = () => {
    setObj({ ...obj, isShow: false });
    setTimeout(() => {
      setObj({ ...obj, isShow: true });
    }, 2000);
  };

  const OpenModal = async () => {
    if (!mnemonic) {
      return;
    }

    console.log('import wallet mode', type);

    setObj({ ...obj, isShow: true });

    //wallet
    let walletName;
    let walletID = Math.random().toString(36).substr(2, 8);
    let wallet_addressType = AddressType.SameAsMvc;

    //account
    let accountName = 'Account 1';
    let accountID = Math.random().toString(36).substr(2, 8);
    let accountAddressIndex = 0;

    const hasNoWallets = await isNoStorageWallet();
    const wallets = await getStorageWallets();

    if (hasNoWallets) {
      //new
      walletName = 'Wallet 1';
      console.log('new');
    } else {
      //add
      console.log('add');

      walletName = 'Wallet ' + (wallets.length + 1);
    }

    console.log('初始创建的路径是： ' + mvcPath);
    const network = await getWalletNetwork();

    let walletBean: WalletBean = {
      id: walletID,
      name: walletName,
      mnemonic,
      mvcTypes: parseInt(mvcPath),
      isOpen: true,
      addressType: wallet_addressType,
      isBackUp: false,
      isCurrentPathIndex: 0,
      seed: '',
      isColdWalletMode: type,
      accountsOptions: [
        {
          id: accountID,
          name: accountName,
          addressIndex: accountAddressIndex,
          isSelect: true,
          defaultAvatarColor: getRandomColorList(),
        },
      ],
    };

    const btcWallet = new BtcWallet({
      network: network == 'mainnet' ? 'mainnet' : 'testnet',
      mnemonic: walletBean.mnemonic,
      addressIndex: walletBean.accountsOptions[0].addressIndex,
      addressType: walletBean.addressType,
      coinType: CoinType.BTC,
    });

    const seed = btcWallet.getSeed();
    const saveSeed = seed.toString('hex');
    console.log('saveSeed', saveSeed);
    walletBean.seed = saveSeed;

    const mvcWallet = new MvcWallet({
      network: network == 'mainnet' ? 'mainnet' : 'testnet',
      mnemonic: walletBean.mnemonic,
      addressIndex: walletBean.accountsOptions[0].addressIndex,
      addressType: AddressType.LegacyMvc,
      coinType: walletBean.mvcTypes,
      seed,
    });

    updateMvcAddress(mvcWallet.getAddress());
    updateBtcAddress(btcWallet.getAddress());
    let metaletWallet = new MetaletWallet();
    metaletWallet.currentBtcWallet = btcWallet;
    metaletWallet.currentMvcWallet = mvcWallet;
    updateMetaletWallet(metaletWallet);
    // const updataWallets=[...value,walletBean]
    if (hasNoWallets) {
      await storage.set(wallets_key, [walletBean]);
    } else {
      console.log('refresh');
      const newWallets = [...wallets, walletBean];
      await storage.set(wallets_key, newWallets);
      updateNeedInitWallet(getRandomID());
    }
    // const updataWallets = addWallet(wallets, walletBean);
    updateMyWallet(walletBean);

    await storage.set(CurrentWalletIDKey, walletBean.id);
    await storage.set(CurrentAccountIDKey, walletBean.accountsOptions[0].id);
    // await AsyncStorageUtil.setItem(CurrentWalletIDKey, walletBean.id);
    // await AsyncStorageUtil.setItem(
    //   CurrentAccountIDKey,
    //   walletBean.accountsOptions[0].id
    // );

    // console.log("wallets " + getWalletBeans());
    setObj({ ...obj, isShow: false });
    // props.navigation.navigate('HomePage')

    navigate('ImportWalletNetWorkPage');

    // props.navigation.navigate("ImportWalletNetWorkPage");

    //TODO  gogo
    // props.navigation.navigate("CongratulationsPage", {
    //   type: "Imported Successfully",
    //   type3: ":sldkfj",
    // });

    // AsyncStorageUtil.getItem(wallets_key).then(async (value) => {
    //   console.log(value);

    //   if (value != null && value.length > 0) {
    //     //插入Wallet 写法
    //     walletName = "Wallet " + (value.length + 1);
    //     let walletBean: WalletBean = {
    //       id: walletID,
    //       name: walletName,
    //       mnemonic,
    //       mvcTypes,
    //       isOpen: true,
    //       addressType: wallet_addressType,
    //       isBackUp: false,
    //       isCurrentPathIndex: 0,
    //       accountsOptions: [
    //         {
    //           id: accountID,
    //           name: accountName,
    //           addressIndex: accountAddressIndex,
    //           isSelect: true,
    //           defaultAvatarColor: getRandomColorList(),
    //         },
    //       ],
    //     };

    //     const btcWallet = new BtcWallet({
    //       network: btc_network,
    //       mnemonic: walletBean.mnemonic,
    //       addressIndex: walletBean.accountsOptions[0].addressIndex,
    //       addressType: walletBean.addressType,

    //       //选中跟mvc 路径一致
    //       coinType: walletBean.mvcTypes,
    //     });

    //     const mvcWallet = new MvcWallet({
    //       network: "mainnet",
    //       mnemonic: walletBean.mnemonic,
    //       addressIndex: walletBean.accountsOptions[0].addressIndex,
    //       addressType: AddressType.LegacyMvc,
    //       coinType: walletBean.mvcTypes,
    //     });

    //     updateMvcAddress(mvcWallet.getAddress());
    //     updateBtcAddress(btcWallet.getAddress());
    //     let metaletWallet = new MetaletWallet();
    //     metaletWallet.currentBtcWallet = btcWallet;
    //     metaletWallet.currentMvcWallet = mvcWallet;
    //     updateMetaletWallet(metaletWallet);
    //     // const updataWallets=[...value,walletBean]
    //     const updataWallets = addWallet(value, walletBean);
    //     updateMyWallet(walletBean);
    //     await storage.set(wallets_key, updataWallets);
    //     await AsyncStorageUtil.setItem(
    //       walllet_address_type_key,
    //       wallet_addressType
    //     );

    //     // const myWalletManager = new MetaletWalletManager({
    //     //   network: "mainnet",
    //     //   walletsOptions: [
    //     //     {
    //     //       id: walletID,
    //     //       mnemonic: mnemonic,
    //     //       name: walletName,
    //     //       mvcTypes: [mvcTypes],
    //     //       accountsOptions: [
    //     //         {
    //     //           id: accountID,
    //     //           name: accountName,
    //     //           addressIndex: accountAddressIndex,
    //     //         },
    //     //       ],
    //     //     },
    //     //   ],
    //     // });

    //     // updateWalletManager(myWalletManager);
    //   } else {
    //     walletName = "Wallet 1";
    //     //新增的写法
    //     let walletBean: WalletBean = {
    //       id: walletID,
    //       name: walletName,
    //       mnemonic,
    //       mvcTypes,
    //       isOpen: true,
    //       addressType: wallet_addressType,
    //       isBackUp: false,
    //       isCurrentPathIndex: 0,
    //       accountsOptions: [
    //         {
    //           id: accountID,
    //           name: accountName,
    //           addressIndex: accountAddressIndex,
    //           isSelect: true,
    //           defaultAvatarColor: getRandomColorList(),
    //         },
    //       ],
    //     };
    //     let initWallets = [walletBean];
    //     await storage.set(wallets_key, initWallets);
    //     await AsyncStorageUtil.setItem(
    //       walllet_address_type_key,
    //       wallet_addressType
    //     );

    // const myWalletManager = new MetaletWalletManager({
    //   network: "mainnet",
    //   walletsOptions: [
    //     {
    //       id: walletID,
    //       mnemonic: mnemonic,
    //       name: walletName,
    //       mvcTypes: [mvcTypes],
    //       accountsOptions: [
    //         {
    //           id: accountID,
    //           name: accountName,
    //           addressIndex: accountAddressIndex,
    //         },
    //       ],
    //     },
    //   ],
    // });

    // updateWalletManager(myWalletManager);
    //   }
    // });
  };

  const addWallet = (wallets, newWallet) => {
    wallets.forEach((wallet) => {
      wallet.accountsOptions.forEach((account) => {
        account.isSelect = false;
      });
    });
    return [...wallets, newWallet];
  };

  const [obj, setObj] = useState({ title: '', isShow: false, isCancel: true });

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        console.log('click');
        Keyboard.dismiss();
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <EasyToast ref={toastRef} position="center" />
        <TitleBar />

        <View style={[metaStyles.verMarginContainer, { marginBottom: 50 }]}>
          <LoadingModal
            isCancel={obj.isCancel}
            isShow={obj.isShow}
            title={obj.title}
            event={closeModal}
          />

          <Text style={[metaStyles.largeDefaultText, { fontWeight: 'bold' }]}>
            {t('m_import_web_title')}
          </Text>
          <Text style={[metaStyles.smallDefaultText, { marginTop: 20 }]}>
            {t('m_import_web_notice')}
          </Text>
          <Text style={[metaStyles.defaultText, { marginTop: 30 }]}>
            {t('m_import_please_enter')}
          </Text>

          <View>
            <TextInput
              placeholder={t('m_import_web_title')}
              multiline={true}
              numberOfLines={6}
              style={[
                metaStyles.textInputDefault,
                { paddingVertical: 20, height: 135, textAlignVertical: 'top' },
              ]}
              onChangeText={(text) => {
                setMneMonic(text.trim());
                // setMneMonic(text);
              }}
            />
          </View>

          {/* <Text style={[metaStyles.defaultText, { marginTop: 20 }]}>
          MVC Path
        </Text>

        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
        >
          <Text style={metaStyles.defaultText}>m/44'/</Text>
          <TextInput
            placeholder="10001"
            // keyboardType="numeric"
            style={{
              borderRadius: 5,
              backgroundColor: semiTransparentGray,
              fontSize: 14,
              color: "#333333",
              paddingHorizontal: 5,
              paddingVertical: 3,
              marginHorizontal: 5,
            }}
            onChangeText={(text) => {
              setmvcPath(text);
            }}
          />
          <Text style={metaStyles.defaultText}>'/0'</Text>
        </View> */}

          <View style={metaStyles.noticeRed}>
            <View style={{ flexDirection: 'row' }}>
              <Image
                source={require('../../image/meta_waring_icon.png')}
                style={{ width: 20, height: 20 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: '#FA5151',
                  fontWeight: 'bold',
                  marginLeft: 5,
                }}
              >
                {t('m_import_warning_title')}
              </Text>
            </View>
            <Text style={{ color: '#FA5151', marginTop: 5 }}>{t('m_import_warning_notice')}</Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* <GradientAvatar/> */}
          <RoundSimButton
            title={t('c_confirm')}
            textColor="#333"
            event={() => {
              // console.log("hello");
              //   toastRef.current?.show('Hello World!', 2000, () => console.log('Toast dismissed'));
              // }, [toastRef]);
              // toastRef.current?.show("Hello", 1500);
              // toastRef.current?.show('Hello World!', 2000, () => console.log('Toast dismissed'));

              // showToast()
              OpenModal();
            }}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalView: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    // elevation: 5,
  },
});
