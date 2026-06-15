import type { NativeChatMessage } from '../../domain/types';
import { getMessageRowViewModel } from '../chatUiSelectors';
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
    ]);
  });

  it('omits tx actions for pending messages without txid', () => {
    expect(getNativeChatMessageActions(message({ status: 'pending', txId: undefined })).map((item) => item.id)).toEqual([
      'copy-text',
      'quote',
    ]);
  });

  it('does not expose red packet or MRC20 actions', () => {
    expect(getNativeChatMessageActions(message({})).some((item) => item.id.includes('mrc20'))).toBe(false);
    expect(getNativeChatMessageActions(message({})).some((item) => item.id.includes('red'))).toBe(false);
  });

  it('does not expose unimplemented buzz or translate actions by default', () => {
    const actionIds = getNativeChatMessageActions(message({ protocol: '/protocols/simplegroupchat' })).map((item) => item.id);

    expect(actionIds).not.toContain('buzz');
    expect(actionIds).not.toContain('translate');
  });

  it('keeps private text tx actions reachable without group-only buzz', () => {
    expect(
      getNativeChatMessageActions(
        message({
          channelType: 'private',
          protocol: 'simplemsg',
        }),
      ).map((item) => item.id),
    ).toEqual([
      'copy-text',
      'copy-txid',
      'open-tx',
      'quote',
    ]);
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
    ]);
  });

  it('omits copy text for unsupported row content even when raw payload exists', () => {
    const row = getMessageRowViewModel(
      message({
        content: '{"redpacket":"raw"}',
        contentType: 'application/json',
        protocol: '/protocols/redpacket',
      }),
      'self',
    );

    expect(row.safeCopyText).toBe('');
    expect(getNativeChatMessageActions(row).map((item) => item.id)).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
  });

  it('omits copy text for decrypt failure rows even when raw ciphertext exists', () => {
    const row = getMessageRowViewModel(
      message({
        content: 'U2FsdGVkX19privatepayload',
      }),
      'self',
    );

    expect(row.safeCopyText).toBe('');
    expect(getNativeChatMessageActions(row).map((item) => item.id)).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
  });

  it('uses row safe copy text while preserving tx actions for row callers', () => {
    const row = getMessageRowViewModel(message({}), 'self');

    expect(getNativeChatMessageActions(row).map((item) => item.id)).toEqual([
      'copy-text',
      'copy-txid',
      'open-tx',
      'quote',
    ]);
  });

  it('does not offer copy text for decrypt failures or unsupported messages passed directly', () => {
    expect(
      getNativeChatMessageActions(message({ content: 'U2FsdGVkX19privatepayload' })).map((item) => item.id),
    ).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
    expect(
      getNativeChatMessageActions(
        message({
          content: '{"raw":true}',
          contentType: 'application/json',
          protocol: '/protocols/redpacket',
        }),
      ).map((item) => item.id),
    ).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
  });

  it('hides open tx for unsupported chains but keeps copy txid', () => {
    expect(getNativeChatMessageActions(message({ chain: 'opcat', txId: 'opcat-tx' })).map((item) => item.id)).toEqual([
      'copy-text',
      'copy-txid',
      'quote',
    ]);
  });

  it('does not offer image actions when no renderable image uri exists', () => {
    expect(
      getNativeChatMessageActions(
        message({
          kind: 'image',
          attachmentUri: 'ipfs://not-renderable',
          contentType: 'image/png',
          protocol: 'simplefilegroupchat',
        }),
      ).map((item) => item.id),
    ).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
  });
});
