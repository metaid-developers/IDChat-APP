import { View, Text, FlatList, TouchableWithoutFeedback, Image, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import {
  AvatarImageView,
  BaseView,
  Line,
  RoundSimButton,
  TitleBar,
  ToastView,
} from '@/constant/Widget';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WalletBean } from '@/bean/WalletBean';
import {
  getCurrentAccountID,
  getRandomID,
  getStorageWallets,
  getWalletBeans,
  setCurrentAccountID,
  setCurrentWalletID,
} from '@/utils/WalletUtils';
import { navigate } from '@/base/NavigationService';
import { metaStyles, themeColor } from '@/constant/Constants';
import { AsyncStorageUtil, createStorage, wallets_key } from '@/utils/AsyncStorageUtil';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { eventBus, logout_Bus, refreshHomeLoadingEvent } from '@/utils/EventBus';
import { useData } from '@/hooks/MyProvider';
import { getCurrentWalletId } from '@/lib/wallet';
import { BaseWalletTools, initBaseChatWallet } from '../lib/BaseWalletTools';
import useWalletStore from '@/stores/useWalletStore';
import { isNotEmpty } from '@/utils/StringUtils';

export default function SwitchAccountPage() {
  let [walletList, setWalletList] = useState<WalletBean[]>([]);
  const [isShowBackUp, setIsShowBackUp] = useState(false);
  const [walletBackUp, setWalletBackUp] = useState('');
  const [mvcPath, setMvcPath] = useState('');
  const { t } = useTranslation();

  //current
  const [currentAccountID, setcurrentAccountID] = useState('');
  const [currentWalletID, setcurrentWalletID] = useState('');
  const { needInitWallet, updateNeedInitWallet } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { walletMode, updateWalletMode } = useData();
  const { myWallet, updateMyWallet } = useData();
  const { setCurrentWallet } = useWalletStore();
  const { switchAccount, updateSwitchAccount } = useData();
  const { webLogout, updateWebLogout } = useData();

  useEffect(() => {
    getWalletData();
  }, []);

  async function getWalletData() {
    const walletID = await getCurrentWalletId();

    setcurrentWalletID(walletID);
    const wallets = await getWalletBeans();
    // console.log(JSON.stringify(wallets));
    // setWalletList(wallets);
    const filterWallets = wallets.filter(
      (item) => item.mnemonic != '1' && isNotEmpty(item.userName),
    );
    setWalletList(filterWallets);
  }

  //是否选中account
  async function updataSelectAccount(walletIndex: number, accountIndex: number) {
    console.log(walletIndex);
    // const wallets = await getStorageWallets();
    const storage = createStorage();

    const nowWallet = walletList[walletIndex];
    console.log('切换账号的钱包名字：' + nowWallet.userName);
    nowWallet.isCurrentPathIndex = accountIndex;
    nowWallet.accountsOptions[accountIndex].isSelect = true;
    setcurrentAccountID(nowWallet.accountsOptions[accountIndex].id);
    await setCurrentAccountID(nowWallet.accountsOptions[accountIndex].id);
    await setCurrentWalletID(nowWallet.id);

    updateWalletMode(nowWallet.isColdWalletMode);
    updateMyWallet(nowWallet);
    setcurrentWalletID(nowWallet.id);
    await storage.set(wallets_key, walletList);
    getWalletData();
    navigate('Tabs');
    // updateNeedInitWallet(getRandomID());
    updateSwitchAccount(getRandomID());

    // eventBus.publish(refreshHomeLoadingEvent, { data: '' });
    initChatWallet();
  }

  //wallet
  async function initChatWallet() {
    const baseWallet: BaseWalletTools = await initBaseChatWallet();
    console.log('baseWallet', baseWallet.currentBtcWallet.getAddress());
    console.log('baseWallet', baseWallet.currentMvcWallet.getAddress());
    const privateKey = baseWallet.currentMvcWallet.getPrivateKey();
    console.log('baseWallet privateKey：', privateKey);
    const publicKey = baseWallet.currentMvcWallet.getPublicKey().toString('hex');
    console.log('baseWallet publicKey:', publicKey);
    baseWallet.currentMvcWallet.getPublicKey;

    const mvcWallet = baseWallet.currentBtcWallet;
    const currentBtcWallet = baseWallet.currentMvcWallet;
    metaletWallet.currentBtcWallet = currentBtcWallet;
    metaletWallet.currentMvcWallet = mvcWallet;
    updateMetaletWallet(metaletWallet);
    setCurrentWallet({ btcWallet: currentBtcWallet, mvcWallet: mvcWallet });
    //  sendWebMessage('isLogin', { isLogin: true, address: "address"});
  }

  const ListItem = ({ index, item }) => {
    return (
      <TouchableWithoutFeedback
        onPress={async () => {
          updataSelectAccount(index, 0);
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            borderColor: '#333333',
            padding: 13,
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginTop: 10,
          }}
        >
          <AvatarImageView
            size={53}
            source={
              isNotEmpty(item.avatarUrl)
                ? {
                    uri: item.avatarUrl,
                  }
                : require('@image/avatar_default_icon.png')
            }
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[metaStyles.defaultText, { fontWeight: 'bold' }]}>{item.userName}</Text>
            <Text style={[{ fontSize: 12, marginTop: 5, color: '#666666' }]}>{item.metaId}</Text>
          </View>

          <View style={{ flex: 1 }} />

          {currentWalletID == item.id && (
            <Text style={{ fontSize: 10, color: '#1AE29C' }}>{t('chat_current_account')}</Text>
          )}
        </View>
      </TouchableWithoutFeedback>

      //   <TouchableWithoutFeedback
      //     onPress={async () => {
      //       setWalletBackUp(item.mnemonic);
      //       setMvcPath(item.mvcTypes.toString());
      //       setIsShowBackUp(true);
      //       const wallets = await getWalletBeans();
      //       const wallet = wallets.find((itemWallet) => {
      //         console.log(itemWallet.mnemonic);
      //         if (itemWallet.mnemonic == item.mnemonic) {
      //           return itemWallet;
      //         }
      //       });
      //       wallet.isBackUp = true;
      //       await AsyncStorageUtil.updateItem(wallets_key, wallets);
      //       getWalletData();
      //     }}
      //   >
      //     <View
      //       style={{
      //         flexDirection: 'row',
      //         marginTop: 30,
      //         alignItems: 'center',
      //         justifyContent: 'center',
      //       }}
      //     >
      //       <Text style={{ marginLeft: 10, color: '#303133', fontSize: 16 }}>{item.name}</Text>
      //       <View style={{ flex: 1 }} />
      //       {item.isBackUp == false && (
      //         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      //           <Image
      //             source={require('../../../image/metalet_dot_icon.png')}
      //             style={{ width: 5, height: 5, marginRight: 7 }}
      //           />
      //           <Text style={{ fontSize: 13, color: 'red' }}>Not backed up</Text>
      //         </View>
      //       )}
      //       <Image
      //         source={require('../../../image/list_icon_ins.png')}
      //         style={{ width: 20, height: 20, marginTop: 5 }}
      //       />
      //     </View>
      //   </TouchableWithoutFeedback>
    );
  };

  const AccountFoolerView = () => {
    return (
      <TouchableWithoutFeedback
        onPress={async () => {
          const rand = getRandomID();
          console.log('随机数' + rand);
          updateWebLogout(rand);
          navigate('WelcomeWalletPage');
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            borderColor: '#333333',
            padding: 13,
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginTop: 10,
          }}
        >
          <AvatarImageView size={53} source={require('@image/buzz_chain_normal_icon.png')} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[metaStyles.defaultText, { fontWeight: 'bold' }]}>
              {t('chat_settings_add_account')}
            </Text>
            {/* <Text style={[{ fontSize: 12, marginTop: 5, color: '#666666' }]}>{item.metaId}</Text> */}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const handlePressFooter = () => {};

  return (
    <SafeAreaView style={{ flex: 1 }}>
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

      <View style={{ flex: 1 }}>
        <TitleBar title={t('s_backup_wallet')} />
        <View style={{ flex: 1 }}>
          <FlatList
            style={{ marginTop: 20, flex: 1, marginBottom: 100 }}
            keyExtractor={(item, index) => index.toString()}
            data={walletList}
            renderItem={ListItem}
            ListFooterComponent={<AccountFoolerView />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
