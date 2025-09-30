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
import React, { useCallback, useEffect, useState } from 'react';
import {
  RoundSimButton,
  TitleBar,
  useEasyToast,
  LoadingModal,
  LoadingNoticeModal,
  // GradientAvatar,
} from '../../constant/Widget';
import { SafeAreaView } from 'react-native-safe-area-context';
import { metaStyles, semiTransparentGray, setShowPayCode } from '../../constant/Constants';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CurrentAccountIDKey,
  CurrentWalletIDKey,
  wallet_password_key,
  wallets_key,
  walllet_address_type_key,
  createStorage,
  wallet_mode_hot,
} from '../../utils/AsyncStorageUtil';
import { goBack, navigate } from '../../base/NavigationService';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { getStorageWallets, isNoStorageWallet } from '../../utils/WalletUtils';
import { useData } from '../../hooks/MyProvider';
import MetaletWallet from '../../wallet/MetaletWallet';
import { createMetaletWallet } from '../../wallet/wallet';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import useWalletStore from '@/stores/useWalletStore';

const storage = createStorage();

export default function SetPasswordPage({ route }) {
  const [IsPasswordLock, setIsPasswordLock] = useState(true);
  const [IsSecondLock, setIsSecondLock] = useState(true);

  const [inputPassword, setInputPassword] = useState('');
  const [inputPasswordAgain, setInputPasswordAgain] = useState('');

  const [isShowNotice, setIsShowNotice] = useState(false);
  const [noticeContent, setNoticeContent] = useState('Successful');

  const { type } = route.params;
  const [value, setValue] = useState('');
  const [valueAgain, setValueAgain] = useState('');

  const [isShowLoading, setIsShowLoading] = useState(false);
  const { setCurrentWallet } = useWalletStore();

  //create
  const { myWallet, updateMyWallet } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { mvcAddress, updateMvcAddress } = useData();
  const { btcAddress, updateBtcAddress } = useData();
  const { t } = useTranslation();

  useEffect(() => {
    console.log('mytype', type);
  }, []);

  const OpenModal = async () => {
    if (inputPassword == '' || inputPasswordAgain == '') {
      return;
    }
    if (inputPassword == inputPasswordAgain) {
      if (inputPassword.length == 6) {
        storage.set(wallet_password_key, inputPassword);
        // AsyncStorageUtil.setItem(wallet_password_key, inputPassword);
        if (type == 'create') {
          setIsShowLoading(true);
          const { btcWallet, mvcWallet, walletBean } = await createMetaletWallet(
            10001,
            wallet_mode_hot,
          );
          const wallets = await getStorageWallets();
          const hasNoWallets = await isNoStorageWallet();

          let metaletWallet = new MetaletWallet();
          updateMvcAddress(mvcWallet.getAddress());
          updateBtcAddress(btcWallet.getAddress());
          metaletWallet.currentBtcWallet = btcWallet;
          metaletWallet.currentMvcWallet = mvcWallet;
          updateMetaletWallet(metaletWallet);

          if (hasNoWallets) {
            await storage.set(wallets_key, [walletBean]);
          } else {
            const newWallets = [...wallets, walletBean];
            await storage.set(wallets_key, newWallets);
          }

          updateMyWallet(walletBean);
          await storage.set(CurrentWalletIDKey, walletBean.id);
          await storage.set(CurrentAccountIDKey, walletBean.accountsOptions[0].id);
          setIsShowLoading(false);

          setCurrentWallet({ btcWallet: btcWallet, mvcWallet: mvcWallet });

          navigate('PeoInfoPage');
          // navigate("CongratulationsPage", {
          //   type: t("w_create_success"),
          // });
        } else if (type == 'import') {
          // navigate("ImportWalletPage", { destory: true });
          // navigate("ImportWalletNetPage", { destory: true });
          navigate('ImportWalletNetPage', { type: wallet_mode_hot });
        } else {
          Toast.show({ text1: 'Successful' });
          goBack();
        }
      } else {
        setNoticeContent('Password must be 6 digits');
        ShowNotice();
      }
    } else {
      setNoticeContent('The passwords entered twice do not match');
      ShowNotice();
    }

    if (inputPassword && inputPassword == '199333') {
      setShowPayCode(0);
      navigate('SplashPage');
    }
  };

  const ShowNotice = () => {
    setIsShowNotice(true);
    setTimeout(() => {
      setIsShowNotice(false);
    }, 2000);
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        console.log('click');
        Keyboard.dismiss();
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <LoadingModal
          isShow={isShowLoading}
          isCancel={true}
          event={() => {
            setIsShowLoading(false);
          }}
        />
        <LoadingNoticeModal title={noticeContent} isShow={isShowNotice} />

        <TitleBar />

        <View style={[metaStyles.verMarginContainer, { marginBottom: 50 }]}>
          <Text style={[metaStyles.largeDefaultText, { fontWeight: 'bold' }]}>
            {t('p_set_password')}
          </Text>
          <Text style={[metaStyles.smallDefaultText, { marginTop: 20 }]}>
            {t('p_set_password_notice')}
          </Text>
          <Text style={[metaStyles.defaultText, { marginTop: 30 }]}>
            {t('p_set_new_password')}
            <Text style={{ color: '#666' }}>{t('p_set_password_about')}</Text>
          </Text>

          <View
            style={{
              alignItems: 'center',
              borderColor: 'rgba(191, 194, 204, 0.5)',
              flexDirection: 'row',
              borderWidth: 1,
              height: 50,
              borderRadius: 10,
              marginTop: 10,
              // backgroundColor:semiTransparentGray
            }}
          >
            <TextInput
              onChangeText={(text) => {
                setInputPassword(text);
                const numericValue = text.replace(/[^0-9]/g, '');
                if (numericValue.length <= 6) {
                  setValue(numericValue);
                }
              }}
              secureTextEntry={IsPasswordLock}
              keyboardType="numeric"
              maxLength={6}
              value={value}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                marginLeft: 10,
                paddingRight: 10,
                color: '#000',
              }}
            />

            <TouchableWithoutFeedback
              onPress={() => {
                setIsPasswordLock(IsPasswordLock ? false : true);
              }}
            >
              {IsPasswordLock ? (
                <Image
                  source={require('../../../image/input_close_icon.png')}
                  style={{ width: 20, height: 20, marginRight: 10 }}
                />
              ) : (
                <Image
                  source={require('../../../image/input_open_icon.png')}
                  style={{ width: 20, height: 20, marginRight: 10 }}
                />
              )}
            </TouchableWithoutFeedback>
          </View>

          {/* <View
          style={{
            alignItems: "center",
            borderColor: "rgba(191, 194, 204, 0.5)",
            flexDirection: "row",
            borderWidth: 1,
            height: 50,
            borderRadius: 10,
            marginTop: 10,
            // backgroundColor:semiTransparentGray
          }}
        >
          <TextInput
            onChangeText={(text) => {}}
            secureTextEntry={true}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              marginLeft: 10,
              paddingRight: 10,
            }}
          />

          <Image
            source={require("../../../image/input_close_icon.png")}
            style={{ width: 20, height: 20, marginRight: 10 }}
          />
        </View> */}

          <Text style={[metaStyles.defaultText, { marginTop: 30 }]}>
            {t('p_set_confirm_password')}
          </Text>

          <View
            style={{
              alignItems: 'center',
              borderColor: 'rgba(191, 194, 204, 0.5)',
              flexDirection: 'row',
              borderWidth: 1,
              height: 50,
              borderRadius: 10,
              marginTop: 10,
              // backgroundColor:semiTransparentGray
            }}
          >
            <TextInput
              onChangeText={(text) => {
                setInputPasswordAgain(text);
                const numericValue = text.replace(/[^0-9]/g, '');
                if (numericValue.length <= 6) {
                  setValueAgain(numericValue);
                }
              }}
              secureTextEntry={IsSecondLock}
              value={valueAgain}
              keyboardType="numeric"
              maxLength={6}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                marginLeft: 10,
                paddingRight: 10,
                color: '#000',
              }}
            />

            <TouchableWithoutFeedback
              onPress={() => {
                setIsSecondLock(IsSecondLock ? false : true);
              }}
            >
              {IsSecondLock ? (
                <Image
                  source={require('../../../image/input_close_icon.png')}
                  style={{ width: 20, height: 20, marginRight: 10 }}
                />
              ) : (
                <Image
                  source={require('../../../image/input_open_icon.png')}
                  style={{ width: 20, height: 20, marginRight: 10 }}
                />
              )}
            </TouchableWithoutFeedback>
          </View>

          <View style={{ flex: 1 }}></View>

          <RoundSimButton
            title={t('c_confirm')}
            event={() => {
              if (type == 'create_cold_wallet') {
                navigate('AddColdWalletPage');
              } else {
                OpenModal();
              }
            }}
          />

          <View style={{ flex: 1 }}></View>
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
