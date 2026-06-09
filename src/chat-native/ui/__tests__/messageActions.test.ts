import type { NativeChatMessage } from '../../domain/types';
import { getNativeChatMessageActions } from '../messageActions';

function message(overrides: Partial<NativeChatMessage>): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'group',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 1710000000,
    status: 'sent',
    txId: 'tx123',
    ...overrides,
  };
}

describe('messageActions', () => {
  it('includes IDChat text actions for text messages with txid', () => {
    expect(getNativeChatMessageActions(message({})).map((item) => item.id)).toEqual([
      'copy-text',
      'copy-txid',
      'open-tx',
      'quote',
      'buzz',
      'translate',
    ]);
  });

  it('omits tx actions for pending messages without txid', () => {
    expect(getNativeChatMessageActions(message({ status: 'pending', txId: undefined })).map((item) => item.id)).toEqual([
      'copy-text',
      'quote',
      'buzz',
      'translate',
    ]);
  });

  it('does not expose red packet or MRC20 actions', () => {
    expect(getNativeChatMessageActions(message({})).some((item) => item.id.includes('mrc20'))).toBe(false);
    expect(getNativeChatMessageActions(message({})).some((item) => item.id.includes('red'))).toBe(false);
  });

  it('keeps group share actions for protocol path values', () => {
    expect(getNativeChatMessageActions(message({ protocol: '/protocols/simplegroupchat' })).map((item) => item.id)).toContain('buzz');
  });

  it('includes image view and save entries without text-only actions', () => {
    expect(
      getNativeChatMessageActions(
        message({
          kind: 'image',
          content: 'metafile://image-txid',
          contentType: 'image/png',
          protocol: 'simplefilegroupchat',
        }),
      ).map((item) => item.id),
    ).toEqual([
      'view-image',
      'save-image',
      'copy-txid',
      'open-tx',
      'quote',
      'buzz',
    ]);
  });
});
