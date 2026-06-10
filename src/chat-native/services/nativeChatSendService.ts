import type { NativeChatChannel, NativeChatMention, NativeChatMessage } from '../domain/types';
import { buildTextNode } from './chatNodeBuilder';
import { encryptGroupText, encryptPrivateText } from './chatCrypto';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { createNativeChatStore } from '../state/useNativeChatStore';
import type { NativeChatWalletAdapter } from './chatWalletAdapter';

type NativeChatStore = ReturnType<typeof createNativeChatStore>;

type SendNativeTextMessageParams = {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  plaintext: string;
  nickName: string;
  addressHost: string;
  repository: NativeChatRepository;
  store: NativeChatStore;
  wallet: NativeChatWalletAdapter;
  nowSeconds?: () => number;
  quoteReplyPin?: string;
  mentions?: NativeChatMention[];
};

function getNowSeconds(nowSeconds?: () => number): number {
  return nowSeconds ? nowSeconds() : Math.floor(Date.now() / 1000);
}

function createMockId(channelId: string, timestamp: number): string {
  return `local:${channelId}:${timestamp}:${Math.random().toString(36).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || 'Send failed');
}

function getCreatedTxId(result: { txids?: string[]; revealTxIds?: string[] }): string | undefined {
  return result.txids?.[0] || result.revealTxIds?.[0];
}

function replaceLocalMessage(store: NativeChatStore, channelId: string, mockId: string, message: NativeChatMessage): void {
  store.setState((state) => {
    const existingMessages = state.messagesByChannel[channelId] || [];

    return {
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: [
          ...existingMessages.filter((item) => (
            item.mockId !== mockId &&
            (!message.txId || item.txId !== message.txId) &&
            (!message.pinId || item.pinId !== message.pinId)
          )),
          message,
        ].sort((a, b) => a.timestamp - b.timestamp),
      },
    };
  });
}

function assertCanSendToChannel(channel: NativeChatChannel): void {
  if (channel.type === 'private' && !channel.publicKeyStr) {
    throw new Error('Missing peer chat public key');
  }
}

async function getEncryptedText(
  channel: NativeChatChannel,
  plaintext: string,
  wallet: NativeChatWalletAdapter,
): Promise<string> {
  if (channel.type === 'private') {
    const ecdh = await wallet.getEcdh(channel.publicKeyStr as string);

    return encryptPrivateText(plaintext, ecdh.sharedSecret);
  }

  return encryptGroupText(plaintext, channel.passwordKey || channel.id.substring(0, 16));
}

export async function sendNativeTextMessage({
  accountGlobalMetaId,
  channel,
  plaintext,
  nickName,
  addressHost,
  repository,
  store,
  wallet,
  nowSeconds,
  quoteReplyPin,
  mentions,
}: SendNativeTextMessageParams): Promise<NativeChatMessage> {
  assertCanSendToChannel(channel);

  const timestamp = getNowSeconds(nowSeconds);
  const mockId = createMockId(channel.id, timestamp);
  const pendingMessage: NativeChatMessage = {
    accountGlobalMetaId,
    channelId: channel.id,
    channelType: channel.type,
    kind: 'text',
    content: plaintext,
    contentType: 'text/plain',
    encryption: channel.type === 'private' ? 'ecdh' : 'aes',
    protocol: channel.type === 'private' ? 'simplemsg' : 'simplegroupchat',
    timestamp,
    senderGlobalMetaId: accountGlobalMetaId,
    mockId,
    replyPin: quoteReplyPin,
    status: 'pending',
    raw: mentions?.length ? { mentions } : undefined,
  };

  store.getState().mergeMessages(channel.id, [pendingMessage]);

  try {
    const encryptedText = await getEncryptedText(channel, plaintext, wallet);
    const node = buildTextNode({
      channelType: channel.type,
      channelId: channel.id,
      parentGroupId: channel.parentGroupId,
      content: encryptedText,
      nickName,
      timestamp,
      replyPin: quoteReplyPin,
      mentions,
    });
    const result = await wallet.createChatNode({
      addressHost,
      protocol: node.protocol,
      body: node.body,
      externalEncryption: node.externalEncryption,
    });
    const sentMessage: NativeChatMessage = {
      ...pendingMessage,
      txId: getCreatedTxId(result),
      status: 'sent',
    };

    await repository.upsertMessage(sentMessage);
    replaceLocalMessage(store, channel.id, mockId, sentMessage);

    return sentMessage;
  } catch (error) {
    const failedMessage: NativeChatMessage = {
      ...pendingMessage,
      status: 'failed',
      errorMessage: getErrorMessage(error),
    };

    await repository.upsertMessage(failedMessage);
    replaceLocalMessage(store, channel.id, mockId, failedMessage);

    return failedMessage;
  }
}
