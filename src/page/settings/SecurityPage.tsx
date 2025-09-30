import { View, Text, TouchableWithoutFeedback, Image } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TitleBar, VerifyModal } from "@/constant/Widget";
import { navigate } from "@/base/NavigationService";
import { use } from "i18next";
import { useTranslation } from "react-i18next";

export default function SecurityPage() {
  const [isShowVerify, setIsShowVerify] = useState(false);
  const { t } = useTranslation();

  const [isShowVerify2, setIsShowVerify2] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <VerifyModal
        isShow={isShowVerify}
        eventCancel={() => {
          setIsShowVerify(false);
        }}
        event={() => {
          setIsShowVerify(false);
          navigate("SetPasswordPage", { type: "change" });
        }}
      />

      <VerifyModal
        isShow={isShowVerify2}
        eventCancel={() => {
          setIsShowVerify2(false);
        }}
        event={() => {
          setIsShowVerify2(false);
          navigate("SmallPayAutoPage");
        }}
      />

      <View style={{ flex: 1 }}>
        <TitleBar title="" />
        <View>
          <TouchableWithoutFeedback
            onPress={async () => {
              setIsShowVerify(true);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                marginTop: 10,
              }}
            >
              <Text style={{ marginLeft: 10, color: "#303133", fontSize: 16 }}>
                {t("s_change_password")}
              </Text>
              <View style={{ flex: 1 }} />

              <Image
                source={require("../../../image/list_icon_ins.png")}
                style={{ width: 20, height: 20, marginTop: 5 }}
              />
            </View>
          </TouchableWithoutFeedback>
{/* 
          <TouchableWithoutFeedback
            onPress={async () => {
              setIsShowVerify2(true);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                marginTop: 10,
              }}
            >
              <Text style={{ marginLeft: 10, color: "#303133", fontSize: 16 }}>
                {t("s_small_payment_auto_approve")}
              </Text>
              <View style={{ flex: 1 }} />

              <Image
                source={require("../../../image/list_icon_ins.png")}
                style={{ width: 20, height: 20, marginTop: 5 }}
              />
            </View>
          </TouchableWithoutFeedback> */}

        </View>
      </View>
    </SafeAreaView>
  );
}
