import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { setTopLevelNavigator } from './NavigationService';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { metaStyles, showPayCode } from '../constant/Constants';
import EasyToast from 'react-native-easy-toast';

// import { ToastContainer } from 'react-native-toastify';
// import 'react-native-toastify';
// import { ToastContainer } from 'react-native-toastify';
// pages
import HomePage from '../page/HomePage';
import ChatWalletPage from '../page/ChatWalletPage';
import SettingsPage from '../page/SettingsPage';
import WelcomeWalletPage from '../page/WelcomeWalletPage';
import SplashPage from '../page/SplashPage';
import ImportWalletPage from '../page/ImportWalletPage';
import CongratulationsPage from '../page/CongratulationsPage';
import MvcNftListPage from '../page/MvcNftListPage';
import MvcNftDetailPage from '../page/MvcNftDetailPage';
import TransferMvcNftPage from '../page/TransferMvcNftPage';
import WalletsPage from '../page/WalletsPage';
import AddWalletPage from '../page/wallet/AddWalletPage';
import WalletDetailPage from '../page/wallet/WalletDetailPage';
import WalletDetelePage from '../page/wallet/WalletDetelePage';
import WalletAccountDetailPage from '../page/wallet/WalletAccountDetailPage';
import AccountAddressPage from '../page/wallet/AccountAddressPage';
import NetWorkPage from '../page/NetWorkPage';
import FtMvcPage from '../page/nft/FtMvcPage';
import FtBtcPage from '../page/nft/FtBtcPage';
import FtParentPage from '../page/nft/FtParentPage';
import SelectReceivePage from '../page/receive/SelectReceivePage';
import ReceivePage from '../page/receive/ReceivePage';
import WebsPage from '../webs/WebsPage';
import AssetsMvcDetailPage from '../page/home/AssetsMvcDetailPage';
import AssetsBtcDetailPage from '../page/home/AssetsBtcDetailPage';
import SendSelectAssertPage from '../page/home/SendSelectAssertPage';
import PasswordPage from '../page/home/PasswordPage';
import SendSpacePage from '../page/home/SendSpacePage';
import SendBtcPage from '../page/home/SendBtcPage';
import SendBtcConfirmPage from '../page/home/SendBtcConfirmPage';
import SendBtcSuccessPage from '../page/home/SendBtcSuccessPage';
import SendSpaceSuccessPage from '../page/home/SendSpaceSuccessPage';
import SetPasswordPage from '../page/safe/SetPasswordPage';
import AssetsMvcFtDetailPage from '../page/home/AssetsMvcFtDetailPage';
import SendMvcFtPage from '../page/home/SendMvcFtPage';
import SendSuccessPage from '@/page/home/SendSuccessPage';
import PlazaPage from '@/page/PlazaPage';
import BRC20DetailPage from '@/page/home/BRC20DetailPage';
import TransferBrc20FirstPage from '@/page/home/transfer/TransferBrc20FirstPage';
import InscribeFirstPage from '@/page/home/transfer/InscribeFirstPage';
import InscribePrePage from '@/page/home/transfer/InscribePrePage';
import InscribeTransferPage from '@/page/home/transfer/InscribeTransferPage';
import InscribeSuccessPage from '@/page/home/transfer/InscribeSuccessPage';
import TransferBrc20Page from '@/page/home/transfer/TransferBrc20Page';
import BtcNftDetailPage from '@/page/home/BtcNftDetailPage';
import BtcNftTransferPage from '@/page/home/BtcNftTransferPage';
import BackupPage from '@/page/settings/BackupPage';
import SecurityPage from '@/page/settings/SecurityPage';
import AboutPage from '@/page/settings/AboutPage';
import ColdWalletPage from '@/page/settings/ColdWalletPage';
import { useData } from '@/hooks/MyProvider';
import { wallet_mode_cold, wallet_mode_hot, wallet_mode_observer } from '@/utils/AsyncStorageUtil';
import SendColdBtcPrePage from '@/page/home/transfer/SendColdBtcPrePage';
import ScanPage from '@/page/settings/ScanPage';
import Mrc20DetailPage from '@/page/home/Mrc20DetailPage';
import SendMrc20Page from '@/page/home/SendMrc20Page';
import SendSuccessNormalPage from '@/page/home/SendSuccessNormalPage';
import MetaIDPinsPage from '@/page/nft/MetaIDPinsPage';
import MetaIDPage from '@/page/nft/MetaIDPage';
import MetaIDPinsDetails from '@/page/home/MetaIDPinsDetails';
import PinNftTransferPage from '@/page/home/PinNftTransferPage';
import ImportWalletNetWorkPage from '@/page/wallet/ImportWalletNetWorkPage';
import ImportWalletFirstPage from '@/page/wallet/ImportWalletFirstPage';
import ImportSelectMvcPathPage from '@/page/wallet/ImportWalletSelectAddressPage';
import ImportWalletSelectAddressPage from '@/page/wallet/ImportWalletSelectAddressPage';
import ImportWalletMvcPathNextPage from '@/page/wallet/ImportWalletMvcPathNextPage';
import ImportWalletNetPage from '@/page/ImportWalletNetPage';
import HomeColdPage from '@/page/HomeColdPage';
import AddColdWalletPage from '@/page/wallet/AddColdWalletPage';
import ReceiveColdPage from '@/page/receive/ReceiveColdPage';
import ColdAssetWalletPage from '@/page/settings/ColdAssetWalletPage';
import CongratulationsColdPage from '@/page/CongratulationsColdPage';
import BtcMRC721Page from '@/page/BtcMRC721Page';
import BtcNftMRC721DetailPage from '@/page/home/BtcNftMRC721DetailPage';
import BtcMRC721RePage from '@/page/BtcMRC721RePage';
import Mrc721NftListPage from '@/page/Mrc721NftListPage';
import ShowBuzzPage from '@/page/home/ShowBuzzPage';
import DappsPage from '@/webs/DappsPage';
import DiscoverPage from '@/webs/DiscoverPage';
import SmallPayAutoPage from '@/page/safe/SmallPayAutoPage';
import ChatHomePage from '@/chat/page/ChatHomePage';
import ChatSettingsPage from '@/chat/page/ChatSettingsPage';
import PeoInfoPage from '@/chat/page/PeoInfoPage';
import PeoEditInfoPage from '@/chat/page/PeoEditInfoPage';
import LocalChatSettingsPage from '@/chat/page/LocalChatSettingsPage';
import ChatAboutPage from '@/chat/page/ChatAboutPage';
import ChatWalletSettingsPage from '@/chat/page/ChatWalletSettingsPage';
import WebViewPage from '@/chat/page/WebViewPage';
import PushPage from '@/chat/page/PushPage';
import SwitchAccountPage from '@/chat/page/SwitchAccountPage';
import DappWebsPage from '@/chat/page/DappWebsPage';

////////

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 创建一个包裹整个应用的NavigationContainer，并将ref关联起来
export default function AppNavigator() {
  const { walletMode, updateWalletMode } = useData();

  useEffect(() => {}, []);

  return (
    <NavigationContainer
      ref={(navigatorRef) => {
        // Toast.setRef(navigatorRef)
        setTopLevelNavigator(navigatorRef);
      }}
    >
      {/* initialRouteName="Index" */}
      {/* 这里放置你的StackNavigator、TabNavigator或其他导航组件 */}

      {/* <Stack.Screen name="Home" component={HomePage} /> */}
      {/* <Stack.Screen name="Settings" component={SettingsPages} /> */}
      <StackNavigator />
    </NavigationContainer>
  );
}
// export default AppNavigator;

const StackNavigator = () => (
  <Stack.Navigator initialRouteName="SplashPage" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ImportWalletPage" component={ImportWalletPage} />
    <Stack.Screen name="SplashPage" component={SplashPage} />
    <Stack.Screen name="WelcomeWalletPage" component={WelcomeWalletPage} />
    <Stack.Screen name="CongratulationsPage" component={CongratulationsPage} />
    <Stack.Screen name="Tabs" component={TabNavigator} options={{ unmountOnBlur: false }} />
    <Stack.Screen
      name="WalletTabs"
      component={TabNavigatorByWallet}
      options={{ unmountOnBlur: false }}
    />
    <Stack.Screen name="MvcNftListPage" component={MvcNftListPage} />
    <Stack.Screen name="MvcNftDetailPage" component={MvcNftDetailPage} />
    <Stack.Screen name="TransferMvcNftPage" component={TransferMvcNftPage} />
    <Stack.Screen name="WalletsPage" component={WalletsPage} />
    <Stack.Screen name="AddWalletPage" component={AddWalletPage} />
    <Stack.Screen name="AddColdWalletPage" component={AddColdWalletPage} />
    <Stack.Screen name="WalletDetailPage" component={WalletDetailPage} />
    <Stack.Screen name="WalletDetelePage" component={WalletDetelePage} />
    <Stack.Screen name="WalletAccountDetailPage" component={WalletAccountDetailPage} />
    <Stack.Screen name="AccountAddressPage" component={AccountAddressPage} />
    <Stack.Screen name="NetWorkPage" component={NetWorkPage} />
    <Stack.Screen name="SelectReceivePage" component={SelectReceivePage} />
    <Stack.Screen name="ReceivePage" component={ReceivePage} />
    <Stack.Screen name="WebsPage" component={WebsPage} />
    <Stack.Screen name="DiscoverPage" component={DiscoverPage} />
    <Stack.Screen name="AssetsMvcDetailPage" component={AssetsMvcDetailPage} />
    <Stack.Screen name="AssetsBtcDetailPage" component={AssetsBtcDetailPage} />
    <Stack.Screen name="SendSelectAssertPage" component={SendSelectAssertPage} />
    <Stack.Screen name="PasswordPage" component={PasswordPage} />
    <Stack.Screen name="SendSpacePage" component={SendSpacePage} />
    <Stack.Screen name="SendBtcPage" component={SendBtcPage} />
    <Stack.Screen name="SendBtcConfirmPage" component={SendBtcConfirmPage} />
    <Stack.Screen name="SendBtcSuccessPage" component={SendBtcSuccessPage} />
    <Stack.Screen name="SendSpaceSuccessPage" component={SendSpaceSuccessPage} />
    <Stack.Screen name="SetPasswordPage" component={SetPasswordPage} />
    <Stack.Screen name="AssetsMvcFtDetailPage" component={AssetsMvcFtDetailPage} />
    <Stack.Screen name="SendMvcFtPage" component={SendMvcFtPage} />
    <Stack.Screen name="SendSuccessPage" component={SendSuccessPage} />
    <Stack.Screen name="BRC20DetailPage" component={BRC20DetailPage} />
    <Stack.Screen name="TransferBrc20FirstPage" component={TransferBrc20FirstPage} />
    <Stack.Screen name="InscribeFirstPage" component={InscribeFirstPage} />
    <Stack.Screen name="InscribePrePage" component={InscribePrePage} />
    <Stack.Screen name="InscribeTransferPage" component={InscribeTransferPage} />
    <Stack.Screen name="InscribeSuccessPage" component={InscribeSuccessPage} />
    <Stack.Screen name="TransferBrc20Page" component={TransferBrc20Page} />
    <Stack.Screen name="BtcNftDetailPage" component={BtcNftDetailPage} />
    <Stack.Screen name="BtcNftTransferPage" component={BtcNftTransferPage} />
    <Stack.Screen name="BackupPage" component={BackupPage} />
    <Stack.Screen name="SecurityPage" component={SecurityPage} />
    <Stack.Screen name="AboutPage" component={AboutPage} />
    <Stack.Screen name="ColdWalletPage" component={ColdWalletPage} />
    <Stack.Screen name="SendColdBtcPrePage" component={SendColdBtcPrePage} />
    <Stack.Screen name="ScanPage" component={ScanPage} />
    <Stack.Screen name="Mrc20DetailPage" component={Mrc20DetailPage} />
    <Stack.Screen name="SendMrc20Page" component={SendMrc20Page} />
    <Stack.Screen name="SendSuccessNormalPage" component={SendSuccessNormalPage} />
    <Stack.Screen name="MetaIDPinsPage" component={MetaIDPinsPage} />
    <Stack.Screen name="MetaIDPage" component={MetaIDPage} />
    <Stack.Screen name="MetaIDPinsDetails" component={MetaIDPinsDetails} />
    <Stack.Screen name="PinNftTransferPage" component={PinNftTransferPage} />
    <Stack.Screen name="ImportWalletNetWorkPage" component={ImportWalletNetWorkPage} />
    <Stack.Screen name="ImportWalletFirstPage" component={ImportWalletFirstPage} />
    <Stack.Screen name="ImportWalletSelectAddressPage" component={ImportWalletSelectAddressPage} />
    <Stack.Screen name="ImportWalletMvcPathNextPage" component={ImportWalletMvcPathNextPage} />
    <Stack.Screen name="ImportWalletNetPage" component={ImportWalletNetPage} />
    <Stack.Screen name="ReceiveColdPage" component={ReceiveColdPage} />
    <Stack.Screen name="ColdAssetWalletPage" component={ColdAssetWalletPage} />
    <Stack.Screen name="CongratulationsColdPage" component={CongratulationsColdPage} />
    <Stack.Screen name="BtcMRC721Page" component={BtcMRC721Page} />
    <Stack.Screen name="BtcMRC721RePage" component={BtcMRC721RePage} />
    <Stack.Screen name="BtcNftMRC721DetailPage" component={BtcNftMRC721DetailPage} />
    <Stack.Screen name="Mrc721NftListPage" component={Mrc721NftListPage} />
    <Stack.Screen name="ShowBuzzPage" component={ShowBuzzPage} />
    <Stack.Screen name="DappsPage" component={DappsPage} />
    <Stack.Screen name="SmallPayAutoPage" component={SmallPayAutoPage} />
    <Stack.Screen name="HomePage" component={HomePage} />

    {/* chat */}
    <Stack.Screen name="ChatHomePage" component={ChatHomePage} />
    <Stack.Screen name="ChatSettingsPage" component={ChatSettingsPage} />
    <Stack.Screen name="PeoInfoPage" component={PeoInfoPage} />
    <Stack.Screen name="PeoEditInfoPage" component={PeoEditInfoPage} />
    <Stack.Screen name="LocalChatSettingsPage" component={LocalChatSettingsPage} />
    <Stack.Screen name="ChatWalletPage" component={ChatWalletPage} />
    <Stack.Screen name="ChatAboutPage" component={ChatAboutPage} />
    <Stack.Screen name="ChatWalletSettingsPage" component={ChatWalletSettingsPage} />
    <Stack.Screen name="WebViewPage" component={WebViewPage} />
    <Stack.Screen name="PushPage" component={PushPage} />
    <Stack.Screen name="SwitchAccountPage" component={SwitchAccountPage} />
    <Stack.Screen name="DappWebsPage" component={DappWebsPage} />
    {/* <Stack.Screen name="PushPage " component={PushPage} /> */}
  </Stack.Navigator>
);

const TabNavigator = () => {
  const { walletMode, updateWalletMode } = useData();
  const { isShowPay, updateIsShowPay } = useData();
  const { isBackUp, updateSetIsBackUp } = useData();

  console.log('walletMode-----', walletMode);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          if (route.name === 'ChatHomePage' || route.name === 'HomeColdPage') {
            icon = focused ? (
              <Image
                source={require('@image/home_select_tab_icon.png')}
                style={metaStyles.tabImage}
              />
            ) : (
              <Image
                source={require('../../image/home_normal_tab_icon.png')}
                style={metaStyles.tabImage}
              />
            );
          } else if (route.name === 'DappsPage') {
            icon = focused ? (
              <Image
                source={require('../../image/me_plaza_select_tab.png')}
                style={metaStyles.tabImage}
              />
            ) : (
              <Image
                source={require('../../image/me_plaza_normal_tab.png')}
                style={metaStyles.tabImage}
              />
            );
          }
          // else if (route.name === "PlazaPage") {
          //   icon = focused ? (
          //     <Image
          //       source={require("../../image/me_plaza_select_tab.png")}
          //       style={metaStyles.tabImage}
          //     />
          //   ) : (
          //     <Image
          //       source={require("../../image/me_plaza_normal_tab.png")}
          //       style={metaStyles.tabImage}
          //     />
          //   );
          // }
          else {
            icon = focused ? (
              <View style={{ position: 'relative' }}>
                <Image
                  source={require('@image/settings_select_tab_icon.png')}
                  style={metaStyles.tabImage}
                />
                {!isBackUp && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -6, // 视需求微调
                      right: -4, // 视需求微调
                      width: 10,
                      height: 10,
                      backgroundColor: 'red',
                      borderRadius: 5, // 圆形
                      borderWidth: 1, // 可选：给红点加个白边
                      borderColor: '#fff',
                    }}
                  />
                )}
              </View>
            ) : (
              <View style={{ position: 'relative' }}>
                <Image
                  source={require('@image/settings_normal_tab_icon.png')}
                  style={metaStyles.tabImage}
                />

                {!isBackUp && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -6, // 视需求微调
                      right: -4, // 视需求微调
                      width: 10,
                      height: 10,
                      backgroundColor: 'red',
                      borderRadius: 5, // 圆形
                      borderWidth: 1, // 可选：给红点加个白边
                      borderColor: '#fff',
                    }}
                  />
                )}
              </View>
            );
          }
          return icon;
        },
      })}
    >
      <Tab.Screen headerShown={false} name="ChatHomePage" component={ChatHomePage} />
      {/* <Tab.Screen headerShown={false} name="HomePage" component={HomePage} /> */}
      {/* <Tab.Screen name="DappsPage" component={DappsPage} /> */}
      <Tab.Screen name="ChatSettingsPage" component={ChatSettingsPage} />
    </Tab.Navigator>
  );
};

const TabNavigatorByWallet = () => {
  const { walletMode, updateWalletMode } = useData();
  const { isShowPay, updateIsShowPay } = useData();
  const { isBackUp, updateSetIsBackUp } = useData();

  console.log('walletMode-----', walletMode);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          if (route.name === 'ChatWalletPage') {
            icon = focused ? (
              <Image
                source={require('@image/me_index_select_tab.png')}
                style={metaStyles.tabImage}
              />
            ) : (
              <Image
                source={require('../../image/me_index_normal_tab.png')}
                style={metaStyles.tabImage}
              />
            );
          } else if (route.name === 'DappsPage') {
            icon = focused ? (
              <Image
                source={require('../../image/me_plaza_select_tab.png')}
                style={metaStyles.tabImage}
              />
            ) : (
              <Image
                source={require('../../image/me_plaza_normal_tab.png')}
                style={metaStyles.tabImage}
              />
            );
          }
          // else if (route.name === "PlazaPage") {
          //   icon = focused ? (
          //     <Image
          //       source={require("../../image/me_plaza_select_tab.png")}
          //       style={metaStyles.tabImage}
          //     />
          //   ) : (
          //     <Image
          //       source={require("../../image/me_plaza_normal_tab.png")}
          //       style={metaStyles.tabImage}
          //     />
          //   );
          // }
          else {
            icon = focused ? (
              <View>
                <Image
                  source={require('@image/settings_select_tab_icon.png')}
                  style={metaStyles.tabImage}
                />
                {!isBackUp && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -6, // 视需求微调
                      right: -4, // 视需求微调
                      width: 10,
                      height: 10,
                      backgroundColor: 'red',
                      borderRadius: 5, // 圆形
                      borderWidth: 1, // 可选：给红点加个白边
                      borderColor: '#fff',
                    }}
                  />
                )}
              </View>
            ) : (
              <View>
                <Image
                  source={require('@image/settings_normal_tab_icon.png')}
                  style={metaStyles.tabImage}
                />
                {!isBackUp && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -6, // 视需求微调
                      right: -4, // 视需求微调
                      width: 10,
                      height: 10,
                      backgroundColor: 'red',
                      borderRadius: 5, // 圆形
                      borderWidth: 1, // 可选：给红点加个白边
                      borderColor: '#fff',
                    }}
                  />
                )}
              </View>
            );
          }
          return icon;
        },
      })}
    >
      <Tab.Screen headerShown={false} name="ChatWalletPage" component={ChatWalletPage} />
      <Tab.Screen name="ChatWalletSettingsPage" component={ChatWalletSettingsPage} />
    </Tab.Navigator>
  );
};
