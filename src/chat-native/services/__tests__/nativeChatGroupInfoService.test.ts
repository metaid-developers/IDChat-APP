import type { NativeChatChannel } from '../../domain/types';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { loadNativeChatGroupInfo } from '../nativeChatGroupInfoService';

function createGroupChannel(overrides: Partial<NativeChatChannel> = {}): NativeChatChannel {
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

describe('nativeChatGroupInfoService', () => {
  it('normalizes web group info and member role buckets into the local cache', async () => {
    const repository = createMemoryChatRepository();
    const apiClient = {
      getGroupInfo: jest.fn().mockResolvedValue({
        groupId: 'group-1',
        name: 'Build Room',
        avatar: 'https://example.test/group.png',
        shortId: 'build',
        roomJoinType: 'public',
        announcement: 'Ship daily',
        memberCount: 5,
        muted: true,
      }),
      getGroupMembers: jest.fn().mockResolvedValue({
        creator: { globalMetaId: 'owner-gm', name: 'Owner' },
        admins: [{ globalMetaId: 'admin-gm', nickName: 'Admin' }],
        whiteList: [{ globalMetaId: 'speaker-gm', name: 'Speaker' }],
        blockList: [{ globalMetaId: 'blocked-gm', name: 'Blocked' }],
        list: [{ globalMetaId: 'member-gm', name: 'Member' }],
      }),
    };

    const result = await loadNativeChatGroupInfo({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
      channel: createGroupChannel(),
      apiClient,
      repository,
    });

    expect(apiClient.getGroupInfo).toHaveBeenCalledWith({ groupId: 'group-1' });
    expect(apiClient.getGroupMembers).toHaveBeenCalledWith({
      groupId: 'group-1',
      cursor: '0',
      size: '20',
    });
    expect(result.groupInfo).toEqual(expect.objectContaining({
      groupId: 'group-1',
      name: 'Build Room',
      avatar: 'https://example.test/group.png',
      shortId: 'build',
      announcement: 'Ship daily',
      memberCount: 5,
      muted: true,
    }));
    expect(result.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ globalMetaId: 'owner-gm', role: 'owner' }),
      expect.objectContaining({ globalMetaId: 'admin-gm', role: 'admin', name: 'Admin' }),
      expect.objectContaining({ globalMetaId: 'speaker-gm', role: 'speaker' }),
      expect.objectContaining({ globalMetaId: 'member-gm', role: 'member' }),
      expect.objectContaining({ globalMetaId: 'blocked-gm', role: 'blocked' }),
    ]));
    await expect(repository.getGroupInfo('self', 'group-1')).resolves.toEqual(expect.objectContaining({
      name: 'Build Room',
    }));
    await expect(repository.listGroupMembers('self', 'group-1')).resolves.toHaveLength(5);
  });

  it('returns local group info and members when the server path is unavailable', async () => {
    const repository = createMemoryChatRepository();
    await repository.upsertGroupInfo({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
      name: 'Cached Room',
      memberCount: 1,
      muted: false,
      updatedAt: 1000,
    });
    await repository.upsertGroupMembers([
      {
        accountGlobalMetaId: 'self',
        groupId: 'group-1',
        memberId: 'cached-gm',
        globalMetaId: 'cached-gm',
        name: 'Cached Member',
        role: 'member',
        updatedAt: 1001,
      },
    ]);
    const apiClient = {
      getGroupInfo: jest.fn().mockRejectedValue(new Error('offline')),
      getGroupMembers: jest.fn().mockRejectedValue(new Error('offline')),
    };

    await expect(loadNativeChatGroupInfo({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
      channel: createGroupChannel(),
      apiClient,
      repository,
    })).resolves.toEqual({
      groupInfo: expect.objectContaining({ name: 'Cached Room' }),
      members: [expect.objectContaining({ name: 'Cached Member' })],
      memberError: true,
      memberSource: 'cache',
      source: 'cache',
    });
  });

  it('uses the web member search endpoint and caches normalized results', async () => {
    const repository = createMemoryChatRepository();
    const apiClient = {
      getGroupInfo: jest.fn().mockResolvedValue({ groupId: 'group-1', name: 'Build Room' }),
      searchGroupMembers: jest.fn().mockResolvedValue({
        list: [
          {
            userInfo: {
              globalMetaId: 'nina-gm',
              name: 'Nina',
              avatar: 'https://example.test/nina.png',
            },
          },
        ],
      }),
    };

    const result = await loadNativeChatGroupInfo({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
      channel: createGroupChannel(),
      apiClient,
      repository,
      query: 'nina',
      size: '8',
    });

    expect(apiClient.searchGroupMembers).toHaveBeenCalledWith({
      groupId: 'group-1',
      query: 'nina',
      cursor: '0',
      size: '8',
    });
    expect(result.members).toEqual([
      expect.objectContaining({
        globalMetaId: 'nina-gm',
        name: 'Nina',
        avatar: 'https://example.test/nina.png',
        role: 'member',
      }),
    ]);
    await expect(repository.listGroupMembers('self', 'group-1', 'nina')).resolves.toEqual([
      expect.objectContaining({ globalMetaId: 'nina-gm' }),
    ]);
  });

  it('passes cursor through searched member pages', async () => {
    const repository = createMemoryChatRepository();
    const apiClient = {
      getGroupInfo: jest.fn().mockResolvedValue({ groupId: 'group-1', name: 'Build Room' }),
      searchGroupMembers: jest.fn().mockResolvedValue({
        list: [{ globalMetaId: 'nina-21', name: 'Nina 21' }],
      }),
    };

    await loadNativeChatGroupInfo({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
      channel: createGroupChannel(),
      apiClient,
      repository,
      cursor: '20',
      query: 'nina',
      size: '20',
    });

    expect(apiClient.searchGroupMembers).toHaveBeenCalledWith({
      groupId: 'group-1',
      query: 'nina',
      cursor: '20',
      size: '20',
    });
  });

  it('reports member failure separately when group info succeeds', async () => {
    const repository = createMemoryChatRepository();
    const apiClient = {
      getGroupInfo: jest.fn().mockResolvedValue({ groupId: 'group-1', name: 'Build Room' }),
      searchGroupMembers: jest.fn().mockRejectedValue(new Error('offline')),
    };

    await expect(loadNativeChatGroupInfo({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
      channel: createGroupChannel(),
      apiClient,
      repository,
      query: 'nina',
    })).resolves.toEqual({
      groupInfo: expect.objectContaining({ name: 'Build Room' }),
      members: [],
      memberError: true,
      memberSource: 'cache',
      source: 'network',
    });
  });
});
