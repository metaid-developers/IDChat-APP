import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { navigate } from '../../base/NavigationService';
import ConversationList from '../components/ConversationList';
import {
  createNativeChatMockApiClient,
  createNativeChatMockWalletAdapter,
  MOCK_ACCOUNT_GLOBAL_META_ID,
  seedNativeChatMockScenario,
} from '../dev/nativeChatMockScenario';
import type { NativeChatChannel } from '../domain/types';
import { NativeChatApiClient } from '../services/chatApiClient';
import { DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG, loadNativeChatRuntimeConfig } from '../services/chatRuntimeConfig';
import { createNativeChatSocketClient } from '../services/chatSocketClient';
import { createNativeChatWalletAdapter } from '../services/chatWalletAdapter';
import { resolveNativeChatAccount } from '../services/nativeChatAccount';
import {
  clearNativeChatRuntimeContext,
  setNativeChatRuntimeContext,
} from '../services/nativeChatRuntimeContext';
import { bootstrapNativeChatSync, handleNativeRealtimeMessage } from '../services/nativeChatSyncService';
import { nativeChatStore } from '../state/useNativeChatStore';
import { openNativeChatDatabase } from '../storage/chatDatabase';
import { createMemoryChatRepository, createSQLiteChatRepository } from '../storage/chatRepository';

type NativeChatHomePageProps = {
  route?: {
    params?: {
      mockScenario?: 'basic';
    };
  };
};

export default function NativeChatHomePage({ route }: NativeChatHomePageProps) {
  const [startupError, setStartupError] = useState<string | null>(null);
  const mockScenario = route?.params?.mockScenario;
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );

  useEffect(() => {
    let isMounted = true;
    let socketClient: ReturnType<typeof createNativeChatSocketClient> | undefined;

    async function startNativeChatRuntime() {
      try {
        setStartupError(null);

        if (__DEV__ && mockScenario === 'basic') {
          const runtimeConfig = DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
          const repository = createMemoryChatRepository();
          const wallet = createNativeChatMockWalletAdapter();
          const apiClient = createNativeChatMockApiClient();

          nativeChatStore.getState().setRuntimeConfig(runtimeConfig);
          await seedNativeChatMockScenario({
            store: nativeChatStore,
            repository,
            accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
          });

          if (!isMounted) {
            return;
          }

          nativeChatStore.getState().setSocketConnected(false);
          setNativeChatRuntimeContext({
            accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
            runtimeConfig,
            wallet,
            apiClient: apiClient as NativeChatApiClient,
            repository,
            store: nativeChatStore,
          });
          return;
        }

        const runtimeConfig = await loadNativeChatRuntimeConfig();
        const db = await openNativeChatDatabase();
        const repository = createSQLiteChatRepository(db);
        const wallet = createNativeChatWalletAdapter();
        const account = await resolveNativeChatAccount(wallet);

        if (!isMounted) {
          return;
        }

        const apiClient = new NativeChatApiClient(runtimeConfig.chatApiBase);
        nativeChatStore.getState().setRuntimeConfig(runtimeConfig);
        nativeChatStore.getState().setAccount(account.accountGlobalMetaId, {
          displayName: account.displayName,
          avatar: account.avatar,
        });
        setNativeChatRuntimeContext({
          accountGlobalMetaId: account.accountGlobalMetaId,
          runtimeConfig,
          wallet,
          apiClient,
          repository,
          store: nativeChatStore,
        });

        await bootstrapNativeChatSync({
          accountGlobalMetaId: account.accountGlobalMetaId,
          apiClient,
          repository,
          store: nativeChatStore,
          isCancelled: () => !isMounted,
        });

        if (!isMounted) {
          return;
        }

        socketClient = createNativeChatSocketClient({
          url: runtimeConfig.chatWsBase,
          socketPath: runtimeConfig.socketPath,
          globalMetaId: account.accountGlobalMetaId,
          onMessage: async (payload) => {
            await handleNativeRealtimeMessage({
              accountGlobalMetaId: account.accountGlobalMetaId,
              payload,
              repository,
              store: nativeChatStore,
            });
          },
          onConnectionChange: (connected) => nativeChatStore.getState().setSocketConnected(connected),
        });
        socketClient.connect();
      } catch (error) {
        if (isMounted) {
          setStartupError(error instanceof Error ? error.message : 'Native chat startup failed');
        }
      }
    }

    startNativeChatRuntime();

    return () => {
      isMounted = false;
      socketClient?.disconnect();
      nativeChatStore.getState().setSocketConnected(false);
      clearNativeChatRuntimeContext();
    };
  }, [mockScenario]);

  const openChannel = (channel: NativeChatChannel) => {
    state.setActiveChannelId(channel.id);
    navigate('NativeChatRoomPage', { channelId: channel.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      {startupError ? <Text style={styles.errorText}>{startupError}</Text> : null}
      <ConversationList channels={state.channels} onOpenChannel={openChannel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  errorText: {
    color: '#b00020',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
