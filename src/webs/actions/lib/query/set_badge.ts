import useWalletStore from "@/stores/useWalletStore";

export async function process() {
  return useWalletStore.getState().mvcWallet.getAddress();
}
