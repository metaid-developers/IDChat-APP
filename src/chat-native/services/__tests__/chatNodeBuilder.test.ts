import * as CreatePin from '@/webs/actions/create-pin';
import { CHAT_PROTOCOL } from '../../domain/protocol';
import { buildChatMetaidData, buildImageNode, buildTextNode } from '../chatNodeBuilder';
import { createNativeChatWalletAdapter } from '../chatWalletAdapter';

jest.mock('@/webs/actions/common/ecdh', () => ({
  process: jest.fn(),
}));

jest.mock('@/webs/actions/lib/query/get-pkh-by-path', () => ({
  process: jest.fn(),
}));

jest.mock('@/webs/actions/create-pin', () => ({
  process: jest.fn(),
}));

describe('chatNodeBuilder', () => {
  it('builds a web-compatible group text node', () => {
    const node = buildTextNode({
      channelType: 'group',
      channelId: 'group-1',
      content: 'encrypted',
      nickName: 'Alice',
      timestamp: 100,
    });

    expect(node.protocol).toBe(CHAT_PROTOCOL.SIMPLE_GROUP_CHAT);
    expect(node.body).toMatchObject({
      groupID: 'group-1',
      channelID: undefined,
      content: 'encrypted',
      contentType: 'text/plain',
      encryption: 'aes',
    });
    expect(node.externalEncryption).toBe('0');
  });

  it('builds a web-compatible private text node', () => {
    const node = buildTextNode({
      channelType: 'private',
      channelId: 'peer-gm',
      content: 'encrypted',
      nickName: 'Alice',
      timestamp: 100,
    });

    expect(node.protocol).toBe(CHAT_PROTOCOL.SIMPLE_MSG);
    expect(node.body).toMatchObject({
      to: 'peer-gm',
      content: 'encrypted',
      contentType: 'text/plain',
      encrypt: 'ecdh',
    });
    expect(node.externalEncryption).toBe('0');
  });

  it('builds a web-compatible group image node for sub-groups', () => {
    const node = buildImageNode({
      channelType: 'sub-group',
      channelId: 'sub-1',
      parentGroupId: 'group-1',
      fileType: 'png',
      nickName: 'Alice',
      timestamp: 100,
    });

    expect(node.protocol).toBe(CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT);
    expect(node.fileEncryption).toBe('0');
    expect(node.body).toMatchObject({
      groupId: 'group-1',
      channelId: 'sub-1',
      fileType: 'png',
      attachment: '',
    });
  });

  it('builds a web-compatible group image node for plain groups', () => {
    const node = buildImageNode({
      channelType: 'group',
      channelId: 'group-1',
      fileType: 'jpg',
      nickName: 'Alice',
      timestamp: 100,
    });

    expect(node.protocol).toBe(CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT);
    expect(node.fileEncryption).toBe('0');
    expect(node.timestamp).toBe(100000);
    expect(node.externalEncryption).toBe('0');
    expect(node.body).toMatchObject({
      groupId: 'group-1',
      channelId: '',
      fileType: 'jpg',
      attachment: '',
      encrypt: 'aes',
    });
  });

  it('builds a web-compatible private image node', () => {
    const node = buildImageNode({
      channelType: 'private',
      channelId: 'peer-gm',
      fileType: 'png',
      nickName: 'Alice',
      timestamp: 100,
    });

    expect(node.protocol).toBe(CHAT_PROTOCOL.SIMPLE_FILE_MSG);
    expect(node.fileEncryption).toBe('1');
    expect(node.body).toMatchObject({
      to: 'peer-gm',
      fileType: 'png',
      attachment: '',
    });
  });

  it('builds create metaid data for chat protocol nodes', () => {
    const node = buildTextNode({
      channelType: 'private',
      channelId: 'peer-gm',
      content: 'encrypted',
      nickName: 'Alice',
      timestamp: 100,
    });

    const metaidData = buildChatMetaidData('bc1p-host', node);

    expect(metaidData).toMatchObject({
      operation: 'create',
      path: 'bc1p-host:/protocols/simplemsg',
      contentType: 'application/json',
      encryption: '0',
      encoding: 'utf-8',
    });
    expect(metaidData.body).toBe(JSON.stringify(node.body));
  });

  it('builds create metaid data for image protocol nodes', () => {
    const privateNode = buildImageNode({
      channelType: 'private',
      channelId: 'peer-gm',
      fileType: 'png',
      nickName: 'Alice',
      timestamp: 100,
    });
    const groupNode = buildImageNode({
      channelType: 'group',
      channelId: 'group-1',
      fileType: 'jpg',
      nickName: 'Alice',
      timestamp: 100,
    });

    const privateMetaidData = buildChatMetaidData('bc1p-host', privateNode);
    const groupMetaidData = buildChatMetaidData('bc1p-host', groupNode);

    expect(privateMetaidData.path).toBe('bc1p-host:/protocols/simplefilemsg');
    expect(groupMetaidData.path).toBe('bc1p-host:/protocols/simplefilegroupchat');
    expect(privateMetaidData.body).toBe(JSON.stringify(privateNode.body));
    expect(JSON.parse(privateMetaidData.body)).toMatchObject({
      to: 'peer-gm',
      fileType: 'png',
      attachment: '',
    });
  });

  it('creates chat nodes through the wallet adapter using mvc create pin data', async () => {
    const createPinResult = { totalCost: 0 };
    jest.mocked(CreatePin.process).mockResolvedValue(createPinResult);

    const body = {
      to: 'peer-gm',
      fileType: 'png',
      attachment: '',
      contentType: 'image/png',
    };

    await expect(
      createNativeChatWalletAdapter().createChatNode({
        addressHost: 'bc1p-host',
        protocol: CHAT_PROTOCOL.SIMPLE_FILE_MSG,
        body,
        externalEncryption: '0',
        fileEncryption: '1',
      }),
    ).resolves.toBe(createPinResult);

    expect(CreatePin.process).toHaveBeenCalledWith({
      chain: 'mvc',
      dataList: [
        {
          metaidData: {
            operation: 'create',
            path: 'bc1p-host:/protocols/simplefilemsg',
            body: JSON.stringify(body),
            contentType: 'image/png',
            encryption: '0',
            encoding: 'utf-8',
          },
        },
      ],
    });
  });
});
