import type { NativeChatWalletAdapter } from './chatWalletAdapter';

export type NativeChatAccount = {
  accountGlobalMetaId: string;
  address: string;
  displayName: string;
  avatar?: string;
};

export async function resolveNativeChatAccount(
  wallet: Pick<NativeChatWalletAdapter, 'getGlobalMetaId' | 'getCurrentProfile'>,
): Promise<NativeChatAccount> {
  const [globalMetaIdResult, profile] = await Promise.all([
    wallet.getGlobalMetaId(),
    wallet.getCurrentProfile(),
  ]);
  const mvc = globalMetaIdResult.mvc;
  if (!mvc?.globalMetaId || !mvc?.address) {
    throw new Error('Missing MVC GlobalMetaId');
  }

  return {
    accountGlobalMetaId: mvc.globalMetaId,
    address: mvc.address,
    displayName: profile.name || 'IDChat User',
    avatar: profile.avatar,
  };
}
