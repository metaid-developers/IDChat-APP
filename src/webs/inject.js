// export const injectedJavaScript = `
// const generateRandomString = (len) => {
//   let randomString = "";
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

//   for (let i = 0; i < len; i++) {
//     randomString += characters.charAt(
//       Math.floor(Math.random() * characters.length)
//     );
//   }

//   return randomString;
// };

// const postMessage = async function (actionName, actionType, params) {
//   const nonce = generateRandomString(16);

//   window.ReactNativeWebView.postMessage(
//     JSON.stringify({
//       nonce,
//       params: params || {},
//       channel: "to-metaidwallet",
//       host: window.location.host,
//       action: actionName + "-" + actionType,
//       icon:
//         document.querySelector("link[rel*='icon']")?.href ||
//         "",
//     })
//   );

//   const subscribe = (callback) => {
//     const eventListener = (nativeEvent) => {
//       try {
//         const res = JSON.parse(nativeEvent.data);
//         if (typeof res === "object" && res.nonce === nonce) {
//           window.removeEventListener("message", eventListener);
//           document.removeEventListener("message", eventListener);
//           callback(res.data);
//         }
//       } catch (e) {
//         console.error("listen error:", e);
//       }
//     };

//     // IOS
//     window.addEventListener("message", eventListener);
//     // Android
//     document.addEventListener("message", eventListener);
//   };

//   return await new Promise((resolve, reject) => {
//     subscribe((data) => {
//       if (data.error) {
//         reject(data.error)
//       }
//       resolve(data);
//     });
//   });
// };

// const actions = {
//   connect: { action: "Connect", type: "authorize" },
//   disconnect: { action: "Disconnect", type: "authorize" },
//   isConnected: { action: "IsConnected", type: "query" },
//   getNetwork: { action: "GetNetwork", type: "query" },
//   switchNetwork: { action: "SwitchNetwork", type: "authorize" },
//   getAddress: { action: "GetAddress", type: "query" },
//   getUtxos: { action: "GetUtxos", type: "query" },
//   getPublicKey: { action: "GetPublicKey", type: "query" },
//   getXPublicKey: { action: "GetXPublicKey", type: "query" },
//   getBalance: { action: "GetBalance", type: "query" },
//   getTokenBalance: { action: "GetTokenBalance", type: "query" },
//   verifySignature: { action: "VerifySignature", type: "query" },
//   previewTransaction: { action: "PreviewTransaction", type: "query" },
//   transfer: { action: "Transfer", type: "authorize" },
//   signMessage: { action: "SignMessage", type: "authorize" },
//   pay: { action: "Pay", type: "authorize" },
//   unlockP2PKHInput: { action: "UnlockP2PKHInput", type: "authorize" },
//   signPartialTx: { action: "SignPartialTx", type: "authorize" },
//   getMvcBalance: { action: "GetBalance", type: "query" },
//   saveBase64Image: { action: "SaveBase64Image", type: "query" },
//   smallPay: { action: "SmallPay", type: "query" },
//   autoPaymentStatus: { action: "AutoPaymentStatus", type: "query" },
//   autoPayment: { action: "AutoPayment", type: "authorize" },
// };

// const metalet = { btc: {}, token: {} ,common: {} };

// Object.keys(actions).forEach((key) => {
//   metalet[key] = async function (params) {
//     const { action, type } = actions[key];
//     return await postMessage(action, type, params);
//   };
// });

// const btcKeys = {
//   query: [
//     { name: "getBalance", action: "GetBTCBalance" },
//     { name: "getAddress", action: "GetBTCAddress" },
//     { name: "getAddressType", action: "GetBTCAddressType" },
//     { name: "getPublicKey", action: "GetBTCPublicKey" },
//     { name: "getUtxos", action: "GetBTCUtxos" },
//     { name: "pushPsbt", action: "PushPsbt" },
//     { name: "verifyMessage", action: "BTCVerifyMessage" },
//     { name: 'addSafeUtxo', action: 'AddSafeUtxo' },
//   ],
//   authorize: [
//     { name: "connect", action: "ConnectBTC" },
//     { name: "signPsbt", action: "SignBTCPsbt" },
//     { name: "signMessage", action: "SignBTCMessage" },
//     { name: "inscribe", action: "Inscribe" },
//     { name: "transfer", action: "BTCTransfer" },
//     { name: 'deployMRC20', action: 'MRC20Deploy' },
//     { name: 'mintMRC20', action: 'MRC20Mint' },
//     { name: 'transferMRC20', action: 'MRC20Transfer' },
//     { name: 'transferMRC20WithInscribe', action: 'MRC20TransferWithInscribe' },
//   ],
//   inscribe: [{ name: "inscribeTransfer", action: "InscribeTransfer" }],
// };

// Object.keys(btcKeys).forEach((type) => {
//   btcKeys[type].forEach((item) => {
//     metalet.btc[item.name] = async function (params) {
//       return await postMessage(item.action, type, params);
//     };
//   });
// });

// const commonKeys = {
//   authorize: [
//     { name: "ecdh", action: "ECDH" },
//   ],
// };

// Object.keys(commonKeys).forEach((type) => {
//   commonKeys[type].forEach((item) => {
//     metalet.common[item.name] = async function (params) {
//       return await postMessage(item.action, type, params);
//     };
//   });
// });

// const tokenKeys = {
//   query: [
//     { name: "getBalance", action: "GetTokenBalance" },
//   ],
// };

// Object.keys(tokenKeys).forEach((type) => {
//   tokenKeys[type].forEach((item) => {
//     metalet.token[item.name] = async function (params) {
//       return await postMessage(item.action, type, params);
//     };
//   });
// });

// metalet.on = () => {};

// metalet.removeListener = () => {};

// window.metaidwallet = metalet;

// // const consoleLog = (type, log) => window.ReactNativeWebView.postMessage(JSON.stringify({'type': 'Console', 'data': {'type': type, 'log': log}}));
// // console = {
// //   log: (log) => consoleLog('log', log),
// //   debug: (log) => consoleLog('debug', log),
// //   info: (log) => consoleLog('info', log),
// //   warn: (log) => consoleLog('warn', log),
// //   error: (log) => consoleLog('error', log),
// // };
// `;

// export const injectedJavaScript = `
// const generateRandomString = (len) => {
//   let randomString = "";
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

//   for (let i = 0; i < len; i++) {
//     randomString += characters.charAt(
//       Math.floor(Math.random() * characters.length)
//     );
//   }

//   return randomString;
// };

// const postMessage = async function (actionName, actionType, params) {
//   const nonce = generateRandomString(16);

//   window.ReactNativeWebView.postMessage(
//     JSON.stringify({
//       nonce,
//       params: params || {},
//       channel: "to-metaidwallet",
//       host: window.location.host,
//       action: actionName + "-" + actionType,
//       icon:
//         document.querySelector("link[rel*='icon']")?.href ||
//         "",
//     })
//   );

//   const subscribe = (callback) => {
//     const eventListener = (nativeEvent) => {
//       try {
//         const res = JSON.parse(nativeEvent.data);
//         if (typeof res === "object" && res.nonce === nonce) {
//           window.removeEventListener("message", eventListener);
//           document.removeEventListener("message", eventListener);
//           callback(res.data);
//         }
//       } catch (e) {
//         console.error("listen error:", e);
//       }
//     };

//     // IOS
//     window.addEventListener("message", eventListener);
//     // Android
//     document.addEventListener("message", eventListener);
//   };

//   return await new Promise((resolve, reject) => {
//     subscribe((data) => {
//       if (data.error) {
//         reject(data.error)
//       }
//       resolve(data);
//     });
//   });
// };

// const actions = {
//   connect: { action: "Connect", type: "authorize" },
//   disconnect: { action: "Disconnect", type: "authorize" },
//   isConnected: { action: "IsConnected", type: "query" },
//   getNetwork: { action: "GetNetwork", type: "query" },
//   switchNetwork: { action: "SwitchNetwork", type: "authorize" },
//   getAddress: { action: "GetAddress", type: "query" },
//   getUtxos: { action: "GetUtxos", type: "query" },
//   getPublicKey: { action: "GetPublicKey", type: "query" },
//   getXPublicKey: { action: "GetXPublicKey", type: "query" },
//   getBalance: { action: "GetBalance", type: "query" },
//   getTokenBalance: { action: "GetTokenBalance", type: "query" },
//   verifySignature: { action: "VerifySignature", type: "query" },
//   previewTransaction: { action: "PreviewTransaction", type: "query" },
//   transfer: { action: "Transfer", type: "authorize" },
//   signMessage: { action: "SignMessage", type: "authorize" },
//   pay: { action: "Pay", type: "authorize" },
//   unlockP2PKHInput: { action: "UnlockP2PKHInput", type: "authorize" },
//   signPartialTx: { action: "SignPartialTx", type: "authorize" },
//   getMvcBalance: { action: "GetBalance", type: "query" },
//   saveBase64Image: { action: "SaveBase64Image", type: "query" },
//   smallPay: { action: "SmallPay", type: "query" },
//   autoPaymentStatus: { action: "AutoPaymentStatus", type: "query" },
//   autoPayment: { action: "AutoPayment", type: "authorize" },
// };

// const metalet = { btc: {}, token: {} ,common: {} };

// Object.keys(actions).forEach((key) => {
//   metalet[key] = async function (params) {
//     const { action, type } = actions[key];
//     return await postMessage(action, type, params);
//   };
// });

// const btcKeys = {
//   query: [
//     { name: "getBalance", action: "GetBTCBalance" },
//     { name: "getAddress", action: "GetBTCAddress" },
//     { name: "getAddressType", action: "GetBTCAddressType" },
//     { name: "getPublicKey", action: "GetBTCPublicKey" },
//     { name: "getUtxos", action: "GetBTCUtxos" },
//     { name: "pushPsbt", action: "PushPsbt" },
//     { name: "verifyMessage", action: "BTCVerifyMessage" },
//     { name: 'addSafeUtxo', action: 'AddSafeUtxo' },
//   ],
//   authorize: [
//     { name: "connect", action: "ConnectBTC" },
//     { name: "signPsbt", action: "SignBTCPsbt" },
//     { name: "signMessage", action: "SignBTCMessage" },
//     { name: "inscribe", action: "Inscribe" },
//     { name: "transfer", action: "BTCTransfer" },
//     { name: 'deployMRC20', action: 'MRC20Deploy' },
//     { name: 'mintMRC20', action: 'MRC20Mint' },
//     { name: 'transferMRC20', action: 'MRC20Transfer' },
//     { name: 'transferMRC20WithInscribe', action: 'MRC20TransferWithInscribe' },
//   ],
//   inscribe: [{ name: "inscribeTransfer", action: "InscribeTransfer" }],
// };

// Object.keys(btcKeys).forEach((type) => {
//   btcKeys[type].forEach((item) => {
//     metalet.btc[item.name] = async function (params) {
//       return await postMessage(item.action, type, params);
//     };
//   });
// });

// const commonKeys = {
//   authorize: [
//     { name: "ecdh", action: "ECDH" },
//   ],
// };

// Object.keys(commonKeys).forEach((type) => {
//   commonKeys[type].forEach((item) => {
//     metalet.common[item.name] = async function (params) {
//       return await postMessage(item.action, type, params);
//     };
//   });
// });

// const tokenKeys = {
//   query: [
//     { name: "getBalance", action: "GetTokenBalance" },
//   ],
// };

// Object.keys(tokenKeys).forEach((type) => {
//   tokenKeys[type].forEach((item) => {
//     metalet.token[item.name] = async function (params) {
//       return await postMessage(item.action, type, params);
//     };
//   });
// });

// window.metaidwallet = metalet;

// const consoleLog = (type, log) => window.ReactNativeWebView.postMessage(JSON.stringify({'type': 'Console', 'data': {'type': type, 'log': log}}));
// console = {
//   log: (log) => consoleLog('log', log),
//   debug: (log) => consoleLog('debug', log),
//   info: (log) => consoleLog('info', log),
//   warn: (log) => consoleLog('warn', log),
//   error: (log) => consoleLog('error', log),
// };

// // ==========================
// // RN 主动发送消息到网页事件系统
// // ==========================
// const eventListeners = {};

// function handleRNEvent(nativeEvent) {
//   try {
//     const res = JSON.parse(nativeEvent.data);
//     if (res && res.channel === "from-rn-event" && res.event) {
//       if (eventListeners[res.event]) {
//         eventListeners[res.event].forEach((cb) => cb(res.data));
//       }
//     }
//   } catch (e) {
//     console.error("handleRNEvent error:", e);
//   }
// }

// // 监听 RN 主动消息
// window.addEventListener("message", handleRNEvent);   // iOS
// document.addEventListener("message", handleRNEvent); // Android

// // 支持网页端订阅事件
// metalet.on = (event, callback) => {
//   if (!eventListeners[event]) {
//     eventListeners[event] = [];
//   }
//   eventListeners[event].push(callback);
// };

// metalet.removeListener = (event, callback) => {
//   if (eventListeners[event]) {
//     eventListeners[event] = eventListeners[event].filter((cb) => cb !== callback);
//   }
// };
// `;

export const injectedJavaScript = `
const generateRandomString = (len) => {
  let randomString = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < len; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return randomString;
};

const postMessage = async function (actionName, actionType, params) {
  const nonce = generateRandomString(16);

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      nonce,
      params: params || {},
      channel: "to-metaidwallet",
      host: window.location.host,
      action: actionName + "-" + actionType,
      icon:
        document.querySelector("link[rel*='icon']")?.href ||
        "",
    })
  );

  const subscribe = (callback) => {
    const eventListener = (nativeEvent) => {
      try {
        const res = JSON.parse(nativeEvent.data);
        if (typeof res === "object" && res.nonce === nonce) {
          window.removeEventListener("message", eventListener);
          document.removeEventListener("message", eventListener);
          callback(res.data);
        }
      } catch (e) {
        console.error("listen error:", e);
      }
    };

    // IOS
    window.addEventListener("message", eventListener);
    // Android
    document.addEventListener("message", eventListener);
  };

  return await new Promise((resolve, reject) => {
    subscribe((data) => {
      if (data.error) {
        reject(data.error)
      }
      resolve(data);
    });
  });
};

const actions = {
  connect: { action: "Connect", type: "authorize" },
  disconnect: { action: "Disconnect", type: "authorize" },
  isConnected: { action: "IsConnected", type: "query" },
  getNetwork: { action: "GetNetwork", type: "query" },
  switchNetwork: { action: "SwitchNetwork", type: "authorize" },
  getAddress: { action: "GetAddress", type: "query" },
  getUtxos: { action: "GetUtxos", type: "query" },
  getPublicKey: { action: "GetPublicKey", type: "query" },
  getXPublicKey: { action: "GetXPublicKey", type: "query" },
  getBalance: { action: "GetBalance", type: "query" },
  getTokenBalance: { action: "GetTokenBalance", type: "query" },
  verifySignature: { action: "VerifySignature", type: "query" },
  previewTransaction: { action: "PreviewTransaction", type: "query" },
  transfer: { action: "Transfer", type: "authorize" },
  signMessage: { action: "SignMessage", type: "authorize" },
  pay: { action: "Pay", type: "authorize" },
  unlockP2PKHInput: { action: "UnlockP2PKHInput", type: "authorize" },
  signPartialTx: { action: "SignPartialTx", type: "authorize" },
  getMvcBalance: { action: "GetBalance", type: "query" },
  saveBase64Image: { action: "SaveBase64Image", type: "query" },
  smallPay: { action: "SmallPay", type: "query" },
  autoPaymentStatus: { action: "AutoPaymentStatus", type: "query" },
  autoPayment: { action: "AutoPayment", type: "authorize" },
  setAppBadge: { action: "SetAppBadge", type: "query" },
  needWebRefresh:{ action: "NeedWebRefresh", type: "query" },
  openAppBrowser:{ action: "OpenAppBrowser", type: "query" },
  getAppVersionCode:{ action: "GetAppVersionCode", type: "query" },
  getPKHByPath:{ action: "GetPKHByPath", type: "query" },
  getGlobalMetaid:{ action: "GetGlobalMetaid", type: "query" },
  signTransaction:{ action: "SignTransaction", type: "authorize" },
  eciesDecrypt:{ action: "EciesDecrypt", type: "authorize" },
  eciesEncrypt:{ action: "EciesEncrypt", type: "authorize" },
};

const metalet = { btc: {}, token: {} ,common: {} , doge: {}, };

Object.keys(actions).forEach((key) => {
  metalet[key] = async function (params) {
    const { action, type } = actions[key];
    return await postMessage(action, type, params);
  };
});

const btcKeys = {
  query: [
    { name: "getBalance", action: "GetBTCBalance" },
    { name: "getAddress", action: "GetBTCAddress" },
    { name: "getAddressType", action: "GetBTCAddressType" },
    { name: "getPublicKey", action: "GetBTCPublicKey" },
    { name: "getUtxos", action: "GetBTCUtxos" },
    { name: "pushPsbt", action: "PushPsbt" },
    { name: "verifyMessage", action: "BTCVerifyMessage" },
    { name: 'addSafeUtxo', action: 'AddSafeUtxo' },
  ],
  authorize: [
    { name: "connect", action: "ConnectBTC" },
    { name: "signPsbt", action: "SignBTCPsbt" },
    { name: "signMessage", action: "SignBTCMessage" },
    { name: "inscribe", action: "Inscribe" },
    { name: "transfer", action: "BTCTransfer" },
    { name: 'deployMRC20', action: 'MRC20Deploy' },
    { name: 'mintMRC20', action: 'MRC20Mint' },
    { name: 'transferMRC20', action: 'MRC20Transfer' },
    { name: 'createPin', action: 'CreatePin' },
    { name: 'transferMRC20WithInscribe', action: 'MRC20TransferWithInscribe' },
  ],
  inscribe: [{ name: "inscribeTransfer", action: "InscribeTransfer" }],
};

const dogeKeys = {
  query: [
    { name: 'getBalance', action: 'GetDOGEBalance' },
    { name: 'getAddress', action: 'GetDOGEAddress' },
    { name: 'getPublicKey', action: 'GetDOGEPublicKey' },
    { name: 'getUtxos', action: 'GetDOGEUtxos' },
  ],
  authorize: [
    { name: 'inscribe', action: 'DogeInscribe' },
  ],
  inscribe: [],
};

Object.keys(btcKeys).forEach((type) => {
  btcKeys[type].forEach((item) => {
    metalet.btc[item.name] = async function (params) {
      return await postMessage(item.action, type, params);
    };
  });
});


Object.keys(dogeKeys).forEach((type) => {
  dogeKeys[type].forEach((item) => {
    metalet.doge[item.name] = async function (params) {
      return await postMessage(item.action, type, params);
    };
  });
});

const commonKeys = {
  authorize: [
    { name: "ecdh", action: "ECDH" },
  ],
};

Object.keys(commonKeys).forEach((type) => {
  commonKeys[type].forEach((item) => {
    metalet.common[item.name] = async function (params) {
      return await postMessage(item.action, type, params);
    };
  });
});

const tokenKeys = {
  query: [
    { name: "getBalance", action: "GetTokenBalance" },
  ],
};

Object.keys(tokenKeys).forEach((type) => {
  tokenKeys[type].forEach((item) => {
    metalet.token[item.name] = async function (params) {
      return await postMessage(item.action, type, params);
    };
  });
});


window.metaidwallet = metalet;
window.metaidwallet.version= 21;

const consoleLog = (type, log) => window.ReactNativeWebView.postMessage(JSON.stringify({'type': 'Console', 'data': {'type': type, 'log': log}}));
console = {
  log: (log) => consoleLog('log', log),
  debug: (log) => consoleLog('debug', log),
  info: (log) => consoleLog('info', log),
  warn: (log) => consoleLog('warn', log),
  error: (log) => consoleLog('error', log),
};

// ==========================
// RN 主动发送消息到网页事件系统
// ==========================
const eventListeners = {};

function handleRNEvent(nativeEvent) {
  try {
    const res = JSON.parse(nativeEvent.data);
    if (res && res.channel === "from-rn-event" && res.event) {
      if (eventListeners[res.event]) {
        eventListeners[res.event].forEach((cb) => cb(res.data));
      }
    }
  } catch (e) {
    console.error("handleRNEvent error:", e);
  }
}

// 监听 RN 主动消息
window.addEventListener("message", handleRNEvent);   // iOS
document.addEventListener("message", handleRNEvent); // Android

// 支持网页端订阅事件
metalet.on = (event, callback) => {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(callback);
};

metalet.removeListener = (event, callback) => {
  if (eventListeners[event]) {
    eventListeners[event] = eventListeners[event].filter((cb) => cb !== callback);
  }
};
`;
