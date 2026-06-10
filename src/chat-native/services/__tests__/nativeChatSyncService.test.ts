import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import { createNativeChatStore } from '../../state/useNativeChatStore';
import { createMemoryChatRepository, type NativeChatRepository } from '../../storage/chatRepository';
import { encryptGroupText, encryptPrivateText } from '../chatCrypto';
import {
  bootstrapNativeChatSync,
  handleNativeRealtimeMessage,
  markNativeChannelRead,
  markNativeChannelReadToIndex,
  syncChannelMessageWindow,
  syncChannelMessages,
  syncOlderChannelMessages,
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

  it('hydrates private latest chat rows from profile fallback before persisting channels', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const apiClient = {
      getLatestChatInfoList: jest.fn().mockResolvedValue([
        {
          type: '2',
          userInfo: {
            globalMetaId: 'peer-gm',
          },
          latestMessage: {
            content: 'private hello',
            timestamp: 200,
            protocol: 'simplemsg',
            fromGlobalMetaId: 'peer-gm',
          },
        },
      ]),
      getUserInfoByGlobalMetaId: jest.fn().mockResolvedValue({
        globalMetaId: 'peer-gm',
        name: 'Profile Peer',
        avatar: 'https://example.test/profile-peer.png',
        chatpubkey: 'profile-chat-key',
      }),
    };

    await bootstrapNativeChatSync({
      accountGlobalMetaId: 'self',
      apiClient: apiClient as any,
      repository,
      store,
    });

    expect(apiClient.getUserInfoByGlobalMetaId).toHaveBeenCalledWith('peer-gm');
    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'peer-gm',
        title: 'Profile Peer',
        avatar: 'https://example.test/profile-peer.png',
        publicKeyStr: 'profile-chat-key',
      }),
    ]);
    await expect(repository.getUserProfile('self', 'peer-gm')).resolves.toEqual(expect.objectContaining({
      name: 'Profile Peer',
      avatar: 'https://example.test/profile-peer.png',
    }));
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

  it('renders the newest local group window before server history resolves', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'group-1',
      type: 'group',
      lastMessage: {
        content: 'latest',
        kind: 'text',
        timestamp: 1000,
        index: 10,
      },
    });
    await repository.upsertMessage(createMessage({ content: 'cached-7', index: 7, timestamp: 700, txId: 'tx-7' }));
    await repository.upsertMessage(createMessage({ content: 'cached-8', index: 8, timestamp: 800, txId: 'tx-8' }));
    const historyDeferred = createDeferred<any>();
    const apiClient = {
      getGroupMessagesByIndex: jest.fn().mockReturnValue(historyDeferred.promise),
    };

    const syncPromise = syncChannelMessageWindow({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
      pageSize: 4,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(apiClient.getGroupMessagesByIndex).toHaveBeenCalledWith({
      groupId: 'group-1',
      startIndex: '7',
      size: '4',
    });
    expect(store.getState().messagesByChannel['group-1']).toEqual([
      expect.objectContaining({ content: 'cached-7', index: 7 }),
      expect.objectContaining({ content: 'cached-8', index: 8 }),
    ]);
    expect(store.getState().messageWindowsByChannel['group-1']).toEqual(expect.objectContaining({
      oldestLoadedIndex: 7,
      newestLoadedIndex: 8,
      hasMoreOlder: true,
      hasMoreNewer: true,
      loadingNewer: true,
      isAtLatest: true,
    }));

    historyDeferred.resolve({
      list: [
        {
          groupId: 'group-1',
          content: 'server-9',
          index: 9,
          timestamp: 900,
          protocol: 'simplegroupchat',
          metaId: 'sender',
          txId: 'tx-9',
        },
        {
          groupId: 'group-1',
          content: 'server-10',
          index: 10,
          timestamp: 1000,
          protocol: 'simplegroupchat',
          metaId: 'sender',
          txId: 'tx-10',
        },
      ],
    });

    const messages = await syncPromise;

    expect(messages.map((message) => message.content)).toEqual([
      'cached-7',
      'cached-8',
      'server-9',
      'server-10',
    ]);
    expect(store.getState().messageWindowsByChannel['group-1']).toEqual(expect.objectContaining({
      oldestLoadedIndex: 7,
      newestLoadedIndex: 10,
      hasMoreOlder: true,
      hasMoreNewer: false,
      loadingNewer: false,
      isAtLatest: true,
    }));
    await expect(repository.getMessageWindowState('self', 'group-1')).resolves.toEqual(expect.objectContaining({
      oldestLoadedIndex: 7,
      newestLoadedIndex: 10,
      hasMoreOlder: true,
      hasMoreNewer: false,
    }));
  });

  it('hydrates group history sender names and avatars from profile fallback', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'group-1',
      type: 'group',
      lastMessage: {
        content: 'latest',
        kind: 'text',
        timestamp: 1000,
        index: 10,
      },
    });
    const apiClient = {
      getGroupMessagesByIndex: jest.fn().mockResolvedValue({
        list: [
          {
            groupId: 'group-1',
            content: 'server-10',
            index: 10,
            timestamp: 1000,
            protocol: 'simplegroupchat',
            metaId: 'sender-gm',
            txId: 'tx-10',
          },
        ],
      }),
      getUserInfoByGlobalMetaId: jest.fn().mockResolvedValue({
        globalMetaId: 'sender-gm',
        name: 'Profile Sender',
        avatar: 'https://example.test/profile-sender.png',
      }),
    };

    const messages = await syncChannelMessageWindow({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
      pageSize: 1,
    });

    expect(apiClient.getUserInfoByGlobalMetaId).toHaveBeenCalledWith('sender-gm');
    expect(messages).toEqual([
      expect.objectContaining({
        senderName: 'Profile Sender',
        senderAvatar: 'https://example.test/profile-sender.png',
      }),
    ]);
  });

  it('opens private rooms by requesting the newest server index window', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'peer-1',
      type: 'private',
      lastMessage: {
        content: 'latest private',
        kind: 'text',
        timestamp: 2500,
        index: 25,
      },
    });
    const apiClient = {
      getPrivateMessagesByIndex: jest.fn().mockResolvedValue({ list: [] }),
    };

    await syncChannelMessageWindow({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
      pageSize: 5,
    });

    expect(apiClient.getPrivateMessagesByIndex).toHaveBeenCalledWith({
      metaId: 'self',
      otherMetaId: 'peer-1',
      startIndex: '21',
      size: '5',
    });
    expect(store.getState().messageWindowsByChannel['peer-1']).toEqual(expect.objectContaining({
      loadingNewer: false,
      isAtLatest: true,
    }));
  });

  it('loads older messages from a continuous local range before server fallback', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'group-1',
      type: 'group',
      lastMessage: {
        content: 'latest',
        kind: 'text',
        timestamp: 400,
        index: 4,
      },
    });
    await repository.upsertMessage(createMessage({ content: 'local-1', index: 1, timestamp: 100, txId: 'tx-1' }));
    await repository.upsertMessage(createMessage({ content: 'local-2', index: 2, timestamp: 200, txId: 'tx-2' }));
    store.getState().replaceMessages('group-1', [
      createMessage({ content: 'current-3', index: 3, timestamp: 300, txId: 'tx-3' }),
      createMessage({ content: 'current-4', index: 4, timestamp: 400, txId: 'tx-4' }),
    ]);
    store.getState().setMessageWindowState('group-1', {
      oldestLoadedIndex: 3,
      newestLoadedIndex: 4,
      hasMoreOlder: true,
      hasMoreNewer: false,
      loadingOlder: false,
      loadingNewer: false,
      isAtLatest: true,
    });
    const apiClient = {
      getGroupMessagesByIndex: jest.fn().mockResolvedValue({ list: [] }),
    };

    const messages = await syncOlderChannelMessages({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
      pageSize: 2,
    });

    expect(apiClient.getGroupMessagesByIndex).not.toHaveBeenCalled();
    expect(messages.map((message) => message.content)).toEqual(['local-1', 'local-2', 'current-3', 'current-4']);
    expect(store.getState().messageWindowsByChannel['group-1']).toEqual(expect.objectContaining({
      oldestLoadedIndex: 1,
      newestLoadedIndex: 4,
      hasMoreOlder: true,
      loadingOlder: false,
      isAtLatest: true,
    }));
    await expect(repository.getMessageWindowState('self', 'group-1')).resolves.toEqual(expect.objectContaining({
      oldestLoadedIndex: 1,
      newestLoadedIndex: 4,
      hasMoreOlder: true,
      hasMoreNewer: false,
    }));
  });

  it('falls back to the server when the local older range is incomplete', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'group-1',
      type: 'group',
      lastMessage: {
        content: 'latest',
        kind: 'text',
        timestamp: 400,
        index: 4,
      },
    });
    await repository.upsertMessage(createMessage({ content: 'local-1', index: 1, timestamp: 100, txId: 'tx-1' }));
    store.getState().replaceMessages('group-1', [
      createMessage({ content: 'current-3', index: 3, timestamp: 300, txId: 'tx-3' }),
      createMessage({ content: 'current-4', index: 4, timestamp: 400, txId: 'tx-4' }),
    ]);
    store.getState().setMessageWindowState('group-1', {
      oldestLoadedIndex: 3,
      newestLoadedIndex: 4,
      hasMoreOlder: true,
      hasMoreNewer: false,
      loadingOlder: false,
      loadingNewer: false,
      isAtLatest: true,
    });
    const apiClient = {
      getGroupMessagesByIndex: jest.fn().mockResolvedValue({
        list: [
          {
            groupId: 'group-1',
            content: 'server-1',
            index: 1,
            timestamp: 100,
            protocol: 'simplegroupchat',
            metaId: 'sender',
            txId: 'tx-1-server',
          },
          {
            groupId: 'group-1',
            content: 'server-2',
            index: 2,
            timestamp: 200,
            protocol: 'simplegroupchat',
            metaId: 'sender',
            txId: 'tx-2-server',
          },
        ],
      }),
    };

    const messages = await syncOlderChannelMessages({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository,
      store,
      pageSize: 2,
    });

    expect(apiClient.getGroupMessagesByIndex).toHaveBeenCalledWith({
      groupId: 'group-1',
      startIndex: '1',
      size: '2',
    });
    expect(messages.map((message) => message.content)).toEqual(['server-1', 'server-2', 'current-3', 'current-4']);
    expect(store.getState().messageWindowsByChannel['group-1']).toEqual(expect.objectContaining({
      oldestLoadedIndex: 1,
      newestLoadedIndex: 4,
      hasMoreOlder: true,
      loadingOlder: false,
    }));
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

  it('persists active realtime messages without jumping when the room is not at latest', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    store.getState().setActiveChannelId('group-1');
    store.getState().mergeChannels([
      createChannel({
        id: 'group-1',
        type: 'group',
        unreadCount: 0,
        updatedAt: 100,
      }),
    ]);
    store.getState().replaceMessages('group-1', [
      createMessage({ content: 'visible-1', index: 1, timestamp: 100, txId: 'tx-1' }),
    ]);
    store.getState().setMessageWindowState('group-1', {
      oldestLoadedIndex: 1,
      newestLoadedIndex: 1,
      hasMoreOlder: false,
      hasMoreNewer: false,
      loadingOlder: false,
      loadingNewer: false,
      isAtLatest: false,
    });

    await handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        groupId: 'group-1',
        content: 'newer group',
        index: 2,
        timestamp: 200,
        protocol: 'simplegroupchat',
        metaId: 'sender',
        txId: 'tx-2',
      },
      repository,
      store,
    });

    expect(store.getState().messagesByChannel['group-1'].map((message) => message.content)).toEqual(['visible-1']);
    await expect(repository.listMessages('self', 'group-1')).resolves.toEqual([
      expect.objectContaining({ content: 'newer group', index: 2 }),
    ]);
    expect(store.getState().messageWindowsByChannel['group-1']).toEqual(expect.objectContaining({
      hasMoreNewer: true,
      isAtLatest: false,
    }));
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

  it('marks a channel read only up to the highest visible message index', async () => {
    const store = createNativeChatStore();
    const repository = {
      ...createMemoryChatRepository(),
      saveLastReadIndex: jest.fn().mockResolvedValue(undefined),
    } as NativeChatRepository;
    const channel = createChannel({
      id: 'group-1',
      unreadCount: 4,
      lastReadIndex: 1,
      updatedAt: 500,
      serverData: { unreadMentionCount: 2 },
    });
    store.getState().mergeChannels([channel]);

    await markNativeChannelReadToIndex({
      accountGlobalMetaId: 'self',
      channel,
      messageIndex: 3,
      repository,
      store,
    });

    expect(repository.saveLastReadIndex).toHaveBeenCalledWith('self', 'group-1', 3);
    expect(store.getState().channels).toEqual([
      expect.objectContaining({
        id: 'group-1',
        unreadCount: 0,
        lastReadIndex: 3,
        serverData: expect.objectContaining({ unreadMentionCount: 0 }),
      }),
    ]);
  });
});
