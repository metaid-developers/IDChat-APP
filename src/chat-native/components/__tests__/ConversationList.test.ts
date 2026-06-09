import { describe, expect, it } from '@jest/globals';
import type { NativeChatChannel } from '../../domain/types';
import { getNativeChatPreviewContent } from '../../ui/chatUiSelectors';

function createChannel(lastMessage?: NativeChatChannel['lastMessage']): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'channel-1',
    type: 'group',
    title: 'Group',
    lastMessage,
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 1,
  };
}

describe('ConversationList', () => {
  it('keeps text previews readable', () => {
    expect(
      getNativeChatPreviewContent(
        createChannel({
          content: 'hello',
          kind: 'text',
          timestamp: 1,
        }),
      ),
    ).toBe('hello');
  });

  it('does not expose raw metafile uris for image previews', () => {
    expect(
      getNativeChatPreviewContent(
        createChannel({
          content: 'metafile://file-txi0',
          kind: 'image',
          timestamp: 1,
        }),
      ),
    ).toBe('[Image]');
  });
});
