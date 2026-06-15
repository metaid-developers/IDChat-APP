import { describe, expect, it, jest } from '@jest/globals';
import type { NativeChatChannel } from '../../domain/types';
import { createNativeChatStore } from '../../state/useNativeChatStore';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { decryptPrivateImageHex } from '../chatCrypto';
import { sendNativeImageMessage } from '../nativeChatImageSendService';

function createChannel(overrides: Partial<NativeChatChannel> = {}): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'group-1',
    type: 'group',
    title: 'Group',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 1,
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

type MockChatNodeResult = { totalCost: number; txids?: string[]; revealTxIds?: string[] };

type MockWallet = {
  getEcdh: jest.Mock<(externalPubKey: string) => Promise<{ sharedSecret: string }>>;
  createChatNode: jest.Mock<(params: unknown) => Promise<MockChatNodeResult>>;
};

function createWallet(overrides: Partial<MockWallet> = {}): MockWallet {
  return {
    getEcdh: jest.fn<(externalPubKey: string) => Promise<{ sharedSecret: string }>>()
      .mockResolvedValue({ sharedSecret: '0123456789abcdef0123456789abcdef' }),
    createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
      .mockResolvedValue({ totalCost: 0, txids: ['file-tx-default', 'chat-tx-default'] }),
    ...overrides,
  };
}

describe('nativeChatImageSendService', () => {
  const validPublicKey = '03604d0eac7a9dd1544690c87def4b89e483547aaa79239df6b04b447666e484df';

  it('creates a pending group image then reconciles it to the chat node txid', async () => {
    const repository = createMemoryChatRepository();
    const store = createNativeChatStore();
    const channel = createChannel();
    const sendResult = createDeferred<{ totalCost: number; txids: string[] }>();
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockReturnValue(sendResult.promise),
    });

    const promise = sendNativeImageMessage({
      accountGlobalMetaId: 'self',
      channel,
      attachment: { data: '010203', fileType: 'image/png' },
      localPreviewUri: 'file:///tmp/pic.png',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 100,
    });

    expect(store.getState().messagesByChannel[channel.id]).toEqual([
      expect.objectContaining({
        kind: 'image',
        localPreviewUri: 'file:///tmp/pic.png',
        mockId: expect.any(String),
        status: 'pending',
      }),
    ]);
    await expect(repository.listMessages('self', channel.id)).resolves.toEqual([]);

    expect(wallet.createChatNode).toHaveBeenCalledWith(
      expect.objectContaining({
        addressHost: 'bc1p-host',
        protocol: 'simplefilegroupchat',
        fileEncryption: '0',
        attachments: [{ data: '010203', fileType: 'image/png' }],
      }),
    );

    sendResult.resolve({ totalCost: 0, txids: ['file-tx', 'chat-tx'] });
    const sentMessage = await promise;

    expect(sentMessage).toEqual(expect.objectContaining({
      attachmentUri: 'metafile://file-txi0',
      status: 'sent',
      txId: 'chat-tx',
    }));
    expect(store.getState().messagesByChannel[channel.id]).toEqual([
      expect.objectContaining({
        attachmentUri: 'metafile://file-txi0',
        kind: 'image',
        localPreviewUri: 'file:///tmp/pic.png',
        status: 'sent',
        txId: 'chat-tx',
      }),
    ]);
    await expect(repository.listMessages('self', channel.id)).resolves.toEqual([
      expect.objectContaining({
        attachmentUri: 'metafile://file-txi0',
        status: 'sent',
        txId: 'chat-tx',
      }),
    ]);
  });

  it('reconciles a pending group image over an already merged matching txId row', async () => {
    const repository = createMemoryChatRepository();
    const store = createNativeChatStore();
    const channel = createChannel();
    const sendResult = createDeferred<{ totalCost: number; txids: string[] }>();
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockReturnValue(sendResult.promise),
    });

    const promise = sendNativeImageMessage({
      accountGlobalMetaId: 'self',
      channel,
      attachment: { data: '010203', fileType: 'image/png' },
      localPreviewUri: 'file:///tmp/race.png',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 101,
    });

    store.getState().mergeMessages(channel.id, [
      {
        accountGlobalMetaId: 'self',
        channelId: channel.id,
        channelType: 'group',
        kind: 'image',
        content: '',
        contentType: 'image/png',
        encryption: 'aes',
        protocol: 'simplefilegroupchat',
        timestamp: 101,
        senderGlobalMetaId: 'self',
        txId: 'chat-race',
        attachmentUri: 'metafile://file-racei0',
        status: 'sent',
      },
    ]);
    expect(store.getState().messagesByChannel[channel.id]).toHaveLength(2);

    sendResult.resolve({ totalCost: 0, txids: ['file-race', 'chat-race'] });
    await promise;

    expect(store.getState().messagesByChannel[channel.id]).toEqual([
      expect.objectContaining({
        kind: 'image',
        attachmentUri: 'metafile://file-racei0',
        localPreviewUri: 'file:///tmp/race.png',
        status: 'sent',
        txId: 'chat-race',
      }),
    ]);
  });

  it('sends private image nodes with encrypted bytes and fileEncryption 1', async () => {
    const repository = createMemoryChatRepository();
    const store = createNativeChatStore();
    const secret = '0123456789abcdef0123456789abcdef';
    const wallet = createWallet({
      getEcdh: jest.fn<(externalPubKey: string) => Promise<{ sharedSecret: string }>>()
        .mockResolvedValue({ sharedSecret: secret }),
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockResolvedValue({ totalCost: 0, txids: ['file-private', 'chat-private'] }),
    });

    await sendNativeImageMessage({
      accountGlobalMetaId: 'self',
      channel: createChannel({
        id: 'peer-gm',
        type: 'private',
        title: 'Peer',
        publicKeyStr: `0x${validPublicKey.toUpperCase()}`,
      }),
      attachment: { data: '010203', fileType: 'image/png' },
      localPreviewUri: 'file:///tmp/private.png',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 102,
    });

    expect(wallet.getEcdh).toHaveBeenCalledWith(validPublicKey);
    expect(wallet.createChatNode).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol: 'simplefilemsg',
        fileEncryption: '1',
        attachments: [expect.objectContaining({ fileType: 'image/png' })],
      }),
    );

    const nodeParams = jest.mocked(wallet.createChatNode).mock.calls[0][0] as any;
    expect(nodeParams.attachments[0].data).not.toBe('010203');
    expect(decryptPrivateImageHex(nodeParams.attachments[0].data, secret)).toBe('010203');
  });

  it('rejects private image without a peer public key before creating pending state', async () => {
    const repository = createMemoryChatRepository();
    const store = createNativeChatStore();
    const channel = createChannel({
      id: 'peer-gm',
      type: 'private',
      title: 'Peer',
      publicKeyStr: undefined,
    });
    const wallet = createWallet();

    await expect(
      sendNativeImageMessage({
        accountGlobalMetaId: 'self',
        channel,
        attachment: { data: '010203', fileType: 'image/png' },
        localPreviewUri: 'file:///tmp/private.png',
        nickName: 'Alice',
        addressHost: 'bc1p-host',
        repository,
        store,
        wallet: wallet as any,
        nowSeconds: () => 103,
      }),
    ).rejects.toThrow('Missing peer chat public key');

    expect(wallet.getEcdh).not.toHaveBeenCalled();
    expect(wallet.createChatNode).not.toHaveBeenCalled();
    expect(store.getState().messagesByChannel[channel.id]).toBeUndefined();
    await expect(repository.listMessages('self', channel.id)).resolves.toEqual([]);
  });

  it('rejects private image with an invalid peer public key before ECDH', async () => {
    const repository = createMemoryChatRepository();
    const store = createNativeChatStore();
    const channel = createChannel({
      id: 'peer-gm',
      type: 'private',
      title: 'Peer',
      publicKeyStr: 'peer-pub',
    });
    const wallet = createWallet();

    await expect(
      sendNativeImageMessage({
        accountGlobalMetaId: 'self',
        channel,
        attachment: { data: '010203', fileType: 'image/png' },
        localPreviewUri: 'file:///tmp/private.png',
        nickName: 'Alice',
        addressHost: 'bc1p-host',
        repository,
        store,
        wallet: wallet as any,
        nowSeconds: () => 103,
      }),
    ).rejects.toThrow('Invalid peer chat public key');

    expect(wallet.getEcdh).not.toHaveBeenCalled();
    expect(wallet.createChatNode).not.toHaveBeenCalled();
    expect(store.getState().messagesByChannel[channel.id]).toBeUndefined();
    await expect(repository.listMessages('self', channel.id)).resolves.toEqual([]);
  });

  it('reconciles wallet failure to one failed row with an error message', async () => {
    const repository = createMemoryChatRepository();
    const store = createNativeChatStore();
    const channel = createChannel();
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockRejectedValue(new Error('wallet rejected')),
    });

    const failedMessage = await sendNativeImageMessage({
      accountGlobalMetaId: 'self',
      channel,
      attachment: { data: '010203', fileType: 'image/png' },
      localPreviewUri: 'file:///tmp/fail.png',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 104,
    });

    expect(failedMessage).toEqual(
      expect.objectContaining({
        status: 'failed',
        errorMessage: 'wallet rejected',
      }),
    );
    expect(store.getState().messagesByChannel[channel.id]).toEqual([
      expect.objectContaining({
        kind: 'image',
        localPreviewUri: 'file:///tmp/fail.png',
        status: 'failed',
        errorMessage: 'wallet rejected',
      }),
    ]);
    await expect(repository.listMessages('self', channel.id)).resolves.toEqual([
      expect.objectContaining({ status: 'failed', errorMessage: 'wallet rejected' }),
    ]);
  });
});
