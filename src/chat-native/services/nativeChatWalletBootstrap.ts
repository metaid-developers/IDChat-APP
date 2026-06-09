import type { BtcWallet, MvcWallet } from '@metalet/utxo-wallet-service';
import useWalletStore from '@/stores/useWalletStore';
import { getCurrentBtcWallet, getCurrentMvcWallet } from '@/wallet/wallet';

type NativeChatWalletStoreState = {
  btcWallet: BtcWallet | null;
  mvcWallet: MvcWallet | null;
  setCurrentWallet(wallets: { btcWallet: BtcWallet; mvcWallet: MvcWallet }): void;
};

type EnsureNativeChatWalletStoreDeps = {
  getWalletState?: () => NativeChatWalletStoreState;
  loadCurrentWallets?: () => Promise<{ btcWallet: BtcWallet; mvcWallet: MvcWallet }>;
};

export async function ensureNativeChatWalletStore(
  deps: EnsureNativeChatWalletStoreDeps = {},
): Promise<{ btcWallet: BtcWallet; mvcWallet: MvcWallet }> {
  const getWalletState = deps.getWalletState || (() => useWalletStore.getState());
  const state = getWalletState();

  if (state.btcWallet && state.mvcWallet) {
    return {
      btcWallet: state.btcWallet,
      mvcWallet: state.mvcWallet,
    };
  }

  const loadCurrentWallets =
    deps.loadCurrentWallets ||
    (async () => {
      const [btcWallet, mvcWallet] = await Promise.all([
        getCurrentBtcWallet(),
        getCurrentMvcWallet(),
      ]);
      return { btcWallet, mvcWallet };
    });
  const wallets = await loadCurrentWallets();
  getWalletState().setCurrentWallet(wallets);
  return wallets;
}
