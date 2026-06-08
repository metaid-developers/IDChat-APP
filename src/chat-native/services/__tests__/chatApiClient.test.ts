import { NativeChatApiClient } from '../chatApiClient';
import { normalizeLatestChatInfoItem, normalizeSocketMessage } from '../chatNormalizers';

describe('NativeChatApiClient', () => {
  it('calls latest-chat-info-list with the existing backend route shape', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: { list: [] } }),
    })) as any;
    const client = new NativeChatApiClient('https://api.idchat.io/chat-api', fetcher);

    await client.getLatestChatInfoList({ metaId: 'gm1' });

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.idchat.io/chat-api/group-chat/user/latest-chat-info-list?metaId=gm1&cursor=0&size=100',
      { method: 'GET' },
    );
  });

  it('calls indexed history endpoints with backend-compatible params', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: { list: [] } }),
    })) as any;
    const client = new NativeChatApiClient('https://api.idchat.io/chat-api/', fetcher);

    await client.getGroupMessagesByIndex({ groupId: 'group 1' });
    await client.getChannelMessagesByIndex({ channelId: 'sub/1' });
    await client.getPrivateMessagesByIndex({ metaId: 'gm1', otherMetaId: 'peer-gm' });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'https://api.idchat.io/chat-api/group-chat/group-chat-list-by-index?groupId=group+1&startIndex=0&size=30',
      { method: 'GET' },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://api.idchat.io/chat-api/group-chat/channel-chat-list-by-index?channelId=sub%2F1&startIndex=0&size=30',
      { method: 'GET' },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      'https://api.idchat.io/chat-api/group-chat/private-chat-list-by-index?metaId=gm1&otherMetaId=peer-gm&startIndex=0&size=30',
      { method: 'GET' },
    );
  });

  it('calls timestamp fallback history endpoints and returns response data', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: { list: [{ txId: 'tx1' }], nextTimestamp: 10, total: 1 } }),
    })) as any;
    const client = new NativeChatApiClient('https://api.idchat.io/chat-api', fetcher);

    await expect(client.getGroupMessages({ groupId: 'group-1', metaId: 'gm1' })).resolves.toEqual({
      list: [{ txId: 'tx1' }],
      nextTimestamp: 10,
      total: 1,
    });
    await client.getChannelMessages({ channelId: 'sub-1', metaId: 'gm1' });
    await client.getPrivateMessages({ metaId: 'gm1', otherMetaId: 'peer-gm' });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'https://api.idchat.io/chat-api/group-chat/group-chat-list-v2?groupId=group-1&metaId=gm1&cursor=0&size=30&timestamp=0',
      { method: 'GET' },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://api.idchat.io/chat-api/group-chat/channel-chat-list-v3?channelId=sub-1&metaId=gm1&cursor=0&size=30&timestamp=0',
      { method: 'GET' },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      'https://api.idchat.io/chat-api/group-chat/private-chat-list?metaId=gm1&otherMetaId=peer-gm&cursor=0&size=30&timestamp=0',
      { method: 'GET' },
    );
  });

  it('preserves direct history response payloads without data wrapping', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => ({ list: [{ txId: 'direct-tx' }], nextTimestamp: 30, total: 1 }),
    })) as any;
    const client = new NativeChatApiClient('https://api.idchat.io/chat-api', fetcher);

    await expect(client.getGroupMessagesByIndex({ groupId: 'group-1' })).resolves.toEqual({
      list: [{ txId: 'direct-tx' }],
      nextTimestamp: 30,
      total: 1,
    });
  });
});

describe('chat normalizers', () => {
  it('normalizes private latest chat records with top-level latest fields', () => {
    expect(
      normalizeLatestChatInfoItem(
        {
          type: '2',
          content: 'hello',
          chatType: 0,
          timestamp: 10,
          index: 7,
          userInfo: {
            globalMetaId: 'peer-gm',
            name: 'Peer',
            avatar: 'peer-avatar',
            chatPublicKey: 'pub',
          },
        },
        'self-gm',
      ),
    ).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      id: 'peer-gm',
      type: 'private',
      title: 'Peer',
      avatar: 'peer-avatar',
      publicKeyStr: 'pub',
      updatedAt: 10,
      lastMessage: {
        content: 'hello',
        kind: 'text',
        timestamp: 10,
      },
      lastReadIndex: 0,
    });
  });

  it('normalizes group latest chat records with nested latest fields', () => {
    expect(
      normalizeLatestChatInfoItem(
        {
          type: '1',
          groupId: 'group-1',
          roomName: 'Group',
          latestMessage: {
            content: 'group hello',
            chatType: 3,
            timestamp: 20,
            globalMetaId: 'sender-gm',
          },
        },
        'self-gm',
      ),
    ).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      id: 'group-1',
      type: 'group',
      title: 'Group',
      updatedAt: 20,
      lastMessage: {
        content: 'group hello',
        kind: 'image',
        timestamp: 20,
        senderGlobalMetaId: 'sender-gm',
      },
    });
  });

  it('normalizes sub-group history payloads by preferring channel id variants', () => {
    expect(
      normalizeSocketMessage(
        {
          groupID: 'group-1',
          channelID: 'sub-1',
          content: 'cipher',
          protocol: 'simplegroupchat',
          userInfo: { globalMetaId: 'sender-gm' },
          txId: 'tx1',
          index: 7,
          timestamp: 30,
        },
        'self-gm',
      ),
    ).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      channelId: 'sub-1',
      channelType: 'sub-group',
      kind: 'text',
      protocol: 'simplegroupchat',
      senderGlobalMetaId: 'sender-gm',
      txId: 'tx1',
      index: 7,
      timestamp: 30,
    });
  });

  it('normalizes private message channel ids as the account counterpart', () => {
    expect(
      normalizeSocketMessage(
        {
          fromGlobalMetaId: 'self-gm',
          toGlobalMetaId: 'peer-gm',
          content: 'outgoing',
          protocol: 'simplemsg',
        },
        'self-gm',
      ),
    ).toMatchObject({
      channelId: 'peer-gm',
      channelType: 'private',
      senderGlobalMetaId: 'self-gm',
    });

    expect(
      normalizeSocketMessage(
        {
          fromGlobalMetaId: 'peer-gm',
          toGlobalMetaId: 'self-gm',
          content: 'incoming',
          protocol: 'simplefilemsg',
          attachment: 'metafile://image',
        },
        'self-gm',
      ),
    ).toMatchObject({
      channelId: 'peer-gm',
      channelType: 'private',
      kind: 'image',
      senderGlobalMetaId: 'peer-gm',
    });
  });

  it('treats chatType 3, file protocols, attachments, and fileType as image messages', () => {
    expect(normalizeSocketMessage({ groupId: 'group-1', chatType: 3 }, 'self-gm')).toMatchObject({
      kind: 'image',
      channelId: 'group-1',
    });
    expect(
      normalizeSocketMessage({ groupID: 'group-2', protocol: 'simplefilegroupchat' }, 'self-gm'),
    ).toMatchObject({
      kind: 'image',
      channelId: 'group-2',
    });
    expect(normalizeSocketMessage({ metanetId: 'group-3', fileType: 'png' }, 'self-gm')).toMatchObject({
      kind: 'image',
      channelId: 'group-3',
    });
  });

  it('does not treat an empty attachments array as an image message', () => {
    expect(
      normalizeSocketMessage({ groupId: 'group-1', content: 'plain text', attachments: [] }, 'self-gm'),
    ).toMatchObject({
      kind: 'text',
      channelId: 'group-1',
      content: 'plain text',
    });
  });
});
