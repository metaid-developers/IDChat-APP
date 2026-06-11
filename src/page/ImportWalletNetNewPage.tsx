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
  ScrollView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { goBack, navigate } from '@/base/NavigationService';
import useWalletStore from '@/stores/useWalletStore';
import {
  SUPPORTED_MNEMONIC_WORD_COUNTS,
  normalizeMnemonicWords,
  validateMnemonicImportWords,
} from '@/wallet/mnemonicImport';

const storage = createStorage();
export default function ImportWalletNetNewPage({ route }) {
  const toastRef = useEasyToast('center');
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

  const [WORD_COUNT, setWordCount] = useState(12);

  const [words, setWords] = useState<string[]>(Array(WORD_COUNT).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const lastKeyRef = useRef<string>('');
  const [isShowWord, setIsShowWord] = useState(false);
  const [isShowLoading, setIsShowLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 每次切换助记词数量时重置输入框
  useEffect(() => {
    setWords(Array(WORD_COUNT).fill(''));
    inputsRef.current = [];
  }, [WORD_COUNT]);

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
    if (isImporting) {
      return;
    }

    const validation = validateMnemonicImportWords(words, WORD_COUNT);

    if (validation.ok === false) {
      Alert.alert('Import failed', validation.error);
      return;
    }

    setIsImporting(true);
    setObj({ ...obj, isShow: true, isCancel: false });

    try {
      const mnemonic = validation.mnemonic;
      const walletID = getRandomID();
      const wallet_addressType = AddressType.SameAsMvc;

      const accountID = getRandomID();
      const accountAddressIndex = 0;

      const hasNoWallets = await isNoStorageWallet();
      const wallets = await getStorageWallets();
      const walletName = hasNoWallets ? 'Wallet 1' : `Wallet ${wallets.length + 1}`;
      const network = await getWalletNetwork();

      const walletBean: WalletBean = {
        id: walletID,
        name: walletName,
        mnemonic,
        mvcTypes: parseInt(mvcPath, 10),
        isOpen: true,
        addressType: wallet_addressType,
        isBackUp: false,
        isCurrentPathIndex: 0,
        seed: '',
        isColdWalletMode: type,
        accountsOptions: [
          {
            id: accountID,
            name: 'Account 1',
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
      walletBean.seed = seed.toString('hex');

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
      const nextMetaletWallet = new MetaletWallet();
      nextMetaletWallet.currentBtcWallet = btcWallet;
      nextMetaletWallet.currentMvcWallet = mvcWallet;
      updateMetaletWallet(nextMetaletWallet);

      if (hasNoWallets) {
        await storage.set(wallets_key, [walletBean]);
      } else {
        await storage.set(wallets_key, [...wallets, walletBean]);
        updateNeedInitWallet(getRandomID());
      }

      updateMyWallet(walletBean);
      await storage.set(CurrentWalletIDKey, walletBean.id);
      await storage.set(CurrentAccountIDKey, walletBean.accountsOptions[0].id);
      setCurrentWallet({ btcWallet, mvcWallet });
      setObj({ ...obj, isShow: false });
      navigate('ImportWalletNetWorkPage');
    } catch (error) {
      setObj({ ...obj, isShow: false });
      Alert.alert(
        'Import failed',
        error instanceof Error ? error.message : 'Unable to import this mnemonic phrase.',
      );
    } finally {
      setIsImporting(false);
    }

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

  // 🔹 输入/粘贴逻辑
  const handleChangeText = (text: string, index: number) => {
    const raw = text.trimStart();

    if (/\s/.test(raw)) {
      const parts = normalizeMnemonicWords([raw]);
      const newWords = [...words];
      for (let i = 0; i < parts.length && index + i < WORD_COUNT; i++) {
        newWords[index + i] = parts[i];
      }
      setWords(newWords);
      const nextIndex = Math.min(index + parts.length, WORD_COUNT - 1);
      setTimeout(() => inputsRef.current[nextIndex]?.focus(), 80);
      return;
    }

    const newWords = [...words];
    newWords[index] = raw.trim().toLowerCase();
    setWords(newWords);
  };

  // 🔹 键盘事件逻辑
  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    const key = e.nativeEvent.key;

    if (key === lastKeyRef.current && key === 'Backspace') return;
    lastKeyRef.current = key;

    if (key === 'Backspace') {
      if (!words[index] && index > 0) {
        const prev = index - 1;
        inputsRef.current[prev]?.focus();
      }
    } else if (key === ' ' || key === 'Enter') {
      if (index < WORD_COUNT - 1) {
        inputsRef.current[index + 1]?.focus();
      } else {
        Keyboard.dismiss();
      }
    }
  };
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView key={WORD_COUNT} style={[styles.wrapper, { flex: 1 }]}>
          <Modal visible={isShowWord} transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                {SUPPORTED_MNEMONIC_WORD_COUNTS.map((value) => (
                  <TouchableWithoutFeedback
                    key={value}
                    onPress={() => {
                      setIsShowWord(false);
                      setWordCount(value);
                    }}
                  >
                    <View style={styles.modalItem}>
                      <Text style={{ fontSize: 18, color: '#333' }}>{value} words</Text>
                      {WORD_COUNT === value && (
                        <Image
                          source={require('@image/wallets_select_icon.png')}
                          style={{ width: 20, height: 20 }}
                        />
                      )}
                    </View>
                  </TouchableWithoutFeedback>
                ))}
              </View>
            </View>
          </Modal>

          <EasyToast ref={toastRef} position="center" />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableWithoutFeedback
              onPress={() => {
                goBack();
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 20,
                  marginTop: 5,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Image
                  source={require('@image/meta_back_icon.png')}
                  style={{ width: 22, height: 22 }}
                />
              </View>
            </TouchableWithoutFeedback>

            <Text
              style={[
                { textAlign: 'center', marginRight: 40, marginLeft: 15 },
                metaStyles.titleText,
              ]}
            >
              Import Wallet
            </Text>

            <View style={{ flex: 1 }}></View>

            <TouchableWithoutFeedback
              onPress={() => {
                setIsShowWord(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('@image/wallets_close_icon.png')}
                  style={{ width: 13, height: 13, marginLeft: 30 }}
                />
                <Text style={{ marginRight: 20, color: '#333', fontSize: 16 }}>
                  {WORD_COUNT} word
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View style={[metaStyles.verMarginContainer, { flex: 1 }]}>
            <LoadingModal
              isCancel={obj.isCancel}
              isShow={obj.isShow}
              title={obj.title}
              event={closeModal}
            />

            {/* ✅ 让输入框部分可滚动 */}
            <ScrollView
              style={{ flex: 1, marginBottom: 20 }}
              contentContainerStyle={{ paddingBottom: 50 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
                {words.map((word, i) => (
                  <View key={`${WORD_COUNT}-${i}`} style={styles.inputRow}>
                    <Text style={styles.indexText}>{i + 1}</Text>
                    <TextInput
                      ref={(ref) => {
                        inputsRef.current[i] = ref;
                      }}
                      style={styles.input}
                      value={word}
                      onChangeText={(text) => handleChangeText(text, i)}
                      onKeyPress={(e) => handleKeyPress(e, i)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            <RoundSimButton
              title={isImporting ? 'Importing...' : t('c_confirm')}
              textColor="#333"
              event={() => {
                OpenModal();
              }}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
    // <TouchableWithoutFeedback
    //   onPress={() => {
    //     console.log('click');
    //     Keyboard.dismiss();
    //   }}
    // >
    // <SafeAreaView key={WORD_COUNT} style={styles.wrapper}>
    //     <Modal visible={isShowWord} transparent>
    //       <View style={styles.modalOverlay}>
    //         <View style={styles.modalBox}>
    //           {[
    //             { label: '12 words', value: 12 },
    //             { label: '15 words', value: 15 },
    //             { label: '18 words', value: 18 },
    //             { label: '24 words', value: 24 },
    //           ].map((opt) => (
    //             <TouchableWithoutFeedback
    //               key={opt.value}
    //               onPress={() => {
    //                 setIsShowWord(false);
    //                 setWordCount(opt.value);
    //               }}
    //             >
    //               <View style={styles.modalItem}>
    //                 <Text style={{ fontSize: 18, color: '#333' }}>{opt.label}</Text>
    //                 {WORD_COUNT === opt.value && (
    //                   <Image
    //                     source={require('@image/wallets_select_icon.png')}
    //                     style={{ width: 20, height: 20 }}
    //                   />
    //                 )}
    //               </View>
    //             </TouchableWithoutFeedback>
    //           ))}
    //         </View>
    //       </View>
    //     </Modal>
    //     <EasyToast ref={toastRef} position="center" />

    //     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    //       <TouchableWithoutFeedback
    //         onPress={() => {
    //           goBack();
    //         }}
    //       >
    //         <View
    //           style={{
    //             flexDirection: 'row',
    //             marginLeft: 20,
    //             marginTop: 5,
    //             height: 44,
    //             alignItems: 'center',
    //             // alignContent: 'space-between',
    //             justifyContent: 'space-between',
    //           }}
    //         >
    //           <Image
    //             source={require('@image/meta_back_icon.png')}
    //             style={{ width: 22, height: 22 }}
    //           />
    //         </View>
    //       </TouchableWithoutFeedback>

    //       <Text
    //         style={[{ textAlign: 'center', marginRight: 40, marginLeft: 15 }, metaStyles.titleText]}
    //       >
    //         Import Wallet
    //       </Text>

    //       <View style={{ flex: 1 }}></View>
    //       <TouchableWithoutFeedback
    //         onPress={() => {
    //           setIsShowWord(true);
    //         }}
    //       >
    //         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    //           <Image
    //             source={require('@image/wallets_close_icon.png')}
    //             style={{ width: 13, height: 13, marginLeft: 30 }}
    //           />
    //           <Text style={{ marginRight: 20, color: '#333', fontSize: 16 }}>
    //             {' '}
    //             {WORD_COUNT} word
    //           </Text>
    //         </View>
    //       </TouchableWithoutFeedback>
    //     </View>

    //     <View style={[metaStyles.verMarginContainer, { marginBottom: 50 }]}>
    //       <LoadingModal
    //         isCancel={obj.isCancel}
    //         isShow={obj.isShow}
    //         title={obj.title}
    //         event={closeModal}
    //       />

    //       <ScrollView
    //       style={{ flex: 1, marginBottom: 20 }}>
    //         <View>
    //           <View style={styles.container}>
    //             {words.map((word, i) => (
    //               <View key={`${WORD_COUNT}-${i}`} style={styles.inputRow}>
    //                 <Text style={styles.indexText}>{i + 1}</Text>
    //                 <TextInput
    //                   ref={(ref) => {
    //                     inputsRef.current[i] = ref;
    //                   }}
    //                   style={styles.input}
    //                   value={word}
    //                   onChangeText={(text) => handleChangeText(text, i)}
    //                   onKeyPress={(e) => handleKeyPress(e, i)}
    //                   autoCapitalize="none"
    //                   autoCorrect={false}
    //                   returnKeyType="next"
    //                   blurOnSubmit={false}
    //                 />
    //               </View>
    //             ))}
    //           </View>
    //         </View>
    //       </ScrollView>
    //       {/* <GradientAvatar/> */}
    //       <RoundSimButton
    //         title={t('c_confirm')}
    //         textColor="#333"
    //         event={() => {
    //           // console.log("hello");
    //           //   toastRef.current?.show('Hello World!', 2000, () => console.log('Toast dismissed'));
    //           // }, [toastRef]);
    //           // toastRef.current?.show("Hello", 1500);
    //           // toastRef.current?.show('Hello World!', 2000, () => console.log('Toast dismissed'));

    //           // showToast()
    //           OpenModal();
    //         }}
    //       />
    //     </View>
    //   </SafeAreaView>
    // </TouchableWithoutFeedback>
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
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '42%', // 让每行大约两个
    marginVertical: 6,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  indexText: {
    width: 20,
    textAlign: 'center',
    marginRight: 6,
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#EDEFF2',
    height: '100%',
    // borderRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    textAlignVertical: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 3,
    fontSize: 16,
    textAlign: 'center',
  },
  buttons: {
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { backgroundColor: '#fff', borderRadius: 10, margin: 30, padding: 20 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
});
