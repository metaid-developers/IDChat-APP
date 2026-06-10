import { describe, expect, it } from '@jest/globals';
import { createNativeChatStore } from '../useNativeChatStore';
import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';

function createChannel(overrides: Partial<NativeChatChannel>): NativeChatChannel {
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

function createMessage(overrides: Partial<NativeChatMessage>): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'group-1',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 100,
    status: 'sent',
    ...overrides,
  };
}

describe('useNativeChatStore', () => {
  it('merges channels and tracks active channel messages', async () => {
    const store = createNativeChatStore();

    store.getState().setAccount('self');
    store.getState().mergeChannels([
      createChannel({ id: 'group-1' }),
    ]);
    store.getState().setActiveChannelId('group-1');
    store.getState().mergeMessages('group-1', [
      createMessage({ txId: 'tx1' }),
    ]);

    expect(store.getState().channels).toHaveLength(1);
    expect(store.getState().messagesByChannel['group-1']).toHaveLength(1);
  });

  it('merges channels by id and sorts updated channels first', async () => {
    const store = createNativeChatStore();

    store.getState().mergeChannels([
      createChannel({ id: 'group-1', title: 'Old Group', unreadCount: 1, updatedAt: 100 }),
      createChannel({ id: 'group-2', title: 'Other Group', updatedAt: 200 }),
    ]);
    store.getState().mergeChannels([
      createChannel({ id: 'group-1', title: 'New Group', unreadCount: 3, updatedAt: 300 }),
    ]);

    expect(store.getState().channels).toEqual([
      expect.objectContaining({ id: 'group-1', title: 'New Group', unreadCount: 3, updatedAt: 300 }),
      expect.objectContaining({ id: 'group-2', title: 'Other Group', updatedAt: 200 }),
    ]);
  });

  it('dedupes messages by txId and replaces existing content', async () => {
    const store = createNativeChatStore();

    store.getState().mergeMessages('group-1', [
      createMessage({ txId: 'tx1', content: 'old', timestamp: 100 }),
    ]);
    store.getState().mergeMessages('group-1', [
      createMessage({ txId: 'tx1', content: 'new', timestamp: 200 }),
    ]);

    expect(store.getState().messagesByChannel['group-1']).toEqual([
      expect.objectContaining({ txId: 'tx1', content: 'new', timestamp: 200 }),
    ]);
  });

  it('replaces channel messages for a bounded latest window', () => {
    const store = createNativeChatStore();

    store.getState().mergeMessages('group-1', [
      createMessage({ content: 'old-1', index: 1, txId: 'tx-1' }),
      createMessage({ content: 'old-2', index: 2, txId: 'tx-2' }),
    ]);
    store.getState().replaceMessages('group-1', [
      createMessage({ content: 'latest-4', index: 4, txId: 'tx-4' }),
      createMessage({ content: 'latest-3', index: 3, txId: 'tx-3' }),
    ]);

    expect(store.getState().messagesByChannel['group-1'].map((message) => message.content)).toEqual([
      'latest-3',
      'latest-4',
    ]);
  });

  it('tracks per-channel message window state independently', () => {
    const store = createNativeChatStore();

    store.getState().setMessageWindowState('group-1', {
      oldestLoadedIndex: 3,
      newestLoadedIndex: 8,
      hasMoreOlder: true,
      hasMoreNewer: false,
      loadingOlder: false,
      loadingNewer: true,
      isAtLatest: true,
    });
    store.getState().setMessageWindowState('group-1', {
      loadingNewer: false,
    });
    store.getState().setMessageWindowState('group-2', {
      loadingOlder: true,
    });

    expect(store.getState().messageWindowsByChannel['group-1']).toEqual({
      oldestLoadedIndex: 3,
      newestLoadedIndex: 8,
      hasMoreOlder: true,
      hasMoreNewer: false,
      loadingOlder: false,
      loadingNewer: false,
      isAtLatest: true,
    });
    expect(store.getState().messageWindowsByChannel['group-2']).toEqual({
      loadingOlder: true,
    });
  });

  it('replaces a matching self pending image when the sent tx row arrives before wallet resolve', async () => {
    const store = createNativeChatStore();
    store.getState().setAccount('self');

    store.getState().mergeMessages('group-1', [
      createMessage({
        kind: 'image',
        content: '',
        contentType: 'image/png',
        protocol: 'simplefilegroupchat',
        timestamp: 101,
        senderGlobalMetaId: 'self',
        mockId: 'local-image-1',
        localPreviewUri: 'file:///tmp/pending.png',
        status: 'pending',
      }),
    ]);
    store.getState().mergeMessages('group-1', [
      createMessage({
        kind: 'image',
        content: '',
        contentType: 'image/png',
        protocol: 'simplefilegroupchat',
        timestamp: 101,
        senderGlobalMetaId: 'self',
        txId: 'chat-tx-1',
        attachmentUri: 'metafile://chat-tx-1i0',
        status: 'sent',
      }),
    ]);

    expect(store.getState().messagesByChannel['group-1']).toEqual([
      expect.objectContaining({
        kind: 'image',
        txId: 'chat-tx-1',
        localPreviewUri: 'file:///tmp/pending.png',
        attachmentUri: 'metafile://chat-tx-1i0',
        status: 'sent',
      }),
    ]);
  });

  it('does not reconcile ambiguous same-second self pending images to the wrong sent row', async () => {
    const store = createNativeChatStore();
    store.getState().setAccount('self');

    store.getState().mergeMessages('group-1', [
      createMessage({
        kind: 'image',
        content: '',
        contentType: 'image/png',
        protocol: 'simplefilegroupchat',
        timestamp: 101,
        senderGlobalMetaId: 'self',
        mockId: 'local-image-1',
        localPreviewUri: 'file:///tmp/pending-1.png',
        status: 'pending',
      }),
      createMessage({
        kind: 'image',
        content: '',
        contentType: 'image/png',
        protocol: 'simplefilegroupchat',
        timestamp: 101,
        senderGlobalMetaId: 'self',
        mockId: 'local-image-2',
        localPreviewUri: 'file:///tmp/pending-2.png',
        status: 'pending',
      }),
    ]);
    store.getState().mergeMessages('group-1', [
      createMessage({
        kind: 'image',
        content: '',
        contentType: 'image/png',
        protocol: 'simplefilegroupchat',
        timestamp: 101,
        senderGlobalMetaId: 'self',
        txId: 'chat-tx-ambiguous',
        attachmentUri: 'metafile://file-tx-ambiguousi0',
        status: 'sent',
      }),
    ]);

    expect(store.getState().messagesByChannel['group-1']).toHaveLength(3);
    expect(store.getState().messagesByChannel['group-1']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mockId: 'local-image-1',
          localPreviewUri: 'file:///tmp/pending-1.png',
          status: 'pending',
        }),
        expect.objectContaining({
          mockId: 'local-image-2',
          localPreviewUri: 'file:///tmp/pending-2.png',
          status: 'pending',
        }),
        expect.objectContaining({
          txId: 'chat-tx-ambiguous',
          attachmentUri: 'metafile://file-tx-ambiguousi0',
          localPreviewUri: undefined,
          status: 'sent',
        }),
      ]),
    );
  });

  it('orders same-timestamp messages by index and deterministic dedupe key', async () => {
    const store = createNativeChatStore();

    store.getState().mergeMessages('group-1', [
      createMessage({ content: 'z', index: undefined, timestamp: 100 }),
      createMessage({ content: 'index-2', index: 2, timestamp: 100 }),
      createMessage({ content: 'a', index: undefined, timestamp: 100 }),
      createMessage({ content: 'index-1', index: 1, timestamp: 100 }),
    ]);

    expect(store.getState().messagesByChannel['group-1'].map((message) => message.content)).toEqual([
      'index-1',
      'index-2',
      'a',
      'z',
    ]);
  });

  it('clears active channel messages when account changes', () => {
    const store = createNativeChatStore();
    store.getState().setAccount('self-a');
    store.getState().mergeChannels([
      createChannel({ accountGlobalMetaId: 'self-a', id: 'group-1' }),
    ]);
    store.getState().setActiveChannelId('group-1');
    store.getState().mergeMessages('group-1', [
      {
        accountGlobalMetaId: 'self-a',
        channelId: 'group-1',
        channelType: 'group',
        kind: 'text',
        content: 'hello',
        contentType: 'text/plain',
        protocol: 'simplegroupchat',
        timestamp: 1,
        txId: 'tx1',
        status: 'sent',
      },
    ]);

    store.getState().setAccount('self-b', { displayName: 'Bob' });

    expect(store.getState().accountGlobalMetaId).toBe('self-b');
    expect(store.getState().accountDisplayName).toBe('Bob');
    expect(store.getState().activeChannelId).toBeUndefined();
    expect(store.getState().channels).toEqual([]);
    expect(store.getState().messagesByChannel).toEqual({});
  });

  it('resets display name to the default when switching accounts without a profile', () => {
    const store = createNativeChatStore();
    store.getState().setAccount('self-a', { displayName: 'Alice' });

    store.getState().setAccount('self-b');

    expect(store.getState().accountGlobalMetaId).toBe('self-b');
    expect(store.getState().accountDisplayName).toBe('IDChat User');
  });

  it('preserves same-account avatar unless a new avatar is provided', () => {
    const store = createNativeChatStore();
    store.getState().setAccount('self-a', { displayName: 'Alice', avatar: 'avatar-a' });

    store.getState().setAccount('self-a', { displayName: 'Alice Updated' });

    expect(store.getState().accountDisplayName).toBe('Alice Updated');
    expect(store.getState().accountAvatar).toBe('avatar-a');

    store.getState().setAccount('self-a', { avatar: 'avatar-b' });

    expect(store.getState().accountAvatar).toBe('avatar-b');
  });

  it('stores account address and chat public key while clearing them on account switch', () => {
    const store = createNativeChatStore();

    store.getState().setAccount('self-a', {
      address: 'mvc-address-a',
      chatPublicKey: 'chat-key-a',
      displayName: 'Alice',
    });
    store.getState().setAccount('self-a', { displayName: 'Alice Updated' });

    expect(store.getState().accountAddress).toBe('mvc-address-a');
    expect(store.getState().accountChatPublicKey).toBe('chat-key-a');

    store.getState().setAccount('self-b');

    expect(store.getState().accountAddress).toBeUndefined();
    expect(store.getState().accountChatPublicKey).toBeUndefined();
  });
});
