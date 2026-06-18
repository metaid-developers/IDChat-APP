import type { NativeChatChannel, NativeChatMessage } from '../domain/types';

export type NativeChatRoomStateKind =
  | 'missing'
  | 'runtime-unavailable'
  | 'loading'
  | 'empty'
  | 'sync-failed'
  | 'ready';

export type NativeChatRoomState = {
  kind: NativeChatRoomStateKind;
  title: string;
  body?: string;
  retryLabel?: string;
  showMessages: boolean;
};

export type NativeChatRoomHeaderViewModel = {
  title: string;
  subtitle: string;
  avatar?: string;
  infoEnabled: boolean;
};

const MAX_QUOTE_PREVIEW_LENGTH = 120;

function isGroupChannel(channel: NativeChatChannel): boolean {
  return channel.type !== 'private';
}

function readNumericServerValue(serverData: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  if (!serverData) {
    return undefined;
  }

  for (const key of keys) {
    const value = serverData[key];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const numberValue = Number(value);

    if (Number.isFinite(numberValue)) {
      return Math.max(0, numberValue);
    }
  }

  return undefined;
}

function getServerMemberCount(serverData: Record<string, unknown> | undefined): number | undefined {
  const directCount = readNumericServerValue(serverData, [
    'memberCount',
    'membersCount',
    'memberTotal',
    'userCount',
    'userTotal',
  ]);

  if (directCount !== undefined) {
    return directCount;
  }

  const members = serverData?.members;
  if (Array.isArray(members)) {
    return members.length;
  }

  return undefined;
}

function getHeaderSubtitle(channel: NativeChatChannel | undefined): string {
  if (!channel) {
    return '';
  }

  if (channel.type === 'private') {
    return 'Private chat';
  }

  const memberCount = getServerMemberCount(channel.serverData);
  if (memberCount !== undefined) {
    return `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;
  }

  return 'Group chat';
}

function getRoomTitle(channel: NativeChatChannel): string {
  const title = channel.title.trim();
  if (title && !(isGroupChannel(channel) && title === channel.id)) {
    return title;
  }

  return isGroupChannel(channel) ? 'Group chat' : 'Private chat';
}

export function getNativeChatRoomHeaderViewModel(
  channel: NativeChatChannel | undefined,
): NativeChatRoomHeaderViewModel {
  return {
    avatar: channel?.avatar,
    infoEnabled: Boolean(channel && isGroupChannel(channel)),
    subtitle: getHeaderSubtitle(channel),
    title: channel ? getRoomTitle(channel) : 'Chat',
  };
}

export function getNativeChatComposerDisabledReason({
  channel,
  runtimeReady,
}: {
  channel?: NativeChatChannel;
  runtimeReady: boolean;
}): string | undefined {
  if (!runtimeReady) {
    return 'Chat is unavailable while account services load.';
  }

  if (!channel) {
    return 'Sending is unavailable in this chat.';
  }

  if (channel.type === 'private' && !channel.publicKeyStr) {
    return 'Missing peer chat public key';
  }

  const serverData = channel.serverData || {};

  if (serverData.isBlocked || serverData.blocked) {
    return 'You cannot send because this chat is blocked.';
  }

  if (serverData.isMember === false || serverData.joined === false) {
    return 'Join this group before sending messages.';
  }

  if (serverData.canSend === false) {
    return typeof serverData.disabledReason === 'string' && serverData.disabledReason
      ? serverData.disabledReason
      : 'Sending is unavailable in this chat.';
  }

  return undefined;
}

export function getNativeChatRoomState({
  channelId,
  channel,
  runtimeReady,
  messages,
  loadingLatest,
  syncError,
}: {
  channelId: string;
  channel?: NativeChatChannel;
  runtimeReady: boolean;
  messages: readonly NativeChatMessage[];
  loadingLatest: boolean;
  syncError?: string;
}): NativeChatRoomState {
  if (!channelId || !channel) {
    return {
      body: 'Return to Chats and choose a conversation.',
      kind: 'missing',
      showMessages: false,
      title: 'Chat not found',
    };
  }

  if (!runtimeReady) {
    return {
      body: 'Account services are still starting.',
      kind: 'runtime-unavailable',
      showMessages: false,
      title: 'Chat is loading',
    };
  }

  if (syncError) {
    return {
      body: 'Check your connection and try again.',
      kind: 'sync-failed',
      retryLabel: 'Retry',
      showMessages: messages.length > 0,
      title: 'Messages could not refresh',
    };
  }

  if (loadingLatest && messages.length === 0) {
    return {
      body: `Opening ${getRoomTitle(channel)}.`,
      kind: 'loading',
      showMessages: false,
      title: 'Loading messages',
    };
  }

  if (messages.length === 0) {
    return {
      body: `Start the conversation in ${getRoomTitle(channel)}.`,
      kind: 'empty',
      showMessages: false,
      title: 'No messages yet',
    };
  }

  return {
    kind: 'ready',
    showMessages: true,
    title: '',
  };
}

export function getSafeNativeChatQuotePreview({
  kind,
  body,
}: {
  kind: NativeChatMessage['kind'] | string;
  body?: string;
  fullTxId?: string;
}): string {
  if (kind === 'image') {
    return '[Image]';
  }

  if (kind !== 'text') {
    return 'Unsupported message';
  }

  const normalizedBody = body?.trim() || '';

  if (!normalizedBody) {
    return 'Unsupported message';
  }

  if (normalizedBody.length <= MAX_QUOTE_PREVIEW_LENGTH) {
    return normalizedBody;
  }

  return `${normalizedBody.slice(0, MAX_QUOTE_PREVIEW_LENGTH - 3)}...`;
}
