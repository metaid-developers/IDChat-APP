import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import { createNativeChatStore } from '../../state/useNativeChatStore';
import { createMemoryChatRepository, type NativeChatRepository } from '../../storage/chatRepository';
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
