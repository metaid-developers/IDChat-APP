import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import { NATIVE_CHAT_DECRYPT_FAILURE_TEXT } from '../../services/nativeChatDisplaySafety';
import {
  getConversationRowViewModel,
  getMessageRowViewModel,
  getMessageRowViewModels,
  NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT,
  sortConversationRows,
} from '../chatUiSelectors';

function channel(overrides: Partial<NativeChatChannel>): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'channel',
    type: 'group',
    title: 'Channel',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 1,
    ...overrides,
  };
}

function message(overrides: Partial<NativeChatMessage>): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'channel',
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

describe('chatUiSelectors', () => {
  it('keeps private and group channels in one recency-sorted list', () => {
    const rows = sortConversationRows([
      channel({ id: 'private-1', type: 'private', updatedAt: 10 }),
      channel({ id: 'group-1', type: 'group', updatedAt: 20 }),
    ]);
    expect(rows.map((row) => row.id)).toEqual(['group-1', 'private-1']);
  });

  it('sorts mixed second and millisecond timestamps by normalized recency', () => {
    const rows = sortConversationRows([
      channel({ id: 'seconds', updatedAt: 1710000001 }),
      channel({ id: 'milliseconds', updatedAt: 1710000000001 }),
    ]);
    expect(rows.map((row) => row.id)).toEqual(['seconds', 'milliseconds']);
  });

  it('builds group preview with sender name and image placeholder', () => {
    const row = getConversationRowViewModel(
      channel({
        type: 'group',
        title: 'MetaWeb Builders',
        lastMessage: {
          content: 'metafile://x',
          kind: 'image',
          timestamp: 1710000000,
          senderName: 'Nina',
        },
        unreadCount: 3,
      }),
    );
    expect(row.typeLabel).toBe('Group chat');
    expect(row.preview).toBe('Nina: [Image]');
    expect(row.unreadCount).toBe(3);
  });

  it('falls back to product group title when the group title is empty or whitespace', () => {
    expect(
      getConversationRowViewModel(
        channel({ id: 'raw-group-id', title: '', type: 'group' }),
      ).title,
    ).toBe('Group chat');
    expect(
      getConversationRowViewModel(
        channel({ id: 'raw-group-id', title: '   ', type: 'group' }),
      ).title,
    ).toBe('Group chat');
  });

  it('falls back to product group title when the normalized group title equals the id', () => {
    expect(
      getConversationRowViewModel(
        channel({ id: 'raw-group-id', title: 'raw-group-id', type: 'group' }),
      ).title,
    ).toBe('Group chat');
  });

  it('keeps group image avatar when one is available', () => {
    const row = getConversationRowViewModel(
      channel({
        avatar: 'https://example.test/group.png',
        title: 'MetaWeb Builders',
        type: 'group',
      }),
    );

    expect(row.avatar).toBe('https://example.test/group.png');
  });

  it('uses a scannable group context label instead of raw group ids', () => {
    const row = getConversationRowViewModel(
      channel({ id: 'raw-group-id', title: 'MetaWeb Builders', type: 'group' }),
    );

    expect(row.typeLabel).toBe('Group chat');
    expect(row.typeLabel).not.toBe('raw-group-id');
  });

  it('uses safe text for private ciphertext previews', () => {
    const row = getConversationRowViewModel(
      channel({
        type: 'private',
        lastMessage: {
          content: 'U2FsdGVkX19privatepayload',
          kind: 'text',
          timestamp: 1710000000,
        },
      }),
    );

    expect(row.preview).toBe('Message unavailable');
  });

  it('uses product text for normalized decrypt failure previews', () => {
    const row = getConversationRowViewModel(
      channel({
        type: 'private',
        lastMessage: {
          content: NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
          kind: 'text',
          timestamp: 1710000000,
        },
      }),
    );

    expect(row.preview).toBe('Message unavailable');
  });

  it('keeps group sender name visible when preview content is encrypted', () => {
    const row = getConversationRowViewModel(
      channel({
        type: 'group',
        lastMessage: {
          content: 'a'.repeat(96),
          kind: 'text',
          timestamp: 1710000000,
          senderName: 'Nina',
        },
      }),
    );

    expect(row.preview).toBe('Nina: Message unavailable');
  });

  it('keeps group preview sender context without raw ciphertext or JSON', () => {
    const encryptedRow = getConversationRowViewModel(
      channel({
        type: 'group',
        lastMessage: {
          content: 'U2FsdGVkX19groupsecret',
          kind: 'text',
          timestamp: 1710000000,
          senderName: 'Nina',
        },
      }),
    );
    const jsonRow = getConversationRowViewModel(
      channel({
        type: 'group',
        lastMessage: {
          content: '{"redpacket":"raw"}',
          kind: 'text',
          timestamp: 1710000001,
          senderName: 'Nina',
        },
      }),
    );

    expect(encryptedRow.preview).toBe('Nina: Message unavailable');
    expect(encryptedRow.preview).not.toContain('U2FsdGVkX19groupsecret');
    expect(jsonRow.preview).toBe('Nina: Message unavailable');
    expect(jsonRow.preview).not.toContain('{"redpacket"');
  });

  it('preserves unread count while adding a capped unread label', () => {
    const row = getConversationRowViewModel(
      channel({
        unreadCount: 1250,
      }),
    );

    expect(row.unreadCount).toBe(1250);
    expect(row.unreadLabel).toBe('999+');
  });

  it('keeps malformed mention counts at zero', () => {
    const row = getConversationRowViewModel(
      channel({
        serverData: { unreadMentionCount: 'not-a-number' },
      }),
    );
    expect(row.mentionCount).toBe(0);
  });

  it('builds self message metadata with tx label and outgoing avatar requirement', () => {
    const row = getMessageRowViewModel(
      message({
        senderGlobalMetaId: 'self',
        senderName: 'Me',
        senderAvatar: 'avatar://me',
        txId: 'a8d142e9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76990b',
        chain: 'mvc',
      }),
      'self',
    );
    expect(row.isSelf).toBe(true);
    expect(row.avatar).toBe('avatar://me');
    expect(row.txLabel).toBe('MVC a8d1...90b');
    expect(row.statusLabel).toBe('');
  });

  it('keeps peer avatar and sender name for incoming group messages', () => {
    const row = getMessageRowViewModel(
      message({
        senderGlobalMetaId: 'peer',
        senderName: 'Nina Xu',
        senderAvatar: 'avatar://nina',
        txId: 'f41342e9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76972e',
      }),
      'self',
    );
    expect(row.isSelf).toBe(false);
    expect(row.avatar).toBe('avatar://nina');
    expect(row.senderName).toBe('Nina Xu');
    expect(row.txLabel).toBe('MVC f413...72e');
  });

  it('groups consecutive same-sender messages without hiding the first group sender label', () => {
    const rows = getMessageRowViewModels(
      [
        message({ senderGlobalMetaId: 'peer', senderName: 'Nina', timestamp: 1000, index: 1 }),
        message({ senderGlobalMetaId: 'peer', senderName: 'Nina', timestamp: 1060, index: 2 }),
        message({ senderGlobalMetaId: 'self', senderName: 'You', timestamp: 1120, index: 3 }),
        message({ senderGlobalMetaId: 'self', senderName: 'You', timestamp: 1180, index: 4 }),
      ],
      'self',
    );

    expect(rows.map((row) => ({
      id: row.id,
      showSenderLabel: row.showSenderLabel,
      showAvatar: row.showAvatar,
      isGroupedWithPrevious: row.isGroupedWithPrevious,
    }))).toEqual([
      expect.objectContaining({ showSenderLabel: true, showAvatar: true, isGroupedWithPrevious: false }),
      expect.objectContaining({ showSenderLabel: false, showAvatar: false, isGroupedWithPrevious: true }),
      expect.objectContaining({ showSenderLabel: false, showAvatar: true, isGroupedWithPrevious: false }),
      expect.objectContaining({ showSenderLabel: false, showAvatar: false, isGroupedWithPrevious: true }),
    ]);
  });

  it('uses status label while pending tx is unavailable', () => {
    const row = getMessageRowViewModel(message({ status: 'pending', txId: undefined }), 'self');
    expect(row.txLabel).toBe('');
    expect(row.statusLabel).toBe('Sending');
  });

  it('does not use message body text directly as the fallback row id', () => {
    const row = getMessageRowViewModel(message({ content: 'mutable display text' }), 'self');
    expect(row.id).not.toContain('mutable display text');
    expect(row.id).toContain('channel');
  });

  it('uses safe text for encrypted message bodies', () => {
    const row = getMessageRowViewModel(
      message({ content: 'U2FsdGVkX19privatepayload' }),
      'self',
    );

    expect(row.body).toBe('Unable to decrypt this message');
  });

  it('does not copy raw ciphertext from decrypt failure message bodies', () => {
    const row = getMessageRowViewModel(
      message({ content: 'U2FsdGVkX19privatepayload' }),
      'self',
    );

    expect(row.body).toBe('Unable to decrypt this message');
    expect(row.safeCopyText).toBe('');
  });

  it('contains unsupported room body content without raw protocol or payload text', () => {
    const row = getMessageRowViewModel(
      message({
        content: '{"redpacket":"raw"}',
        contentType: 'application/json',
        protocol: '/protocols/redpacket',
      }),
      'self',
    );

    expect(row.body).toBe(NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT);
    expect(row.safeCopyText).toBe('');
    expect(row.isUnsupported).toBe(true);
  });

  it('keeps long text as readable body content while bounding metadata separately', () => {
    const longText = `Line one ${'abc'.repeat(80)}\nLine two with emoji 🙂`;
    const row = getMessageRowViewModel(message({ content: longText }), 'self');

    expect(row.body).toBe(longText);
    expect(row.safeCopyText).toBe(longText);
  });

  it('keeps normalized decrypt failure text for message bodies', () => {
    const row = getMessageRowViewModel(
      message({ content: NATIVE_CHAT_DECRYPT_FAILURE_TEXT }),
      'self',
    );

    expect(row.body).toBe('Unable to decrypt this message');
  });

  it('uses the unsupported placeholder for encrypted file message bodies', () => {
    const row = getMessageRowViewModel(
      message({
        content: 'U2FsdGVkX19filepayload',
        contentType: 'application/octet-stream',
        protocol: '/protocols/simplefilemsg',
      }),
      'self',
    );

    expect(row.body).toBe(NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT);
    expect(row.safeCopyText).toBe('');
  });

  it('uses the unsupported placeholder for non-ciphertext file URI message bodies', () => {
    const row = getMessageRowViewModel(
      message({
        content: 'metafile://file-pin',
        contentType: 'application/octet-stream',
        protocol: '/protocols/simplefilemsg',
      }),
      'self',
    );

    expect(row.body).toBe(NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT);
    expect(row.safeCopyText).toBe('');
  });
});
