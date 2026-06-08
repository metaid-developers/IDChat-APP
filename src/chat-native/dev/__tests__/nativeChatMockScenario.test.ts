import {
  createNativeChatMockApiClient,
  createNativeChatMockWalletAdapter,
  seedNativeChatMockScenario,
} from '../nativeChatMockScenario';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { createNativeChatStore } from '../../state/useNativeChatStore';
import { syncChannelMessages } from '../../services/nativeChatSyncService';

describe('nativeChatMockScenario', () => {
  it('seeds private and group conversations for simulator QA', async () => {
    const store = createNativeChatStore();
    const repo = createMemoryChatRepository();

    await seedNativeChatMockScenario({ store, repository: repo, accountGlobalMetaId: 'qa-self' });

    expect(store.getState().channels.map((channel) => channel.type).sort()).toEqual(['group', 'private']);
    expect(store.getState().messagesByChannel['qa-group']).toHaveLength(2);
    expect(store.getState().messagesByChannel['qa-peer']).toHaveLength(2);
    await expect(repo.listChannels('qa-self')).resolves.toHaveLength(2);
    await expect(repo.listMessages('qa-self', 'qa-group')).resolves.toHaveLength(2);
    await expect(repo.listMessages('qa-self', 'qa-peer')).resolves.toHaveLength(2);
  });

  it('provides mocked API and wallet behavior for offline simulator runs', async () => {
    const api = createNativeChatMockApiClient();
    const wallet = createNativeChatMockWalletAdapter();

    await expect(api.getLatestChatInfoList({ metaId: 'qa-self' })).resolves.toHaveLength(2);
    await expect(wallet.getEcdh('04mock-public-key')).resolves.toMatchObject({
      externalPubKey: '04mock-public-key',
      sharedSecret: expect.any(String),
    });
    await expect(
      wallet.createChatNode({
        addressHost: 'bc1p-host',
        protocol: 'simplegroupchat',
        body: { content: 'hello' },
        externalEncryption: '0',
      }),
    ).resolves.toMatchObject({
      txids: ['mock-native-chat-txid-1'],
    });
  });

  it('returns unique chat txids and file plus chat txids for attachment sends', async () => {
    const wallet = createNativeChatMockWalletAdapter();

    const first = await wallet.createChatNode({
      addressHost: 'bc1p-host',
      protocol: 'simplegroupchat',
      body: { content: 'hello' },
      externalEncryption: '0',
    });
    const second = await wallet.createChatNode({
      addressHost: 'bc1p-host',
      protocol: 'simplemsg',
      body: { content: 'hello again' },
      externalEncryption: '1',
    });
    const image = await wallet.createChatNode({
      addressHost: 'bc1p-host',
      protocol: 'simplefilegroupchat',
      body: { fileType: 'png' },
      externalEncryption: '0',
      fileEncryption: '0',
      attachments: [{ data: '00', fileType: 'image/png' }],
    });

    expect(first.txids).toEqual(['mock-native-chat-txid-1']);
    expect(second.txids).toEqual(['mock-native-chat-txid-2']);
    expect(image.txids).toEqual(['mock-file-txid-3', 'mock-chat-txid-3']);
  });

  it('keeps mock room focus sync offline for group and private channels', async () => {
    const store = createNativeChatStore();
    const repo = createMemoryChatRepository();
    const api = createNativeChatMockApiClient();

    await seedNativeChatMockScenario({ store, repository: repo, accountGlobalMetaId: 'qa-self' });

    const group = store.getState().channels.find((channel) => channel.id === 'qa-group');
    const privateChannel = store.getState().channels.find((channel) => channel.id === 'qa-peer');

    expect(group).toBeDefined();
    expect(privateChannel).toBeDefined();
    await expect(
      syncChannelMessages({
        accountGlobalMetaId: 'qa-self',
        channel: group!,
        apiClient: api,
        repository: repo,
        store,
      }),
    ).resolves.toHaveLength(2);
    await expect(
      syncChannelMessages({
        accountGlobalMetaId: 'qa-self',
        channel: privateChannel!,
        apiClient: api,
        repository: repo,
        store,
      }),
    ).resolves.toHaveLength(2);
  });

  it('keeps native and mock entry flags committed off', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat/page/ChatHomePage.tsx', 'utf8');

    expect(source).toContain('const ENABLE_NATIVE_IDCHAT = false');
    expect(source).toContain('const ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = false');
    expect(source).not.toContain('const ENABLE_NATIVE_IDCHAT = true');
    expect(source).not.toContain('const ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = true');
  });
});
