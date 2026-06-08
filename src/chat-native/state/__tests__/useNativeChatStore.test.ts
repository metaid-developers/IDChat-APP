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
});
