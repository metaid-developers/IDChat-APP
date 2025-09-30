import { AddressType, BtcWallet, Chain, CoinType } from '@metalet/utxo-wallet-service';
import { AccountsOptions, WalletBean } from '../bean/WalletBean';
import { useData } from '../hooks/MyProvider';
import {
  CurrentAccountIDKey,
  CurrentWalletIDKey,
  wallet_password_key,
  wallets_key,
  createStorage,
  network_btc,
  AsyncStorageUtil,
  net_wallet_network_key,
  wallet_mode_key,
  wallet_mode_cold,
  wallet_mode_observer,
} from './AsyncStorageUtil';
import MetaletWallet from '../wallet/MetaletWallet';
import { removeTrailingZeros } from './StringUtils';
import { fetchMvcFtPrice } from '../api/metaletservice';
import { MvcFtData } from '../api/type/MvcFtData';
import { Linking } from 'react-native';
import { Asset } from 'expo-asset';

const storage = createStorage();

//storage
export async function getCurrentWalletID(): Promise<string> {
  const walletID = await storage.get(CurrentWalletIDKey);
  return walletID;
}

export async function setCurrentWalletID(walletID: string) {
  await storage.set(CurrentWalletIDKey, walletID);
}

export async function getCurrentAccountID(): Promise<string> {
  const accountID = await storage.get(CurrentAccountIDKey);
  return accountID;
}

export async function setCurrentAccountID(accountID: string) {
  await storage.set(CurrentAccountIDKey, accountID);
}

export async function getCurrentWalletAccount(): Promise<AccountsOptions> {
  const wallet = await getStorageCurrentWallet();
  const accountID = await getCurrentAccountID();
  if (!wallet || !accountID) {
    return null;
  }
  return wallet.accountsOptions.find((account) => account.id == accountID);
}

export async function updateStorageWallet(id: string, updates: Partial<WalletBean>): Promise<void> {
  const wallets = await storage.get<WalletBean[]>(wallets_key);
  if (!wallets) return;

  const newWallets = wallets.map((wallet) =>
    wallet.id === id ? { ...wallet, ...updates } : wallet,
  );

  await storage.set(wallets_key, newWallets);
}
export async function getStorageCurrentWallet(): Promise<WalletBean> {
  const wallets = await storage.get<WalletBean[]>(wallets_key);
  if (wallets) {
    const walletID = await getCurrentWalletID();
    const wallet = wallets.find((wallet) => {
      if (wallet) {
        if (wallet.id == walletID) {
          return wallet;
        }
      } else {
        return null;
      }
    });
    return wallet;
  } else {
    return null;
  }
}

export async function setCurrentStorageWallet(walletBean: WalletBean, mvcPath: number) {
  const wallets = await getWalletBeans();
  const wallet = wallets.find((itemWallet) => {
    console.log(itemWallet.mnemonic);
    if (itemWallet.id == walletBean.id) {
      return itemWallet;
    }
  });
  wallet.mvcTypes = mvcPath;
  await AsyncStorageUtil.updateItem(wallets_key, wallets);

  // await AsyncStorageUtil.setItem(CurrentWalletIDKey, walletBean.id);
}

//   export async function setCurrentAccount(account:AccountsOptions) {
//      await AsyncStorageUtil.setItem(CurrentAccountIDKey,account);
//   }

export async function getWalletBeans() {
  return await storage.get<WalletBean[]>(wallets_key);
}

export async function getCurrentWalletSeed() {
  const wallet: WalletBean = await getStorageCurrentWallet();
  if (wallet.seed == null) {
    return null;
  }
  const seed = Buffer.from(wallet.seed, 'hex');
  return seed;
}

export async function isNoWalletPassword(): Promise<boolean> {
  const password = await storage.get(wallet_password_key);
  // const password = await AsyncStorageUtil.getItem(wallet_password_key);
  console.log('isNoWalletPassword', password);

  if (password == null) {
    return true;
  } else {
    return false;
  }
}

export async function isNoStorageWallet(): Promise<boolean> {
  const wallets: WalletBean[] = await storage.get(wallets_key);
  // const wallets = await AsyncStorageUtil.getItem(wallets_key);

  if (Array.isArray(wallets) && wallets.length > 0) {
    return false;
  }
  return true;
}

export async function getStorageWallets() {
  return await storage.get<WalletBean[]>(wallets_key, { defaultValue: [] });
}

export async function verifyPassword(password: string): Promise<boolean> {
  const passwordLocal = await storage.get(wallet_password_key);
  // const passwordLocal = await AsyncStorageUtil.getItem(wallet_password_key);
  if (passwordLocal == password) {
    return true;
  } else {
    return false;
  }
}

export async function getWalletNetwork(chain?: Chain): Promise<string> {
  const network = await AsyncStorageUtil.getItem(net_wallet_network_key);
  if (chain === Chain.BTC && network === 'mainnet') {
    return 'livenet';
  }

  return network;
}

export async function setWalletNetwork(walletNet: string) {
  await AsyncStorageUtil.setItem(net_wallet_network_key, walletNet);
}

export async function isObserverWalletMode() {
  // const mode = await AsyncStorageUtil.getItem(wallet_mode_key);
  const wallet = await getStorageCurrentWallet();
  if (wallet.isColdWalletMode == wallet_mode_observer) {
    return true;
  } else {
    return false;
  }
  // if (mode && wallet_mode_cold === mode) {
  //   return true;
  // } else {
  //   return false;
  // }
}
export async function isColdWalletMode() {
  // const mode = await AsyncStorageUtil.getItem(wallet_mode_key);
  const wallet = await getStorageCurrentWallet();
  if (wallet.isColdWalletMode == wallet_mode_observer) {
    return true;
  } else {
    return false;
  }
  // if (mode && wallet_mode_cold === mode) {
  //   return true;
  // } else {
  //   return false;
  // }
}

export async function getWalletMode() {
  const wallet = await getStorageCurrentWallet();
  return wallet.isColdWalletMode;
}

// export async function getWalletModeTest() {
//   const wallet = await getStorageCurrentWallet();
//   return wallet.isColdWalletModeTest;
// }

export async function setWalletMode(mode: string) {
  await AsyncStorageUtil.setItem(wallet_mode_key, mode);
}

/////////////change
export async function changeCurrentWalletAddressType(changeAddressType: AddressType) {
  const wallets: WalletBean[] = await getWalletBeans();
  const walletID = await getCurrentWalletID();
  const wallet = wallets.find((wallet) => wallet.id == walletID);
  wallet.addressType = changeAddressType;
  await storage.set(wallets_key, wallets);
  // await AsyncStorageUtil.updateItem(wallets_key, [...wallets, wallet]);
  // await AsyncStorageUtil.updateItem(wallets_key, wallets);
}

///////////utils
export function parseToSpace(space: string) {
  return (parseFloat(space) / 100000000).toFixed(8);
}

export function parseToSat(space: string) {
  return Math.floor(parseFloat(space) * 100000000);
}

export function getRandomID() {
  return Math.random().toString(36).substr(2, 8);
}

let lastRandom = 0;
export function getRandomNum() {
  // 使用当前时间（毫秒） + Math.random() 构造较大随机数
  let num = Date.now() + Math.floor(Math.random() * 1000);
  // 保证不重复（如果两次调用时间太接近）
  if (num <= lastRandom) {
    num = lastRandom + 1;
  }
  lastRandom = num;
  return num;
}

//sat to space
export function formatToDecimal(amount: number, precision: number) {
  // 将整数转换为浮点数并除以10的精度次方
  const divisor = Math.pow(10, precision);
  const formattedAmount = (amount / divisor).toFixed(precision);
  return removeTrailingZeros(formattedAmount);
}

//space to sat
export function caculateToSatDecimal(amount: number, precision: number) {
  const divisor = Math.pow(10, precision);
  const formattedAmount = (amount * divisor).toFixed(precision);
  return removeTrailingZeros(formattedAmount);
}

/////////// fuction
export async function goToWebScan(chain: string, linkTx: string) {
  let url;
  const network = await getWalletNetwork();
  if (chain == 'mvc') {
    if (network == 'testnet') {
      url = 'https://test.mvcscan.com/tx/' + linkTx;
    } else {
      url = 'https://www.mvcscan.com/tx/' + linkTx;
    }
  } else if (chain == 'btc') {
    if (network == 'testnet') {
      url = 'https://mempool.space/testnet/tx/' + linkTx;
    } else {
      url = 'https://mempool.space/tx/' + linkTx;
    }
  }

  console.log('url', url);

  if (url) {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log(`Don't know how to open this URL: ${url}`);
    }
  }
}

export async function openBrowser(link: string) {
  if (link) {
    const supported = await Linking.canOpenURL(link);
    if (supported) {
      console.log('openBrowser', link);

      await Linking.openURL(link);
    } else {
      console.log(`Don't know how to open this URL: ${link}`);
    }
  }
}

// export async function openLocalPrivacyPolicy() {
//   const asset = Asset.fromModule(require('../assets/privatecy.html'));
//   await asset.downloadAsync(); // 确保打包后有真实路径
//   const uri = asset.localUri ?? asset.uri; // iOS/Android 都可
//   const supported = await Linking.canOpenURL(uri);
//   if (supported) {
//     await Linking.openURL(uri);
//   } else {
//     console.warn('Cannot open local HTML:', uri);
//   }
// }
