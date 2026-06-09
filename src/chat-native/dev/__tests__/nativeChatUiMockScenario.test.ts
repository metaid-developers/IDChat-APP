import {
  NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
  nativeChatUiMockChannels,
  nativeChatUiMockMessages,
} from '../nativeChatUiMockScenario';

describe('nativeChatUiMockScenario', () => {
  it('contains mixed private and group channels', () => {
    expect(nativeChatUiMockChannels.filter((channel) => channel.type === 'private')).toHaveLength(1);
    expect(nativeChatUiMockChannels.filter((channel) => channel.type === 'group')).toHaveLength(2);
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
