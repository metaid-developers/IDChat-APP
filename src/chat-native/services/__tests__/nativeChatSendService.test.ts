import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import ChatComposer from '../../components/ChatComposer';
import type { NativeChatChannel } from '../../domain/types';
import { createNativeChatStore } from '../../state/useNativeChatStore';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { decryptGroupText, decryptPrivateText } from '../chatCrypto';
import { sendNativeTextMessage } from '../nativeChatSendService';

function createChannel(overrides: Partial<NativeChatChannel> = {}): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'group-1234567890abcdef',
    type: 'group',
    title: 'Group',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 100,
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
  getPKHByPath: jest.Mock<() => Promise<string>>;
  getGlobalMetaId: jest.Mock<() => Promise<unknown>>;
  getCurrentProfile: jest.Mock<() => Promise<unknown>>;
  getEcdh: jest.Mock<(externalPubKey: string) => Promise<{ sharedSecret: string }>>;
  createPin: jest.Mock<() => Promise<unknown>>;
  createChatNode: jest.Mock<(params: unknown) => Promise<MockChatNodeResult>>;
};

function createWallet(overrides: Partial<MockWallet> = {}): MockWallet {
  return {
    getPKHByPath: jest.fn<() => Promise<string>>(),
    getGlobalMetaId: jest.fn<() => Promise<unknown>>(),
    getCurrentProfile: jest.fn<() => Promise<unknown>>(),
    getEcdh: jest.fn<(externalPubKey: string) => Promise<{ sharedSecret: string }>>()
      .mockResolvedValue({ sharedSecret: 'private-secret' }),
    createPin: jest.fn<() => Promise<unknown>>(),
    createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
      .mockResolvedValue({ totalCost: 0, txids: ['tx-default'] }),
    ...overrides,
  };
}

describe('nativeChatSendService', () => {
  it('creates a pending group message then reconciles it to one sent row', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      passwordKey: '1234567890abcdef',
    });
    const sendResult = createDeferred<{ totalCost: number; txids: string[] }>();
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockReturnValue(sendResult.promise),
    });

    const promise = sendNativeTextMessage({
      accountGlobalMetaId: 'self',
      channel,
      plaintext: 'hello group',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 123,
    });

    expect(store.getState().messagesByChannel[channel.id]).toEqual([
      expect.objectContaining({
        channelId: channel.id,
        content: 'hello group',
        mockId: expect.any(String),
        status: 'pending',
      }),
    ]);

    await Promise.resolve();

    expect(wallet.createChatNode).toHaveBeenCalledWith(
      expect.objectContaining({
        addressHost: 'bc1p-host',
        protocol: 'simplegroupchat',
        externalEncryption: '0',
      }),
    );

    const nodeParams = jest.mocked(wallet.createChatNode).mock.calls[0][0] as any;
    expect(decryptGroupText(nodeParams.body.content, '1234567890abcdef')).toBe('hello group');

    sendResult.resolve({ totalCost: 0, txids: ['tx-group'] });
    const sentMessage = await promise;

    expect(sentMessage).toEqual(expect.objectContaining({ status: 'sent', txId: 'tx-group' }));
    expect(store.getState().messagesByChannel[channel.id]).toEqual([
      expect.objectContaining({
        content: 'hello group',
        status: 'sent',
        txId: 'tx-group',
      }),
    ]);
    await expect(repository.listMessages('self', channel.id)).resolves.toEqual([
      expect.objectContaining({ status: 'sent', txId: 'tx-group' }),
    ]);
  });

  it('reconciles a pending row over an already merged matching txId row', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      passwordKey: '1234567890abcdef',
    });
    const sendResult = createDeferred<{ totalCost: number; txids: string[] }>();
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockReturnValue(sendResult.promise),
    });

    const promise = sendNativeTextMessage({
      accountGlobalMetaId: 'self',
      channel,
      plaintext: 'hello race',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 127,
    });

    await Promise.resolve();
    store.getState().mergeMessages(channel.id, [
      {
        accountGlobalMetaId: 'self',
        channelId: channel.id,
        channelType: 'group',
        kind: 'text',
        content: 'server echoed race',
        contentType: 'text/plain',
        encryption: 'aes',
        protocol: 'simplegroupchat',
        timestamp: 127,
        senderGlobalMetaId: 'self',
        txId: 'tx-race',
        status: 'sent',
      },
    ]);
    expect(store.getState().messagesByChannel[channel.id]).toHaveLength(2);

    sendResult.resolve({ totalCost: 0, txids: ['tx-race'] });
    await promise;

    const visibleMessages = store.getState().messagesByChannel[channel.id];
    expect(visibleMessages).toHaveLength(1);
    expect(visibleMessages).toEqual([
      expect.objectContaining({
        content: 'hello race',
        status: 'sent',
        txId: 'tx-race',
      }),
    ]);
  });

  it('builds sub-group text payload with parent and child channel ids', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'child-1234567890abcdef',
      type: 'sub-group',
      parentGroupId: 'parent-group',
    });
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockResolvedValue({ totalCost: 0, txids: ['tx-sub'] }),
    });

    await sendNativeTextMessage({
      accountGlobalMetaId: 'self',
      channel,
      plaintext: 'hello sub',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 128,
    });

    const nodeParams = jest.mocked(wallet.createChatNode).mock.calls[0][0] as any;
    expect(nodeParams.body.groupID).toBe('parent-group');
    expect(nodeParams.body.channelID).toBe('child-1234567890abcdef');
    expect(decryptGroupText(nodeParams.body.content, channel.id.substring(0, 16))).toBe('hello sub');
  });

  it('sends private text through ECDH and simplemsg', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'peer-gm',
      type: 'private',
      publicKeyStr: 'peer-public-key',
    });
    const wallet = createWallet({
      getEcdh: jest.fn<(externalPubKey: string) => Promise<{ sharedSecret: string }>>()
        .mockResolvedValue({ sharedSecret: 'shared-secret' }),
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockResolvedValue({ totalCost: 0, revealTxIds: ['reveal-private'] }),
    });

    const sentMessage = await sendNativeTextMessage({
      accountGlobalMetaId: 'self',
      channel,
      plaintext: 'hello private',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 124,
    });

    expect(wallet.getEcdh).toHaveBeenCalledWith('peer-public-key');
    expect(wallet.createChatNode).toHaveBeenCalledWith(
      expect.objectContaining({
        addressHost: 'bc1p-host',
        protocol: 'simplemsg',
        externalEncryption: '0',
      }),
    );
    const nodeParams = jest.mocked(wallet.createChatNode).mock.calls[0][0] as any;
    expect(decryptPrivateText(nodeParams.body.content, 'shared-secret')).toBe('hello private');
    expect(sentMessage).toEqual(expect.objectContaining({ status: 'sent', txId: 'reveal-private' }));
    expect(store.getState().messagesByChannel[channel.id]).toHaveLength(1);
  });

  it('rejects private text without a peer public key before creating pending state', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'peer-gm',
      type: 'private',
      publicKeyStr: undefined,
    });
    const wallet = createWallet();

    await expect(
      sendNativeTextMessage({
        accountGlobalMetaId: 'self',
        channel,
        plaintext: 'hello private',
        nickName: 'Alice',
        addressHost: 'bc1p-host',
        repository,
        store,
        wallet: wallet as any,
        nowSeconds: () => 125,
      }),
    ).rejects.toThrow('Missing peer chat public key');

    expect(wallet.getEcdh).not.toHaveBeenCalled();
    expect(wallet.createChatNode).not.toHaveBeenCalled();
    expect(store.getState().messagesByChannel[channel.id]).toBeUndefined();
  });

  it('reconciles wallet failure to one failed row with an error message', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel();
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockRejectedValue(new Error('wallet rejected')),
    });

    const failedMessage = await sendNativeTextMessage({
      accountGlobalMetaId: 'self',
      channel,
      plaintext: 'hello fail',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 126,
    });

    expect(failedMessage).toEqual(
      expect.objectContaining({
        status: 'failed',
        errorMessage: 'wallet rejected',
      }),
    );
    expect(store.getState().messagesByChannel[channel.id]).toEqual([
      expect.objectContaining({
        content: 'hello fail',
        status: 'failed',
        errorMessage: 'wallet rejected',
      }),
    ]);
    await expect(repository.listMessages('self', channel.id)).resolves.toEqual([
      expect.objectContaining({ status: 'failed', errorMessage: 'wallet rejected' }),
    ]);
  });
});

describe('ChatComposer', () => {
  it('restores the draft when onSend rejects before a pending row exists', async () => {
    const onSend = jest.fn<(text: string) => Promise<void>>()
      .mockRejectedValue(new Error('runtime missing'));
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, { onSend }));
    });

    const input = renderer.root.findByType(TextInput);
    await act(async () => {
      input.props.onChangeText('keep this draft');
    });

    const sendButton = renderer.root.findAllByType(TouchableOpacity)
      .find((item) => item.props.accessibilityLabel === 'Send message');

    expect(sendButton).toBeDefined();

    await act(async () => {
      await sendButton?.props.onPress();
    });

    expect(onSend).toHaveBeenCalledWith('keep this draft');
    expect(renderer.root.findByType(TextInput).props.value).toBe('keep this draft');
  });
});
