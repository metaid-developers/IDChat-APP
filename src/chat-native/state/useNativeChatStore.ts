import { createStore } from 'zustand/vanilla';
import type { NativeChatChannel, NativeChatMessage, NativeChatRuntimeConfig } from '../domain/types';
import { getMessageDedupeKey } from '../storage/chatRepository';

export type NativeChatMessageWindow = {
  oldestLoadedIndex?: number;
  newestLoadedIndex?: number;
  hasMoreOlder?: boolean;
  hasMoreNewer?: boolean;
  loadingOlder?: boolean;
  loadingNewer?: boolean;
  isAtLatest?: boolean;
};

type NativeChatState = {
  accountGlobalMetaId: string;
  accountDisplayName: string;
  accountAvatar?: string;
  activeChannelId?: string;
  runtimeConfig?: NativeChatRuntimeConfig;
  channels: NativeChatChannel[];
  messagesByChannel: Record<string, NativeChatMessage[]>;
  messageWindowsByChannel: Record<string, NativeChatMessageWindow>;
  socketConnected: boolean;
  setAccount: (globalMetaId: string, profile?: { displayName?: string; avatar?: string }) => void;
  setRuntimeConfig: (runtimeConfig: NativeChatRuntimeConfig) => void;
  setActiveChannelId: (channelId?: string) => void;
  setSocketConnected: (connected: boolean) => void;
  mergeChannels: (channels: NativeChatChannel[]) => void;
  mergeMessages: (channelId: string, messages: NativeChatMessage[]) => void;
  replaceMessages: (channelId: string, messages: NativeChatMessage[]) => void;
  setMessageWindowState: (channelId: string, window: NativeChatMessageWindow) => void;
};

function compareMessagesByPosition(a: NativeChatMessage, b: NativeChatMessage): number {
  const indexA = a.index ?? Number.MAX_SAFE_INTEGER;
  const indexB = b.index ?? Number.MAX_SAFE_INTEGER;
  return a.timestamp - b.timestamp || indexA - indexB || getMessageDedupeKey(a).localeCompare(getMessageDedupeKey(b));
}

function isReconcileableSelfImage(
  accountGlobalMetaId: string,
  channelId: string,
  pending: NativeChatMessage,
  incoming: NativeChatMessage,
): boolean {
  return Boolean(
    accountGlobalMetaId &&
    incoming.status === 'sent' &&
    incoming.kind === 'image' &&
    (incoming.txId || incoming.pinId) &&
    incoming.channelId === channelId &&
    incoming.senderGlobalMetaId === accountGlobalMetaId &&
    pending.status === 'pending' &&
    pending.kind === 'image' &&
    pending.channelId === channelId &&
    pending.protocol === incoming.protocol &&
    pending.timestamp === incoming.timestamp &&
    pending.senderGlobalMetaId === accountGlobalMetaId
  );
}

export function createNativeChatStore() {
  return createStore<NativeChatState>((set) => ({
    accountGlobalMetaId: '',
    accountDisplayName: 'IDChat User',
    accountAvatar: undefined,
    activeChannelId: undefined,
    runtimeConfig: undefined,
    channels: [],
    messagesByChannel: {},
    messageWindowsByChannel: {},
    socketConnected: false,
    setAccount: (globalMetaId, profile) =>
      set((state) => {
        const sameAccount = state.accountGlobalMetaId === globalMetaId;
        const hasDisplayName = profile?.displayName !== undefined;
        const hasAvatar = profile?.avatar !== undefined;
        return {
          accountGlobalMetaId: globalMetaId,
          accountDisplayName: sameAccount
            ? hasDisplayName ? profile.displayName : state.accountDisplayName
            : profile?.displayName || 'IDChat User',
          accountAvatar: sameAccount ? hasAvatar ? profile.avatar : state.accountAvatar : profile?.avatar,
          activeChannelId: sameAccount ? state.activeChannelId : undefined,
          messagesByChannel: sameAccount ? state.messagesByChannel : {},
          messageWindowsByChannel: sameAccount ? state.messageWindowsByChannel : {},
          channels: sameAccount ? state.channels : [],
        };
      }),
    setRuntimeConfig: (runtimeConfig) => set({ runtimeConfig }),
    setActiveChannelId: (channelId) => set({ activeChannelId: channelId }),
    setSocketConnected: (connected) => set({ socketConnected: connected }),
    mergeChannels: (incoming) =>
      set((state) => {
        const byId = new Map(state.channels.map((channel) => [channel.id, channel]));
        incoming.forEach((channel) => byId.set(channel.id, { ...byId.get(channel.id), ...channel }));
        return { channels: Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt) };
      }),
    mergeMessages: (channelId, incoming) =>
      set((state) => {
        const existing = state.messagesByChannel[channelId] || [];
        const byKey = new Map(existing.map((message) => [getMessageDedupeKey(message), message]));
        incoming.forEach((message) => {
          const key = getMessageDedupeKey(message);
          let nextMessage = message;
          const pendingMatches = Array.from(byKey.entries()).filter(([, existingMessage]) =>
            isReconcileableSelfImage(state.accountGlobalMetaId, channelId, existingMessage, message),
          );
          const pendingKeyToReplace = pendingMatches.length === 1 ? pendingMatches[0][0] : undefined;

          if (pendingKeyToReplace) {
            const pendingMessage = byKey.get(pendingKeyToReplace);
            nextMessage = {
              ...pendingMessage,
              ...message,
              localPreviewUri: message.localPreviewUri || pendingMessage?.localPreviewUri,
            };
          }

          if (pendingKeyToReplace && pendingKeyToReplace !== key) {
            byKey.delete(pendingKeyToReplace);
          }

          const existingByKey = byKey.get(key);
          byKey.set(key, {
            ...existingByKey,
            ...nextMessage,
            localPreviewUri: nextMessage.localPreviewUri || existingByKey?.localPreviewUri,
          });
        });
        return {
          messagesByChannel: {
            ...state.messagesByChannel,
            [channelId]: Array.from(byKey.values()).sort(compareMessagesByPosition),
          },
        };
      }),
    replaceMessages: (channelId, messages) =>
      set((state) => ({
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...messages].sort(compareMessagesByPosition),
        },
      })),
    setMessageWindowState: (channelId, window) =>
      set((state) => ({
        messageWindowsByChannel: {
          ...state.messageWindowsByChannel,
          [channelId]: {
            ...state.messageWindowsByChannel[channelId],
            ...window,
          },
        },
      })),
  }));
}

export const nativeChatStore = createNativeChatStore();
