import { View, Text, TouchableWithoutFeedback, Image } from "react-native";
import React, { useState } from "react";
import {
  GradientAvatar,
  RoundSimButton,
  TitleBar,
} from "../../constant/Widget";
import { metaStyles } from "../../constant/Constants";
import { useData } from "../../hooks/MyProvider";
import {
  network_all,
  network_btc,
  network_key,
  network_mvc,
  createStorage,
} from "../../utils/AsyncStorageUtil";
import { eventBus, refreshHomeLoadingEvent } from "../../utils/EventBus";
import { navigate } from "../../base/NavigationService";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getStorageCurrentWallet,
  setCurrentStorageWallet,
} from "@/utils/WalletUtils";

const storage = createStorage();

export default function ImportWalletSelectAddressPage() {
  const { netWork, updateNetWork } = useData();
  const [selectMvcNetWork, setSelectMvcNetWork] = useState(true);
  // const [selectBtcNetWork, setSelectBtcNetWork] = useState(true);
  const { mvcPath, updateMvcPath } = useData();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <TitleBar title="Select Mvc Address Type" />

        <View style={{ marginLeft: 20, marginTop: 20 }}>
          <Text style={metaStyles.smallDefaultText}> Default</Text>
        </View>
        <View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 20,
              marginVertical: 10,
              backgroundColor: "#F5F7F9",
              borderRadius: 10,
              padding: 10,
            },
          ]}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              setSelectMvcNetWork(true);
              // changeNetwork(network_btc);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                marginVertical: 10,
                alignItems: "center",
                marginHorizontal: 10,
              }}
            >
              <Text style={[metaStyles.smallDefaultText, { width: "80%" }]}>
                The Metalet wallet uses a default address generation strategy.
                The derivation path will be "m/44'/10001'/0'".
              </Text>

              <View style={{ flex: 1 }} />

              {selectMvcNetWork && (
                <Image
                  source={require("../../../image/wallets_select_icon.png")}
                  style={{  width: 15, height: 15 }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        <View style={{ marginLeft: 20, marginTop: 20 }}>
          <Text style={metaStyles.smallDefaultText}> Mvc Custom</Text>
        </View>
        <View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 20,
              marginVertical: 10,
              backgroundColor: "#F5F7F9",
              borderRadius: 10,
              padding: 10,
            },
          ]}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              setSelectMvcNetWork(false);
              // changeNetwork(network_mvc);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                marginVertical: 10,
                alignItems: "center",
                marginHorizontal: 10,
              }}
            >
              <Text style={[metaStyles.smallDefaultText, { width: "80%" }]}>
                Use a custom derivation path for Metalet wallet. Mostly used for
                backward compatibility. Carefully choose this when you're
                importing an older account and make sure you know the derivation
                path.
              </Text>

              <View style={{ flex: 1 }} />

              {selectMvcNetWork == false && (
                <Image
                  source={require("../../../image/wallets_select_icon.png")}
                  style={{ width: 15, height: 15 }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ marginHorizontal: 20, marginBottom: 40 }}>
          <RoundSimButton
            title="Next"
            textColor="#333"
            event={async () => {
              if (selectMvcNetWork == false) {
                updateMvcPath("236")
                const walletBean = await getStorageCurrentWallet();
                await setCurrentStorageWallet(walletBean, parseInt("236"));
              }else{
                updateMvcPath("10001")
                const walletBean = await getStorageCurrentWallet();
                await setCurrentStorageWallet(walletBean, parseInt("10001"));
              }
              navigate("ImportWalletMvcPathNextPage", {
                isDefault: selectMvcNetWork,
              });
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
