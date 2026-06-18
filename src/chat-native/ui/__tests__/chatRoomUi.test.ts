import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import {
  getNativeChatComposerDisabledReason,
  getNativeChatRoomHeaderViewModel,
  getNativeChatRoomState,
  getSafeNativeChatQuotePreview,
} from '../chatRoomUi';

function channel(overrides: Partial<NativeChatChannel>): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'channel-1',
    type: 'group',
    title: 'Build Room',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 1,
    ...overrides,
  };
}

function message(overrides: Partial<NativeChatMessage> = {}): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'channel-1',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 1710000000,
    status: 'sent',
    ...overrides,
  };
}

describe('chatRoomUi', () => {
  it('builds private and group header identity', () => {
    expect(
      getNativeChatRoomHeaderViewModel(
        channel({
          avatar: 'avatar://lisa',
          id: 'lisa',
          title: 'Lisa Hahn',
          type: 'private',
        }),
      ),
    ).toEqual({
      avatar: 'avatar://lisa',
      infoEnabled: false,
      subtitle: 'Private chat',
      title: 'Lisa Hahn',
    });

    expect(
      getNativeChatRoomHeaderViewModel(
        channel({
          serverData: { memberCount: 128 },
          title: 'Builders',
          type: 'group',
        }),
      ),
    ).toEqual({
      avatar: undefined,
      infoEnabled: true,
      subtitle: '128 members',
      title: 'Builders',
    });
  });

  it('uses a product group fallback title instead of a raw group id', () => {
    expect(
      getNativeChatRoomHeaderViewModel(
        channel({
          id: 'raw-group-id',
          title: '   ',
          type: 'group',
        }),
      ),
    ).toEqual({
      avatar: undefined,
      infoEnabled: true,
      subtitle: 'Group chat',
      title: 'Group chat',
    });
  });

  it('uses a product group fallback title when the normalized group title equals the id', () => {
    expect(
      getNativeChatRoomHeaderViewModel(
        channel({
          id: 'raw-group-id',
          title: 'raw-group-id',
          type: 'group',
        }),
      ).title,
    ).toBe('Group chat');
  });

  it('renders member count subtitle when known', () => {
    expect(
      getNativeChatRoomHeaderViewModel(
        channel({
          serverData: { members: ['owner', 'member'] },
          title: 'Builders',
          type: 'group',
        }),
      ).subtitle,
    ).toBe('2 members');
  });

  it('renders group subtitle when member count is missing', () => {
    expect(
      getNativeChatRoomHeaderViewModel(
        channel({
          serverData: {},
          title: 'Builders',
          type: 'group',
        }),
      ).subtitle,
    ).toBe('Group chat');
  });

  it('does not enable group info for private rooms', () => {
    expect(
      getNativeChatRoomHeaderViewModel(
        channel({
          title: 'Lisa Hahn',
          type: 'private',
        }),
      ).infoEnabled,
    ).toBe(false);
  });

  it('builds missing, runtime, loading, empty, ready, and sync-failed room states', () => {
    const activeChannel = channel({});
    const messages = [message()];

    expect(
      getNativeChatRoomState({
        channel: undefined,
        channelId: 'missing',
        loadingLatest: false,
        messages: [],
        runtimeReady: true,
        syncError: undefined,
      }),
    ).toEqual({
      body: 'Return to Chats and choose a conversation.',
      kind: 'missing',
      showMessages: false,
      title: 'Chat not found',
    });

    expect(
      getNativeChatRoomState({
        channel: activeChannel,
        channelId: 'channel-1',
        loadingLatest: false,
        messages: [],
        runtimeReady: false,
        syncError: undefined,
      }),
    ).toEqual({
      body: 'Account services are still starting.',
      kind: 'runtime-unavailable',
      showMessages: false,
      title: 'Chat is loading',
    });

    expect(
      getNativeChatRoomState({
        channel: activeChannel,
        channelId: 'channel-1',
        loadingLatest: true,
        messages: [],
        runtimeReady: true,
        syncError: undefined,
      }),
    ).toEqual({
      body: 'Opening Build Room.',
      kind: 'loading',
      showMessages: false,
      title: 'Loading messages',
    });

    expect(
      getNativeChatRoomState({
        channel: activeChannel,
        channelId: 'channel-1',
        loadingLatest: false,
        messages: [],
        runtimeReady: true,
        syncError: undefined,
      }),
    ).toEqual({
      body: 'Start the conversation in Build Room.',
      kind: 'empty',
      showMessages: false,
      title: 'No messages yet',
    });

    expect(
      getNativeChatRoomState({
        channel: activeChannel,
        channelId: 'channel-1',
        loadingLatest: false,
        messages,
        runtimeReady: true,
        syncError: undefined,
      }),
    ).toEqual({
      kind: 'ready',
      showMessages: true,
      title: '',
    });

    expect(
      getNativeChatRoomState({
        channel: activeChannel,
        channelId: 'channel-1',
        loadingLatest: false,
        messages,
        runtimeReady: true,
        syncError: 'Messages could not refresh',
      }),
    ).toEqual({
      body: 'Check your connection and try again.',
      kind: 'sync-failed',
      retryLabel: 'Retry',
      showMessages: true,
      title: 'Messages could not refresh',
    });
  });

  it('explains why the composer is disabled', () => {
    expect(getNativeChatComposerDisabledReason({ channel: channel({}), runtimeReady: false }))
      .toBe('Chat is unavailable while account services load.');
    expect(getNativeChatComposerDisabledReason({
      channel: channel({ publicKeyStr: undefined, type: 'private' }),
      runtimeReady: true,
    })).toBe('Missing peer chat public key');
    expect(getNativeChatComposerDisabledReason({
      channel: channel({ serverData: { isBlocked: true } }),
      runtimeReady: true,
    })).toBe('You cannot send because this chat is blocked.');
    expect(getNativeChatComposerDisabledReason({
      channel: channel({ serverData: { isMember: false } }),
      runtimeReady: true,
    })).toBe('Join this group before sending messages.');
    expect(getNativeChatComposerDisabledReason({
      channel: channel({ serverData: { canSend: false, disabledReason: 'Admins only today.' } }),
      runtimeReady: true,
    })).toBe('Admins only today.');
    expect(getNativeChatComposerDisabledReason({
      channel: channel({ serverData: { canSend: false } }),
      runtimeReady: true,
    })).toBe('Sending is unavailable in this chat.');
  });

  it('builds safe quote previews for images, decrypt placeholders, unsupported, and long text', () => {
    expect(getSafeNativeChatQuotePreview({ body: 'metafile://image', kind: 'image' })).toBe('[Image]');
    expect(getSafeNativeChatQuotePreview({ body: 'Unable to decrypt this message', kind: 'text' }))
      .toBe('Unable to decrypt this message');
    expect(getSafeNativeChatQuotePreview({ body: '', kind: 'text' })).toBe('Unsupported message');

    const preview = getSafeNativeChatQuotePreview({
      body: 'a'.repeat(160),
      fullTxId: 'txid',
      kind: 'text',
    });

    expect(preview.length).toBeLessThanOrEqual(120);
    expect(preview.endsWith('...')).toBe(true);
  });
});
