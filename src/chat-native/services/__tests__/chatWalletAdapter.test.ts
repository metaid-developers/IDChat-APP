jest.mock('@/stores/useWalletStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
  },
}));

jest.mock('@/wallet/wallet', () => ({
  getCurrentBtcWallet: jest.fn(),
  getCurrentMvcWallet: jest.fn(),
}));

import useWalletStore from '@/stores/useWalletStore';
import { getCurrentBtcWallet, getCurrentMvcWallet } from '@/wallet/wallet';
import { ensureNativeChatWalletStore } from '../nativeChatWalletBootstrap';

describe('ensureNativeChatWalletStore', () => {
  it('uses the existing wallet store when both wallets are already initialized', async () => {
    const btcWallet = { chain: 'btc' } as any;
    const mvcWallet = { chain: 'mvc' } as any;
    const loadCurrentWallets = jest.fn();
    const setCurrentWallet = jest.fn();

    await expect(
      ensureNativeChatWalletStore({
        getWalletState: () => ({
          btcWallet,
          mvcWallet,
          setCurrentWallet,
        }),
        loadCurrentWallets,
      }),
    ).resolves.toEqual({ btcWallet, mvcWallet });

    expect(loadCurrentWallets).not.toHaveBeenCalled();
    expect(setCurrentWallet).not.toHaveBeenCalled();
  });

  it('hydrates the wallet store from local wallet storage when native chat starts directly', async () => {
    const btcWallet = { chain: 'btc' } as any;
    const mvcWallet = { chain: 'mvc' } as any;
    const state = {
      btcWallet: null,
      mvcWallet: null,
      setCurrentWallet: jest.fn((wallets) => {
        state.btcWallet = wallets.btcWallet;
        state.mvcWallet = wallets.mvcWallet;
      }),
    };
    const loadCurrentWallets = jest.fn(async () => ({ btcWallet, mvcWallet }));

    await expect(
      ensureNativeChatWalletStore({
        getWalletState: () => state,
        loadCurrentWallets,
      }),
    ).resolves.toEqual({ btcWallet, mvcWallet });

    expect(loadCurrentWallets).toHaveBeenCalledTimes(1);
    expect(state.setCurrentWallet).toHaveBeenCalledWith({ btcWallet, mvcWallet });
    expect(state.btcWallet).toBe(btcWallet);
    expect(state.mvcWallet).toBe(mvcWallet);
  });

  it('loads current wallets into the app wallet store by default', async () => {
    const btcWallet = { chain: 'btc' } as any;
    const mvcWallet = { chain: 'mvc' } as any;
    const state = {
      btcWallet: null,
      mvcWallet: null,
      setCurrentWallet: jest.fn(),
    };

    jest.mocked(useWalletStore.getState).mockReturnValue(state as any);
    jest.mocked(getCurrentBtcWallet).mockResolvedValue(btcWallet);
    jest.mocked(getCurrentMvcWallet).mockResolvedValue(mvcWallet);

    await expect(ensureNativeChatWalletStore()).resolves.toEqual({ btcWallet, mvcWallet });

    expect(getCurrentBtcWallet).toHaveBeenCalledTimes(1);
    expect(getCurrentMvcWallet).toHaveBeenCalledTimes(1);
    expect(state.setCurrentWallet).toHaveBeenCalledWith({ btcWallet, mvcWallet });
  });
});
