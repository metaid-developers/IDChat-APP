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
  typeLabel: 'Group chat' | 'Private chat';
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
  showSenderLabel?: boolean;
  showAvatar?: boolean;
  isGroupedWithPrevious?: boolean;
  isUnsupported?: boolean;
  safeCopyText?: string;
  raw: NativeChatMessage;
};

export const NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT = 'Unsupported message';

const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;
const TEXT_CONTENT_TYPES = new Set(['', 'text/plain', 'text']);
const TEXT_PROTOCOLS = new Set([
  '',
  'simplemsg',
  'simplegroupchat',
  '/protocols/simplemsg',
  '/protocols/simplegroupchat',
]);

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

function getConversationTitle(channel: NativeChatChannel): string {
  const title = channel.title.trim();
  if (title && !(channel.type !== 'private' && title === channel.id)) {
    return title;
  }

  return channel.type === 'private' ? 'Private chat' : 'Group chat';
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

function normalizeProtocol(protocol: string | undefined): string {
  return (protocol || '').trim().toLowerCase();
}

function normalizeContentType(contentType: string | undefined): string {
  return (contentType || '').split(';')[0].trim().toLowerCase();
}

function isSupportedTextMessage(message: NativeChatMessage): boolean {
  return (
    message.kind === 'text' &&
    TEXT_CONTENT_TYPES.has(normalizeContentType(message.contentType)) &&
    TEXT_PROTOCOLS.has(normalizeProtocol(message.protocol))
  );
}

function isUnsupportedRoomMessage(message: NativeChatMessage): boolean {
  if (message.kind === 'image') {
    return false;
  }

  return !isSupportedTextMessage(message);
}

function getMessageGroupedWithPrevious(
  message: NativeChatMessage,
  previous?: NativeChatMessage,
): boolean {
  if (!previous) {
    return false;
  }

  if ((message.senderGlobalMetaId || '') !== (previous.senderGlobalMetaId || '')) {
    return false;
  }

  const currentTime = normalizeNativeChatTimestamp(message.timestamp) || 0;
  const previousTime = normalizeNativeChatTimestamp(previous.timestamp) || 0;
  return Math.abs(currentTime - previousTime) <= MESSAGE_GROUP_WINDOW_MS;
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
    title: getConversationTitle(channel),
    avatar: channel.avatar,
    typeLabel: channel.type === 'private' ? 'Private chat' : 'Group chat',
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
  options: { previousMessage?: NativeChatMessage } = {},
): MessageRowViewModel {
  const txId = message.txId || message.pinId || '';
  const shortenedTxId = shortenNativeChatTxId(txId);
  const isSelf = message.senderGlobalMetaId === accountGlobalMetaId;
  const isGroupedWithPrevious = getMessageGroupedWithPrevious(message, options.previousMessage);
  const isUnsupported = isUnsupportedRoomMessage(message);
  const body = isUnsupported
    ? NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT
    : message.kind === 'image'
      ? message.content
      : getSafeSelectorText(message.content);
  const safeCopyText =
    !isUnsupported && message.kind === 'text' && body !== NATIVE_CHAT_DECRYPT_FAILURE_TEXT
      ? body
      : '';
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
    body,
    kind: message.kind,
    timeLabel: formatNativeChatClockTime(message.timestamp),
    txLabel: shortenedTxId ? `${getNativeChatChainLabel(message.chain)} ${shortenedTxId}` : '',
    fullTxId: txId,
    statusLabel,
    showSenderLabel: !isSelf && message.channelType !== 'private' && !isGroupedWithPrevious,
    showAvatar: !isGroupedWithPrevious,
    isGroupedWithPrevious,
    isUnsupported,
    safeCopyText,
    raw: message,
  };
}

export function getMessageRowViewModels(
  messages: NativeChatMessage[],
  accountGlobalMetaId: string,
): MessageRowViewModel[] {
  return messages.map((message, index) =>
    getMessageRowViewModel(message, accountGlobalMetaId, { previousMessage: messages[index - 1] }),
  );
}
