import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { normalizeLatestChatInfoItem, normalizeSocketMessage } from './chatNormalizers';
import type { NativeChatApiClient } from './chatApiClient';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { createNativeChatStore } from '../state/useNativeChatStore';

type NativeChatStore = ReturnType<typeof createNativeChatStore>;
type LatestChatApi = Pick<NativeChatApiClient, 'getLatestChatInfoList'>;
type IndexedHistoryApi = Pick<
  NativeChatApiClient,
  'getGroupMessagesByIndex' | 'getChannelMessagesByIndex' | 'getPrivateMessagesByIndex'
>;

type SyncServiceDeps = {
  accountGlobalMetaId: string;
  apiClient: LatestChatApi;
  repository: NativeChatRepository;
  store: NativeChatStore;
  isCancelled?: () => boolean;
};

type ChannelSyncDeps = Omit<SyncServiceDeps, 'apiClient'> & {
  apiClient: IndexedHistoryApi;
  channel: NativeChatChannel;
  pageSize?: string;
};

type RealtimeMessageDeps = {
  accountGlobalMetaId: string;
  payload: any;
  repository: NativeChatRepository;
  store: NativeChatStore;
};

type MarkReadDeps = {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  repository: NativeChatRepository;
  store: NativeChatStore;
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
    senderGlobalMetaId: message.senderGlobalMetaId,
  };
}

export async function bootstrapNativeChatSync({
  accountGlobalMetaId,
  apiClient,
  repository,
  store,
  isCancelled,
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

  const latestChannels = extractPayloadList(latestPayload).map((item) =>
    normalizeLatestChatInfoItem(item, accountGlobalMetaId),
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
  const historyMessages = extractPayloadList(payload).map((item) =>
    normalizeSocketMessage(withChannelIdentity(item, channel), accountGlobalMetaId),
  );

  await Promise.all(historyMessages.map((message) => repository.upsertMessage(message)));

  const mergedMessages = await repository.listMessages(accountGlobalMetaId, channel.id);
  store.getState().mergeMessages(channel.id, mergedMessages);

  return store.getState().messagesByChannel[channel.id] || [];
}

export async function handleNativeRealtimeMessage({
  accountGlobalMetaId,
  payload,
  repository,
  store,
}: RealtimeMessageDeps): Promise<NativeChatMessage> {
  const message = normalizeSocketMessage(payload, accountGlobalMetaId);
  await repository.upsertMessage(message);
  store.getState().mergeMessages(message.channelId, [message]);

  const state = store.getState();
  const existingChannel = state.channels.find((channel) => channel.id === message.channelId);

  if (existingChannel) {
    const isActive = state.activeChannelId === message.channelId;
    const updatedChannel = {
      ...existingChannel,
      lastMessage: getMessageSummary(message),
      unreadCount: isActive ? existingChannel.unreadCount : existingChannel.unreadCount + 1,
      updatedAt: Math.max(existingChannel.updatedAt, message.timestamp),
    };

    await repository.upsertChannel(updatedChannel);
    store.getState().mergeChannels([updatedChannel]);
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
