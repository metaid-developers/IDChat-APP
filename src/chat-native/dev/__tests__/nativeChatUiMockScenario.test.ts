import {
  NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
  nativeChatUiMockChannels,
  nativeChatUiMockGroupInfoFixtures,
  nativeChatUiMockGroupMemberFixtures,
  nativeChatUiMockMessages,
} from '../nativeChatUiMockScenario';
import {
  NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT,
  getMessageRowViewModel,
} from '../../ui/chatUiSelectors';

describe('nativeChatUiMockScenario', () => {
  it('contains mixed private and group channels', () => {
    expect(nativeChatUiMockChannels.filter((channel) => channel.type === 'private')).toHaveLength(2);
    expect(nativeChatUiMockChannels.filter((channel) => channel.type === 'group')).toHaveLength(2);
  });

  it('provides deterministic P1.3 group info and all member roles for the UI parity mock', () => {
    const buildersChannel = nativeChatUiMockChannels.find((channel) => channel.id === 'ui-metaweb-builders');
    const buildersInfo = nativeChatUiMockGroupInfoFixtures['ui-metaweb-builders'];
    const buildersMembers = nativeChatUiMockGroupMemberFixtures['ui-metaweb-builders'];

    expect(buildersChannel).toEqual(expect.objectContaining({ type: 'group' }));
    expect(buildersInfo).toEqual(
      expect.objectContaining({
        groupAvatar: expect.stringMatching(/^https:\/\//),
        groupId: 'ui-metaweb-builders',
        memberCount: expect.any(Number),
        muted: false,
        name: 'MetaWeb Builders',
      }),
    );
    expect(buildersInfo.memberCount).toBeGreaterThanOrEqual(5);
    expect(buildersMembers).toEqual(
      expect.objectContaining({
        admins: [expect.objectContaining({ globalMetaId: 'qa-admin-gm', name: 'QA Admin' })],
        blockList: [expect.objectContaining({ globalMetaId: 'qa-blocked-gm', name: 'QA Blocked' })],
        creator: expect.objectContaining({ globalMetaId: 'qa-owner-gm', name: 'QA Owner' }),
        list: [expect.objectContaining({ globalMetaId: 'qa-member-gm', name: 'QA Member' })],
        whiteList: [expect.objectContaining({ globalMetaId: 'qa-speaker-gm', name: 'QA Speaker' })],
      }),
    );
  });

  it('keeps P1.3 group fixture identities public, non-sensitive, and QA-scoped', () => {
    const fixtureJson = JSON.stringify({
      groups: nativeChatUiMockGroupInfoFixtures,
      members: nativeChatUiMockGroupMemberFixtures,
    });
    const allMembers = Object.values(nativeChatUiMockGroupMemberFixtures).flatMap((fixture) => [
      fixture.creator,
      ...(fixture.admins || []),
      ...(fixture.whiteList || []),
      ...(fixture.list || []),
      ...(fixture.blockList || []),
    ]);

    expect(allMembers.length).toBeGreaterThanOrEqual(5);
    for (const member of allMembers) {
      expect(member.name).toMatch(/^QA /);
      expect(member.globalMetaId).toMatch(/^qa-[a-z-]+-gm$/);
      expect(member.address).toMatch(/^qa-address-/);
    }
    expect(fixtureJson).not.toMatch(/mnemonic|privateKey|private key|seed phrase|sharedSecret|shared secret|secret|token|password/i);
    expect(fixtureJson).not.toMatch(/\b(xprv|L[1-9A-HJ-NP-Za-km-z]{50,}|K[1-9A-HJ-NP-Za-km-z]{50,})\b/);
  });

  it('covers P1.2 room evidence states without live sends or secrets', () => {
    const channels = nativeChatUiMockChannels;
    const messages = nativeChatUiMockMessages;

    expect(channels.some((channel) => channel.type === 'private' && channel.publicKeyStr)).toBe(true);
    expect(channels.some((channel) => channel.type === 'private' && !channel.publicKeyStr)).toBe(true);
    expect(channels.some((channel) => channel.type === 'group')).toBe(true);

    const missingKeyPrivateChannel = channels.find((channel) => channel.type === 'private' && !channel.publicKeyStr);
    expect(missingKeyPrivateChannel).toEqual(
      expect.objectContaining({
        serverData: expect.objectContaining({
          canSend: false,
          disabledReason: 'Missing peer chat public key',
        }),
      }),
    );
    expect(
      messages.some((message) => message.channelId === missingKeyPrivateChannel?.id && message.status === 'sent'),
    ).toBe(true);

    const missingKeyReadableMessage = messages.find(
      (message) => message.channelId === missingKeyPrivateChannel?.id && message.status === 'sent',
    );
    expect(missingKeyPrivateChannel?.unreadCount).toBe(0);
    expect(missingKeyPrivateChannel?.lastReadIndex).toBe(missingKeyReadableMessage?.index);

    expect(messages.some((message) => message.content.includes('long-message-evidence'))).toBe(true);
    expect(messages.some((message) => message.kind === 'image' && message.attachmentUri?.startsWith('https://'))).toBe(true);
    expect(messages.some((message) => message.kind === 'image' && message.attachmentUri?.startsWith('ipfs://'))).toBe(true);
    expect(messages.some((message) => message.txId && message.chain === 'mvc')).toBe(true);
    expect(messages.some((message) => message.contentType === 'application/json')).toBe(true);
    expect(messages.some((message) => message.status === 'failed')).toBe(true);
    expect(JSON.stringify({ channels, messages })).not.toMatch(/mnemonic|private key|seed phrase|shared secret/i);
  });

  it('maps the redpacket placeholder fixture to unsupported row copy', () => {
    const redpacketMessage = nativeChatUiMockMessages.find(
      (message) => message.protocol === '/protocols/redpacket' && message.contentType === 'application/json',
    );

    expect(redpacketMessage).toBeDefined();

    const row = getMessageRowViewModel(redpacketMessage!, NATIVE_CHAT_UI_MOCK_ACCOUNT_ID);

    expect(row.body).toBe(NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT);
    expect(row.body).not.toBe(redpacketMessage!.content);
    expect(row.safeCopyText || undefined).toBeUndefined();
  });

  it('contains UI states needed for screenshot validation', () => {
    const messages = nativeChatUiMockMessages;
    expect(
      messages.some(
        (message) => message.senderAvatar && message.senderGlobalMetaId === NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      ),
    ).toBe(true);
    expect(
      messages.some(
        (message) => message.senderAvatar && message.senderGlobalMetaId !== NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      ),
    ).toBe(true);
    expect(messages.some((message) => message.kind === 'image')).toBe(true);
    expect(messages.some((message) => message.status === 'pending')).toBe(true);
    expect(messages.some((message) => message.status === 'failed')).toBe(true);
  });

  it('keeps channel previews aligned with each room latest message', () => {
    for (const channel of nativeChatUiMockChannels) {
      const latestMessage = nativeChatUiMockMessages
        .filter((message) => message.channelId === channel.id)
        .sort((left, right) => left.timestamp - right.timestamp)
        .at(-1);

      expect(latestMessage).toBeDefined();
      expect(channel.lastMessage?.timestamp).toBe(latestMessage?.timestamp);
      expect(channel.updatedAt).toBe(latestMessage?.timestamp);
      expect(channel.lastMessage?.senderGlobalMetaId).toBe(latestMessage?.senderGlobalMetaId);
      expect(channel.lastMessage?.content).toBe(latestMessage?.content);
    }
  });

  it('covers image previews, unread counts, and mention badges in channels', () => {
    expect(nativeChatUiMockChannels.some((channel) => channel.lastMessage?.kind === 'image')).toBe(true);
    expect(
      nativeChatUiMockMessages.some(
        (message) =>
          message.kind === 'image' &&
          message.attachmentUri?.startsWith('https://') &&
          message.localPreviewUri?.startsWith('https://'),
      ),
    ).toBe(true);
    expect(nativeChatUiMockChannels.some((channel) => channel.unreadCount > 0)).toBe(true);
    expect(
      nativeChatUiMockChannels.some((channel) => {
        const serverData = channel.serverData as { unreadMentionCount?: unknown } | undefined;
        return Number(serverData?.unreadMentionCount || 0) > 0;
      }),
    ).toBe(true);
  });

  it('keeps the conversation empty state scoped to a truly empty chat list', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/components/ConversationList.tsx', 'utf8');

    expect(source).toContain("import NewUserJoinPrompt from './NewUserJoinPrompt'");
    expect(source).toContain('channels.length === 0');
    expect(source).toContain('No matching chats');
  });

  it('keeps failed outgoing status readable on self bubbles', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/components/MessageBubble.tsx', 'utf8');

    expect(source).toContain('selfFailedText');
    expect(source).toContain('selfFailedStatusText');
  });
});
