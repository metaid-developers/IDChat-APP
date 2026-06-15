import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import {
  hydrateNativeChatChannels,
  hydrateNativeChatMessages,
} from '../nativeChatProfileService';

function createPrivateChannel(overrides: Partial<NativeChatChannel> = {}): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'peer-gm',
    type: 'private',
    title: 'peer-gm',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 100,
    ...overrides,
  };
}

function createGroupMessage(overrides: Partial<NativeChatMessage> = {}): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'group-1',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 100,
    senderGlobalMetaId: 'sender-gm',
    status: 'sent',
    ...overrides,
  };
}

describe('nativeChatProfileService', () => {
  const pinId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefi0';
  const resolvedPinAvatar =
    'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/' +
    `${pinId}?x-oss-process=image/auto-orient,1/quality,q_80/resize,m_lfit,w_128`;

  it('hydrates private channels from the local profile cache before fetching', async () => {
    const repository = createMemoryChatRepository();
    await repository.upsertUserProfile({
      accountGlobalMetaId: 'self',
      profileKey: 'peer-gm',
      globalMetaId: 'peer-gm',
      name: 'Cached Peer',
      avatar: 'https://example.test/cached-peer.png',
      chatPublicKey: 'cached-chat-key',
      updatedAt: 1000,
    });
    const apiClient = {
      getUserInfoByGlobalMetaId: jest.fn(),
    };

    const channels = await hydrateNativeChatChannels({
      accountGlobalMetaId: 'self',
      channels: [createPrivateChannel()],
      apiClient,
      repository,
    });

    expect(apiClient.getUserInfoByGlobalMetaId).not.toHaveBeenCalled();
    expect(channels).toEqual([
      expect.objectContaining({
        id: 'peer-gm',
        title: 'Cached Peer',
        avatar: 'https://example.test/cached-peer.png',
        publicKeyStr: 'cached-chat-key',
      }),
    ]);
  });

  it('fetches and caches missing private channel profiles with bounded fallback data', async () => {
    const repository = createMemoryChatRepository();
    const apiClient = {
      getUserInfoByGlobalMetaId: jest.fn().mockResolvedValue({
        globalMetaId: 'peer-gm',
        metaid: 'peer-metaid',
        name: 'Fetched Peer',
        avatar: 'https://example.test/fetched-peer.png',
        chatpubkey: 'fetched-chat-key',
      }),
    };

    const channels = await hydrateNativeChatChannels({
      accountGlobalMetaId: 'self',
      channels: [createPrivateChannel()],
      apiClient,
      repository,
    });

    expect(apiClient.getUserInfoByGlobalMetaId).toHaveBeenCalledWith('peer-gm');
    expect(channels).toEqual([
      expect.objectContaining({
        title: 'Fetched Peer',
        avatar: 'https://example.test/fetched-peer.png',
        publicKeyStr: 'fetched-chat-key',
      }),
    ]);
    await expect(repository.getUserProfile('self', 'peer-gm')).resolves.toEqual(expect.objectContaining({
      name: 'Fetched Peer',
      avatar: 'https://example.test/fetched-peer.png',
      chatPublicKey: 'fetched-chat-key',
    }));
  });

  it('normalizes fetched private profile metafile avatars before storing and applying them', async () => {
    const repository = createMemoryChatRepository();
    const apiClient = {
      getUserInfoByGlobalMetaId: jest.fn().mockResolvedValue({
        globalMetaId: 'peer-gm',
        name: 'Fetched Peer',
        avatar: `metafile://${pinId}`,
      }),
    };

    const channels = await hydrateNativeChatChannels({
      accountGlobalMetaId: 'self',
      channels: [createPrivateChannel()],
      apiClient,
      repository,
    });

    expect(channels).toEqual([
      expect.objectContaining({
        title: 'Fetched Peer',
        avatar: resolvedPinAvatar,
      }),
    ]);
    await expect(repository.getUserProfile('self', 'peer-gm')).resolves.toEqual(expect.objectContaining({
      avatar: resolvedPinAvatar,
      avatarImage: resolvedPinAvatar,
    }));
  });

  it('does not let cached default placeholder avatars overwrite existing usable channel avatars', async () => {
    const repository = createMemoryChatRepository();
    await repository.upsertUserProfile({
      accountGlobalMetaId: 'self',
      profileKey: 'peer-gm',
      globalMetaId: 'peer-gm',
      name: 'Cached Peer',
      avatar: 'https://static.test/default_avatar.png',
      updatedAt: 1000,
    });

    const channels = await hydrateNativeChatChannels({
      accountGlobalMetaId: 'self',
      channels: [
        createPrivateChannel({
          avatar: 'https://example.test/existing.png',
        }),
      ],
      repository,
    });

    expect(channels).toEqual([
      expect.objectContaining({
        title: 'Cached Peer',
        avatar: 'https://example.test/existing.png',
      }),
    ]);
  });

  it('hydrates group message sender names and avatars from payload profiles before API fallback', async () => {
    const repository = createMemoryChatRepository();
    const apiClient = {
      getUserInfoByGlobalMetaId: jest.fn(),
    };
    const messages = [
      createGroupMessage({
        senderName: 'Payload Sender',
        senderAvatar: 'https://example.test/payload.png',
      }),
    ];

    const hydratedMessages = await hydrateNativeChatMessages({
      accountGlobalMetaId: 'self',
      messages,
      apiClient,
      repository,
    });

    expect(apiClient.getUserInfoByGlobalMetaId).not.toHaveBeenCalled();
    expect(hydratedMessages).toEqual([
      expect.objectContaining({
        senderName: 'Payload Sender',
        senderAvatar: 'https://example.test/payload.png',
      }),
    ]);
    await expect(repository.getUserProfile('self', 'sender-gm')).resolves.toEqual(expect.objectContaining({
      name: 'Payload Sender',
      avatar: 'https://example.test/payload.png',
    }));
  });

  it('normalizes payload group sender avatars before writing the repository cache', async () => {
    const repository = createMemoryChatRepository();
    const messages = [
      createGroupMessage({
        senderName: 'Payload Sender',
        senderAvatar: `/content/${pinId}`,
      }),
    ];

    const hydratedMessages = await hydrateNativeChatMessages({
      accountGlobalMetaId: 'self',
      messages,
      repository,
    });

    expect(hydratedMessages).toEqual([
      expect.objectContaining({
        senderAvatar: resolvedPinAvatar,
      }),
    ]);
    await expect(repository.getUserProfile('self', 'sender-gm')).resolves.toEqual(expect.objectContaining({
      avatar: resolvedPinAvatar,
      avatarImage: resolvedPinAvatar,
    }));
  });

  it('hydrates group message sender names and avatars from cached or fetched profiles', async () => {
    const repository = createMemoryChatRepository();
    await repository.upsertUserProfile({
      accountGlobalMetaId: 'self',
      profileKey: 'cached-gm',
      globalMetaId: 'cached-gm',
      name: 'Cached Sender',
      avatar: 'https://example.test/cached.png',
      updatedAt: 1000,
    });
    const apiClient = {
      getUserInfoByGlobalMetaId: jest.fn().mockResolvedValue({
        globalMetaId: 'fetched-gm',
        name: 'Fetched Sender',
        avatar: 'https://example.test/fetched.png',
      }),
    };
    const messages = [
      createGroupMessage({ senderGlobalMetaId: 'cached-gm', index: 1 }),
      createGroupMessage({ senderGlobalMetaId: 'fetched-gm', index: 2 }),
    ];

    const hydratedMessages = await hydrateNativeChatMessages({
      accountGlobalMetaId: 'self',
      messages,
      apiClient,
      repository,
    });

    expect(apiClient.getUserInfoByGlobalMetaId).toHaveBeenCalledWith('fetched-gm');
    expect(hydratedMessages).toEqual([
      expect.objectContaining({
        senderName: 'Cached Sender',
        senderAvatar: 'https://example.test/cached.png',
      }),
      expect.objectContaining({
        senderName: 'Fetched Sender',
        senderAvatar: 'https://example.test/fetched.png',
      }),
    ]);
  });
});
