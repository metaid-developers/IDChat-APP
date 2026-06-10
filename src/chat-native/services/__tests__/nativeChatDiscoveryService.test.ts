import {
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
});
