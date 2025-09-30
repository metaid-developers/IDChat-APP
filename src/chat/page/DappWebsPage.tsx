import { BaseWalletTools, initBaseChatWallet } from '../lib/BaseWalletTools';
import { init } from 'i18next';
import useWalletStore from '@/stores/useWalletStore';
import { useData } from '@/hooks/MyProvider';

import WebView from 'react-native-webview';
// import { injectedJavaScript } from "./inject";
import CloseIcon from '@/components/icons/CloseIcon';
import { createElement, ComponentType, useCallback } from 'react';
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
} from 'react-native';
import { CircleAvatarLetter, LoadingModal, TitleBar, ToastView } from '@/constant/Widget';
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
import { AsyncStorageUtil, createStorage, no_notice_key } from '@/utils/AsyncStorageUtil';
import { useFocusEffect } from '@react-navigation/native';
import { ActionType } from '@/webs/actions/types';
import { injectedJavaScript } from '@/webs/inject';
import actionDispatcher from '@/webs/actions/action-dispatcher';
import { json } from 'stream/consumers';
import { getMvcAddress } from '@/wallet/walletUtils';
import { eventBus, loginSuccess_Bus, logout_Bus } from '@/utils/EventBus';
import { account_switch, isLogin_event, logout_event, refresh_event } from '../com/chatActions';
import { isUserLogin } from '../com/metaIDUtils';
import { getStorageCurrentWallet } from '@/utils/WalletUtils';
import * as Notifications from 'expo-notifications';

interface Message {
  host: string;
  icon: string;
  nonce: string;
  channel: 'to-metaidwallet';
  params: Record<string, unknown>;
  action: `${string}-${ActionType}`;
}
export default function DappWebsPage(props) {
  const { setCurrentWallet } = useWalletStore();
  const { metaletWallet, updateMetaletWallet } = useData();
  const { needInitWallet, updateNeedInitWallet } = useData();
  const { switchAccount, updateSwitchAccount } = useData();

  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);
  const url = props.route.params.url;
  const [uri, setURI] = useState(url);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [uriReady, setReadyURI] = useState('');
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

  useEffect(() => {
    // console.log("HomePage useEffect   btc change");
    setIsShowLoading(true);
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          console.log('Back button pressed on focused screen11111111111');
          webViewRef.current.goBack();
          return true; // 阻止直接退出 App
        } else {
          console.log('Back button pressed on focused screen222222');
          goBack();
        }
        console.log('Back button pressed on focused screen');
        // return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [canGoBack]),
  );

  const handleNavigationStateChange = (navState) => {
    console.log('handleNavigationStateChange', navState.canGoBack);
    setCanGoBack(navState.canGoBack);
    setReadyURI(navState.url);
    setURI(navState.url);
    setCurrentUrl(navState.url);
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
          console.log('调用报错' + e);
          setModalVisible(false);
          ToastView({ text: e.toString(), type: 'error', time: 3000 });
          // cancelAction();
          errorAction(e.toString());
          throw e.toString();
        }
      } else {
        try {
          // console.log("进行下一步处理", actionName);
          const { process } = actionDispatcher(actionName, actionType as ActionType);
          // console.log("confirmAction params", componentInfo.params);
          // console.log("actionName 执行4444 ", componentInfo.params);
          const data = await process(componentInfo.params, actionMsg.host);
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
    console.log('webView 加载错误信息');

    console.log('onError', nativeEvent);
  };
  const postMessage = async (message: unknown) => {
    console.log('postMessage', message);

    webViewRef.current.postMessage(message);
  };

  const handlerMessage = async (message: Message & { type: string; data: unknown }) => {
    console.log('handlerMessage', JSON.stringify(message));

    if (message.type === 'Console') {
      console.info(`[Console] ${JSON.stringify(message.data)}`);
      return;
    }
    let [actionName, actionType] = message.action.split('-');
    // console.log("actionName", actionName);
    // console.log("actionType", actionType);
    setIsShowLoading(false);
    if (actionName === 'ECDH' || actionName === 'SignBTCMessage' || actionName === 'Connect') {
      actionType = 'query';
    }
    // if (actionName === "Transfer") {
    //   console.log("message", message);
    // }

    if (actionName === 'Connect') {
      message.params.icon = message.icon;
    }

    actionMsg2 = message;

    // console.log("actionMsg2 执行111 ", JSON.stringify(actionMsg2));

    if (actionType === ActionType.Authorize) {
      // console.log("actionMsg2 执行222 " + actionName);

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
      // console.log(
      //   "actionMsg2 执行333 ",
      //   title,
      //   descriptions,
      //   component,
      //   needEstimated
      // );
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

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setIsFocusEdit(false);
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
              {/* metaStyles.defaultText, */}
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

                {/* <Image  style={{width:15}} source={require("../../image/metalet_wallet_check_normal_icom.png")} /> */}
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
                    setURI(uriReady);
                    console.log('uriReady', uriReady);
                    console.log('uri', uri);
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



        <View
          style={{
            flexDirection: "row",
            padding: 10,
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              if (webViewRef.current) webViewRef.current.goBack();
            }}
          >
            <Image
              source={require("@image/meta_back_icon.png")}
              style={{ width: 22, height: 22 }}
            />
          </TouchableWithoutFeedback>
          {/* <Text
          style={{
            backgroundColor: litterWhittleBgColor,
            flex: 1,
            padding: 10,
            borderRadius: 10,
            overflow: "hidden",
          }}
          numberOfLines={1}
        >
          {uri}
        </Text> */}

          <TextInput
            style={{
              backgroundColor: litterWhittleBgColor,
              flex: 1,
              padding: 10,
              borderRadius: 10,
              overflow: "hidden",
            }}
            numberOfLines={1}
            value={uriReady}
            onFocus={() => {
              // setFeedModeType(feedModeCustom);
              setIsFocusEdit(true);
            }}
            onChangeText={(text) => setReadyURI(text)}
          />

          <TouchableOpacity
            onPress={() => {
              if (isFocusEdit == false) {
                if (webViewRef.current) webViewRef.current.reload();
              } else {
                console.log("uriReady进入加载");
                setIsFocusEdit(false);
                Keyboard.dismiss();

                if (isAgree) {
                  setURI(uriReady);
                  if (webViewRef.current) webViewRef.current.reload();
                } else {
                  setIsShowWebNotice(true);
                }

                // if (uriReady.trim()) {
                //   const newUrl = uriReady.trim();
                //   // 检查是否需要添加协议头
                //   if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
                //     setURI(`https://${newUrl}`); // 默认使用 https
                //   } else {
                //     setURI(newUrl);
                //   }
                // }
                // setURI("https://ai.com");
                // Keyboard.dismiss();
                // setIsFocusEdit(false);
              }
            }}
            style={{
              borderWidth: 1, // 设置边框宽度为1
              borderColor: "#E7E7E7", // 设置边框颜色为 #E7E7E7
              borderRadius: 50, // 圆形边角，h和w的大小决定了其形状
              width: 32, // 对应 w-8，8 * 4px = 32px
              height: 32, // 对应 h-8，8 * 4px = 32px
              flexDirection: "row", // 使用 flex 排列元素
              alignItems: "center", // 垂直居中对齐
              justifyContent: "center",
              marginLeft: 5, // 水平居中对齐
            }}
          >
            {isFocusEdit === true ? (
              <Image
                source={require("@image/meta_search_icon.png")}
                style={{ width: 16, height: 16 }}
              />
            ) : (
              <Image
                source={require("@image/icon_refresh.png")}
                style={{ width: 16, height: 16 }}
              />
            )}
            {/* <Image
            source={require("../../image/icon_refresh.png")}
            style={{ width: 16, height: 16 }}
          /> */}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              goBack();
            }}
            style={{
              marginLeft: 5,
              borderWidth: 1, // 设置边框宽度为1
              borderColor: "#E7E7E7", // 设置边框颜色为 #E7E7E7
              borderRadius: 50, // 圆形边角，h和w的大小决定了其形状
              width: 32, // 对应 w-8，8 * 4px = 32px
              height: 32, // 对应 h-8，8 * 4px = 32px
              flexDirection: "row", // 使用 flex 排列元素
              alignItems: "center", // 垂直居中对齐
              justifyContent: "center", // 水平居中对齐
            }}
          >
            {/* <CloseIcon
              style={{
                width: 10, // 对应 w-2.5，2.5 * 4px = 10px
                height: 10, // 对应 h-2.5，2.5 * 4px = 10px
                backgroundColor: "#000", // 设置背景色为黑色
                borderRadius: 5, // 使其成为圆形，宽高相等时用半径的一半
              }}
            /> */}

            <Image
              source={require("@image/metalet_close_big_icon.png")}
              style={{ width: 13, height: 13 }}
            />
          </TouchableOpacity>
        </View>

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
            {/* <TitleBar
              event={() => {
                if (canGoBack && webViewRef.current && currentUrl !== url) {
                  console.log('Back button pressed on focused screen11111111111');
                  webViewRef.current.goBack();
                } else {
                  console.log('Back button pressed on focused screen222222');
                  goBack();
                }
                console.log('Back button pressed on focused screen');
                // return true;
              }}
            /> */}
            <WebView
              style={{ width: '100%', height: '100%' }}
              ref={webViewRef}
              source={{ uri }}
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
              onLoadEnd={() => {
                console.log('WebView end');

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
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
