import {
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
  TextInput,
  Keyboard,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  GradientAvatar,
  RoundSimButton,
  TitleBar,
} from "../../constant/Widget";
import { metaStyles, semiTransparentGray } from "../../constant/Constants";
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
import { getCurrentMvcWallet } from "@/wallet/wallet";
import {
  getStorageCurrentWallet,
  getWalletNetwork,
  setCurrentStorageWallet,
} from "@/utils/WalletUtils";
import { AddressType, MvcWallet } from "@metalet/utxo-wallet-service";
import { mvc } from "meta-contract";

const storage = createStorage();

export default function ImportWalletMvcPathNextPage({ route }) {
  const { netWork, updateNetWork } = useData();
  const [selectMvcNetWork, setSelectMvcNetWork] = useState(true);
  const [selectBtcNetWork, setSelectBtcNetWork] = useState(true);
  const { mvcPath, updateMvcPath } = useData();

  const [mvcAddress, setMvcAddress] = useState("");
  const [value, setValue] = useState("");

  const { isDefault } = route.params;
  console.log(isDefault);

  useEffect(() => {
    initData();
  }, []);

  async function initData() {
    const address = (await getCurrentMvcWallet()).getAddress();
    console.log("获取的地址是：" + address);

    setMvcAddress(address);
  }

  async function changeNetwork(changeNetwork: string) {
    if (selectBtcNetWork == false && selectMvcNetWork == false) {
      return;
    }

    if (changeNetwork == network_mvc) {
      await storage.set(network_key, network_mvc);
      // await AsyncStorageUtil.setItem(network_key, network_mvc);
    } else if (changeNetwork == network_btc) {
      await storage.set(network_key, network_btc);
      // await AsyncStorageUtil.setItem(network_key, network_btc);
    } else if (changeNetwork == network_all) {
      await storage.set(network_key, network_all);
      // await AsyncStorageUtil.setItem(network_key, network_all);
    }
    // navigate("Tabs");
    updateNetWork(changeNetwork);
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        console.log("click");
        Keyboard.dismiss();
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ flex: 1 }}>
          <TitleBar title="" />
          <View style={{ marginLeft: 20, marginTop: 20 }}>
            <Text
              style={{
                color: "#333333",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              {isDefault ? "Address for MVCs" : "Customize your MVC address"}
            </Text>
          </View>

          {isDefault == false && (
            <View
              style={{
                marginLeft: 20,
                marginTop: 15,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={metaStyles.defaultText}>m/44'/</Text>
              <TextInput
                placeholder="236"
                keyboardType="numeric"
                value={value}
                style={{
                  borderRadius: 5,
                  backgroundColor: semiTransparentGray,
                  fontSize: 14,
                  color: "#333333",
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  marginHorizontal: 5,
                }}
                onChangeText={async (text) => {
                  const numericValue = text.replace(/[^0-9]/g, "");
                  if (numericValue.length > 0) {
                    setValue(numericValue);
                    updateMvcPath(numericValue);
                    const walletBean = await getStorageCurrentWallet();
                    await setCurrentStorageWallet(
                      walletBean,
                      parseInt(numericValue)
                    );
  
                    const network = await getWalletNetwork();

                    const mvcWallet = new MvcWallet({
                      network: network == "mainnet" ? "mainnet" : "testnet",
                      mnemonic: walletBean.mnemonic,
                      addressIndex: walletBean.accountsOptions[0].addressIndex,
                      addressType: AddressType.LegacyMvc,
                      coinType: parseInt(numericValue),
                    });
                    const mvcSetAddress = mvcWallet.getAddress();
                    setMvcAddress(mvcSetAddress);
                    console.log(mvcWallet.getPath());
                    console.log("当前的地址是：", mvcWallet.getAddress());
                  }
                }}
              />
              <Text style={metaStyles.defaultText}>'/0'</Text>
            </View>
          )}
          <View
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: 20,
                marginVertical: 20,
                backgroundColor: "#F5F7F9",
                borderRadius: 10,
                padding: 10,
              },
            ]}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setSelectBtcNetWork(!selectBtcNetWork);
                // changeNetwork(network_btc);
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  marginVertical: 10,
                  alignItems: "center",
                  // marginHorizontal: 20,
                }}
              >
                {/* <Image
                source={require("../../../image/meta_btc_icon.png")}
                style={{ width: 30, height: 30 }}
              /> */}
                <GradientAvatar
                  userStyle={{ width: 30, height: 30 }}
                  isRand={false}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text
                    style={{
                      color: "#333333",
                      fontSize: 12,
                    }}
                  >
                    {mvcAddress}
                  </Text>
                  {/* <Text style={{ marginTop: 10 }}>{}</Text> */}
                </View>

                <View style={{ flex: 1 }} />
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ marginHorizontal: 20, marginBottom: 40 }}>
            <RoundSimButton
              title="Next"
              textColor="#333"
              event={() => {
                navigate("ImportWalletNetWorkPage");
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
