import { createStore } from 'zustand/vanilla';
import type { NativeChatChannel, NativeChatMessage, NativeChatRuntimeConfig } from '../domain/types';
import { getMessageDedupeKey } from '../storage/chatRepository';

type NativeChatState = {
  accountGlobalMetaId: string;
  activeChannelId?: string;
  runtimeConfig?: NativeChatRuntimeConfig;
  channels: NativeChatChannel[];
  messagesByChannel: Record<string, NativeChatMessage[]>;
  socketConnected: boolean;
  setAccount: (globalMetaId: string) => void;
  setRuntimeConfig: (runtimeConfig: NativeChatRuntimeConfig) => void;
  setActiveChannelId: (channelId?: string) => void;
  setSocketConnected: (connected: boolean) => void;
  mergeChannels: (channels: NativeChatChannel[]) => void;
  mergeMessages: (channelId: string, messages: NativeChatMessage[]) => void;
};

function compareMessagesByPosition(a: NativeChatMessage, b: NativeChatMessage): number {
  const indexA = a.index ?? Number.MAX_SAFE_INTEGER;
  const indexB = b.index ?? Number.MAX_SAFE_INTEGER;
  return a.timestamp - b.timestamp || indexA - indexB || getMessageDedupeKey(a).localeCompare(getMessageDedupeKey(b));
}

export function createNativeChatStore() {
  return createStore<NativeChatState>((set) => ({
    accountGlobalMetaId: '',
    activeChannelId: undefined,
    runtimeConfig: undefined,
    channels: [],
    messagesByChannel: {},
    socketConnected: false,
    setAccount: (globalMetaId) => set({ accountGlobalMetaId: globalMetaId }),
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
          byKey.set(key, { ...byKey.get(key), ...message });
        });
        return {
          messagesByChannel: {
            ...state.messagesByChannel,
            [channelId]: Array.from(byKey.values()).sort(compareMessagesByPosition),
          },
        };
      }),
  }));
}

export const nativeChatStore = createNativeChatStore();
