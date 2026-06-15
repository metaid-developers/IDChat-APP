import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { buildImageNode } from './chatNodeBuilder';
import type { createNativeChatStore } from '../state/useNativeChatStore';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { NativeChatAttachmentItem, NativeChatWalletAdapter } from './chatWalletAdapter';
import { normalizeNativeChatPublicKey } from './chatPublicKey';
import { encryptImageAttachmentForChannel, fileExtensionFromMime } from './nativeChatImageService';

type NativeChatStore = ReturnType<typeof createNativeChatStore>;

type SendNativeImageMessageParams = {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  attachment: NativeChatAttachmentItem;
  localPreviewUri: string;
  nickName: string;
  addressHost: string;
  repository: NativeChatRepository;
  store: NativeChatStore;
  wallet: Pick<NativeChatWalletAdapter, 'createChatNode' | 'getEcdh'>;
  nowSeconds?: () => number;
  quoteReplyPin?: string;
};

function getNowSeconds(nowSeconds?: () => number): number {
  return nowSeconds ? nowSeconds() : Math.floor(Date.now() / 1000);
}

function createMockId(channelId: string, timestamp: number): string {
  return `local-image:${channelId}:${timestamp}:${Math.random().toString(36).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || 'Image send failed');
}

function getCreatedChatTxId(result: { txids?: string[]; revealTxIds?: string[] }): string | undefined {
  return result.txids?.[1] || result.revealTxIds?.[1] || result.txids?.[0] || result.revealTxIds?.[0];
}

function getCreatedFileTxId(result: { txids?: string[]; revealTxIds?: string[] }): string | undefined {
  return result.txids?.[0] || result.revealTxIds?.[0];
}

function getAttachmentUri(result: { txids?: string[]; revealTxIds?: string[] }): string | undefined {
  const fileTxId = getCreatedFileTxId(result);

  return fileTxId ? `metafile://${fileTxId}i0` : undefined;
}

function replaceLocalMessage(store: NativeChatStore, channelId: string, mockId: string, message: NativeChatMessage): void {
  store.setState((state) => {
    const existingMessages = state.messagesByChannel[channelId] || [];
    const existingMatch = existingMessages.find((item) => (
      item.mockId === mockId ||
      Boolean(message.txId && item.txId === message.txId) ||
      Boolean(message.pinId && item.pinId === message.pinId)
    ));
    const mergedMessage: NativeChatMessage = {
      ...existingMatch,
      ...message,
      attachmentUri: message.attachmentUri || existingMatch?.attachmentUri,
      localPreviewUri: message.localPreviewUri || existingMatch?.localPreviewUri,
    };

    return {
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: [
          ...existingMessages.filter((item) => (
            item.mockId !== mockId &&
            (!message.txId || item.txId !== message.txId) &&
            (!message.pinId || item.pinId !== message.pinId)
          )),
          mergedMessage,
        ].sort((a, b) => a.timestamp - b.timestamp),
      },
    };
  });
}

function assertCanSendImage(
  channel: NativeChatChannel,
  wallet: Pick<NativeChatWalletAdapter, 'getEcdh'>,
): string | undefined {
  if (channel.type !== 'private') {
    return undefined;
  }

  if (!channel.publicKeyStr) {
    throw new Error('Missing peer chat public key');
  }

  if (typeof wallet.getEcdh !== 'function') {
    throw new Error('Missing wallet ECDH support');
  }

  const publicKey = normalizeNativeChatPublicKey(channel.publicKeyStr);
  if (!publicKey) {
    throw new Error('Invalid peer chat public key');
  }

  return publicKey;
}

async function encryptAttachment(
  channel: NativeChatChannel,
  attachment: NativeChatAttachmentItem,
  wallet: Pick<NativeChatWalletAdapter, 'getEcdh'>,
  privatePublicKey?: string,
): Promise<NativeChatAttachmentItem> {
  if (channel.type === 'private') {
    const ecdh = await wallet.getEcdh(privatePublicKey as string);

    return encryptImageAttachmentForChannel({
      attachment,
      channel,
      sharedSecret: ecdh.sharedSecret,
    });
  }

  return encryptImageAttachmentForChannel({ attachment, channel });
}

export async function sendNativeImageMessage({
  accountGlobalMetaId,
  channel,
  attachment,
  localPreviewUri,
  nickName,
  addressHost,
  repository,
  store,
  wallet,
  nowSeconds,
  quoteReplyPin,
}: SendNativeImageMessageParams): Promise<NativeChatMessage> {
  const privatePublicKey = assertCanSendImage(channel, wallet);

  const timestamp = getNowSeconds(nowSeconds);
  const mockId = createMockId(channel.id, timestamp);
  const fileType = fileExtensionFromMime(attachment.fileType);
  const node = buildImageNode({
    channelType: channel.type,
    channelId: channel.id,
    parentGroupId: channel.parentGroupId,
    fileType,
    nickName,
    timestamp,
    replyPin: quoteReplyPin,
  });
  const pendingMessage: NativeChatMessage = {
    accountGlobalMetaId,
    channelId: channel.id,
    channelType: channel.type,
    kind: 'image',
    content: '',
    contentType: attachment.fileType,
    encryption: 'aes',
    protocol: node.protocol,
    timestamp,
    senderGlobalMetaId: accountGlobalMetaId,
    mockId,
    localPreviewUri,
    replyPin: quoteReplyPin,
    status: 'pending',
  };

  store.getState().mergeMessages(channel.id, [pendingMessage]);

  try {
    const encryptedAttachment = await encryptAttachment(
      channel,
      attachment,
      wallet,
      privatePublicKey,
    );
    const result = await wallet.createChatNode({
      addressHost,
      protocol: node.protocol,
      body: node.body,
      externalEncryption: node.externalEncryption,
      fileEncryption: node.fileEncryption,
      attachments: [encryptedAttachment],
    });
    const sentMessage: NativeChatMessage = {
      ...pendingMessage,
      attachmentUri: getAttachmentUri(result),
      txId: getCreatedChatTxId(result),
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
