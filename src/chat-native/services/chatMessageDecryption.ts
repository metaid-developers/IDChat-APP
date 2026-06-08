import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { decryptGroupText, decryptPrivateText } from './chatCrypto';
import type { NativeChatWalletAdapter } from './chatWalletAdapter';

const FILE_PROTOCOLS = new Set(['simplefilemsg', 'simplefilegroupchat']);

export type NativeChatDecryptWallet = Pick<NativeChatWalletAdapter, 'getEcdh'>;

function shouldSkipTextDecrypt(message: NativeChatMessage): boolean {
  return (
    message.kind === 'image' ||
    FILE_PROTOCOLS.has(message.protocol.toLowerCase())
  );
}

function withDisplayContent(message: NativeChatMessage, plaintext: string): NativeChatMessage {
  return plaintext ? { ...message, content: plaintext } : message;
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
    if (!channel.publicKeyStr || typeof wallet?.getEcdh !== 'function') {
      return message;
    }

    try {
      const ecdh = await wallet.getEcdh(channel.publicKeyStr);

      return withDisplayContent(message, decryptPrivateText(message.content, ecdh.sharedSecret));
    } catch {
      return message;
    }
  }

  return withDisplayContent(
    message,
    decryptGroupText(message.content, channel.passwordKey || channel.id.substring(0, 16)),
  );
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
