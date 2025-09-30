import {
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  LoadingNoticeModal,
  NoMoreDataView,
  TitleBar,
  ToastView,
} from "../../constant/Widget";
import { goBack, navigate } from "../../base/NavigationService";
import { metaStyles, normalColor, themeColor } from "../../constant/Constants";
import { MvcActivityRecord } from "../../types/mvcrecord";
import { fetchMvcActivityComfird } from "../../api/metaletservice";
import { useData } from "../../hooks/MyProvider";
import * as Clipboard from "expo-clipboard";
import { formatTime } from "../../utils/MetaFunUiils";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { wallet_mode_observer } from "@/utils/AsyncStorageUtil";

export default function AssetsMvcDetailPage({ route }) {
  const { myCoinType } = route.params;
  const [mvcActivityList, setMvcActivityList] = useState<MvcActivityRecord[]>(
    []
  );
  const { mvcAddress, updateMvcAddress } = useData();
  const [noticeContent, setNoticeContent] = useState("Successful");
  const [isShowNotice, setIsShowNotice] = useState(false);
  const { metaletWallet, updateMetaletWallet } = useData();
  const { t } = useTranslation();
  const { walletMode, updateWalletMode } = useData();

  useEffect(() => {
    getActivityList();
  }, []);

  async function getActivityList() {
    let mvcActivityListData = await fetchMvcActivityComfird(mvcAddress, true);

    if (mvcActivityListData.length == 0) {
      console.log("mvcActivityListData.length == 0");

      let record: MvcActivityRecord = {
        flag: "1",
        address: "1",
        time: 1712334223000,
        height: 1,
        income: 1,
        outcome: 1,
        txid: "",
      };
      setMvcActivityList([...mvcActivityListData, record]);
    } else {
      setMvcActivityList([...mvcActivityListData]);
    }
  }

  function ShowNotice(notice) {
    Clipboard.setString(notice);
    setNoticeContent("Copy Successful");
    setIsShowNotice(true);
    setTimeout(() => {
      setIsShowNotice(false);
    }, 800);
  }

  const ListItem = ({ index, item }) => {
    let isIncome;
    let recordMoney;
    let showAmount;
    recordMoney = item.income - item.outcome;
    showAmount = (recordMoney / 100000000).toFixed(8);

    if (recordMoney > 0) {
      isIncome = true;
    } else {
      isIncome = false;
    }

    return (
      <View>
        {item.address != "1" ? (
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
                source={require("../../../image/assert_mvcrecord_receive_icon.png")}
                style={{ width: 35, height: 35 }}
              />
            ) : (
              <Image
                source={require("../../../image/assert_mvcrecord_send_icon.png")}
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
                {/* {formatTime(item.time)} */}
                {item.time <= 0 ? "--" : formatTime(item.time * 1000)}
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
                  ShowNotice(item.txid);
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
                    {item.txid}
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
              justifyContent: "center",
              alignItems: "center",
              // width: "100%",
              // height: "100%",
              // opacity: isShow?1:0,
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
          source={require("../../../image/receive_mvc_icon.png")}
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
          {metaletWallet.currentMvcBalance} SPACE
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
          ${metaletWallet.currentSpaceAssert}
        </Text>

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
              navigate("SendSpacePage");
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
              navigate("ReceivePage", { myCoinType: "SPACE" });
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <LoadingNoticeModal title={noticeContent} isShow={isShowNotice} />

      <View style={{ flex: 1 }}>
        {/* 头部 */}
        {/* <View
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

          {myCoinType == "BTC" && (
            <TouchableWithoutFeedback onPress={() => {}}>
              <Image
                source={require("../../../image/assert_adress_type_icon.png")}
                style={{ width: 22, height: 22 }}
              />
            </TouchableWithoutFeedback>
          )}
          <Text style={{ marginRight: 20, color: "#333", fontSize: 16 }}>
            {""}
          </Text>
        </View> */}

        <TitleBar />

        {/* <ListHeader /> */}
        {/* 尾部 */}

        <FlatList
          data={mvcActivityList}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={ListItem}
          ListHeaderComponent={listHeaderComponent}
        />
      </View>
    </SafeAreaView>
  );
}
