import { BaseWalletTools, initBaseChatWallet } from '../lib/BaseWalletTools';
import { init } from 'i18next';
import useWalletStore from '@/stores/useWalletStore';
import { useData } from '@/hooks/MyProvider';

import WebView from 'react-native-webview';
// import { injectedJavaScript } from "./inject";
import CloseIcon from '@/components/icons/CloseIcon';
import { createElement, ComponentType, useCallback, act } from 'react';
// import actionDispatcher from "./actions/action-dispatcher";
import React, { useEffect, useRef, useState } from 'react';
import { navigate, goBack } from '@/base/NavigationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import CheckBadgeIcon from '@/components/icons/CheckBadgeIcon';
import {
  View,
  Text,
  Modal,
  Image,
  Button,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Keyboard,
  BackHandler,
  AppStateStatus,
  AppState,
} from 'react-native';
import { CircleAvatarLetter, LoadingModal, RoundSimButtonFlee, ToastView } from '@/constant/Widget';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  inputNormalBgColor,
  litterWhittleBgColor,
  metaStyles,
  themeColor,
} from '@/constant/Constants';
import * as ECDH from '@/webs/actions/common/ecdh';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AsyncStorageUtil,
  CHAT_NODE_KEY,
  createStorage,
  no_notice_key,
  wallet_language_key,
} from '@/utils/AsyncStorageUtil';
import { useFocusEffect } from '@react-navigation/native';
import { ActionType } from '@/webs/actions/types';
import { injectedJavaScript } from '@/webs/inject';
import actionDispatcher from '@/webs/actions/action-dispatcher';
import { json } from 'stream/consumers';
import { getMvcAddress } from '@/wallet/walletUtils';
import { eventBus, loginSuccess_Bus, logout_Bus } from '@/utils/EventBus';
import {
  account_switch,
  isLogin_event,
  logout_event,
  on_language_change,
  refresh_event,
  tab_change_event,
} from '../com/chatActions';
import { isUserLogin } from '../com/metaIDUtils';
import {
  getRandomID,
  getRandomNum,
  getStorageCurrentWallet,
  openBrowser,
} from '@/utils/WalletUtils';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { UpdateData } from '@/api/type/Update';
import { fetchCheckUpgrade } from '@/api/metaletservice';
import i18n from '@/language/i18n';
import { Portal } from 'react-native-paper';
import { sleep } from '@/lib/helpers';
import { DogeCoinWallet, getDogeCoinWallet } from '../wallet/doge/DogeCoinWallet';
import * as getPKHByPath from '@/webs/actions/lib/query/get-pkh-by-path';
import { getDogeWallet } from '../wallet/doge/wallet';

interface Message {
  host: string;
  icon: string;
  nonce: string;
  channel: 'to-metaidwallet';
  params: Record<string, unknown>;
  action: `${string}-${ActionType}`;
}

const ENABLE_NATIVE_IDCHAT = false;

// export let webChatNode = 'https://www.idchat.io/chat';
export default function ChatHomePage() {
  const { setCurrentWallet } = useWalletStore();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { needInitWallet, updateNeedInitWallet } = useData();
  const { switchAccount, updateSwitchAccount } = useData();
  const { needWebRefresh, updateNeedWebRefresh } = useData();
  const { chatNodeNow, updateChatNodeNow } = useData();
  const [chatNodeUri, setChatNodeUri] = useState<string>('https://www.idchat.io/chat');
  // const [chatNodeUri, setChatNodeUri] = useState<string>('https://chat-eta-swart-50.vercel.app/talk/@me/b561918bc281f5ff2e0512b571c28c2853fc07e1d20bab73537445ac4867813b');
  const [isUriReady, setIsUriReady] = useState(false);

  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);
  // const url = 'https://www.idchat.io/chat';
  // const url = 'https://testchat.show.now/';

  const currentUrl = useRef(chatNodeUri);
  // const [uri, setURI] = useState(chatNodeNow);
  const [uriReady, setReadyURI] = useState('');
  const { walletLanguage, updateWalletLanguage } = useData();

  const [icon, setIcon] = useState('');
  const [host, setHost] = useState('');
  const [actionName, setActionName] = useState('');
  const [descriptions, setDescriptions] = useState([]);
  const [actionMsg, setActionMsg] = useState<Message>();
  const [modalVisible, setModalVisible] = useState(false);
  const [needEstimated, setNeedEstimated] = useState(false);
  const [isFocusEdit, setIsFocusEdit] = useState(false);
  const [componentInfo, setComponentInfo] = useState<{
    params: Record<string, unknown>;
    component: ComponentType<{
      params: object;
      ref?: React.MutableRefObject<any>;
    }>;
  }>(null);
  let actionMsg2;

  const metaidComponentRef = useRef<{
    getEstimatedData: () => null;
  } | null>(null);

  const [isShowLoading, setIsShowLoading] = useState(false);
  const [isShowWebNotice, setIsShowWebNotice] = useState(false);
  const { t } = useTranslation();
  const [isAgree, setIsAgree] = useState(false);
  const storage = createStorage();

  const { isBackUp, updateSetIsBackUp } = useData();
  const { webLogout, updateWebLogout } = useData();

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const { reloadWebKey, updateReloadKey } = useData();
  // 用 ref 保存当前 AppState
  const appStateRef = useRef(AppState.currentState);
  const reloadKeyRef = useRef(0);

  const isNeedRefreshWebRef = useRef(true);

  useEffect(() => {
    if (ENABLE_NATIVE_IDCHAT) {
      navigate('NativeChatHomePage');
      return;
    }

    initChatWallet();
    initIsBackUp();
    requestBadgePermission();
    changeLanguage();

    getChatNode();
    // setTimeout(() => {
    //   getChatNode();
    //   setIsShowLoading(false);
    // }, 3000);

    const sub = Notifications.addNotificationReceivedListener(async () => {
      const count = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(count + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // console.log("HomePage needInitWallet ");
    // initCurrentWallet();
    console.log('HomePage switchAccount ');
    byAccountSwitch();
    if (isNeedRefreshWebRef.current) byRefresh();
  }, [switchAccount]);

  useEffect(() => {
    // console.log("HomePage needInitWallet ");
    // initCurrentWallet();
    onLanguageChange();
  }, [walletLanguage]);

  useFocusEffect(
    React.useCallback(() => {
      byLogin();
      if (isNeedRefreshWebRef.current) byRefresh();
      onTabChange();
    }, []),
  );

  useEffect(() => {
    // console.log("HomePage useEffect   btc change");
    setIsShowLoading(true);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      // nextState 可能是 'active' | 'background' | 'inactive'
      if (appState.match(/background|inactive/) && nextState === 'active') {
        // 👇 这里就是「从后台重新回到前台」的时机
        console.log('App has come to the foreground!');
        if (isNeedRefreshWebRef.current) byRefresh();
        // 例如：重新请求数据、刷新 UI 等
      }

      setAppState(nextState);
    });

    return () => subscription.remove();
  }, [appState]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/background|inactive/) && nextState === 'active') {
        console.log('读取到的：' + isNeedRefreshWebRef.current);
        await sleep(3000);

        if (isNeedRefreshWebRef.current) {
          // updateReloadKey((k) => {
          //   const next = getRandomNum();
          //   reloadKeyRef.current = next; // 更新 ref
          //   console.log('old key:', k, 'new key:', next);
          //   return next;
          // });
        }
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  // 监听 reloadKey 变化，始终能拿到最新值
  useEffect(() => {
    console.log('✅ 最新 reloadKey:', reloadWebKey);
    if (isNeedRefreshWebRef.current) byRefresh();
    getChatNode();
  }, [reloadWebKey]);

  // 监听 reloadKey 变化，始终能拿到最新值
  useEffect(() => {
    console.log('✅ 最新 needWebRefresh:', needWebRefresh);
  }, [needWebRefresh]);

  // 监听 reloadKey 变化，始终能拿到最新值
  useEffect(() => {
    if (webLogout === '0') {
      return;
    }
    byLogOut();
  }, [webLogout]);

  /////////////////////////////////init/////////////////////////////
  async function initChatWallet() {
    const pubk = await getPKHByPath.process({ path: 'm/100/0' }, { password: '' });
    const baseWallet: BaseWalletTools = await initBaseChatWallet();
    // console.log('baseWallet', baseWallet.currentBtcWallet.getAddress());
    // console.log('baseWallet', baseWallet.currentMvcWallet.getAddress());
    const privateKey = baseWallet.currentMvcWallet.getPrivateKey();
    const publicKey = baseWallet.currentMvcWallet.getPublicKey().toString('hex');
    baseWallet.currentMvcWallet.getPublicKey;

    const mvcWallet = baseWallet.currentBtcWallet;
    const currentBtcWallet = baseWallet.currentMvcWallet;
    metaletWallet.currentBtcWallet = currentBtcWallet;
    metaletWallet.currentMvcWallet = mvcWallet;
    updateMetaletWallet(metaletWallet);
    setCurrentWallet({ btcWallet: currentBtcWallet, mvcWallet: mvcWallet });

    const wallet = await getDogeWallet();
    const address = wallet.getAddress();
    console.log('addressDoge: ', address);
    //  sendWebMessage('isLogin', { isLogin: true, address: "address"});
  }

  eventBus.subscribe(loginSuccess_Bus, (message) => {
    console.log('in eventBus', message);
    sendWebMessage(isLogin_event, { isLogin: true });
  });

  eventBus.subscribe(logout_Bus, (message) => {
    console.log('in logout_Bus', logout_Bus);
    sendWebMessage(logout_event, { isLogin: false });
  });

  async function initIsBackUp() {
    const walletBean = await getStorageCurrentWallet();
    if (walletBean.isBackUp == true) {
      updateSetIsBackUp(true);
    } else {
      updateSetIsBackUp(false);
    }
  }

  async function requestBadgePermission() {
    const settings = await Notifications.requestPermissionsAsync({
      ios: { allowBadge: true, allowAlert: true, allowSound: true },
    });
    console.log('Notification settings', settings);
  }

  const changeLanguage = async () => {
    // const newLanguage = i18n.language === 'en' ? 'zh' : 'en';
    const newLanguage = await AsyncStorageUtil.getItemDefault(wallet_language_key, 'en');
    i18n.changeLanguage(newLanguage); // 切换语言
    updateWalletLanguage(newLanguage);
  };

  async function getChatNode() {
    const nodeChat = await AsyncStorageUtil.getItemDefault(
      CHAT_NODE_KEY,
      'https://www.idchat.io/chat',
    ).then((value) => {
      updateChatNodeNow(value);
      // webChatNode = nodeChat;
      setChatNodeUri(value);
      // updateReloadKey(getRandomNum());
      setIsShowLoading(false);
      setIsUriReady(true);

      console.log('nodeChat', value);
    });
  }

  //////////////////////////web function////////////////////////////////////////////////
  async function byLogin() {
    const isLogin = await isUserLogin();
    const address = metaletWallet.currentMvcWallet.getAddress();

    if (isLogin) {
      console.log('in byLogin 发送登录', address);
      sendWebMessage(isLogin_event, { isLogin: true });
    }
  }

  async function byLogOut() {
    const isLogin = await isUserLogin();
    const address = metaletWallet.currentMvcWallet.getAddress();
    if (isLogin) {
      console.log('in  发送退出登录', logout_event + address);
      sendWebMessage(logout_event, { isLogin: false });
    }
  }

  async function byAccountSwitch() {
    const address = metaletWallet.currentMvcWallet.getAddress();
    console.log('in byAccountSwitch', address);
    const isLogin = await isUserLogin();
    if (isLogin) {
      console.log('in byAccountSwitch 登录', isLogin);
      sendWebMessage(account_switch, { address: address });
    }
  }

  async function byRefresh() {
    const isLogin = await isUserLogin();
    const address = metaletWallet.currentMvcWallet.getAddress();

    if (isLogin) {
      console.log('in byRefresh 发送刷新：', address);
      // sendWebMessage(refresh_event, { address: address });
    }
  }

  async function onTabChange() {
    const isLogin = await isUserLogin();
    if (isLogin) {
      sendWebMessage(tab_change_event, { data: 'HomeTab' });
    }
  }

  async function onLanguageChange() {
    const isLogin = await isUserLogin();
    if (isLogin) {
      const newLanguage = await AsyncStorageUtil.getItemDefault(wallet_language_key, 'en');
      console.log(
        '发送切换语言：                                                                                                                       in onLanguageChange',
        newLanguage,
      );
      sendWebMessage(on_language_change, newLanguage);
    }

    // const dogeWallet = await getDogeCoinWallet();
    // const dogeAddress = await dogeWallet.getAddress();
    // console.log('walletAddress : ' + dogeAddress);
    // const hexTx = await dogeWallet.buildAndSignTx('DAk4Uq7pKhvcg4J3vwRYSkUc9FJeFxpNsn', 0.3);
    // const result = dogeWallet.broadcastTx(hexTx);
    // console.log('TxID : ' + JSON.stringify(result));
  }

  //webs
  const cancelAction = async () => {
    postMessage(
      JSON.stringify({
        nonce: actionMsg.nonce,
        data: {
          status: 'canceled',
        },
      }),
    );
    setModalVisible(false);
  };

  const handleNavigationStateChange = (navState) => {
    console.log('handleNavigationStateChange', navState.canGoBack);
    setCanGoBack(navState.canGoBack);
    setReadyURI(navState.url);
    // setURI(navState.url);
    updateChatNodeNow(navState.url);
    // webChatNode = navState.url;
    setChatNodeUri(navState.url);
    currentUrl.current = navState.url;
  };

  const confirmAction = async () => {
    try {
      // const resutl = ECDH.process({
      //   path: "m/100'/0'/0'/0/0",
      //   externalPubKey:
      //     "04782a9b4046f88a8fd717ed4bdf632aca5bcef29b7547506c2a58aef2e47fbc5ad87e7796361773c5deb511eb26e6c65819aabb1d2272aa3a1bd4a1d0107935d6",
      // });

      // console.log("creatorPubkey：" + (await resutl).creatorPubkey);
      // console.log("ecdhPubKey ：" + (await resutl).ecdhPubKey);
      // console.log("externalPubKey：" + (await resutl).externalPubKey);
      // console.log("sharedSecret：" + (await resutl).sharedSecret);

      const [actionName, actionType] = actionMsg.action.split('-');
      console.log('actionName ', actionName);

      if (actionType === ActionType.Authorize && needEstimated) {
        const data = metaidComponentRef.current.getEstimatedData();

        const { nextComponent, estimate } = actionDispatcher(actionName, ActionType.Authorize);

        try {
          const params = await estimate(data);

          setNeedEstimated(false);
          setComponentInfo({ component: nextComponent, params });
          // console.log("params 设置参数完成：", params);
          setIsShowLoading(false);
        } catch (e) {
          if (actionName === 'Inscribe') {
            console.log('调用报错11:' + actionName + e);
            setModalVisible(false);
            ToastView({ text: 'Insufficient funds', type: 'error', time: 3000 });
            // cancelAction();
            errorAction('Insufficient funds.');
            throw 'Insufficient funds';
          } else {
            console.log('调用报错:' + actionName + e);
            setModalVisible(false);
            ToastView({ text: e.toString(), type: 'error', time: 3000 });
            // cancelAction();
            errorAction(e.toString());
            throw e.toString();
          }
        }
      } else {
        try {
          console.log('进行下一步处理', actionName);
          const { process } = actionDispatcher(actionName, actionType as ActionType);
          // console.log("confirmAction params", componentInfo.params);
          console.log('actionName 执行4444 ', componentInfo.params);
          const data = await process(componentInfo.params, actionMsg.host);
          console.log('actionName 执行5555inscribe 结果： ', data);
          setIsShowLoading(false);

          postMessage(
            JSON.stringify({
              data,
              nonce: actionMsg.nonce,
            }),
          );
          setModalVisible(false);
        } catch (e) {
          console.log('调用报错' + e);
          setModalVisible(false);
          ToastView({ text: e.toString(), type: 'error', time: 3000 });
          // cancelAction();
          errorAction(e.toString());
          throw e.toString();
        }
      }
    } catch (e) {
      setIsShowLoading(false);
      // alert(e);
      // ToastView({ text: "Please input address", type: "error" });
      ToastView({ text: e.toString(), type: 'error', time: 5000 });
    }
  };

  const errorAction = async (errorMessage) => {
    postMessage(
      JSON.stringify({
        nonce: actionMsg.nonce,
        data: {
          status: errorMessage,
          info: errorMessage,
        },
      }),
    );
    setModalVisible(false);
  };

  const sendWebMessage = async (event, message?) => {
    // console.log('sendWebMessage', jsonMessage);
    const webMessage = {
      channel: 'from-rn-event',
      event: event,
      // data: { isLogin: true ,address:""},
      data: message,
    };
    const jsonMessage = JSON.stringify(webMessage);
    console.log('sendWebMessage', jsonMessage);
    postMessage(jsonMessage);
  };

  const onError = ({ nativeEvent }) => {
    console.log('onError', nativeEvent);
  };
  const postMessage = async (message: unknown) => {
    // console.log('postMessage', message);

    webViewRef.current.postMessage(message);
  };

  const handlerMessage = async (message: Message & { type: string; data: unknown }) => {
    console.log('handlerMessage', JSON.stringify(message));

    // if (message.type === 'Console') {
    //   console.info(`[Console] ${JSON.stringify(message.data)}`);
    //   return;
    // }

    let [actionName, actionType] = message.action.split('-');

    if (actionName === 'SetAppBadge') {
      // Ensure count is a number
      const count =
        typeof message.params === 'number'
          ? message.params
          : typeof message.params?.count === 'number'
            ? message.params.count
            : 0;
      console.log('设置角标onSetAppBadge: ' + count);

      // await Notifications.setBadgeCountAsync(count);
    }

    if (actionName === 'NeedWebRefresh') {
      console.log('onRefresh 当前的刷新是否开启' + message.params.isNeed);
      updateNeedWebRefresh(message.params.isNeed);
      isNeedRefreshWebRef.current = message.params.isNeed as boolean;
    }

    if (actionName === 'OpenAppBrowser') {
      console.log('openAppBrowser: 链接: ' + message.params.url);
      navigate('OpenWebsPage', { url: message.params.url });
      return;
    }

    //   if (currentUrl.current.includes('idchat.io')) return true;

    //   if (!isNavigating.current) {
    //     isNavigating.current = true;
    //     navigate('DappWebsPage', { url: request.url });
    //     setTimeout(() => (isNavigating.current = false), 1000);
    //   }
    //   return false;

    // console.log("actionName", actionName);
    // console.log("actionType", actionType);
    setIsShowLoading(false);
    if (actionName === 'ECDH' || actionName === 'SignBTCMessage' || actionName === 'Connect') {
      actionType = 'query';
    }

    if (actionName === 'Connect') {
      message.params.icon = message.icon;
    }

    // let metaID = true;
    // if (metaID) {
    //   metaID = false;
    //   const { process } = actionDispatcher('GetGlobalMetaid', ActionType.Query);
    //   const data = await process(message.params, message.host);
    //   console.log('GetGlobalMetaid data : ' + JSON.stringify(data));
    // }

    actionMsg2 = message;
    // console.log("actionMsg2 执行111 ", JSON.stringify(actionMsg2));

    if (actionType === ActionType.Authorize) {
      console.log('actionMsg2 执行222 ' + actionName);

      // console.log("message", message);
      setActionMsg(message);
      setModalVisible(true);
      if (message.icon) {
        setIcon(message.icon);
      }
      setHost(message.host);
      const { title, descriptions, component, needEstimated } = actionDispatcher(
        actionName,
        actionType,
      );

      setActionName(title);
      setComponentInfo({ component, params: message.params });
      setDescriptions(descriptions);
      setNeedEstimated(needEstimated);
      // console.log("actionMsg2 执行333");

      // console.log("actionDispatcher", JSON.stringify(actionDispatcher(actionName, actionType)));

      // console.log("params", JSON.stringify(message.params));
    } else if (actionType === ActionType.Query) {
      // console.log("query1111 :", actionName);

      try {
        const { process } = actionDispatcher(actionName, ActionType.Query);
        // console.log("query2222 :", actionName, message.params, message.host);

        const data = await process(message.params, message.host);

        // console.log("query :", data);

        if (data !== undefined) {
          if (message && message.nonce) {
            postMessage(
              JSON.stringify({
                data,
                nonce: message.nonce,
              }),
            );
          }
        } else {
          console.log('query error', actionName);
        }
      } catch (e) {
        console.log('query2222 :', e);
        console.log('error actionName : ' + actionName);
      }
    }
  };
  const isNavigating = useRef(false);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setIsFocusEdit(false);
      }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LoadingModal
          isShow={isShowLoading}
          isCancel={true}
          event={() => {
            setIsShowLoading(false);
          }}
        />

        <Modal animationType="slide" visible={modalVisible}>
          <SafeAreaView style={{ flex: 1, margin: Platform.OS === 'ios' ? 30 : 0 }}>
            <View
              style={{
                flex: 1,
                margin: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 20,
                }}
              >
                <MaskedView
                  style={{
                    flexDirection: 'row',
                    height: 60,
                  }}
                  maskElement={
                    <Text
                      style={{
                        fontSize: 20,
                        textAlign: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      AUTHORIZE
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={['#6CE5F7', '#1F2CFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                  />
                </MaskedView>
              </View>

              {icon ? (
                <Image source={{ uri: icon }} style={{ width: 80, height: 80, borderRadius: 10 }} />
              ) : (
                <CircleAvatarLetter widthC={70} heightC={70} letterStr={host[0] || ''} />
              )}

              <Text
                style={{
                  fontSize: 14, // text-sm ≈ 14px
                  color: '#6B7280', // text-gray-500 ≈ #6B7280
                  paddingVertical: 24, // py-6 ≈ 24px
                }}
              >
                {`${host} would like to:`}
              </Text>

              <ScrollView
                style={{
                  overflow: 'scroll', // overflow-y-auto -> overflow: 'scroll' for vertical scrolling
                  borderRadius: 8, // rounded-lg -> rounded large (8px)
                  backgroundColor: '#F9FAFB', // bg-gray-50 -> light gray (#F9FAFB)
                  width: '100%', // w-full -> full width
                }}
              >
                <View
                  style={{
                    padding: 16, // p-4 -> padding of 16px
                    gap: 8, // space-y-2 -> vertical space between elements (2 * 4px = 8px)
                  }}
                >
                  {componentInfo
                    ? createElement(
                        componentInfo.component,
                        {
                          params: componentInfo.params,
                          ref: needEstimated ? metaidComponentRef : undefined,
                        },
                        <View style={{ gap: 8 }}>
                          <Text style={{ fontSize: 16 }}>{actionName}</Text>
                          {(descriptions || []).map((description, index) => (
                            <View
                              key={index}
                              style={{
                                flexDirection: 'row',
                                gap: 4,
                                width: '100%',
                              }}
                            >
                              <CheckBadgeIcon style={{ width: 24, height: 24, marginTop: -2 }} />
                              <Text style={{ flex: 1 }}>{description}</Text>
                            </View>
                          ))}
                        </View>,
                      )
                    : null}
                </View>
              </ScrollView>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 24, // pt-6 对应 24px
                  paddingBottom: 48, // pb-12 对应 48px
                  width: '100%',
                  gap: 8, // gap-2 对应 8px
                }}
              >
                <Pressable
                  onPress={cancelAction}
                  style={{
                    width: 120, // w-[120px] 对应 120px
                    borderRadius: 24, // rounded-3xl 通常对应的边角圆度是 24px
                    backgroundColor: '#ADD8E6', // bg-blue-light 对应的浅蓝色 (可以根据具体颜色修改)
                    paddingVertical: 16, // py-4 对应的上下内边距是 16px
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center', // text-center 对应 `textAlign: 'center'`
                      fontSize: 12, // text-sm 对应字体大小，通常为 12px
                      color: '#1E40AF', // text-blue-primary 对应的蓝色 (#1E40AF) 可以根据你的设计系统修改
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIsShowLoading(true);
                    confirmAction();
                  }}
                  style={{
                    width: 120, // w-[120px] 对应的宽度
                    borderRadius: 30, // rounded-3xl 对应的圆角，通常为 30px
                    backgroundColor: '#1E40AF', // bg-blue-primary 对应的蓝色背景 (#1E40AF) 可以根据你的设计系统修改
                    paddingVertical: 16, // py-4 对应的垂直内边距，通常为 16px
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center', // text-center 对应的文本居中
                      fontSize: 12, // text-sm 对应的小字体，通常为 12px
                      color: 'white', // text-white 对应的白色字体
                    }}
                  >
                    {needEstimated ? 'Next' : 'Confirm'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={isShowWebNotice} transparent={true}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
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
                height: '45%',
                width: '80%',
              }}
            >
              <Text style={[metaStyles.largeDefaultLittleText, { textAlign: 'center' }]}>
                {t('n_web_response_title')}
              </Text>
              <Line />
              <ScrollView>
                <Text
                  style={[
                    {
                      color: '#333333',
                      fontSize: 16,
                      lineHeight: 22,
                      marginTop: 15,
                    },
                  ]}
                >
                  {t('n_web_response_notice')}
                </Text>
              </ScrollView>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 15,
                  marginBottom: 20,
                }}
              >
                {isAgree ? (
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setIsAgree(false);
                      AsyncStorageUtil.setItem(no_notice_key, false);
                    }}
                  >
                    <Image
                      source={require('@image/metalet_wallet_check_select.png')}
                      style={{ width: 20, height: 20, marginRight: 10 }}
                    />
                  </TouchableWithoutFeedback>
                ) : (
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setIsAgree(true);
                      AsyncStorageUtil.setItem(no_notice_key, true);
                    }}
                  >
                    <Image
                      source={require('@image/metalet_wallet_check_normal_icom.png')}
                      style={{ width: 20, height: 20, marginRight: 10 }}
                    />
                  </TouchableWithoutFeedback>
                )}

                <Text style={[metaStyles.defaultText, { marginTop: 0 }]}>
                  {t('n_web_response_confirm')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <TouchableWithoutFeedback
                  onPress={async () => {
                    setIsShowWebNotice(false);
                  }}
                >
                  <Text
                    style={[
                      metaStyles.largeDefaultLittleText,
                      { textAlign: 'center', color: themeColor },
                    ]}
                  >
                    {t('c_cancel')}
                  </Text>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback
                  onPress={async () => {
                    setIsShowWebNotice(false);
                    // setURI(uriReady);
                    // updateChatNodeNow(uriReady);
                    // webChatNode = uriReady;
                    console.log('uriReady', uriReady);
                    setIsFocusEdit(false);
                    Keyboard.dismiss();
                    if (webViewRef.current) webViewRef.current.reload();
                  }}
                >
                  <Text
                    style={[
                      metaStyles.largeDefaultLittleText,
                      { textAlign: 'center', color: themeColor },
                    ]}
                  >
                    {t('c_confirm')}
                  </Text>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </View>
        </Modal>

        {Platform.OS === 'web' ? (
          <View
            style={{
              flex: 1, // 设置占据父容器的全部空间
              justifyContent: 'center', // 垂直居中
              alignItems: 'center', // 水平居中
              width: '100%', // 设置宽度为100%
              height: '100%', // 设置高度为100%
            }}
          >
            <Text style={{ marginBottom: 16 }}>GetWebView does not support on web</Text>
            <Button onPress={() => setModalVisible(true)} title="Show Modal" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* <TouchableWithoutFeedback
              onPress={() => {
                console.log('click');
              }}
            >
              <Text style={{ marginBottom: 16, fontSize: 30 }}>发送事件</Text>
            </TouchableWithoutFeedback> */}

            {isUriReady && (
              <WebView
                key={reloadWebKey}
                style={{ flex: 1 }}
                ref={webViewRef}
                source={{ uri: chatNodeUri }}
                useWebKit={true}
                onError={onError}
                allowFileAccess={true}
                javaScriptEnabled={true}
                injectedJavaScript={injectedJavaScript}
                domStorageEnabled={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                cacheEnabled={true}
                onLoadStart={() => console.log('WebView start')}
                onLoadEnd={async () => {
                  console.log('WebView end');
                  setTimeout(() => {
                    byLogin();
                  }, 2000);
                  setTimeout(() => {
                    byLogin();
                  }, 4000);
                  setTimeout(() => {
                    byLogin();
                  }, 6000);
                  // sendWebMessage({ isLogin: true });
                  // const address = await getMvcAddress();
                  // console.log('address', address);
                }}
                // cacheMode="LOAD_CACHE_ELSE_NETWORK"
                javaScriptCanOpenWindowsAutomatically={true}
                onMessage={(e) => {
                  handlerMessage(JSON.parse(e.nativeEvent.data));
                }}
                userAgent={Platform.OS === 'ios' ? 'IDChat-iOS' : 'IDChat-Android'}
                androidHardwareAccelerationDisabled={false}
                onNavigationStateChange={handleNavigationStateChange}
                originWhitelist={['*']}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
