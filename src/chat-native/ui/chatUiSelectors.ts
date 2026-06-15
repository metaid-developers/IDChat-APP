import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import {
  NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
  getSafeNativeChatPreviewText,
  getSafeNativeChatText,
  looksLikeNativeChatCiphertext,
} from '../services/nativeChatDisplaySafety';
import {
  formatNativeChatClockTime,
  formatNativeChatUnreadCount,
  getNativeChatChainLabel,
  normalizeNativeChatTimestamp,
  shortenNativeChatTxId,
} from './chatUiFormatters';

export type ConversationRowViewModel = {
  id: string;
  title: string;
  avatar?: string;
  typeLabel: 'G' | 'P';
  preview: string;
  timeLabel: string;
  unreadCount: number;
  unreadLabel: string;
  mentionCount: number;
  updatedAt: number;
  raw: NativeChatChannel;
};

export type MessageRowViewModel = {
  id: string;
  isSelf: boolean;
  avatar?: string;
  senderName: string;
  body: string;
  kind: NativeChatMessage['kind'];
  timeLabel: string;
  txLabel: string;
  fullTxId: string;
  statusLabel: string;
  raw: NativeChatMessage;
};

function getConversationActivityTimestamp(channel: NativeChatChannel): number {
  return channel.lastMessage?.timestamp ?? channel.updatedAt ?? 0;
}

function getNormalizedConversationActivityTimestamp(channel: NativeChatChannel): number {
  return normalizeNativeChatTimestamp(getConversationActivityTimestamp(channel)) ?? 0;
}

function getMentionCount(channel: NativeChatChannel): number {
  const rawServerData = channel.serverData as Record<string, unknown> | undefined;
  const count = Number(rawServerData?.unreadMentionCount || 0);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

function getMessageFallbackId(message: NativeChatMessage): string {
  const stableParts = [
    message.channelId,
    message.index !== undefined ? `index:${message.index}` : `time:${message.timestamp}`,
    message.senderGlobalMetaId || 'unknown-sender',
    message.protocol || 'unknown-protocol',
    message.kind,
    message.attachmentUri || message.localPreviewUri || message.contentType || 'no-attachment',
  ];
  return stableParts.join(':');
}

function getSafeSelectorText(content: string): string {
  return getSafeNativeChatText(
    content,
    looksLikeNativeChatCiphertext(content) ? NATIVE_CHAT_DECRYPT_FAILURE_TEXT : '',
  );
}

export function getNativeChatPreviewContent(channel: NativeChatChannel): string {
  const lastMessage = channel.lastMessage;
  if (!lastMessage) return '';
  const content =
    lastMessage.kind === 'image'
      ? '[Image]'
      : getSafeNativeChatPreviewText(lastMessage.content || '');
  if (channel.type === 'group' && lastMessage.senderName) {
    return `${lastMessage.senderName}: ${content}`;
  }
  return content;
}

export function getConversationRowViewModel(channel: NativeChatChannel): ConversationRowViewModel {
  const unreadCount = Math.max(0, channel.unreadCount || 0);

  return {
    id: channel.id,
    title: channel.title,
    avatar: channel.avatar,
    typeLabel: channel.type === 'private' ? 'P' : 'G',
    preview: getNativeChatPreviewContent(channel),
    timeLabel: formatNativeChatClockTime(getConversationActivityTimestamp(channel)),
    unreadCount,
    unreadLabel: formatNativeChatUnreadCount(unreadCount),
    mentionCount: getMentionCount(channel),
    updatedAt: getConversationActivityTimestamp(channel),
    raw: channel,
  };
}

export function sortConversationRows(channels: NativeChatChannel[]): NativeChatChannel[] {
  return [...channels].sort((a, b) => {
    const aTime = getNormalizedConversationActivityTimestamp(a);
    const bTime = getNormalizedConversationActivityTimestamp(b);
    return bTime - aTime;
  });
}

export function getMessageRowViewModel(
  message: NativeChatMessage,
  accountGlobalMetaId: string,
): MessageRowViewModel {
  const txId = message.txId || message.pinId || '';
  const shortenedTxId = shortenNativeChatTxId(txId);
  const isSelf = message.senderGlobalMetaId === accountGlobalMetaId;
  const statusLabel =
    message.status === 'pending'
      ? 'Sending'
      : message.status === 'failed'
        ? 'Failed'
        : message.status === 'cancelled'
          ? 'Cancelled'
          : '';

  return {
    id:
      message.mockId ||
      message.txId ||
      message.pinId ||
      getMessageFallbackId(message),
    isSelf,
    avatar: message.senderAvatar,
    senderName: message.senderName || (isSelf ? 'You' : message.senderGlobalMetaId || 'Unknown'),
    body: message.kind === 'image' ? message.content : getSafeSelectorText(message.content),
    kind: message.kind,
    timeLabel: formatNativeChatClockTime(message.timestamp),
    txLabel: shortenedTxId ? `${getNativeChatChainLabel(message.chain)} ${shortenedTxId}` : '',
    fullTxId: txId,
    statusLabel,
    raw: message,
  };
}
