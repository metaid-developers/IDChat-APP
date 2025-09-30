import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
  LayoutChangeEvent,
  TextInput,
  Button,
  Alert,
  ImageSourcePropType,
  ScrollView,
} from 'react-native';
import { metaStyles, normalColor, themeColor } from '../constant/Constants';
import { goBack, navigate } from '../base/NavigationService';

import React, { useRef, useEffect, useState } from 'react';
import EasyToast from 'react-native-easy-toast';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import QRCode from 'react-native-qrcode-svg';
import PasswordPay from 'react-native-password-pay';
import { verifyPassword } from '../utils/WalletUtils';
import { wallet_password_key, createStorage } from '../utils/AsyncStorageUtil';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { verifyPassword } from "../utils/WalletUtils";
// import { CameraView } from 'expo-camera/next';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { Camera, CameraView } from 'expo-camera';

const storage = createStorage();

export const styles = StyleSheet.create({
  centeredView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  centeredView2: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
    marginHorizontal: 10,

    // backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalView: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    // elevation: 5,
  },
  avaterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 50,
    overflow: 'hidden', // 需要设置 overflow: 'hidden' 来裁剪渐变色
  },
  avaterGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 50,
  },
  indicator: {
    // width: 30,
    height: 3,
    backgroundColor: 'blue',
    marginRight: 20,
    alignItems: 'center',
  },
});

//1. 白色组件填充 "#F3F3FF"

export const RoundSimButton = ({
  title,
  event,
  color = themeColor,
  textColor = normalColor,
  roundStytle = {},
}) => {
  return (
    <TouchableWithoutFeedback onPress={event}>
      <View
        style={[
          roundStytle,
          {
            flexDirection: 'row',
            height: 48,
            width: '100%',
            backgroundColor: color,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderColor: normalColor,
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[{ textAlign: 'center' }, { color: textColor }, { fontSize: 16 }]}>
          {title}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const RoundSimButtonFlee = ({
  title,
  event,
  color = themeColor,
  textColor = themeColor,
  style = {},
}) => {
  return (
    <TouchableWithoutFeedback onPress={event}>
      <View
        style={[
          {
            flexDirection: 'row',
            height: 48,
            width: '100%',
            backgroundColor: color,
            borderRadius: 23,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          },
          style,
        ]}
      >
        <Text style={[{ textAlign: 'center' }, { color: textColor }, { fontSize: 16 }]}>
          {title}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

// export const RoundColorButton = ({
//   title,
//   event,
//   color = themeColor,
//   textColor = themeColor,
//   style = {},
// }) => {
//   return (
//     <TouchableWithoutFeedback onPress={event}>

// <View
//                     style={[
//                       {
//                         flexDirection: "row",
//                         height: 48,
//                         width: 200,
//                         backgroundColor: isCanReName
//                           ? "rgba(23, 26, 255, 1)"
//                           : "rgba(23, 26, 255, 0.5)",
//                         borderRadius: 30,
//                         alignItems: "center",
//                         justifyContent: "center",
//                         marginBottom: 20,
//                       },
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         { textAlign: "center" },
//                         { color: "#fff" },
//                         { fontSize: 16 },
//                       ]}
//                     >
//                       Confirm
//                     </Text>
//                   </View>

//       <View
//         style={[
//           {
//             flexDirection: "row",
//             height: 48,
//             width: "100%",
//             backgroundColor: color,
//             borderRadius: 23,
//             alignItems: "center",
//             justifyContent: "center",
//             marginBottom: 20,
//           },
//           style,
//         ]}
//       >
//         <Text
//           style={[
//             { textAlign: "center" },
//             { color: textColor },
//             { fontSize: 16 },
//           ]}
//         >
//           {title}
//         </Text>
//       </View>
//     </TouchableWithoutFeedback>
//   );
// };

//2.title bar
export const TitleBar = ({
  title = '',
  event = (props) => {
    goBack();
  },
}) => {
  return (
    <TouchableWithoutFeedback onPress={event}>
      <View
        style={{
          flexDirection: 'row',
          marginLeft: 20,
          marginTop: 5,
          height: 44,
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../../image/meta_back_icon.png')}
          style={{ width: 22, height: 22 }}
        />
        <Text
          style={[{ textAlign: 'center', marginRight: 40, marginLeft: 15 }, metaStyles.titleText]}
        >
          {title}
        </Text>

        <Text style={{ marginRight: 20, color: '#333', fontSize: 16 }}> </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

// export const TitleImgBar = ({
//   title = "",
//   rightImg="",
//   event = (props) => {
//     goBack();
//   },
//   rightevent = () => {},

// }) => {
//   return (
//     <View
//       style={{
//         flexDirection: "row",
//         marginLeft: 20,
//         marginTop: 5,
//         height: 44,
//         alignItems: "center",
//       }}
//     >
//       <TouchableWithoutFeedback onPress={event}>
//         <Image
//           source={require("../../image/meta_back_icon.png")}
//           style={{ width: 22, height: 22 }}
//         />
//       </TouchableWithoutFeedback>
//       <Text
//         style={[
//           { textAlign: "center", marginRight: 40, marginLeft: 15, flex: 1 },
//           metaStyles.titleText,
//         ]}
//       >
//         {title}
//       </Text>

//       <TouchableWithoutFeedback onPress={rightevent}>
//         <Image
//           source={require(rightImg)}
//           style={{ width: 22, height: 22 }}
//         />
//       </TouchableWithoutFeedback>

//       <Text style={{ marginRight: 20, color: "#333", fontSize: 16 }}> </Text>
//     </View>
//   );
// };

//3.hook toast
export const useEasyToast = (position: 'top' | 'bottom' | 'center') => {
  const toastRef = useRef<EasyToast>(null);

  useEffect(() => {
    // 如果需要在组件卸载时做清理工作，可以在这里编写
    // 返回一个清除函数
    // return () => {...};
  }, []);

  return toastRef;
};

//4.loading Modal 弹框来着
export const LoadingModal = ({ isShow = true, title = '', isCancel = true, event = () => {} }) => {
  // const [obj, setObj] = useState({ title: title, isShow: isShow ,isCancel:isCancel});

  // animationType="slide"
  // transparent={true}
  // visible={obj.isShow}
  // onRequestClose={() => {
  // setModalVisible(false);
  // }}

  // const closeModal=()=>{
  //   setObj({...obj,isShow:false})
  // }

  return (
    <Modal animationType="fade" transparent={true} visible={isShow}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (isCancel) {
            event();
          }
          // if(isCancel)
          // setObj({...obj,isShow:false})
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ActivityIndicator size={'large'} color={'#fff'} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

//5.loading Modal 弹框来着
export const LoadingNoticeModal = ({
  isShow = true,
  title = '',
  isCancel = true,
  event = () => {},
}) => {
  return (
    <Modal transparent={true} visible={isShow}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (isCancel) {
            event();
          }
        }}
      >
        <View style={styles.centeredView2}>
          <View style={styles.modalView}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{title}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const defaultAvatarColor = [];
// const defaultAvatarColor2 = [];
//6. avater
// export const GradientAvatar = ({ isRand = false, userStyle = {} }) => {
//  export const GradientAvatar = React.memo(({ userStyle = {}, isRand = false , defaultAvatarColor = []}: { userStyle?: object; isRand?: boolean ;defaultAvatarColor?:string []}) => {
export const GradientAvatar = ({
  userStyle = {},
  isRand = false,
  defaultAvatarColor = [],
}: {
  userStyle?: object;
  isRand?: boolean;
  defaultAvatarColor?: string[];
}) => {
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  if (defaultAvatarColor.length == 0) {
    defaultAvatarColor[0] = getRandomColor();
    defaultAvatarColor[1] = getRandomColor();
  } else {
    // if (isRand) {
    //   defaultAvatarColor2[0] = getRandomColor();
    //   defaultAvatarColor2[1] = getRandomColor();
    // }
  }

  const randomGradientColors = [defaultAvatarColor[0], defaultAvatarColor[1]];
  // let randomGradientColors;
  // if (isRand) {
  //   randomGradientColors = [defaultAvatarColor2[0], defaultAvatarColor2[1]];
  // } else {
  //   randomGradientColors = [defaultAvatarColor[0], defaultAvatarColor[1]];
  // }

  return (
    <View style={[styles.avaterContainer, userStyle]}>
      <LinearGradient
        colors={randomGradientColors}
        style={styles.avaterGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
  );
};
// )

// 7. no more data view
export const NoMoreDataView = ({ isShow = false }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        // opacity: isShow?1:0,
      }}
    >
      <Image
        source={require('../../image/meta_no_more_data_icon.png')}
        style={{ width: 38, height: 53 }}
      />

      <Text style={[metaStyles.grayTextdefault66, { marginTop: 20 }]}>No more data</Text>
    </View>
  );
};

//8.custom tabbar 自定义切换头部
export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
  isShowIndicator = true,
  isSmallTitle = false,
}) => {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let fontSize = isSmallTitle ? 12 : 16;
        return (
          <TouchableOpacity activeOpacity={1} key={route.key} onPress={onPress}>
            <View style={{ alignItems: 'center' }}>
              <Text
                key={index}
                style={{
                  fontSize: isFocused ? fontSize : fontSize,
                  // marginHorizontal: 10,
                  // paddingRight: 15,
                  marginVertical: 5,
                  fontWeight: isFocused ? 'bold' : 'normal',
                  color: isFocused ? '#333333' : '#666666',
                  paddingRight: 20,
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
              {isFocused && isShowIndicator && (
                <LinearGradient
                  // colors={["#FFD700", "#FF6347"]}
                  colors={['#6CE5F7', '#1F2CFF']}
                  style={[styles.indicator, { width: label.length * 4 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}

              {/* {isFocused && <View style={styles.indicator2} />} */}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/////////////////////////////////////////////////////////////////////////////////
// 9.圆形头像 组件
export const CircleAvatar = ({ imageUrl, widthC = 50, heightC = 50, event = () => {} }) => {
  return (
    <View
      style={{
        width: widthC,
        height: heightC,
        borderRadius: 50,
        overflow: 'hidden',
      }}
    >
      <Image style={{ width: '100%', height: '100%' }} source={{ uri: imageUrl }} onError={event} />
    </View>
  );
};

/////////////////////////////////////////////////////////////////////////////////
// 10.圆形头像 首字母
export const CircleAvatarLetter = ({ letterStr, widthC = 50, heightC = 50 }) => {
  return (
    <View
      style={{
        width: widthC,
        height: heightC,
        borderRadius: 50,
        overflow: 'hidden',
        backgroundColor: '#171AFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          textAlign: 'center',
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
        }}
      >
        {letterStr.toUpperCase()}
      </Text>
    </View>
  );
};

//11.loading Modal 弹框来着
export const VerifyModal = ({
  isShow = true,
  title = '',
  isCancel = true,
  event = (inputText: string) => {},
  eventCancel = () => {},
}) => {
  const [inputText, setInputText] = useState('');
  const { t } = useTranslation();

  return (
    <Modal transparent={true} visible={isShow}>
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
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 30,
            marginHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{t('o_verify_password')}</Text>
            <View style={{ flex: 1 }} />

            <TouchableWithoutFeedback
              onPress={() => {
                eventCancel();
              }}
            >
              <Image
                source={require('../../image/metalet_close_big_icon.png')}
                style={{ width: 15, height: 15 }}
              />
            </TouchableWithoutFeedback>
          </View>

          <Text style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
            {t('o_verify_password_notice')}
          </Text>
          {/* 
          <View
            style={{
              alignItems: "center",
              borderColor: "#171AFF",
              // backgroundColor:'#F5F7F9',
              flexDirection: "row",
              borderWidth: 1,
              height: 50,
              borderRadius: 30,
              marginTop: 20,
            }}
          >
          <TextInput
              multiline={true}
              // placeholder={editWalletName}
              autoCapitalize={"none"}
              onChangeText={setInputText}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                marginLeft: 10,
                paddingRight: 20,
              }}
            /> */}

          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 30,
            }}
          >
            <PasswordPay
              maxLength={6}
              onChange={async (value) => {
                if (value.length == 6) {
                  const passwordLocal = await storage.get(wallet_password_key);
                  // await AsyncStorageUtil.getItem(wallet_password_key);
                  // const isPassword = await verifyPassword(value);
                  console.log('输入的密码：', passwordLocal);
                  if (passwordLocal == undefined) {
                    navigate('SetPasswordPage', { type: 'change' });
                  }
                  if (passwordLocal == value) {
                    event(inputText);
                  } else {
                    console.log('Password Error');
                    eventCancel();
                    ToastView({ text: 'Password Error', type: 'error' });
                    // Toast.show({
                    //   type: 'error',
                    //   text1: 'password error',
                    //   visibilityTime: 2000,
                    // });
                  }
                }
              }}
            />
          </View>

          {/* </View> 

           <TouchableWithoutFeedback
            onPress={async () => {
              event(inputText);
            }}
          >
            <View
              style={{
                marginTop: 20,
                marginBottom: 20,
                height: 20,
                width: "100%",
                alignItems: "center",
              }}
            >
              <View
                style={[
                  {
                    flexDirection: "row",
                    height: 48,
                    width: 200,
                    backgroundColor: "rgba(23, 26, 255, 1)",
                    // backgroundColor: isCanReName
                    //   ? "rgba(23, 26, 255, 1)"
                    // : "rgba(23, 26, 255, 0.5)",
                    borderRadius: 30,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  },
                ]}
              >
                <Text
                  style={[
                    { textAlign: "center" },
                    { color: "#fff" },
                    { fontSize: 16 },
                  ]}
                >
                  Confirm
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback> */}
        </View>
      </View>
    </Modal>
  );
};

// 12 显示二维码
export const MyQrCode = ({ qrData, size }) => {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <QRCode value={qrData} size={size} />
    </View>
  );
};

// 13 扫一扫
export const QRScanner = ({ handleScan }) => {
  const [hasPermission, setHasPermission] = useState(null);
  //扫描状态
  const [scanned, setScanned] = useState(false);

  const [showCamera, setShowCamera] = useState(false);

  const [cameraRef, setCameraRef] = useState(null);

  let satrtScan: boolean = false;

  useEffect(() => {
    // 组件加载时请求摄像头权限
    requestCameraPermission();

    return () => {
      releaseCamera(); // 组件卸载时释放相机资源
    };
  }, []);

  async function getHasPermission() {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      return true;
    } else {
      return false;
    }
  }
  // 请求摄像头权限
  const requestCameraPermission = async () => {
    // const { status } = await Camera.requestPermissionsAsync();
    // const { status } = await Camera.requestCameraPermissionsAsync();
    console.log('status');

    // if(status === "granted"){
    //   setHasPermission(true);
    //   if(!showCamera&&satrtScan==false){
    //     console.log("startScanning");
    //     satrtScan=true
    //     startScanning()
    //   }
    // }

    const hasPer = await getHasPermission();
    if (hasPer && satrtScan == false) {
      console.log('开始');
      setHasPermission(true);
      satrtScan = true;
      startScanning();
    }
    // setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = ({ type, data }) => {
    // setScanned(true);
    // Alert.alert(`扫描结果`, `类型: ${type}\n数据: ${data}`);
    console.log(type, data);
    if (data != null) {
      handleScan(data);
      stopScanning();
    }
  };

  const startScanning = async () => {
    setShowCamera(true);
    // if (!hasPermission) {
    //   await requestCameraPermission();
    // }else{
    //   console.log('开始');

    //   setShowCamera(true);
    // }
  };

  const stopScanning = () => {
    setScanned(true);
    setShowCamera(false);
    if (cameraRef) {
      // cameraRef.pausePreview(); // 暂停相机预览
    }
  };

  const releaseCamera = () => {
    if (cameraRef) {
      cameraRef.release(); // 释放相机资源
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TitleBar />
      {showCamera && hasPermission && (
        // <Camera
        //   style={{ flex: 1 }}
        //   // type={CameraType.back}
        //   ref={(ref) => setCameraRef(ref)}
        //   // 扫描二维码时触发的回调函数
        //   onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        //   barCodeScannerSettings={{
        //     barCodeTypes: ['qr']
        //   }}
        // />
        <CameraView
          style={{ flex: 1 }}
          // type={CameraType.back}
          ref={(ref) => setCameraRef(ref)}
          // 扫描二维码时触发的回调函数
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      )}
    </View>
  );
};

// 14.
export const Line = ({ top = 10 }) => {
  return (
    <View
      style={{
        width: '100%',
        height: 0.5,
        backgroundColor: 'rgba(191, 194, 204, 0.5)',
        marginTop: top,
      }}
    />
  );
};

// 15.close
export const CloseView = ({ event }) => {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        event();
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../../image/metalet_close_big_icon.png')}
          style={{ width: 15, height: 15 }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

// 16.base parent view
export const BaseView = ({ hasTitle = true, titleText = '', ChildView }) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {hasTitle && <TitleBar title={titleText} />}
        <View>
          <ChildView />
        </View>
      </View>
    </SafeAreaView>
  );
};

//17.simple notice
export const ToastView = ({ text, time = 2000, type = 'info' }) => {
  Toast.show({
    type,
    text1: text,
    visibilityTime: time,
    autoHide: true,
    position: 'top',
  });
};

// 18.圆形头像
export const AvatarImageView: React.FC<AvatarImageViewProps> = ({ source, size = 80 }) => {
  return (
    <Image
      source={source}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'white' }]}
      resizeMode="cover"
    />
  );
};

type AvatarImageViewProps = {
  source: ImageSourcePropType; // 可传 {uri: "..."} 或 require("...")
  size?: number;
};

//19.正常弹框提示
export const NormalAlertView = ({
  title,
  message,
  onConfirm,
  isShow = false,
  onCancel = () => {
    goBack();
  },
}: {
  title: string;
  message: string;
  isShow?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Modal visible={isShow} transparent={true}>
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
            paddingTop: 25,
            marginHorizontal: 20,
            paddingBottom: 15,
          }}
        >
          <Text style={[metaStyles.largeDefaultLittleText, { textAlign: 'center' }]}>{title}</Text>

          <Line />

          <ScrollView>
            <Text style={[metaStyles.defaultText, { marginTop: 30 }]}>{message}</Text>
          </ScrollView>

          {/* <RoundSimButton textColor="#fff" title={"OK"} event={()=>{
            setIsShowBackUp(false)
           }}/> */}

          <View style={{ flexDirection: 'row', marginTop: 30, justifyContent: 'space-around' }}>
            <TouchableWithoutFeedback
              onPress={async () => {
                onCancel();
              }}
            >
              <Text style={[metaStyles.defaultText18, { textAlign: 'center', flex: 1 }]}>
                {t('c_cancel')}
              </Text>
            </TouchableWithoutFeedback>

            <View style={{ flex: 1 }} />

            <TouchableWithoutFeedback
              onPress={async () => {
                onConfirm();
              }}
            >
              <Text
                style={[
                  metaStyles.defaultText18,
                  { textAlign: 'center', color: themeColor, flex: 1 },
                ]}
              >
                {t('c_confirm')}
              </Text>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
    </Modal>
  );
};
