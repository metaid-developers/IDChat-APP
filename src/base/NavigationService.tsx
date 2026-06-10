import { StackActions } from "@react-navigation/native";
import React from "react";
import Toast from "react-native-toast-message";

// 初始化一个navigation对象
let _navigator;

// 设置navigator的方法
export function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

// 全局跳转的方法
export function navigate(routeName, myObject?) {
  if (_navigator) {
    // 对于react-navigation v5+
    _navigator.navigate(routeName, myObject);
  } else {
    console.warn("Can't navigate without a navigator!");
  }
}


export function navigatePush(routeName, params?: object) {
  if (_navigator) {
    _navigator.dispatch(StackActions.push(routeName, params));
  } else {
    console.warn("Can't navigate without a navigator!");
  }
}

export function goBack() {
  if (_navigator) {
    // 对于react-navigation v5+
    _navigator.goBack();
  } else {
    console.warn("Can't navigate without a navigator!");
  }
}

export function canGoBack() {
  return Boolean(_navigator?.canGoBack?.());
}

export function reSets(name: string) {
  if (_navigator) {
    _navigator.reset({
      index: 0,
      routes: [{ name: name }],
    });
  } else {
    console.warn("Can't navigate without a navigator!");
  }
}
