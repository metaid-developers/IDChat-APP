import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { decryptGroupText, decryptPrivateText } from './chatCrypto';
import { normalizeNativeChatPublicKey } from './chatPublicKey';
import type { NativeChatWalletAdapter } from './chatWalletAdapter';
import {
  NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
  getProductSafeNativeChatError,
  getSafeNativeChatText,
  looksLikeNativeChatCiphertext,
} from './nativeChatDisplaySafety';

const FILE_PROTOCOLS = new Set([
  'simplefilemsg',
  'simplefilegroupchat',
  '/protocols/simplefilemsg',
  '/protocols/simplefilegroupchat',
]);

export type NativeChatDecryptWallet = Pick<NativeChatWalletAdapter, 'getEcdh'>;

function shouldSkipTextDecrypt(message: NativeChatMessage): boolean {
  return (
    message.kind === 'image' ||
    FILE_PROTOCOLS.has(message.protocol.toLowerCase())
  );
}

function withDisplayContent(message: NativeChatMessage, plaintext: string): NativeChatMessage {
  const safeText = getSafeNativeChatText(
    plaintext || message.content,
    looksLikeNativeChatCiphertext(message.content)
      ? NATIVE_CHAT_DECRYPT_FAILURE_TEXT
      : message.content,
  );
  return safeText === message.content ? message : { ...message, content: safeText };
}

export async function decryptMessageContentForDisplay(
  message: NativeChatMessage,
  channel: NativeChatChannel,
  wallet?: NativeChatDecryptWallet,
): Promise<NativeChatMessage> {
  if (shouldSkipTextDecrypt(message)) {
    return message;
  }

  if (channel.type === 'private') {
    const publicKey = normalizeNativeChatPublicKey(channel.publicKeyStr);
    if (!publicKey || typeof wallet?.getEcdh !== 'function') {
      return looksLikeNativeChatCiphertext(message.content)
        ? { ...message, content: NATIVE_CHAT_DECRYPT_FAILURE_TEXT }
        : message;
    }

    try {
      const ecdh = await wallet.getEcdh(publicKey);

      return withDisplayContent(message, decryptPrivateText(message.content, ecdh.sharedSecret));
    } catch (error) {
      return looksLikeNativeChatCiphertext(message.content)
        ? {
            ...message,
            content: getProductSafeNativeChatError(error, NATIVE_CHAT_DECRYPT_FAILURE_TEXT),
          }
        : message;
    }
  }

  try {
    return withDisplayContent(
      message,
      decryptGroupText(message.content, channel.passwordKey || channel.id.substring(0, 16)),
    );
  } catch (error) {
    return looksLikeNativeChatCiphertext(message.content)
      ? {
          ...message,
          content: getProductSafeNativeChatError(error, NATIVE_CHAT_DECRYPT_FAILURE_TEXT),
        }
      : message;
  }
}

export async function decryptChannelLastMessageForDisplay(
  channel: NativeChatChannel,
  wallet?: NativeChatDecryptWallet,
): Promise<NativeChatChannel> {
  if (!channel.lastMessage) {
    return channel;
  }

  const decryptedMessage = await decryptMessageContentForDisplay(
    {
      accountGlobalMetaId: channel.accountGlobalMetaId,
      channelId: channel.id,
      channelType: channel.type,
      kind: channel.lastMessage.kind,
      content: channel.lastMessage.content,
      contentType: channel.lastMessage.kind === 'image' ? 'image' : 'text/plain',
      protocol: '',
      timestamp: channel.lastMessage.timestamp,
      senderGlobalMetaId: channel.lastMessage.senderGlobalMetaId,
      status: 'sent',
    },
    channel,
    wallet,
  );

  if (decryptedMessage.content === channel.lastMessage.content) {
    return channel;
  }

  return {
    ...channel,
    lastMessage: {
      ...channel.lastMessage,
      content: decryptedMessage.content,
    },
  };
}
