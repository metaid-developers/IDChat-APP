import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import * as chatCrypto from '../chatCrypto';
import {
  decryptMessageContentForDisplay,
  type NativeChatDecryptWallet,
} from '../chatMessageDecryption';
import { NATIVE_CHAT_DECRYPT_FAILURE_TEXT } from '../nativeChatDisplaySafety';

function channel(overrides: Partial<NativeChatChannel>): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'channel',
    type: 'private',
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
    channelType: 'private',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplechat',
    timestamp: 1710000000,
    status: 'sent',
    ...overrides,
  };
}

describe('chatMessageDecryption', () => {
  const validPublicKey = '03604d0eac7a9dd1544690c87def4b89e483547aaa79239df6b04b447666e484df';

  it('does not call wallet ECDH for invalid private peer public keys', async () => {
    const wallet: NativeChatDecryptWallet = {
      getEcdh: jest.fn(),
    };

    const result = await decryptMessageContentForDisplay(
      message({ content: 'U2FsdGVkX19privatepayload' }),
      channel({ publicKeyStr: 'peer-public-key' }),
      wallet,
    );

    expect(wallet.getEcdh).not.toHaveBeenCalled();
    expect(result.content).toBe(NATIVE_CHAT_DECRYPT_FAILURE_TEXT);
  });

  it('normalizes uppercase 0x private public keys before ECDH', async () => {
    const wallet: NativeChatDecryptWallet = {
      getEcdh: jest.fn().mockResolvedValue({ sharedSecret: 'shared-secret' }),
    };

    const result = await decryptMessageContentForDisplay(
      message({ content: chatCrypto.encryptPrivateText('private hello', 'shared-secret') }),
      channel({ publicKeyStr: `0x${validPublicKey.toUpperCase()}` }),
      wallet,
    );

    expect(wallet.getEcdh).toHaveBeenCalledWith(validPublicKey);
    expect(result.content).toBe('private hello');
  });

  it('does not surface unsafe private decrypt output', async () => {
    const wallet: NativeChatDecryptWallet = {
      getEcdh: jest.fn().mockResolvedValue({ sharedSecret: 'shared-secret' }),
    };
    jest.spyOn(chatCrypto, 'decryptPrivateText').mockReturnValueOnce('H\u001cN<');

    const result = await decryptMessageContentForDisplay(
      message({ content: 'U2FsdGVkX19privatepayload' }),
      channel({ publicKeyStr: validPublicKey }),
      wallet,
    );

    expect(result.content).toBe(NATIVE_CHAT_DECRYPT_FAILURE_TEXT);
  });

  it('does not surface long group hex when group decryption fails', async () => {
    const result = await decryptMessageContentForDisplay(
      message({
        channelType: 'group',
        content: 'a'.repeat(96),
        protocol: 'simplegroupchat',
      }),
      channel({ type: 'group', passwordKey: 'wrong-group-key1' }),
    );

    expect(result.content).toBe(NATIVE_CHAT_DECRYPT_FAILURE_TEXT);
  });

  it('keeps non-encrypted normal text unchanged when private channel cannot decrypt', async () => {
    const result = await decryptMessageContentForDisplay(
      message({ content: 'ordinary readable text' }),
      channel({ publicKeyStr: undefined }),
      undefined,
    );

    expect(result.content).toBe('ordinary readable text');
  });

  it('does not rewrite image or file attachment messages', async () => {
    const imageMessage = message({
      kind: 'image',
      content: 'U2FsdGVkX19imagepayload',
      contentType: 'image/png',
      protocol: 'simplechat',
      attachmentUri: 'metafile://image-pin',
    });
    const fileMessage = message({
      content: 'U2FsdGVkX19filepayload',
      contentType: 'application/octet-stream',
      protocol: '/protocols/simplefilemsg',
      attachmentUri: 'metafile://file-pin',
    });
    const groupFileMessage = message({
      channelType: 'group',
      content: 'a'.repeat(96),
      contentType: 'application/octet-stream',
      protocol: '/protocols/simplefilegroupchat',
      attachmentUri: 'metafile://group-file-pin',
    });

    await expect(
      decryptMessageContentForDisplay(
        imageMessage,
        channel({ publicKeyStr: 'peer-public-key' }),
        { getEcdh: jest.fn() },
      ),
    ).resolves.toBe(imageMessage);
    await expect(
      decryptMessageContentForDisplay(
        fileMessage,
        channel({ publicKeyStr: 'peer-public-key' }),
        { getEcdh: jest.fn() },
      ),
    ).resolves.toBe(fileMessage);
    await expect(
      decryptMessageContentForDisplay(groupFileMessage, channel({ type: 'group' })),
    ).resolves.toBe(groupFileMessage);
  });
});
