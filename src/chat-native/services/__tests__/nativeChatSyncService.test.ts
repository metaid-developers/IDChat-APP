import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import { createNativeChatStore } from '../../state/useNativeChatStore';
import { createMemoryChatRepository, type NativeChatRepository } from '../../storage/chatRepository';
import { encryptGroupText, encryptPrivateText } from '../chatCrypto';
import {
  bootstrapNativeChatSync,
  handleNativeRealtimeMessage,
  markNativeChannelRead,
  syncChannelMessages,
} from '../nativeChatSyncService';

function createChannel(overrides: Partial<NativeChatChannel> = {}): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'group-1',
    type: 'group',
    title: 'Group',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 100,
    ...overrides,
  };
}

function createMessage(overrides: Partial<NativeChatMessage> = {}): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'group-1',
    channelType: 'group',
    kind: 'text',
    content: 'cached',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 100,
    status: 'sent',
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

describe('nativeChatSyncService', () => {
  it('loads latest channels and cached channels for an account', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const cachedChannel = createChannel({ id: 'cached-group', title: 'Cached Group', updatedAt: 50 });
    await repository.upsertChannel(cachedChannel);
    const apiClient = {
      getLatestChatInfoList: jest.fn().mockResolvedValue([
        {
          groupId: 'group-1',
          groupName: 'Latest Group',
          unreadCount: 2,
          latestMessage: {
            content: 'latest',
            index: 7,
            timestamp: 200,
            protocol: 'simplegroupchat',
            metaId: 'sender',
          },
        },
      ]),
    };

    await bootstrapNativeChatSync({
      accountGlobalMetaId: 'self',
      apiClient: apiClient as any,
      repository,
      store,
    });

    expect(apiClient.getLatestChatInfoList).toHaveBeenCalledWith({
      metaId: 'self',
      cursor: '0',
      size: '100',
    });
    expect(store.getState().channels).toEqual([
      expect.objectContaining({ id: 'group-1', title: 'Latest Group', unreadCount: 2 }),
      cachedChannel,
    ]);
    await expect(repository.listChannels('self')).resolves.toEqual([
      expect.objectContaining({ id: 'group-1', title: 'Latest Group' }),
      cachedChannel,
    ]);
  });

  it('does not merge cached or latest channels when bootstrap is cancelled after cache read', async () => {
    const store = createNativeChatStore();
    const cachedChannel = createChannel({ id: 'cached-group', title: 'Cached Group', updatedAt: 50 });
    let cancelled = false;
    const repository = {
      ...createMemoryChatRepository(),
      listChannels: jest.fn(async () => {
        cancelled = true;
        return [cachedChannel];
      }),
      upsertChannel: jest.fn().mockResolvedValue(undefined),
    } as NativeChatRepository;
    const apiClient = {
      getLatestChatInfoList: jest.fn().mockResolvedValue([
        {
          groupId: 'group-1',
          groupName: 'Latest Group',
          latestMessage: {
            content: 'latest',
            timestamp: 200,
            protocol: 'simplegroupchat',
            metaId: 'sender',
          },
        },
      ]),
    };

    const channels = await bootstrapNativeChatSync({
      accountGlobalMetaId: 'self',
      apiClient,
      repository,
      store,
      isCancelled: () => cancelled,
    });

    expect(channels).toEqual([]);
    expect(store.getState().channels).toEqual([]);
    expect(apiClient.getLatestChatInfoList).not.toHaveBeenCalled();
    expect(repository.upsertChannel).not.toHaveBeenCalled();
  });

  it('decrypts group latest message preview before persisting and merging bootstrap channels', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const ciphertext = encryptGroupText('decrypted latest preview', '1234567890abcdef');
    const apiClient = {
      getLatestChatInfoList: jest.fn().mockResolvedValue([
        {
          groupId: 'group-1',
          groupName: 'Latest Group',
          passwordKey: '1234567890abcdef',
          latestMessage: {
            content: ciphertext,
            timestamp: 200,
            protocol: 'simplegroupchat',
            metaId: 'sender',
          },
        },
      ]),
    };

    await bootstrapNativeChatSync({
      accountGlobalMetaId: 'self',
      apiClient: apiClient as any,
      repository,
      store,
    });

    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'group-1',
        lastMessage: expect.objectContaining({ content: 'decrypted latest preview' }),
      }),
    ]);
    await expect(repository.listChannels('self')).resolves.toEqual([
      expect.objectContaining({
        id: 'group-1',
        lastMessage: expect.objectContaining({ content: 'decrypted latest preview' }),
      }),
    ]);
  });

  it('loads group history by continuous index and merges messages', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({ id: 'group-1', type: 'group', lastReadIndex: 0 });
    const apiClient = {
      getGroupMessagesByIndex: jest.fn().mockResolvedValue({
        list: [
          {
            groupId: 'group-1',
            content: 'history',
            index: 0,
            timestamp: 300,
            protocol: 'simplegroupchat',
            metaId: 'sender',
          },
        ],
      }),
    };

    const messages = await syncChannelMessages({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
    });

    expect(apiClient.getGroupMessagesByIndex).toHaveBeenCalledWith({
      groupId: 'group-1',
      startIndex: '0',
      size: '30',
    });
    expect(messages).toEqual([
      expect.objectContaining({ channelId: 'group-1', content: 'history', index: 0 }),
    ]);
    expect(store.getState().messagesByChannel['group-1']).toEqual(messages);
  });

  it('decrypts group history text before storing and rendering merged messages', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'group-1',
      type: 'group',
      passwordKey: '1234567890abcdef',
    });
    const ciphertext = encryptGroupText('decrypted group history', '1234567890abcdef');
    const apiClient = {
      getGroupMessagesByIndex: jest.fn().mockResolvedValue({
        list: [
          {
            groupId: 'group-1',
            content: ciphertext,
            index: 1,
            timestamp: 301,
            protocol: 'simplegroupchat',
            metaId: 'sender',
          },
        ],
      }),
    };

    const messages = await syncChannelMessages({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
    });

    expect(messages).toEqual([
      expect.objectContaining({ channelId: 'group-1', content: 'decrypted group history', index: 1 }),
    ]);
    await expect(repository.listMessages('self', 'group-1')).resolves.toEqual([
      expect.objectContaining({ content: 'decrypted group history' }),
    ]);
  });

  it('leaves image and file history content unchanged', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'group-1',
      type: 'group',
      passwordKey: '1234567890abcdef',
    });
    const ciphertext = encryptGroupText('file payload should stay encrypted', '1234567890abcdef');
    const apiClient = {
      getGroupMessagesByIndex: jest.fn().mockResolvedValue({
        list: [
          {
            groupId: 'group-1',
            content: ciphertext,
            index: 1,
            timestamp: 301,
            protocol: 'simplefilegroupchat',
            attachment: { uri: 'https://example.test/file.png' },
            metaId: 'sender',
          },
        ],
      }),
    };

    const messages = await syncChannelMessages({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
    });

    expect(messages).toEqual([
      expect.objectContaining({ kind: 'image', protocol: 'simplefilegroupchat', content: ciphertext }),
    ]);
    await expect(repository.listMessages('self', 'group-1')).resolves.toEqual([
      expect.objectContaining({ content: ciphertext }),
    ]);
  });

  it('merges realtime socket messages and increments unread for inactive channels', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    store.getState().mergeChannels([
      createChannel({ id: 'group-1', unreadCount: 1, updatedAt: 100 }),
    ]);

    const message = await handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        groupId: 'group-1',
        content: 'realtime',
        index: 2,
        timestamp: 400,
        protocol: 'simplegroupchat',
        metaId: 'sender',
      },
      repository,
      store,
    });

    expect(message).toEqual(expect.objectContaining({ channelId: 'group-1', content: 'realtime' }));
    expect(store.getState().messagesByChannel['group-1']).toEqual([
      expect.objectContaining({ content: 'realtime' }),
    ]);
    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'group-1',
        unreadCount: 2,
        updatedAt: 400,
        lastMessage: expect.objectContaining({ content: 'realtime', timestamp: 400 }),
      }),
    ]);
  });

  it('decrypts private realtime text before storing and updating channel last message', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const wallet = {
      getEcdh: jest.fn().mockResolvedValue({ sharedSecret: 'shared-secret' }),
    };
    store.getState().mergeChannels([
      createChannel({
        id: 'peer-gm',
        type: 'private',
        title: 'Peer',
        publicKeyStr: 'peer-public-key',
        unreadCount: 0,
        updatedAt: 100,
      }),
    ]);

    const ciphertext = encryptPrivateText('decrypted private realtime', 'shared-secret');
    const message = await handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        fromMetaId: 'peer-gm',
        toMetaId: 'self',
        content: ciphertext,
        index: 2,
        timestamp: 401,
        protocol: 'simplemsg',
      },
      repository,
      store,
      wallet,
    } as any);

    expect(wallet.getEcdh).toHaveBeenCalledWith('peer-public-key');
    expect(message).toEqual(expect.objectContaining({ channelId: 'peer-gm', content: 'decrypted private realtime' }));
    expect(store.getState().messagesByChannel['peer-gm']).toEqual([
      expect.objectContaining({ content: 'decrypted private realtime' }),
    ]);
    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'peer-gm',
        lastMessage: expect.objectContaining({ content: 'decrypted private realtime', timestamp: 401 }),
      }),
    ]);
  });

  it('updates realtime unread and last message from current state after async private decryption', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const olderEcdh = createDeferred<{ sharedSecret: string }>();
    const newerEcdh = createDeferred<{ sharedSecret: string }>();
    const wallet = {
      getEcdh: jest.fn()
        .mockReturnValueOnce(olderEcdh.promise)
        .mockReturnValueOnce(newerEcdh.promise),
    };
    store.getState().mergeChannels([
      createChannel({
        id: 'peer-gm',
        type: 'private',
        title: 'Peer',
        publicKeyStr: 'peer-public-key',
        unreadCount: 0,
        updatedAt: 100,
      }),
    ]);

    const olderPromise = handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        fromMetaId: 'peer-gm',
        toMetaId: 'self',
        content: encryptPrivateText('older private', 'shared-secret'),
        index: 1,
        timestamp: 401,
        protocol: 'simplemsg',
      },
      repository,
      store,
      wallet,
    } as any);
    const newerPromise = handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        fromMetaId: 'peer-gm',
        toMetaId: 'self',
        content: encryptPrivateText('newer private', 'shared-secret'),
        index: 2,
        timestamp: 402,
        protocol: 'simplemsg',
      },
      repository,
      store,
      wallet,
    } as any);

    await Promise.resolve();
    newerEcdh.resolve({ sharedSecret: 'shared-secret' });
    await newerPromise;
    olderEcdh.resolve({ sharedSecret: 'shared-secret' });
    await olderPromise;

    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'peer-gm',
        unreadCount: 2,
        updatedAt: 402,
        lastMessage: expect.objectContaining({ content: 'newer private', timestamp: 402 }),
      }),
    ]);
  });

  it('updates realtime unread from current state before awaiting slow channel persistence', async () => {
    const store = createNativeChatStore();
    const baseRepository = createMemoryChatRepository();
    const channelUpsertDefers: Array<ReturnType<typeof createDeferred<void>>> = [];
    const repository = {
      ...baseRepository,
      upsertChannel: jest.fn((channel: NativeChatChannel) => {
        const deferred = createDeferred<void>();
        channelUpsertDefers.push(deferred);
        return deferred.promise;
      }),
    } as NativeChatRepository;
    store.getState().mergeChannels([
      createChannel({
        id: 'group-1',
        type: 'group',
        unreadCount: 0,
        updatedAt: 100,
      }),
    ]);

    const olderPromise = handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        groupId: 'group-1',
        content: 'older group',
        index: 1,
        timestamp: 401,
        protocol: 'simplegroupchat',
        metaId: 'sender',
      },
      repository,
      store,
    });
    const newerPromise = handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        groupId: 'group-1',
        content: 'newer group',
        index: 2,
        timestamp: 402,
        protocol: 'simplegroupchat',
        metaId: 'sender',
      },
      repository,
      store,
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(repository.upsertChannel).toHaveBeenCalledTimes(2);

    channelUpsertDefers.forEach((deferred) => deferred.resolve());
    await Promise.all([olderPromise, newerPromise]);

    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'group-1',
        unreadCount: 2,
        updatedAt: 402,
        lastMessage: expect.objectContaining({ content: 'newer group', timestamp: 402 }),
      }),
    ]);
  });

  it('marks active channel read using highest loaded index', async () => {
    const store = createNativeChatStore();
    const repository = {
      ...createMemoryChatRepository(),
      saveLastReadIndex: jest.fn().mockResolvedValue(undefined),
    } as NativeChatRepository;
    const staleChannel = createChannel({
      id: 'group-1',
      unreadCount: 4,
      lastReadIndex: 1,
      updatedAt: 100,
      lastMessage: { content: 'old', kind: 'text', timestamp: 100 },
    });
    store.getState().setActiveChannelId('group-1');
    store.getState().mergeChannels([
      createChannel({
        id: 'group-1',
        unreadCount: 4,
        lastReadIndex: 1,
        updatedAt: 500,
        lastMessage: { content: 'newer', kind: 'text', timestamp: 500 },
      }),
    ]);
    store.getState().mergeMessages('group-1', [
      createMessage({ index: 2, timestamp: 200 }),
      createMessage({ index: 5, timestamp: 500 }),
    ]);

    await markNativeChannelRead({
      accountGlobalMetaId: 'self',
      channel: staleChannel,
      repository,
      store,
    });

    expect(repository.saveLastReadIndex).toHaveBeenCalledWith('self', 'group-1', 5);
    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'group-1',
        unreadCount: 0,
        lastReadIndex: 5,
        updatedAt: 500,
        lastMessage: expect.objectContaining({ content: 'newer' }),
      }),
    ]);
  });
});
