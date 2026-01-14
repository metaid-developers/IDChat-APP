import { View, Text, FlatList, Alert, TouchableWithoutFeedback, Image, Modal } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { metaStyles } from '../constant/Constants';
import { CloseView, NoMoreDataView, useEasyToast } from '../constant/Widget';
import * as FileSystem from 'expo-file-system';
import EasyToast from 'react-native-easy-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AsyncStorageUtil,
  network_all,
  network_btc,
  network_doge,
  network_key,
  network_mvc,
} from '../utils/AsyncStorageUtil';
import { useData } from '../hooks/MyProvider';
import { navigate } from '../base/NavigationService';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Data, RootBtcBalanceObject } from '@/bean/BtcBalanceBean';
import { fetchBtcBalance } from '@/api/metaletservice';
import { getBtcWallet } from '@/wallet/wallet';
import { getCurrentWallet } from '@/lib/wallet';
import { Chain } from '@metalet/utxo-wallet-sdk';

export default function AssetsPage() {
  const { myWallet, updateMyWallet } = useData();
  const { accountIndex, updateAccountIndex } = useData();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { netWork, updateNetWork } = useData();
  const { spaceBalance, updateSpaceBalance } = useData();
  const { btcBalance, updateSetBtcBalance } = useData();
  const { dogeBalance, updateDogeBalance } = useData();

  const [hasData, setHasData] = useState(false);
  const [myfile, setFolders] = useState<string[]>([]);

  const toastRef = useEasyToast('center');
  const [isShowBtcNotice, setShowBtcNotice] = useState(false);
  const { t } = useTranslation();

  const [btcDetailBalance, setBtcBalance] = useState<Data>({
    balance: 0,
    block: {
      incomeFee: 0,
      spendFee: 0,
    },
    mempool: {
      incomeFee: 0,
      spendFee: 0,
    },
    pendingBalance: 0,
    safeBalance: 0,
    inscriptionsBalance: 0,
    runesBalance: 0,
    pinsBalance: 0,
  });

  const showToast = useCallback(() => {
    toastRef.current?.show('Hello World!', 2000, () => console.log('Toast dismissed'));
  }, [toastRef]);

  useFocusEffect(
    React.useCallback(() => {
      // console.log("AssetsPage page is focused");
      // getBtcBalance();
      console.log('dogeBalance==', dogeBalance);
    }, []),
  );

  async function getMVCBalance() {
    // try {
    //   const fileUri = FileSystem.documentDirectory + 'example.txt';
    //   await FileSystem.writeAsStringAsync(fileUri, 'Hello, Expo!');
    //   console.log('File created successfully');
    //   const appDirectory = FileSystem.documentDirectory; // 获取应用的沙盒目录路径
    //   console.log("app 沙盒路径："+appDirectory);
    //   Alert.alert("app 沙盒路径："+appDirectory);
    //   // 读取应用沙盒目录下的文件夹列表
    //   const folders = await FileSystem.readDirectoryAsync(appDirectory);
    //   setFolders(folders); // 使用函数形式的 setState 更新状态
    //   // console.log('Folders in app directory:', folders);
    //   // Alert.alert('Folders in app directory:', folders.join(', '));
    // } catch (error) {
    //   console.error('Error reading app directory:', error);
    //  Alert.alert('Error reading app directory:', error);
    // }
    // const data = walletManager.getWallets();
    // console.log("walletManager AssetsPage 钱包： ", JSON.stringify(data));
    // const mvcAddress = data[0].accounts[accountIndex].mvc[0].address;
    // console.log("mvcAddress", mvcAddress);
  }

  // useEffect(() => {

  // }, [spaceBalance, btcBalance, dogeBalance,]);

  // AsyncStorageUtil.setItem("test", "test1111");
  // AsyncStorageUtil.getItem("test").then((res) => {
  //   console.log("res:" + res);
  // });

  async function getBtcBalance() {
    // const net=await AsyncStorageUtil.getItem(network_key);
    // console.log('获取 BTC 余额'+net);
    // const wallet = await getCurrentWallet(Chain.BTC);
    // const btcAddress = await wallet.getAddress();
    // console.log('btcAddress获取到的地址是：', btcAddress);
    // const balance: RootBtcBalanceObject = await fetchBtcBalance(btcAddress);
    // setBtcBalance(balance.data);
    // console.log('btcAddress', JSON.stringify(balance));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Modal visible={isShowBtcNotice} transparent={true}>
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
              padding: 23,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={metaStyles.defaultText}>{t('b_detail')}</Text>

              <View style={{ flex: 1 }} />

              <CloseView
                event={() => {
                  setShowBtcNotice(false);
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Image
                source={require('../../image/btc_notice.png')}
                style={{ width: 12, height: 12, marginTop: 3 }}
              />
              <Text style={{ fontSize: 12, color: '#676767', marginLeft: 5 }}>
                {t('b_btc_notice')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {netWork == network_btc && (
          <TouchableWithoutFeedback
            onPress={() => {
              // navigate("ReceivePage", { myCoinType: "BTC" });
              navigate('AssetsBtcDetailPage', { myCoinType: 'BTC' });
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginTop: 30,
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../../image/logo_btc.png')}
                style={{ width: 45, height: 45 }}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>BTC</Text>
                {/* <Text style={{ marginTop: 10, fontSize: 14, color: "#666" }}>
                sdfewfwsf
              </Text> */}
              </View>

              <View style={{ flex: 1 }} />

              <View>
                <Text style={{ color: '#333', fontSize: 16, textAlign: 'right' }}>
                  {btcBalance} BTC{' '}
                </Text>
                <Text
                  style={{
                    color: '#666',
                    fontSize: 14,
                    marginTop: 10,
                    textAlign: 'right',
                  }}
                >
                  ${metaletWallet.currentBtcAssert}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {netWork == network_mvc && (
          <TouchableWithoutFeedback
            onPress={() => {
              // navigate("ReceivePage",{myCoinType:'SPACE'});
              navigate('AssetsMvcDetailPage', { myCoinType: 'SPACE' });
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginTop: 30,
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../../image/logo_space.png')}
                style={{ width: 45, height: 45 }}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>SPACE</Text>
                {/* <Text style={{ marginTop: 10, fontSize: 14, color: "#666" }}>
                sdfewfwsf
              </Text> */}
              </View>

              <View style={{ flex: 1 }} />

              <View>
                <Text style={{ color: '#333', fontSize: 16, textAlign: 'right' }}>
                  {/* {metaletWallet.currentMvcBalance} SPACE{" "} */}
                  {spaceBalance} SPACE{' '}
                </Text>
                <Text
                  style={{
                    color: '#666',
                    fontSize: 14,
                    marginTop: 10,
                    textAlign: 'right',
                  }}
                >
                  ${metaletWallet.currentSpaceAssert}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {netWork == network_doge && (
          <TouchableWithoutFeedback
            onPress={() => {
              // navigate("ReceivePage",{myCoinType:'SPACE'});
              navigate('AssetsDogeDetailPage', { myCoinType: 'DOGE' });
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginTop: 30,
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../../image/doge_logo.png')}
                style={{ width: 45, height: 45 }}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>DOGE</Text>

                <View style={{ marginLeft: 0 }}>
                  <View
                    style={{
                      marginTop: 3,
                      backgroundColor: 'rgba(247, 147, 26, 0.2)',
                      borderRadius: 10,
                      alignItems: 'center',
                      paddingVertical: 2,
                      paddingHorizontal: 5,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: '#FF981C' }}>Bitcoin sidechain </Text>
                  </View>
                </View>
              </View>

              <View style={{ flex: 1 }} />

              <View>
                <Text style={{ color: '#333', fontSize: 16, textAlign: 'right' }}>
                  {/* {metaletWallet.currentDogeBalance!} DOGE{' '} */}
                  {dogeBalance!} DOGE{' '}
                </Text>
                <Text
                  style={{
                    color: '#666',
                    fontSize: 14,
                    marginTop: 10,
                    textAlign: 'right',
                  }}
                >
                  ${metaletWallet.currentDogeAssert}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {netWork == network_all && (
          <TouchableWithoutFeedback
            onPress={() => {
              // navigate("ReceivePage",{myCoinType:{type:'BTC'}});
              // navigate("ReceivePage", { myCoinType: "BTC" });
              navigate('AssetsBtcDetailPage', { myCoinType: 'BTC' });
            }}
          >
            <View style={{ backgroundColor: '#fff', padding: 0 }}>
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 0,
                  alignItems: 'center',
                }}
              >
                <Image
                  source={require('../../image/logo_btc.png')}
                  style={{ width: 45, height: 45 }}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>BTC</Text>
                  {/* <Text style={{ marginTop: 10, fontSize: 14, color: "#666" }}>
                sdfewfwsf
              </Text> */}
                </View>

                <View style={{ flex: 1 }} />

                <View>
                  <Text style={{ color: '#333', fontSize: 16, textAlign: 'right' }}>
                    {/* {metaletWallet.currentBtcBalance!} BTC{" "} */}
                    {btcBalance!} BTC{' '}
                  </Text>
                  <Text
                    style={{
                      color: '#666',
                      fontSize: 14,
                      marginTop: 10,
                      textAlign: 'right',
                    }}
                  >
                    ${metaletWallet.currentBtcAssert}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: 10,
                  backgroundColor: '#F8F8FA',
                  borderRadius: 23,
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignContent: 'center',
                  justifyContent: 'space-around',
                  paddingVertical: 10,
                  paddingHorizontal: 5,
                }}
              >
                <Text style={{ fontSize: 10, color: '#999999' }}>Avail</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: '#303133',
                    fontWeight: 'bold',
                    marginLeft: 3,
                  }}
                >
                  {/* {btcDetailBalance.safeBalance == 0
                    ? metaletWallet.currentBtcSafeBalance
                    : btcDetailBalance.safeBalance} */}
                  {metaletWallet.currentBtcSafeBalance}
                </Text>
                <Text style={{ fontSize: 10, color: '#999999', marginLeft: 3 }}>BTC</Text>

                <Text style={{ fontSize: 10, color: '#999999' }}> | </Text>

                <Text style={{ fontSize: 10, color: '#999999' }}>N/A</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: '#303133',
                    fontWeight: 'bold',
                    marginLeft: 3,
                  }}
                >
                  {/* {(btcDetailBalance.balance-btcDetailBalance.safeBalance)==0?metaletWallet.currentBtcNa:(btcDetailBalance.balance-btcDetailBalance.safeBalance).toFixed(8)} */}
                  {metaletWallet.currentBtcNa}
                </Text>
                <Text style={{ fontSize: 10, color: '#999999', marginLeft: 3 }}>BTC</Text>

                <TouchableWithoutFeedback
                  onPress={() => {
                    setShowBtcNotice(true);
                  }}
                >
                  <Image
                    source={require('../../image/btc_notice.png')}
                    style={{ width: 12, height: 12, marginLeft: 5 }}
                  />
                </TouchableWithoutFeedback>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {netWork == network_all && (
          <TouchableWithoutFeedback
            onPress={() => {
              // navigate("ReceivePage",{myCoinType:'SPACE'});
              navigate('AssetsMvcDetailPage', { myCoinType: 'SPACE' });
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginTop: 13,
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../../image/logo_space.png')}
                style={{ width: 45, height: 45 }}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>SPACE</Text>
                {/* <Text style={{ marginTop: 10, fontSize: 14, color: "#666" }}>
                sdfewfwsf
              </Text> */}
                <View style={{ marginLeft: 0 }}>
                  <View
                    style={{
                      marginTop: 3,
                      backgroundColor: 'rgba(247, 147, 26, 0.2)',
                      borderRadius: 10,
                      alignItems: 'center',
                      paddingVertical: 2,
                      paddingHorizontal: 5,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: '#FF981C' }}>Bitcoin sidechain </Text>
                  </View>
                </View>
              </View>

              <View style={{ flex: 1 }} />

              <View>
                <Text style={{ color: '#333', fontSize: 16, textAlign: 'right' }}>
                  {spaceBalance!} SPACE{' '}
                </Text>
                <Text
                  style={{
                    color: '#666',
                    fontSize: 14,
                    marginTop: 10,
                    textAlign: 'right',
                  }}
                >
                  ${metaletWallet.currentSpaceAssert}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {netWork == network_all && (
          <TouchableWithoutFeedback
            onPress={() => {
              // navigate("ReceivePage",{myCoinType:'SPACE'});
              navigate('AssetsDogeDetailPage', { myCoinType: 'DOGE' });
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                marginTop: 15,
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../../image/doge_logo.png')}
                style={{ width: 45, height: 45 }}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>DOGE</Text>

                <View style={{ marginLeft: 0 }}>
                  <View
                    style={{
                      marginTop: 3,
                      backgroundColor: 'rgba(247, 147, 26, 0.2)',
                      borderRadius: 10,
                      alignItems: 'center',
                      paddingVertical: 2,
                      paddingHorizontal: 5,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: '#FF981C' }}>Bitcoin sidechain </Text>
                  </View>
                </View>
              </View>

              <View style={{ flex: 1 }} />

              <View>
                <Text style={{ color: '#333', fontSize: 16, textAlign: 'right' }}>
                  {/* {metaletWallet.currentDogeBalance!} DOGE{' '} */}
                  {dogeBalance!} DOGE{' '}
                </Text>
                <Text
                  style={{
                    color: '#666',
                    fontSize: 14,
                    marginTop: 10,
                    textAlign: 'right',
                  }}
                >
                  ${metaletWallet.currentDogeAssert}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    </SafeAreaView>
  );
}
