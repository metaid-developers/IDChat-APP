import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useSyncExternalStore } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MessageList from '../components/MessageList';
import { getNativeChatRuntimeContext } from '../services/nativeChatRuntimeContext';
import { markNativeChannelRead, syncChannelMessages } from '../services/nativeChatSyncService';
import { nativeChatStore } from '../state/useNativeChatStore';

type NativeChatRoomPageProps = {
  route?: {
    params?: {
      channelId?: string;
    };
  };
};

export default function NativeChatRoomPage({ route }: NativeChatRoomPageProps) {
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );
  const channelId = route?.params?.channelId || nativeChatStore.getState().activeChannelId || '';
  const hasChannel = state.channels.some((item) => item.id === channelId);
  const runtimeReady = Boolean(state.runtimeConfig && state.accountGlobalMetaId);
  const messages = state.messagesByChannel[channelId] || [];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (!channelId || !hasChannel || !runtimeReady) {
        return undefined;
      }

      nativeChatStore.getState().setActiveChannelId(channelId);

      async function syncFocusedChannel() {
        let context;

        try {
          context = getNativeChatRuntimeContext();
        } catch {
          return;
        }

        const channel = context.store.getState().channels.find((item) => item.id === channelId);

        if (!channel) {
          return;
        }

        await syncChannelMessages({
          accountGlobalMetaId: context.accountGlobalMetaId,
          channel,
          apiClient: context.apiClient,
          repository: context.repository,
          store: context.store,
        });

        if (!isActive) {
          return;
        }

        await markNativeChannelRead({
          accountGlobalMetaId: context.accountGlobalMetaId,
          channel,
          repository: context.repository,
          store: context.store,
        });
      }

      syncFocusedChannel().catch(() => undefined);

      return () => {
        isActive = false;
        if (nativeChatStore.getState().activeChannelId === channelId) {
          nativeChatStore.getState().setActiveChannelId(undefined);
        }
      };
    }, [channelId, hasChannel, runtimeReady, state.accountGlobalMetaId]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <MessageList accountGlobalMetaId={state.accountGlobalMetaId} messages={messages} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
});
