import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { ScrollView, TextInput, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import ChatComposer, { type NativeChatComposerSendOptions } from '../../components/ChatComposer';
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
  const validPublicKey = '03604d0eac7a9dd1544690c87def4b89e483547aaa79239df6b04b447666e484df';

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

  it('includes quote and mentions in group text payloads and local rows', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      passwordKey: '1234567890abcdef',
    });
    const wallet = createWallet({
      createChatNode: jest.fn<(params: unknown) => Promise<MockChatNodeResult>>()
        .mockResolvedValue({ totalCost: 0, txids: ['tx-quote'] }),
    });

    const sentMessage = await sendNativeTextMessage({
      accountGlobalMetaId: 'self',
      channel,
      plaintext: 'reply @Alice',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository,
      store,
      wallet: wallet as any,
      nowSeconds: () => 129,
      quoteReplyPin: 'quote-pin',
      mentions: [{ globalMetaId: 'alice-gm', name: 'Alice' }],
    });

    const nodeParams = jest.mocked(wallet.createChatNode).mock.calls[0][0] as any;
    expect(nodeParams.body.replyPin).toBe('quote-pin');
    expect(nodeParams.body.mention).toEqual([{ globalMetaId: 'alice-gm', name: 'Alice' }]);
    expect(sentMessage).toEqual(expect.objectContaining({
      replyPin: 'quote-pin',
      raw: expect.objectContaining({
        mentions: [{ globalMetaId: 'alice-gm', name: 'Alice' }],
      }),
    }));
  });

  it('sends private text through ECDH and simplemsg', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'peer-gm',
      type: 'private',
      publicKeyStr: `0x${validPublicKey.toUpperCase()}`,
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

    expect(wallet.getEcdh).toHaveBeenCalledWith(validPublicKey);
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

  it('rejects private text with an invalid peer public key before ECDH', async () => {
    const store = createNativeChatStore();
    const repository = createMemoryChatRepository();
    const channel = createChannel({
      id: 'peer-gm',
      type: 'private',
      publicKeyStr: 'peer-public-key',
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
    ).rejects.toThrow('Invalid peer chat public key');

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
  it('labels the message input and preserves composer input height bounds', async () => {
    const onSend = jest.fn<(text: string, options?: NativeChatComposerSendOptions) => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, { onSend }));
    });

    const input = renderer.root.findByProps({ accessibilityLabel: 'Message input' });
    expect(input.type).toBe(TextInput);
    expect(input.props.style).toEqual(expect.objectContaining({
      maxHeight: 96,
      minHeight: 36,
    }));
  });

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

  it('sends quote metadata and clears the quote preview', async () => {
    const onSend = jest.fn<(text: string, options?: unknown) => Promise<void>>()
      .mockResolvedValue(undefined);
    const onClearQuote = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        onClearQuote,
        onSend,
        quote: {
          replyPin: 'quote-pin',
          senderName: 'Nina',
          content: 'quoted text',
        },
      }));
    });

    expect(renderer.root.findByProps({ children: 'Replying to Nina' })).toBeTruthy();
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('reply text');
    });
    await act(async () => {
      await renderer.root.findByProps({ accessibilityLabel: 'Send message' }).props.onPress();
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Clear quote' }).props.onPress();
    });

    expect(onSend).toHaveBeenCalledWith('reply text', { quoteReplyPin: 'quote-pin' });
    expect(onClearQuote).toHaveBeenCalledTimes(1);
  });

  it('inserts a group mention suggestion and sends mention metadata', async () => {
    const onSend = jest.fn<(text: string, options?: unknown) => Promise<void>>()
      .mockResolvedValue(undefined);
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        mentionSuggestions: [{ globalMetaId: 'alice-gm', name: 'Alice' }],
        mentionsEnabled: true,
        onSend,
      }));
    });

    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('hello @al');
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Mention Alice' }).props.onPress();
    });
    await act(async () => {
      await renderer.root.findByProps({ accessibilityLabel: 'Send message' }).props.onPress();
    });

    expect(onSend).toHaveBeenCalledWith('hello @Alice', {
      mentions: [{ globalMetaId: 'alice-gm', name: 'Alice' }],
    });
  });

  it('renders explicit disabled state reason and blocks sending', async () => {
    const onSend = jest.fn<(text: string, options?: NativeChatComposerSendOptions) => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        disabled: true,
        disabledReason: 'Missing peer chat public key',
        onSend,
      }));
    });

    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('blocked');
      await renderer.root.findByProps({ accessibilityLabel: 'Send message' }).props.onPress();
    });

    expect(renderer.root.findByProps({ children: 'Missing peer chat public key' })).toBeTruthy();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('keeps disabled composer controls inert across text, emoji, image, and send actions', async () => {
    const onSend = jest.fn<(text: string, options?: NativeChatComposerSendOptions) => void>();
    const onPickImage = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        disabled: true,
        disabledReason: 'Join this group before sending messages.',
        onPickImage,
        onSend,
      }));
    });

    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('blocked text');
      renderer.root.findByProps({ accessibilityLabel: 'Insert emoji' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Pick image' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Send message' }).props.onPress();
    });

    expect(onPickImage).not.toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
    expect(renderer.root.findByType(TextInput).props.value).toBe('');
    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(renderer.root.findByProps({ children: 'Join this group before sending messages.' })).toBeTruthy();
  });

  it('keeps text input events inert while a send is in flight', async () => {
    const sendResult = createDeferred<void>();
    const onSend = jest.fn<(text: string, options?: NativeChatComposerSendOptions) => Promise<void>>()
      .mockReturnValue(sendResult.promise);
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, { onSend }));
    });

    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('message');
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Send message' }).props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('mutated while sending');
    });

    expect(renderer.root.findByType(TextInput).props.value).toBe('');
    expect(onSend).toHaveBeenCalledWith('message');

    await act(async () => {
      sendResult.resolve(undefined);
      await sendResult.promise;
    });
  });

  it('does not show the full local image uri as primary preview copy', async () => {
    const onPickImage = jest.fn<() => void>();
    const onRemoveImage = jest.fn<() => void>();
    const onSend = jest.fn<(text: string, options?: NativeChatComposerSendOptions) => void>();
    const onSendImage = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        imagePreviewUri: 'file:///private/var/mobile/Containers/Data/image-secret.png',
        onPickImage,
        onRemoveImage,
        onSend,
        onSendImage,
      }));
    });

    expect(renderer.root.findByProps({ children: 'Image ready' })).toBeTruthy();
    expect(renderer.root.findAllByProps({
      children: 'file:///private/var/mobile/Containers/Data/image-secret.png',
    })).toHaveLength(0);
  });

  it('keeps image send disabled when composer is disabled', async () => {
    const onPickImage = jest.fn<() => void>();
    const onRemoveImage = jest.fn<() => void>();
    const onSend = jest.fn<(text: string, options?: NativeChatComposerSendOptions) => void>();
    const onSendImage = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        disabled: true,
        disabledReason: 'Missing peer chat public key',
        imagePreviewUri: 'file://preview.png',
        onPickImage,
        onRemoveImage,
        onSend,
        onSendImage,
      }));
    });

    await act(async () => {
      await renderer.root.findByProps({ accessibilityLabel: 'Send selected image' }).props.onPress();
    });

    expect(onSendImage).not.toHaveBeenCalled();
  });

  it('renders image preview controls for remove, replace, and send', async () => {
    const onSend = jest.fn<(text: string, options?: NativeChatComposerSendOptions) => void>();
    const onPickImage = jest.fn<() => void>();
    const onRemoveImage = jest.fn<() => void>();
    const onSendImage = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        imagePreviewUri: 'file://preview.png',
        onPickImage,
        onRemoveImage,
        onSend,
        onSendImage,
      }));
    });

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Remove selected image' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Replace selected image' }).props.onPress();
      await renderer.root.findByProps({ accessibilityLabel: 'Send selected image' }).props.onPress();
    });

    expect(renderer.root.findByProps({ children: 'Image ready' })).toBeTruthy();
    expect(onRemoveImage).toHaveBeenCalledTimes(1);
    expect(onPickImage).toHaveBeenCalledTimes(1);
    expect(onSendImage).toHaveBeenCalledTimes(1);
  });
});
