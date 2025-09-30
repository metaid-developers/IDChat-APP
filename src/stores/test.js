
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
  needWebRefresh: { action: "NeedWebRefresh", type: "query" },
};

const metalet = { btc: {}, token: {} ,common: {} };

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
    { name: 'transferMRC20WithInscribe', action: 'MRC20TransferWithInscribe' },
  ],
  inscribe: [{ name: "inscribeTransfer", action: "InscribeTransfer" }],
};

Object.keys(btcKeys).forEach((type) => {
  btcKeys[type].forEach((item) => {
    metalet.btc[item.name] = async function (params) {
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

metalet.on = () => {};

metalet.removeListener = () => {};

window.metaidwallet = metalet;

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


// ------------------ 更稳健的版本 ------------------
// const eventListeners = {};
// const CHANNEL = 'from-rn-event';

// // 安全解析 data
// function safeParse(data) {
//   if (typeof data === 'object') return data;
//   try {
//     return JSON.parse(data);
//   } catch (err) {
//     console.warn('[metalet] JSON parse error:', err);
//     return null;
//   }
// }

// function handleRNEvent(nativeEvent) {
//   const res = safeParse(nativeEvent.data);
//   if (!res || res.channel !== CHANNEL || !res.event) return;

//   const list = eventListeners[res.event];
//   if (!list || !list.length) return;

//   list.forEach((cb) => {
//     try {
//       cb(res.data);
//     } catch (err) {
//       console.error(`[metalet] callback for ${res.event} failed:`, err);
//     }
//   });
// }

// --------- 防止重复绑定 ----------
// if (!window.__metaletEventBound__) {
//   window.__metaletEventBound__ = true;
//   window.addEventListener('message', handleRNEvent);    // iOS
//   document.addEventListener('message', handleRNEvent);  // Android
// }

// // --------- 事件 API ----------
// metalet.on = (event, callback) => {
//   if (!event || typeof callback !== 'function') return;
//   (eventListeners[event] ||= []).push(callback);
// };

// // 支持一次性订阅
// metalet.once = (event, callback) => {
//   function wrapper(data) {
//     callback(data);
//     metalet.removeListener(event, wrapper);
//   }
//   metalet.on(event, wrapper);
// };

// metalet.removeListener = (event, callback) => {
//   const list = eventListeners[event];
//   if (!list) return;
//   eventListeners[event] = list.filter((cb) => cb !== callback);
// };
