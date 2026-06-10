import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { normalizeLatestChatInfoItem, normalizeSocketMessage } from './chatNormalizers';
import type { NativeChatApiClient } from './chatApiClient';
import {
  decryptChannelLastMessageForDisplay,
  decryptMessageContentForDisplay,
  type NativeChatDecryptWallet,
} from './chatMessageDecryption';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { createNativeChatStore } from '../state/useNativeChatStore';

type NativeChatStore = ReturnType<typeof createNativeChatStore>;
type LatestChatApi = Pick<NativeChatApiClient, 'getLatestChatInfoList'>;
type IndexedHistoryApi = Pick<
  NativeChatApiClient,
  'getGroupMessagesByIndex' | 'getChannelMessagesByIndex' | 'getPrivateMessagesByIndex'
>;
type LatestWindowHistoryApi = Pick<
  NativeChatApiClient,
  | 'getGroupMessagesByIndex'
  | 'getChannelMessagesByIndex'
  | 'getPrivateMessagesByIndex'
  | 'getGroupMessages'
  | 'getChannelMessages'
  | 'getPrivateMessages'
>;

type SyncServiceDeps = {
  accountGlobalMetaId: string;
  apiClient: LatestChatApi;
  repository: NativeChatRepository;
  store: NativeChatStore;
  isCancelled?: () => boolean;
  wallet?: NativeChatDecryptWallet;
};

type ChannelSyncDeps = Omit<SyncServiceDeps, 'apiClient'> & {
  apiClient: IndexedHistoryApi;
  channel: NativeChatChannel;
  pageSize?: string;
  wallet?: NativeChatDecryptWallet;
};

type MessageWindowSyncDeps = Omit<SyncServiceDeps, 'apiClient'> & {
  apiClient: LatestWindowHistoryApi;
  channel: NativeChatChannel;
  pageSize?: number;
  wallet?: NativeChatDecryptWallet;
};

type OlderMessageWindowSyncDeps = Omit<SyncServiceDeps, 'apiClient'> & {
  apiClient: IndexedHistoryApi;
  channel: NativeChatChannel;
  pageSize?: number;
  wallet?: NativeChatDecryptWallet;
};

type RealtimeMessageDeps = {
  accountGlobalMetaId: string;
  payload: any;
  repository: NativeChatRepository;
  store: NativeChatStore;
  wallet?: NativeChatDecryptWallet;
};

type MarkReadDeps = {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  repository: NativeChatRepository;
  store: NativeChatStore;
};

type MarkReadToIndexDeps = MarkReadDeps & {
  messageIndex: number;
};

function extractPayloadList(payload: any): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data?.list)) {
    return payload.data.list;
  }

  if (Array.isArray(payload?.list)) {
    return payload.list;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function getHighestMessageIndex(messages: NativeChatMessage[]): number | undefined {
  const indexedMessages = messages.filter((message) => message.index !== undefined);

  if (indexedMessages.length === 0) {
    return undefined;
  }

  return Math.max(...indexedMessages.map((message) => message.index as number));
}

function getMessageIndexRange(messages: NativeChatMessage[]): {
  oldestLoadedIndex?: number;
  newestLoadedIndex?: number;
} {
  const indexedMessages = messages.filter((message) => message.index !== undefined);

  if (indexedMessages.length === 0) {
    return {};
  }

  const indexes = indexedMessages.map((message) => message.index as number);
  return {
    oldestLoadedIndex: Math.min(...indexes),
    newestLoadedIndex: Math.max(...indexes),
  };
}

function normalizeWindowPageSize(pageSize?: number): number {
  if (!Number.isFinite(pageSize) || !pageSize || pageSize <= 0) {
    return 30;
  }

  return Math.floor(pageSize);
}

function readNumericValue(...values: unknown[]): number | undefined {
  for (const value of values) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return undefined;
}

function getChannelLatestIndex(channel: NativeChatChannel): number | undefined {
  const serverData = channel.serverData || {};
  const latestPayload = (
    typeof serverData.latestMessage === 'object' && serverData.latestMessage !== null
      ? serverData.latestMessage
      : typeof serverData.lastMessage === 'object' && serverData.lastMessage !== null
        ? serverData.lastMessage
        : {}
  ) as Record<string, unknown>;

  return readNumericValue(
    channel.lastMessage?.index,
    latestPayload.index,
    serverData.index,
    serverData.lastIndex,
    serverData.messageIndex,
  );
}

function getWindowStartIndex(channel: NativeChatChannel, pageSize: number): number {
  const latestIndex = getChannelLatestIndex(channel);

  if (latestIndex === undefined || latestIndex <= 0) {
    return 0;
  }

  return Math.max(0, latestIndex - pageSize + 1);
}

function hasMoreNewerMessages(newestLoadedIndex: number | undefined, latestIndex: number | undefined): boolean {
  if (latestIndex === undefined) {
    return false;
  }

  if (newestLoadedIndex === undefined) {
    return latestIndex > 0;
  }

  return newestLoadedIndex < latestIndex;
}

async function fetchLatestWindowPayload({
  accountGlobalMetaId,
  channel,
  apiClient,
  pageSize,
}: {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  apiClient: LatestWindowHistoryApi;
  pageSize: number;
}): Promise<any> {
  const latestIndex = getChannelLatestIndex(channel);
  const size = String(pageSize);

  if (latestIndex !== undefined && latestIndex > 0) {
    const startIndex = String(getWindowStartIndex(channel, pageSize));

    if (channel.type === 'private') {
      return apiClient.getPrivateMessagesByIndex({
        metaId: accountGlobalMetaId,
        otherMetaId: channel.id,
        startIndex,
        size,
      });
    }

    if (channel.type === 'sub-group') {
      return apiClient.getChannelMessagesByIndex({
        channelId: channel.id,
        startIndex,
        size,
      });
    }

    return apiClient.getGroupMessagesByIndex({
      groupId: channel.id,
      startIndex,
      size,
    });
  }

  if (channel.type === 'private') {
    return apiClient.getPrivateMessages({
      metaId: accountGlobalMetaId,
      otherMetaId: channel.id,
      cursor: '0',
      size,
      timestamp: '0',
    });
  }

  if (channel.type === 'sub-group') {
    return apiClient.getChannelMessages({
      channelId: channel.id,
      metaId: accountGlobalMetaId,
      cursor: '0',
      size,
      timestamp: '0',
    });
  }

  return apiClient.getGroupMessages({
    groupId: channel.id,
    metaId: accountGlobalMetaId,
    cursor: '0',
    size,
    timestamp: '0',
  });
}

async function fetchIndexedWindowPayload({
  accountGlobalMetaId,
  channel,
  apiClient,
  startIndex,
  pageSize,
}: {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  apiClient: IndexedHistoryApi;
  startIndex: number;
  pageSize: number;
}): Promise<any> {
  const request = {
    startIndex: String(startIndex),
    size: String(pageSize),
  };

  if (channel.type === 'private') {
    return apiClient.getPrivateMessagesByIndex({
      metaId: accountGlobalMetaId,
      otherMetaId: channel.id,
      ...request,
    });
  }

  if (channel.type === 'sub-group') {
    return apiClient.getChannelMessagesByIndex({
      channelId: channel.id,
      ...request,
    });
  }

  return apiClient.getGroupMessagesByIndex({
    groupId: channel.id,
    ...request,
  });
}

function withChannelIdentity(payload: any, channel: NativeChatChannel): any {
  if (channel.type === 'group') {
    return { ...payload, groupId: payload?.groupId ?? channel.id };
  }

  if (channel.type === 'sub-group') {
    return { ...payload, channelId: payload?.channelId ?? channel.id };
  }

  return { ...payload, otherMetaId: payload?.otherMetaId ?? channel.id };
}

function getMessageSummary(message: NativeChatMessage) {
  return {
    content: message.content,
    kind: message.kind,
    timestamp: message.timestamp,
    index: message.index,
    senderGlobalMetaId: message.senderGlobalMetaId,
  };
}

function getOldestLoadedIndex(store: NativeChatStore, channelId: string): number | undefined {
  const state = store.getState();
  const windowOldestIndex = state.messageWindowsByChannel[channelId]?.oldestLoadedIndex;

  if (windowOldestIndex !== undefined) {
    return windowOldestIndex;
  }

  return getMessageIndexRange(state.messagesByChannel[channelId] || []).oldestLoadedIndex;
}

function getMergedWindowState({
  store,
  channel,
  loadedOlderCount,
}: {
  store: NativeChatStore;
  channel: NativeChatChannel;
  loadedOlderCount: number;
}) {
  const state = store.getState();
  const currentWindow = state.messageWindowsByChannel[channel.id] || {};
  const range = getMessageIndexRange(state.messagesByChannel[channel.id] || []);
  const hasMoreOlder =
    loadedOlderCount > 0 && range.oldestLoadedIndex !== undefined ? range.oldestLoadedIndex > 0 : false;

  return {
    oldestLoadedIndex: range.oldestLoadedIndex,
    newestLoadedIndex: range.newestLoadedIndex,
    hasMoreOlder,
    hasMoreNewer: currentWindow.hasMoreNewer ?? hasMoreNewerMessages(range.newestLoadedIndex, getChannelLatestIndex(channel)),
    loadingOlder: false,
    loadingNewer: currentWindow.loadingNewer ?? false,
    isAtLatest: currentWindow.isAtLatest ?? true,
  };
}

function clearUnreadMentionCount(serverData?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!serverData) {
    return serverData;
  }

  const unreadMentionCount = Number(serverData.unreadMentionCount);

  if (!Number.isFinite(unreadMentionCount) || unreadMentionCount <= 0) {
    return serverData;
  }

  return {
    ...serverData,
    unreadMentionCount: 0,
  };
}

export async function bootstrapNativeChatSync({
  accountGlobalMetaId,
  apiClient,
  repository,
  store,
  isCancelled,
  wallet,
}: SyncServiceDeps): Promise<NativeChatChannel[]> {
  const cachedChannels = await repository.listChannels(accountGlobalMetaId);

  if (isCancelled?.()) {
    return store.getState().channels;
  }

  store.getState().mergeChannels(cachedChannels);

  if (isCancelled?.()) {
    return store.getState().channels;
  }

  const latestPayload = await apiClient.getLatestChatInfoList({
    metaId: accountGlobalMetaId,
    cursor: '0',
    size: '100',
  });

  if (isCancelled?.()) {
    return store.getState().channels;
  }

  const latestChannels = await Promise.all(
    extractPayloadList(latestPayload).map((item) =>
      decryptChannelLastMessageForDisplay(
        normalizeLatestChatInfoItem(item, accountGlobalMetaId),
        wallet,
      ),
    ),
  );

  if (isCancelled?.()) {
    return store.getState().channels;
  }

  await Promise.all(latestChannels.map((channel) => repository.upsertChannel(channel)));

  if (isCancelled?.()) {
    return store.getState().channels;
  }

  store.getState().mergeChannels(latestChannels);

  return store.getState().channels;
}

export async function syncChannelMessages({
  accountGlobalMetaId,
  channel,
  apiClient,
  repository,
  store,
  pageSize = '30',
  wallet,
}: ChannelSyncDeps): Promise<NativeChatMessage[]> {
  const cachedMessages = await repository.listMessages(accountGlobalMetaId, channel.id);
  store.getState().mergeMessages(channel.id, cachedMessages);

  const highestCachedIndex = getHighestMessageIndex(cachedMessages);
  const startIndex = String(highestCachedIndex ?? channel.lastReadIndex ?? 0);
  const size = pageSize;
  const payload =
    channel.type === 'private'
      ? await apiClient.getPrivateMessagesByIndex({
          metaId: accountGlobalMetaId,
          otherMetaId: channel.id,
          startIndex,
          size,
        })
      : channel.type === 'sub-group'
        ? await apiClient.getChannelMessagesByIndex({
            channelId: channel.id,
            startIndex,
            size,
          })
        : await apiClient.getGroupMessagesByIndex({
            groupId: channel.id,
            startIndex,
            size,
          });
  const historyMessages = await Promise.all(
    extractPayloadList(payload).map((item) =>
      decryptMessageContentForDisplay(
        normalizeSocketMessage(withChannelIdentity(item, channel), accountGlobalMetaId),
        channel,
        wallet,
      ),
    ),
  );

  await Promise.all(historyMessages.map((message) => repository.upsertMessage(message)));

  const mergedMessages = await repository.listMessages(accountGlobalMetaId, channel.id);
  store.getState().mergeMessages(channel.id, mergedMessages);

  return store.getState().messagesByChannel[channel.id] || [];
}

export async function syncChannelMessageWindow({
  accountGlobalMetaId,
  channel,
  apiClient,
  repository,
  store,
  pageSize,
  wallet,
}: MessageWindowSyncDeps): Promise<NativeChatMessage[]> {
  const normalizedPageSize = normalizeWindowPageSize(pageSize);
  const cachedMessages = await repository.listLatestMessages(accountGlobalMetaId, channel.id, normalizedPageSize);
  const latestIndex = getChannelLatestIndex(channel);
  const cachedRange = getMessageIndexRange(cachedMessages);

  store.getState().replaceMessages(channel.id, cachedMessages);
  store.getState().setMessageWindowState(channel.id, {
    ...cachedRange,
    hasMoreOlder: cachedRange.oldestLoadedIndex !== undefined ? cachedRange.oldestLoadedIndex > 0 : false,
    hasMoreNewer: hasMoreNewerMessages(cachedRange.newestLoadedIndex, latestIndex),
    loadingOlder: false,
    loadingNewer: true,
    isAtLatest: true,
  });

  try {
    const payload = await fetchLatestWindowPayload({
      accountGlobalMetaId,
      channel,
      apiClient,
      pageSize: normalizedPageSize,
    });
    const historyMessages = await Promise.all(
      extractPayloadList(payload).map((item) =>
        decryptMessageContentForDisplay(
          normalizeSocketMessage(withChannelIdentity(item, channel), accountGlobalMetaId),
          channel,
          wallet,
        ),
      ),
    );

    await Promise.all(historyMessages.map((message) => repository.upsertMessage(message)));

    const latestMessages = await repository.listLatestMessages(accountGlobalMetaId, channel.id, normalizedPageSize);
    const latestRange = getMessageIndexRange(latestMessages);
    const windowState = {
      ...latestRange,
      hasMoreOlder: latestRange.oldestLoadedIndex !== undefined ? latestRange.oldestLoadedIndex > 0 : false,
      hasMoreNewer: hasMoreNewerMessages(latestRange.newestLoadedIndex, latestIndex),
      loadingOlder: false,
      loadingNewer: false,
      isAtLatest: true,
    };

    store.getState().replaceMessages(channel.id, latestMessages);
    store.getState().setMessageWindowState(channel.id, windowState);
    await repository.saveMessageWindowState({
      accountGlobalMetaId,
      channelId: channel.id,
      oldestLoadedIndex: latestRange.oldestLoadedIndex,
      newestLoadedIndex: latestRange.newestLoadedIndex,
      hasMoreOlder: windowState.hasMoreOlder,
      hasMoreNewer: windowState.hasMoreNewer,
      updatedAt: Date.now(),
    });

    return store.getState().messagesByChannel[channel.id] || [];
  } catch (error) {
    store.getState().setMessageWindowState(channel.id, {
      loadingNewer: false,
    });
    throw error;
  }
}

export async function syncOlderChannelMessages({
  accountGlobalMetaId,
  channel,
  apiClient,
  repository,
  store,
  pageSize,
  wallet,
}: OlderMessageWindowSyncDeps): Promise<NativeChatMessage[]> {
  const normalizedPageSize = normalizeWindowPageSize(pageSize);
  const beforeIndex = getOldestLoadedIndex(store, channel.id);

  if (beforeIndex === undefined || beforeIndex <= 0) {
    store.getState().setMessageWindowState(channel.id, {
      hasMoreOlder: false,
      loadingOlder: false,
    });
    return store.getState().messagesByChannel[channel.id] || [];
  }

  const endIndex = beforeIndex - 1;
  const startIndex = Math.max(0, beforeIndex - normalizedPageSize);
  const rangeSize = endIndex - startIndex + 1;

  store.getState().setMessageWindowState(channel.id, {
    loadingOlder: true,
  });

  try {
    let olderMessages = await repository.listMessagesBefore(accountGlobalMetaId, channel.id, beforeIndex, rangeSize);
    const hasLocalRange =
      olderMessages.length > 0
      && await repository.hasContinuousMessageRange(accountGlobalMetaId, channel.id, startIndex, endIndex);

    if (!hasLocalRange) {
      const payload = await fetchIndexedWindowPayload({
        accountGlobalMetaId,
        channel,
        apiClient,
        startIndex,
        pageSize: rangeSize,
      });
      const historyMessages = await Promise.all(
        extractPayloadList(payload).map((item) =>
          decryptMessageContentForDisplay(
            normalizeSocketMessage(withChannelIdentity(item, channel), accountGlobalMetaId),
            channel,
            wallet,
          ),
        ),
      );

      await Promise.all(historyMessages.map((message) => repository.upsertMessage(message)));
      olderMessages = await repository.listMessagesBefore(accountGlobalMetaId, channel.id, beforeIndex, rangeSize);
    }

    if (olderMessages.length > 0) {
      store.getState().mergeMessages(channel.id, olderMessages);
    }

    const windowState = getMergedWindowState({
      store,
      channel,
      loadedOlderCount: olderMessages.length,
    });

    store.getState().setMessageWindowState(channel.id, windowState);
    await repository.saveMessageWindowState({
      accountGlobalMetaId,
      channelId: channel.id,
      oldestLoadedIndex: windowState.oldestLoadedIndex,
      newestLoadedIndex: windowState.newestLoadedIndex,
      hasMoreOlder: windowState.hasMoreOlder,
      hasMoreNewer: windowState.hasMoreNewer,
      updatedAt: Date.now(),
    });

    return store.getState().messagesByChannel[channel.id] || [];
  } catch (error) {
    store.getState().setMessageWindowState(channel.id, {
      loadingOlder: false,
    });
    throw error;
  }
}

export async function handleNativeRealtimeMessage({
  accountGlobalMetaId,
  payload,
  repository,
  store,
  wallet,
}: RealtimeMessageDeps): Promise<NativeChatMessage> {
  const normalizedMessage = normalizeSocketMessage(payload, accountGlobalMetaId);
  const decryptState = store.getState();
  const channelForDecrypt = decryptState.channels.find((channel) => channel.id === normalizedMessage.channelId);
  const message = await decryptMessageContentForDisplay(
    normalizedMessage,
    channelForDecrypt || {
      accountGlobalMetaId,
      id: normalizedMessage.channelId,
      type: normalizedMessage.channelType,
      title: normalizedMessage.channelId,
      unreadCount: 0,
      lastReadIndex: 0,
      updatedAt: normalizedMessage.timestamp,
    },
    wallet,
  );
  await repository.upsertMessage(message);
  const stateBeforeMerge = store.getState();
  const activeWindowState = stateBeforeMerge.messageWindowsByChannel[message.channelId];
  const shouldHoldVisibleWindow =
    stateBeforeMerge.activeChannelId === message.channelId && activeWindowState?.isAtLatest === false;

  if (shouldHoldVisibleWindow) {
    store.getState().setMessageWindowState(message.channelId, {
      hasMoreNewer: true,
    });
  } else {
    store.getState().mergeMessages(message.channelId, [message]);

    const mergedRange = getMessageIndexRange(store.getState().messagesByChannel[message.channelId] || []);

    if (activeWindowState) {
      store.getState().setMessageWindowState(message.channelId, {
        newestLoadedIndex: mergedRange.newestLoadedIndex,
        hasMoreNewer: false,
      });
    }
  }

  const currentState = store.getState();
  const currentChannel = currentState.channels.find((channel) => channel.id === message.channelId);

  if (currentChannel) {
    const isActive = currentState.activeChannelId === message.channelId;
    const currentLastTimestamp = currentChannel.lastMessage?.timestamp ?? 0;
    const shouldUpdateLastMessage = message.timestamp >= currentLastTimestamp;
    const updatedChannel = {
      ...currentChannel,
      lastMessage: shouldUpdateLastMessage ? getMessageSummary(message) : currentChannel.lastMessage,
      unreadCount: isActive ? currentChannel.unreadCount : currentChannel.unreadCount + 1,
      updatedAt: Math.max(currentChannel.updatedAt, message.timestamp),
    };

    store.getState().mergeChannels([updatedChannel]);
    await repository.upsertChannel(updatedChannel);
  }

  return message;
}

export async function markNativeChannelRead({
  accountGlobalMetaId,
  channel,
  repository,
  store,
}: MarkReadDeps): Promise<void> {
  const state = store.getState();
  const currentChannel = state.channels.find((item) => item.id === channel.id) || channel;
  const messages = state.messagesByChannel[channel.id] || [];
  const highestLoadedIndex = getHighestMessageIndex(messages);
  const lastReadIndex = highestLoadedIndex ?? currentChannel.lastReadIndex;
  const updatedChannel = {
    ...currentChannel,
    unreadCount: 0,
    lastReadIndex,
  };

  await repository.saveLastReadIndex(accountGlobalMetaId, channel.id, lastReadIndex);
  await repository.upsertChannel(updatedChannel);
  store.getState().mergeChannels([updatedChannel]);
}

export async function markNativeChannelReadToIndex({
  accountGlobalMetaId,
  channel,
  messageIndex,
  repository,
  store,
}: MarkReadToIndexDeps): Promise<void> {
  if (!Number.isFinite(messageIndex) || messageIndex < 0) {
    return;
  }

  const visibleIndex = Math.floor(messageIndex);
  const state = store.getState();
  const currentChannel = state.channels.find((item) => item.id === channel.id) || channel;

  if (visibleIndex <= currentChannel.lastReadIndex) {
    return;
  }

  const updatedChannel = {
    ...currentChannel,
    unreadCount: 0,
    lastReadIndex: visibleIndex,
    serverData: clearUnreadMentionCount(currentChannel.serverData),
  };

  await repository.saveLastReadIndex(accountGlobalMetaId, channel.id, visibleIndex);
  await repository.upsertChannel(updatedChannel);
  store.getState().mergeChannels([updatedChannel]);
}
