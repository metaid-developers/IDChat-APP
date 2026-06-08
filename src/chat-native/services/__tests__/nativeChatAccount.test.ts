import { resolveNativeChatAccount } from '../nativeChatAccount';

describe('resolveNativeChatAccount', () => {
  it('uses MVC globalMetaId as the native chat account identity', async () => {
    const wallet = {
      getGlobalMetaId: jest.fn(async () => ({
        mvc: { address: 'mvc-address', globalMetaId: 'mvc-global-metaid' },
        btc: { address: 'btc-address', globalMetaId: 'btc-global-metaid' },
        doge: { address: 'doge-address', globalMetaId: 'doge-global-metaid' },
      })),
      getCurrentProfile: jest.fn(async () => ({
        name: 'Alice',
        avatar: 'https://example.test/avatar.png',
      })),
    };

    await expect(resolveNativeChatAccount(wallet as any)).resolves.toEqual({
      accountGlobalMetaId: 'mvc-global-metaid',
      address: 'mvc-address',
      displayName: 'Alice',
      avatar: 'https://example.test/avatar.png',
    });
  });

  it('throws a clear error when the wallet has no MVC globalMetaId', async () => {
    const wallet = {
      getGlobalMetaId: jest.fn(async () => ({
        mvc: { address: '', globalMetaId: '' },
        btc: { address: 'btc-address', globalMetaId: 'btc-global-metaid' },
        doge: { address: 'doge-address', globalMetaId: 'doge-global-metaid' },
      })),
      getCurrentProfile: jest.fn(),
    };

    await expect(resolveNativeChatAccount(wallet as any)).rejects.toThrow('Missing MVC GlobalMetaId');
  });
});
