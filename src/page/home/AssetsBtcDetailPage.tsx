import {
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
  FlatList,
  Modal,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CloseView,
  LoadingNoticeModal,
  NoMoreDataView,
  TitleBar,
  ToastView,
} from "../../constant/Widget";
import { goBack, navigate } from "../../base/NavigationService";
import { metaStyles, normalColor, themeColor } from "../../constant/Constants";
import {
  BtcRootRecord,
  MvcActivityRecord,
  TransactionList,
} from "../../types/mvcrecord";
import { fetchBtcActivityRecord } from "../../api/metaletservice";
// import useNetworkManager from "@/hooks/useNetworkManager";
import useNetworkStore from "@/stores/useNetworkStore";
import { useData } from "../../hooks/MyProvider";
import * as Clipboard from "expo-clipboard";
import { formatTime } from "../../utils/MetaFunUiils";
import { AddressType, Chain } from "@metalet/utxo-wallet-service";
import {
  wallet_mode_cold,
  wallet_mode_default,
  wallet_mode_hot,
  wallet_mode_observer,
  walllet_address_type_key,
} from "../../utils/AsyncStorageUtil";
import {
  changeCurrentWalletAddressType,
  getStorageCurrentWallet,
} from "../../utils/WalletUtils";
import useWalletStore from "@/stores/useWalletStore";
import { useTranslation } from "react-i18next";
// import { BtcWallet, MvcWallet } from "@metalet/utxo-wallet-sdk";

export default function AssetsBtcDetailPage({ route }) {
  const { myCoinType } = route.params;
  const [btcActivityList, setBtcActivityList] = useState<TransactionList[]>([]);

  const [noticeContent, setNoticeContent] = useState("Successful");
  const [isShowNotice, setIsShowNotice] = useState(false);
  const { metaletWallet, updateMetaletWallet } = useData();
  const [isShowCopy, setIsShowCopy] = useState(false);
  const [addressType, setAddressType] = useState(AddressType.Legacy);
  const { setCurrentChainWallet } = useWalletStore();
  const { t } = useTranslation();

  const [isShowBtcNotice, setShowBtcNotice] = useState(false);

  //当前btc 地址
  const { btcAddress, updateBtcAddress } = useData();
  console.log("myCoinType", myCoinType);

  useEffect(() => {
    getActivityList(btcAddress);
  }, []);

  async function getActivityList(address: string) {
    // let btcActivityListData: BtcRootRecord = await fetchBtcActivityRecord(
    //   "bc1qxwul4ktslh9zumv8nvp2seyukz0jcmdxzq8kx6"
    // );
    let btcActivityListData: BtcRootRecord =
      await fetchBtcActivityRecord(address);
    console.log("btcActivityListData", btcActivityListData);

    let datalist = btcActivityListData.data.transactionList;

    if (datalist.length == 0) {
      let record: TransactionList = {
        txId: "1",
        methodId: "",
        blockHash: "00",
        height: "00",
        transactionTime: "00",
        from: "00,00",
        to: "00,00,00",
        amount: "-0.02996359",
        transactionSymbol: "BTC",
        txFee: "0.00003107",
      };
      setBtcActivityList([...datalist, record]);
    } else {
      console.log("datalist", datalist);
      setBtcActivityList([...datalist]);
    }

    const currentWallet = await getStorageCurrentWallet();
    const addressType = currentWallet.addressType;
    console.log("addressType11111", addressType);

    setAddressType(addressType);
  }

  function ShowNotice(notice) {
    Clipboard.setString(notice);
    setNoticeContent("Copy Successful");
    setIsShowNotice(true);
    setTimeout(() => {
      setIsShowNotice(false);
    }, 800);
  }

  async function changAddressType(addressTpye) {
    setIsShowCopy(false);
    switch (addressTpye) {
      case AddressType.Legacy:
        metaletWallet.currentBtcWallet = metaletWallet.btcLegacyWallet;
        setAddressType(AddressType.Legacy);
        changeCurrentWalletAddressType(AddressType.Legacy);
        break;
      case AddressType.NestedSegwit:
        metaletWallet.currentBtcWallet = metaletWallet.btcNestedSegwitWallet;
        setAddressType(AddressType.NestedSegwit);
        changeCurrentWalletAddressType(AddressType.NestedSegwit);
        break;
      case AddressType.NativeSegwit:
        metaletWallet.currentBtcWallet = metaletWallet.btcNativeSegwitWallet;
        setAddressType(AddressType.NativeSegwit);
        changeCurrentWalletAddressType(AddressType.NativeSegwit);
        break;
      case AddressType.Taproot:
        metaletWallet.currentBtcWallet = metaletWallet.btcTaprootWallet;
        setAddressType(AddressType.Taproot);
        changeCurrentWalletAddressType(AddressType.Taproot);
        break;
      case AddressType.SameAsMvc:
        metaletWallet.currentBtcWallet = metaletWallet.btcSameAsWallet;
        setAddressType(AddressType.SameAsMvc);
        changeCurrentWalletAddressType(AddressType.SameAsMvc);
        break;
    }

    updateBtcAddress(metaletWallet.currentBtcWallet.getAddress());
    console.log(
      "currentBtcWallet",
      metaletWallet.currentBtcWallet.getAddress()
    );

    getActivityList(metaletWallet.currentBtcWallet.getAddress());

    setCurrentChainWallet(Chain.BTC, metaletWallet.currentBtcWallet);
    // getActivityList();
  }

  const ListItem = ({ index, item }) => {
    let isIncome;

    let showAmount;
    showAmount = item.amount;

    if (item.amount.startsWith("-")) {
      isIncome = false;
    } else {
      isIncome = true;
    }

    return (
      <View>
        {item?.txId !== "1" ? (
          <View
            style={{
              width: "100%",
              marginTop: 20,
              borderRadius: 10,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            {isIncome ? (
              <Image
                source={require("../../../image/assert_btcrecord_receive_icon.png")}
                style={{ width: 35, height: 35 }}
              />
            ) : (
              <Image
                source={require("../../../image/assert_btcrecord_send_icon.png")}
                style={{ width: 35, height: 35 }}
              />
            )}

            <View style={{ marginLeft: 10 }}>
              <Text
                style={{ fontSize: 16, color: "#000000", marginBottom: 10 }}
              >
                {isIncome ? t("h_receive") : t("h_send")}
              </Text>
              <Text style={metaStyles.grayTextSmall66}>
                {formatTime(parseInt(item.transactionTime))}
              </Text>
            </View>

            <View style={{ flex: 1 }} />
            <View style={{ marginLeft: 10, marginRight: 10 }}>
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{
                  fontSize: 16,
                  color: isIncome ? "green" : "red",
                  marginBottom: 10,
                  textAlign: "right",
                }}
              >
                {isIncome ? "+" + showAmount : showAmount}
              </Text>

              <TouchableWithoutFeedback
                onPress={() => {
                  ShowNotice(item.txId);
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={[
                      metaStyles.grayTextSmall66,
                      { textAlign: "right", width: 100 },
                    ]}
                  >
                    {item.txId}
                  </Text>

                  <Image
                    source={require("../../../image/meta_copy_icon.png")}
                    style={{ width: 15, height: 15, marginLeft: 5 }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        ) : (
          <View
            style={{
              // flex:1,
              justifyContent: "center",
              alignItems: "center",
              // width: "100%",
              // height: "100%",
              // opacity: 0,
            }}
          >
            <Image
              source={require("../../../image/assert_record_nodata_icon.png")}
              style={{ width: 38, height: 53, marginTop: 100 }}
            />

            <Text style={[metaStyles.grayTextdefault66, { marginTop: 20 }]}>
              {t("o_nodata")}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const ListHeader = () => {
    return (
      <View
        style={{
          marginTop: 40,
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Image
          source={require("../../../image/receive_btc_icon.png")}
          style={{ width: 70, height: 70 }}
        />

        <Text
          style={{
            color: "#333",
            textAlign: "center",
            marginTop: 20,
            fontSize: 25,
            fontWeight: "bold",
          }}
        >
          {/* {(metaletWallet.currentBtcBalance / 100000000).toFixed(8)} SPACE */}
          {metaletWallet.currentBtcBalance} BTC
        </Text>

        <Text
          style={{
            color: "#666",
            textAlign: "center",
            lineHeight: 20,
            marginTop: 10,
            fontSize: 18,
          }}
        >
          ${metaletWallet.currentBtcAssert}
        </Text>

        <View
          style={{
            marginTop: 13,
            padding: 13,
            backgroundColor: "#F8F8FA",
            borderRadius: 23,
            flexDirection: "row",
            alignItems: "center",
            alignContent: "center",
            justifyContent: "space-around",
            marginHorizontal: 13,
            alignSelf: "stretch", //
          }}
        >
          <Text style={{ fontSize: 13, color: "#999999" }}>Avail</Text>
          <Text
            style={{
              fontSize: 13,
              color: "#303133",
              fontWeight: "bold",
              marginLeft: 3,
            }}
          >
            {/* {btcDetailBalance.safeBalance == 0
                    ? metaletWallet.currentBtcSafeBalance
                    : btcDetailBalance.safeBalance} */}
            {metaletWallet.currentBtcSafeBalance}
          </Text>
          <Text style={{ fontSize: 13, color: "#999999", marginLeft: 3 }}>
            BTC
          </Text>

          <Text style={{ fontSize: 13, color: "#999999" }}> | </Text>

          <Text style={{ fontSize: 13, color: "#999999" }}>N/A</Text>
          <Text
            style={{
              fontSize: 13,
              color: "#303133",
              fontWeight: "bold",
              marginLeft: 3,
            }}
          >
            {/* {(btcDetailBalance.balance-btcDetailBalance.safeBalance)==0?metaletWallet.currentBtcNa:(btcDetailBalance.balance-btcDetailBalance.safeBalance).toFixed(8)} */}
            {metaletWallet.currentBtcNa}
          </Text>
          <Text style={{ fontSize: 13, color: "#999999", marginLeft: 3 }}>
            BTC
          </Text>

          <TouchableWithoutFeedback
            onPress={() => {
              setShowBtcNotice(true);
            }}
          >
            <Image
              source={require("../../../image/btc_notice.png")}
              style={{ width: 12, height: 12, marginLeft: 5 }}
            />
          </TouchableWithoutFeedback>
        </View>

        <View
          style={{
            marginTop: 40,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              if (walletMode == wallet_mode_observer) {
                ToastView({ text: "come soon", type: "info" });
                return;
              }
              navigate("SendBtcPage");
            }}
          >
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#F3F3FF",
                borderRadius: 30,
                paddingVertical: 20,
                paddingHorizontal: 30,
                alignItems: "center",
                justifyContent: "center",
                width: "40%",
              }}
            >
              <Image
                source={require("../../../image/assert_send_icon.png")}
                style={{ width: 15, height: 15 }}
              />

              <Text
                style={{
                  color: normalColor,
                  textAlign: "center",
                  marginLeft: 10,
                  lineHeight: 20,
                  fontSize: 18,
                }}
              >
                {t("h_send")}
              </Text>
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback
            onPress={() => {
              navigate("ReceivePage", { myCoinType: "BTC" });
            }}
          >
            <View
              style={{
                flexDirection: "row",
                backgroundColor: themeColor,
                borderRadius: 30,
                paddingVertical: 20,
                paddingHorizontal: 30,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 20,
                width: "40%",
              }}
            >
              <Image
                source={require("../../../image/assert_receive_icon.png")}
                style={{ width: 15, height: 15 }}
              />

              <Text
                style={{
                  color: normalColor,
                  textAlign: "center",
                  marginLeft: 10,
                  lineHeight: 20,
                  fontSize: 18,
                }}
              >
                {t("h_receive")}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  };

  const listHeaderComponent = <View>{ListHeader()}</View>;

  //   const listHeaderComponent = mvcActivityList.length === 0 ? ListHeader() : null;

  console.log("当前地址类型： " + addressType);
  const { walletMode, updateWalletMode } = useData();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 操作提示 */}
      <LoadingNoticeModal title={noticeContent} isShow={isShowNotice} />
      <Modal visible={isShowBtcNotice} transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              marginHorizontal: 30,
              padding: 23,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={metaStyles.defaultText}>{t("b_detail")}</Text>

              <View style={{ flex: 1 }} />

              <CloseView
                event={() => {
                  setShowBtcNotice(false);
                }}
              />
            </View>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <Image
                source={require("../../../image/btc_notice.png")}
                style={{ width: 12, height: 12, marginTop: 3 }}
              />
              <Text style={{ fontSize: 12, color: "#676767", marginLeft: 5 }}>
                {t("b_btc_notice")}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 切换address */}
      {(walletMode == wallet_mode_hot || walletMode == undefined) && (
        <Modal transparent={true} visible={isShowCopy}>
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopRightRadius: 10,
                borderTopLeftRadius: 10,
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 20,
                paddingBottom: 30,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    textAlign: "center",
                    flex: 1,
                  }}
                >
                  {t("o_select_default_address")}
                </Text>

                <TouchableWithoutFeedback
                  onPress={() => {
                    setIsShowCopy(false);
                  }}
                >
                  <Image
                    source={require("../../../image/metalet_close_big_icon.png")}
                    style={{ width: 15, height: 15, padding: 5 }}
                  />
                </TouchableWithoutFeedback>
              </View>

              {/* btc Legacy */}
              <TouchableWithoutFeedback
                onPress={() => {
                  changAddressType(AddressType.Legacy);
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 20,
                    marginHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../image/logo_btc.png")}
                    style={{ width: 35, height: 35, marginLeft: 20 }}
                  />

                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={{ fontSize: 15, width: "70%" }}
                      >
                        {metaletWallet.btcLegacyWallet.getAddress()}
                      </Text>
                    </View>
                    <Text
                      style={{ marginTop: 5, fontSize: 13, color: "#999" }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Legacy
                    </Text>
                  </View>

                  {addressType == AddressType.Legacy ? (
                    <Image
                      source={require("../../../image/wallets_select_icon.png")}
                      style={{ width: 20, height: 20, marginRight: 10 }}
                    />
                  ) : null}
                </View>
              </TouchableWithoutFeedback>

              {/* btc nested segwit */}
              <TouchableWithoutFeedback
                onPress={() => {
                  changAddressType(AddressType.NestedSegwit);
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 20,
                    marginHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../image/logo_btc.png")}
                    style={{ width: 35, height: 35, marginLeft: 20 }}
                  />

                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={{ fontSize: 15, width: "70%" }}
                      >
                        {metaletWallet.btcNestedSegwitWallet.getAddress()}
                      </Text>
                    </View>
                    <Text
                      style={{ marginTop: 5, fontSize: 13, color: "#999" }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Nested Segwit
                    </Text>
                  </View>

                  {addressType == AddressType.NestedSegwit ? (
                    <Image
                      source={require("../../../image/wallets_select_icon.png")}
                      style={{ width: 20, height: 20, marginRight: 10 }}
                    />
                  ) : null}
                </View>
              </TouchableWithoutFeedback>

              {/* native segwit */}
              <TouchableWithoutFeedback
                onPress={() => {
                  changAddressType(AddressType.NativeSegwit);
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 20,
                    marginHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../image/logo_btc.png")}
                    style={{ width: 35, height: 35, marginLeft: 20 }}
                  />

                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={{ fontSize: 15, width: "70%" }}
                      >
                        {metaletWallet.btcNativeSegwitWallet.getAddress()}
                      </Text>
                    </View>
                    <Text
                      style={{ marginTop: 5, fontSize: 13, color: "#999" }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Native Segwit
                    </Text>
                  </View>

                  {addressType == AddressType.NativeSegwit ? (
                    <Image
                      source={require("../../../image/wallets_select_icon.png")}
                      style={{ width: 20, height: 20, marginRight: 10 }}
                    />
                  ) : null}
                </View>
              </TouchableWithoutFeedback>

              {/* taproot */}
              <TouchableWithoutFeedback
                onPress={() => {
                  changAddressType(AddressType.Taproot);
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 20,
                    marginHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../image/logo_btc.png")}
                    style={{ width: 35, height: 35, marginLeft: 20 }}
                  />

                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={{ fontSize: 15, width: "70%" }}
                      >
                        {metaletWallet.btcTaprootWallet.getAddress()}
                      </Text>
                    </View>
                    <Text
                      style={{ marginTop: 5, fontSize: 13, color: "#999" }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Taproot
                    </Text>
                  </View>
                  {addressType == AddressType.Taproot ? (
                    <Image
                      source={require("../../../image/wallets_select_icon.png")}
                      style={{ width: 20, height: 20, marginRight: 10 }}
                    />
                  ) : null}
                </View>
              </TouchableWithoutFeedback>
              {/* Same as Mvc */}
              <TouchableWithoutFeedback
                onPress={() => {
                  changAddressType(AddressType.SameAsMvc);
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 20,
                    marginHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../image/logo_btc.png")}
                    style={{ width: 35, height: 35, marginLeft: 20 }}
                  />

                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={{ fontSize: 15, width: "70%" }}
                      >
                        {metaletWallet.btcSameAsWallet.getAddress()}
                      </Text>
                    </View>
                    <Text
                      style={{ marginTop: 5, fontSize: 13, color: "#999" }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Default
                    </Text>
                  </View>
                  {addressType == AddressType.SameAsMvc ? (
                    <Image
                      source={require("../../../image/wallets_select_icon.png")}
                      style={{ width: 20, height: 20, marginRight: 10 }}
                    />
                  ) : null}
                </View>
              </TouchableWithoutFeedback>
              {/* over */}
            </View>
          </View>
        </Modal>
      )}

      <View style={{ flex: 1 }}>
        {/* 头部 */}
        <View
          style={{
            flexDirection: "row",
            marginLeft: 20,
            marginTop: 5,
            height: 44,
            alignItems: "center",
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              goBack();
            }}
          >
            <Image
              source={require("../../../image/meta_back_icon.png")}
              style={{ width: 22, height: 22 }}
            />
          </TouchableWithoutFeedback>
          <Text
            style={[
              {
                textAlign: "center",
                marginRight: 40,
                marginLeft: 15,
                flex: 1,
                color: "#333333",
                fontSize: 18,
                fontWeight: "bold",
              },
            ]}
          ></Text>

          {(walletMode == wallet_mode_hot || walletMode == undefined) && (
            <TouchableWithoutFeedback
              onPress={() => {
                setIsShowCopy(true);
              }}
            >
              {myCoinType == "BTC" && (
                <Image
                  source={require("../../../image/assert_adress_type_icon.png")}
                  style={{ width: 22, height: 22 }}
                />
              )}
            </TouchableWithoutFeedback>
          )}
          <Text style={{ marginRight: 20, color: "#333", fontSize: 16 }}>
            {""}
          </Text>
        </View>

        {/* <ListHeader /> */}
        {/* 尾部 */}

        <FlatList
          data={btcActivityList}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={ListItem}
          ListHeaderComponent={listHeaderComponent}
        />
      </View>
    </SafeAreaView>
  );
}




// export const smallPayTransactions = async (
//   toPayTransactions: {
//     txComposer: string;
//     message?: string;
//   }[],
//   hasMetaid: boolean = false,
//   feeb?: number,
//   autoPaymentAmount: number = 0,
//   options?: { password: string }
// ) => {
//   // const network = await getNetwork()
//   // const password = options?.password || (await getPassword())
//   // const activeWallet = await getActiveWalletOnlyAccount()
//   // const wallet = await getCurrentWallet(Chain.MVC, options)
//   // const address = wallet.getAddress()

//   const network = await getNetwork();
//   const wallet = await getCurrentWallet(Chain.MVC);
//   const activeWallet = await getActiveWalletOnlyAccount();
//   const address = wallet.getAddress();

//   if (!feeb) {
//     feeb = await getDefaultMVCTRate();
//   }
//   let usableUtxos = ((await fetchUtxos(Chain.MVC, address)) as MvcUtxo[]).map(
//     (u) => {
//       return {
//         txId: u.txid,
//         outputIndex: u.outIndex,
//         satoshis: u.value,
//         address,
//         height: u.height,
//       };
//     }
//   );

//   // find out if transactions other than the first one are dependent on previous ones
//   // if so, we need to sign them in order, and sequentially update the prevTxId of the later ones
//   // so that the signature of the previous one can be calculated correctly

//   // first we gather all txids using a map for future mutations
//   const txids = new Map<string, string>();
//   toPayTransactions.forEach(({ txComposer: txComposerSerialized }) => {
//     const txid = TxComposer.deserialize(txComposerSerialized).getTxId();
//     txids.set(txid, txid);
//   });

//   // we finish the transaction by finding the appropriate utxo and calculating the change
//   const payedTransactions = [];
//   for (let i = 0; i < toPayTransactions.length; i++) {
//     const toPayTransaction = toPayTransactions[i];
//     // record current txid
//     const currentTxid = TxComposer.deserialize(
//       toPayTransaction.txComposer
//     ).getTxId();

//     const txComposer = TxComposer.deserialize(toPayTransaction.txComposer);
//     const tx = txComposer.tx;

//     // make sure that every input has an output
//     const inputs = tx.inputs;
//     const existingInputsLength = tx.inputs.length;
//     for (let i = 0; i < inputs.length; i++) {
//       if (!inputs[i].output) {
//         throw new Error(
//           "The output of every input of the transaction must be provided"
//         );
//       }
//     }

//     // update metaid metadata
//     if (hasMetaid) {
//       const { messages: metaIdMessages, outputIndex } =
//         await parseLocalTransaction(tx);

//       if (outputIndex !== null) {
//         let replaceFound = false;
//         // find out if any of the messages contains the wrong txid
//         // how to find out the wrong txid?
//         // it's the keys of txids Map
//         const prevTxids = Array.from(txids.keys());

//         // we use a nested loops here to find out the wrong txid
//         for (let i = 0; i < metaIdMessages.length; i++) {
//           for (let j = 0; j < prevTxids.length; j++) {
//             if (typeof metaIdMessages[i] !== "string") continue;

//             if (metaIdMessages[i].includes(prevTxids[j])) {
//               replaceFound = true;
//               metaIdMessages[i] = (metaIdMessages[i] as string).replace(
//                 prevTxids[j],
//                 txids.get(prevTxids[j])!
//               );
//             }
//           }
//         }

//         if (replaceFound) {
//           // update the OP_RETURN
//           const opReturnOutput = new mvc.Transaction.Output({
//             script: mvc.Script.buildSafeDataOut(metaIdMessages),
//             satoshis: 0,
//           });

//           // update the OP_RETURN output in tx
//           tx.outputs[outputIndex] = opReturnOutput;
//         }
//       }
//     }

//     const addressObj = new mvc.Address(address, network);
//     // find out the total amount of the transaction (total output minus total input)
//     const totalOutput = tx.outputs.reduce(
//       (acc, output) => acc + output.satoshis,
//       0
//     );
//     const totalInput = tx.inputs.reduce(
//       (acc, input) => acc + input.output!.satoshis,
//       0
//     );
//     const currentSize = tx.toBuffer().length;
//     const currentFee = feeb * currentSize;
//     const difference = totalOutput - totalInput + currentFee;

//     if (autoPaymentAmount !== 0 && difference > autoPaymentAmount) {
//       throw new Error(
//         `The fee is too high: ${difference}, it should be less than ${autoPaymentAmount}`
//       );
//     }

//     const pickedUtxos = pickUtxo(usableUtxos, difference, feeb);

//     // append inputs
//     for (let i = 0; i < pickedUtxos.length; i++) {
//       const utxo = pickedUtxos[i];
//       txComposer.appendP2PKHInput({
//         address: addressObj,
//         txId: utxo.txId,
//         outputIndex: utxo.outputIndex,
//         satoshis: utxo.satoshis,
//       });

//       // remove it from usableUtxos
//       usableUtxos = usableUtxos.filter((u) => {
//         return u.txId !== utxo.txId || u.outputIndex !== utxo.outputIndex;
//       });
//     }

//     const changeIndex = txComposer.appendChangeOutput(addressObj, feeb);
//     const changeOutput = txComposer.getOutput(changeIndex);

//     // sign
//     // const mneObj = mvc.Mnemonic.fromString(
//     //   decrypt(activeWallet.mnemonic, password)
//     // );
//     const mneObj = mvc.Mnemonic.fromString(activeWallet.mnemonic);

//     const hdpk = mneObj.toHDPrivateKey("", network);

//     const rootPath = await getMvcRootPath();
//     const basePrivateKey = hdpk.deriveChild(rootPath);
//     // const rootPrivateKey = hdpk.deriveChild(`${rootPath}/0/0`).privateKey
//     const rootPrivateKey = mvc.PrivateKey.fromWIF(wallet.getPrivateKey());

//     // we have to find out the private key of existing inputs
//     const toUsePrivateKeys = new Map<number, mvc.PrivateKey>();
//     for (let i = 0; i < existingInputsLength; i++) {
//       const input = txComposer.getInput(i);
//       // gotta change the prevTxId of the input to the correct one, if there's some kind of dependency to previous txs
//       const prevTxId = input.prevTxId.toString("hex");
//       if (txids.has(prevTxId)) {
//         input.prevTxId = Buffer.from(txids.get(prevTxId)!, "hex");
//       }

//       // find out the path corresponding to this input's prev output's address
//       const inputAddress = mvc.Address.fromString(
//         input.output!.script.toAddress().toString(),
//         network === "regtest" ? "testnet" : network
//       ).toString();
//       let deriver = 0;
//       let toUsePrivateKey: mvc.PrivateKey | undefined = undefined;
//       while (deriver < DERIVE_MAX_DEPTH) {
//         const childPk = basePrivateKey.deriveChild(0).deriveChild(deriver);
//         const childAddress = childPk.publicKey
//           .toAddress(network === "regtest" ? "testnet" : network)
//           .toString();

//         if (childAddress === inputAddress.toString()) {
//           toUsePrivateKey = childPk.privateKey;
//           break;
//         }

//         deriver++;
//       }

//       if (!toUsePrivateKey) {
//         throw new Error(`Cannot find the private key of index #${i} input`);
//       }

//       // record the private key
//       toUsePrivateKeys.set(i, toUsePrivateKey);
//     }

//     // sign the existing inputs
//     toUsePrivateKeys.forEach((privateKey, index) => {
//       txComposer.unlockP2PKHInput(privateKey, index);
//     });

//     // then we use root private key to sign the new inputs (those we just added to pay)
//     pickedUtxos.forEach((v, index) => {
//       txComposer.unlockP2PKHInput(rootPrivateKey, index + existingInputsLength);
//     });

//     // change txids map to reflect the new txid
//     const txid = txComposer.getTxId();
//     txids.set(currentTxid, txid);

//     // return the payed transactions
//     payedTransactions.push(txComposer.serialize());

//     // add changeOutput to usableUtxos
//     if (changeIndex >= 0) {
//       usableUtxos.push({
//         txId: txComposer.getTxId(),
//         outputIndex: changeIndex,
//         satoshis: changeOutput.satoshis,
//         address,
//         height: -1,
//       });
//     }
//   }

//   return payedTransactions;
// };
