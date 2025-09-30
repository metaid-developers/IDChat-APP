import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import React, { useState } from 'react';
import { metaStyles, themeColor } from '../constant/Constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { LoadingModal, RoundSimButton, ToastView } from '../constant/Widget';
import Index from '../page/Index';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { navigate } from '../base/NavigationService';
import {
  getRandomID,
  getStorageWallets,
  isNoStorageWallet,
  isNoWalletPassword,
  openBrowser,
  // openLocalPrivacyPolsicy,
} from '../utils/WalletUtils';
import { wordlist } from '@scure/bip39/wordlists/english';
import * as bip39 from '@scure/bip39';
import { useData } from '../hooks/MyProvider';
import { createMetaletWallet } from '../wallet/wallet';
import MetaletWallet from '../wallet/MetaletWallet';
import {
  createStorage,
  CurrentAccountIDKey,
  CurrentWalletIDKey,
  wallet_mode_hot,
  wallets_key,
} from '../utils/AsyncStorageUtil';
import { use } from 'i18next';
import { useTranslation } from 'react-i18next';
import { checkHasNetWork } from '@/api/metaletservice';
import { isAwaitKeyword } from 'typescript';
import useWalletStore from '@/stores/useWalletStore';
import useUserStore from '@/stores/useUserStore';
import { eventBus, logout_Bus } from '@/utils/EventBus';
import { isUserLogin } from '@/chat/com/metaIDUtils';

const storage = createStorage();

// type Props={
//   navigation:StackNavigationProp<any,''/>;
// };
type Props = {
  navigation: NativeStackScreenProps<any, 'Home'>; // 替换any为你的StackNavigator路由类型
};

export default function WelcomeWalletPage(props) {
  //create
  const { myWallet, updateMyWallet } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { mvcAddress, updateMvcAddress } = useData();
  const { btcAddress, updateBtcAddress } = useData();
  const [isShowLoading, setIsShowLoading] = useState(false);
  const { t } = useTranslation();
  const { setCurrentWallet } = useWalletStore();
  const { webLogout, updateWebLogout } = useData();

  async function createWallet() {
    setIsShowLoading(true);
    const { btcWallet, mvcWallet, walletBean } = await createMetaletWallet(10001, wallet_mode_hot);
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
    // navigate('CongratulationsPage', {
    //   type: 'Successfully created',
    // });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColor }]}>
      <LoadingModal
        isShow={isShowLoading}
        isCancel={true}
        event={() => {
          setIsShowLoading(false);
        }}
      />

      <Image
        source={require('@image/icon.png')}
        style={{ width: 150, height: 150, marginTop: 50 }}
        // style={styles.img}
      />
      {/* { marginTop: 15 }, */}
      <Text style={[{ fontWeight: 'bold', marginTop: 20 }, { fontSize: 20 }]}>
        {t('w_welcome_title')}
      </Text>

      {/* <View style={{ flex: 1 }} /> */}
      <View style={{ height: 30 }} />

      <TouchableWithoutFeedback
        onPress={async () => {
          // props.navigation.navigate("TabNavigator",{screen: "Home"});
          // props.navigation.navigate('TabNavigator', { screen: 'Home' });

          // navigate('Home')
          const isPassword = await isNoWalletPassword();
          console.log('isPassword', isPassword);

          if (isPassword) {
            // navigate("ImportWalletPage", { destory: true });
            navigate('SetPasswordPage', { type: 'create' });
          } else {
            // if (isUserLogin()) {
            //   useUserStore.getState().clearUserInfo();
            //   eventBus.publish(logout_Bus, { data: '' });
            //   updateWebLogout(getRandomID)
            // }
            createWallet();
          }
        }}
      >
        <View
          style={{
            width: '100%',
            backgroundColor: 'white',
            borderRadius: 13,
            borderWidth: 1,
            borderColor: '#333333',
            padding: 13,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Image
            source={require('@image/welcome_create_icon.png')}
            style={{ width: 53, height: 53 }}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[metaStyles.defaultText, { fontWeight: 'bold' }]}>
              {t('m_create_wallet')}
            </Text>
            <Text style={[{ fontSize: 12, marginTop: 5, color: '#666666' }]}>
              {t('chat_no_wallet')}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback
        onPress={async () => {
          const noPassword = await isNoWalletPassword();
          if (noPassword) {
            navigate('SetPasswordPage', { type: 'import' });
          } else {
            // navigate("ImportWalletPage", { destory: true });
            navigate('ImportWalletNetPage', { type: wallet_mode_hot });
          }
        }}
      >
        <View
          style={{
            width: '100%',
            backgroundColor: 'white',
            borderRadius: 13,
            borderWidth: 1,
            borderColor: '#333333',
            padding: 13,
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 30,
          }}
        >
          <Image
            source={require('@image/welcome_import_icon.png')}
            style={{ width: 53, height: 53 }}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[metaStyles.defaultText, { fontWeight: 'bold' }]}>
              {t('m_import_wallet')}
            </Text>
            <Text style={[{ fontSize: 12, marginTop: 5, color: '#666666' }]}>
              {t('chat_import_ex_wallet')}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <View style={{ height: 10 }} />

      <View style={{ height: 10 }} />
      {/* <RoundSimButton
        title={"Cold Wallet"}
        event={async () => {
          // props.navigation.navigate("TabNavigator",{screen: "Home"});
          // props.navigation.navigate('TabNavigator', { screen: 'Home' });

          // navigate('Home')

          // const hasNetwork = await checkHasNetWork();
          // if (!hasNetwork) {
          if (isNoWalletPassword()) {
            // navigate("ImportWalletPage", { destory: true });
            navigate("SetPasswordPage", { type: "create_cold_wallet" });
          } else {
            navigate("AddColdWalletPage");
          }
          // } else {
          // console.log("hasNetwork");
          // }
        }}
        textColor="white"
      /> */}

      <View style={{ height: 15 }} />
      <Text style={{ color: '#666666', fontSize: 12 }}>{t('w_welcome_notice')}</Text>
      <View style={[styles.row, { marginBottom: 40 }]}>
        {/* <Text style={metaStyles.blueText}>User Agreement</Text> */}
        <Text style={{ color: '#666666', fontSize: 12 }}> {t('w_metalet')}</Text>
        <TouchableWithoutFeedback
          onPress={() => {
            // Linking.openURL(
            //   "https://metalet.space/terms-of-service"
            // );
            // openLocalPrivacyPolicy();
            // navigate('WebViewPage');

            // navigate('WebViewPage', {
            //   url: require('@assets/privacy.html'),
            // });

            navigate('WebViewPage', {
              url: 'https://idchat.io/userprivacy/en',
            });
          }}
        >
          <Text style={{ color: '#333333', fontSize: 12, lineHeight: 20 }}>
            {t('s_terms_of_service')}
          </Text>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    // margin: 20,
    // marginTop: 50,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    flexDirection: 'column',
    flex: 1,
  },
  img: {
    width: 300,
    height: 253,
    marginTop: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});
