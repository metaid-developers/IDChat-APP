import {
  createNativePrivateChatFromDiscovery,
  loadNativeChatOnlineBots,
  searchNativeChatDiscovery,
} from '../nativeChatDiscoveryService';

describe('nativeChatDiscoveryService', () => {
  it('normalizes mixed remote group and user search results for native discovery', async () => {
    const apiClient = {
      searchGroupsAndUsers: jest.fn().mockResolvedValue({
        list: [
          {
            type: 'group',
            groupId: 'group-1',
            groupName: 'Builders',
            memberCount: 12,
            avatar: 'https://example.test/group.png',
          },
          {
            type: 'user',
            globalMetaId: 'peer-gm',
            name: 'Alice',
            avatarImage: 'https://example.test/alice.png',
          },
        ],
      }),
    };

    await expect(searchNativeChatDiscovery({ apiClient, query: ' build ' })).resolves.toEqual([
      {
        id: 'group-1',
        type: 'group',
        title: 'Builders',
        subtitle: '12 members',
        avatar: 'https://example.test/group.png',
        raw: expect.objectContaining({ groupId: 'group-1' }),
      },
      {
        id: 'peer-gm',
        type: 'private',
        title: 'Alice',
        subtitle: 'peer-gm',
        avatar: 'https://example.test/alice.png',
        raw: expect.objectContaining({ globalMetaId: 'peer-gm' }),
      },
    ]);
    expect(apiClient.searchGroupsAndUsers).toHaveBeenCalledWith({ query: 'build' });
  });

  it('does not call remote search for blank queries', async () => {
    const apiClient = {
      searchGroupsAndUsers: jest.fn(),
    };

    await expect(searchNativeChatDiscovery({ apiClient, query: '   ' })).resolves.toEqual([]);
    expect(apiClient.searchGroupsAndUsers).not.toHaveBeenCalled();
  });

  it('normalizes online users into chat-capable bot entries', async () => {
    const apiClient = {
      getOnlineUsers: jest.fn().mockResolvedValue({
        total: 3,
        cursor: 0,
        size: 100,
        onlineWindowSeconds: 60,
        list: [
          {
            globalMetaId: 'bot-gm',
            lastSeenAt: 1000,
            lastSeenAgoSeconds: 7,
            deviceCount: 2,
            userInfo: {
              name: 'Helper Bot',
              avatar: 'https://example.test/bot.png',
              chatPublicKey: 'bot-chat-key',
              bio: { primaryProvider: 'gpt' },
            },
          },
          {
            globalMetaId: 'bot-gm',
            userInfo: {
              name: 'Duplicate Bot',
              chatPublicKey: 'bot-chat-key',
            },
          },
          {
            globalMetaId: 'viewer-gm',
            userInfo: {
              name: 'Viewer Without Chat Key',
            },
          },
        ],
      }),
    };

    await expect(loadNativeChatOnlineBots({ apiClient })).resolves.toEqual({
      total: 3,
      cursor: 0,
      size: 100,
      onlineWindowSeconds: 60,
      bots: [
        {
          globalMetaId: 'bot-gm',
          name: 'Helper Bot',
          avatar: 'https://example.test/bot.png',
          bio: 'LLM:gpt',
          chatPublicKey: 'bot-chat-key',
          lastSeenAt: 1000,
          lastSeenAgoSeconds: 7,
          deviceCount: 2,
          raw: expect.objectContaining({ globalMetaId: 'bot-gm' }),
        },
      ],
    });
    expect(apiClient.getOnlineUsers).toHaveBeenCalledWith({ cursor: '0', size: '100' });
  });

  it('creates and caches a native private channel for chat-capable discovery users', async () => {
    const apiClient = {
      getUserInfoByGlobalMetaId: jest.fn().mockResolvedValue({
        globalMetaId: 'peer-gm',
        metaid: 'peer-metaid',
        name: 'Alice',
        avatar: 'https://example.test/alice.png',
        chatpubkey: 'peer-chat-key',
        chatpubkeyId: 'peer-chat-key-id',
      }),
    };
    const repository = {
      upsertChannel: jest.fn().mockResolvedValue(undefined),
      upsertUserProfile: jest.fn().mockResolvedValue(undefined),
    };

    const channel = await createNativePrivateChatFromDiscovery({
      accountGlobalMetaId: 'self-gm',
      apiClient,
      repository,
      targetGlobalMetaId: 'peer-gm',
    });

    expect(channel).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      id: 'peer-gm',
      type: 'private',
      title: 'Alice',
      avatar: 'https://example.test/alice.png',
      publicKeyStr: 'peer-chat-key',
      unreadCount: 0,
      lastReadIndex: 0,
    });
    expect(repository.upsertUserProfile).toHaveBeenCalledWith(expect.objectContaining({
      accountGlobalMetaId: 'self-gm',
      profileKey: 'peer-gm',
      chatPublicKey: 'peer-chat-key',
    }));
    expect(repository.upsertChannel).toHaveBeenCalledWith(channel);
  });

  it('does not create private channels for users without a chat public key', async () => {
    const apiClient = {
      getUserInfoByGlobalMetaId: jest.fn().mockResolvedValue({
        globalMetaId: 'peer-gm',
        name: 'No Chat Key',
      }),
    };
    const repository = {
      upsertChannel: jest.fn().mockResolvedValue(undefined),
      upsertUserProfile: jest.fn().mockResolvedValue(undefined),
    };

    await expect(createNativePrivateChatFromDiscovery({
      accountGlobalMetaId: 'self-gm',
      apiClient,
      repository,
      targetGlobalMetaId: 'peer-gm',
    })).rejects.toThrow('Private chat is unavailable for this user');
    expect(repository.upsertChannel).not.toHaveBeenCalled();
  });
});
