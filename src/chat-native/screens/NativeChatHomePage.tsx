import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { navigate } from '../../base/NavigationService';
import ChatAvatar from '../components/ChatAvatar';
import ConversationList from '../components/ConversationList';
import NativeChatMePage from './NativeChatMePage';
import {
  createNativeChatMockApiClient,
  createNativeChatMockWalletAdapter,
  MOCK_ACCOUNT_GLOBAL_META_ID,
  NATIVE_CHAT_MOCK_SCENARIO,
  type NativeChatMockScenarioName,
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
import { nativeChatTheme } from '../ui/chatTheme';

type NativeChatHomePageProps = {
  route?: {
    params?: {
      mockEmptyList?: boolean;
      mockScenario?: NativeChatMockScenarioName;
    };
  };
};

const FORCE_NATIVE_IDCHAT_UI_PARITY_MOCK = false;
const FORCE_NATIVE_IDCHAT_UI_PARITY_EMPTY_LIST = false;

function getDevMockScenario(): NativeChatMockScenarioName | undefined {
  if (!__DEV__) {
    return undefined;
  }

  if (FORCE_NATIVE_IDCHAT_UI_PARITY_MOCK) {
    return NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY;
  }

  const configuredScenario = process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO;

  if (configuredScenario === NATIVE_CHAT_MOCK_SCENARIO.BASIC) {
    return NATIVE_CHAT_MOCK_SCENARIO.BASIC;
  }

  if (configuredScenario === NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY) {
    return NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY;
  }

  return undefined;
}

function getDevMockEmptyList(): boolean {
  return __DEV__ && (FORCE_NATIVE_IDCHAT_UI_PARITY_EMPTY_LIST || process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST === 'true');
}

export default function NativeChatHomePage({ route }: NativeChatHomePageProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'me'>('chats');
  const [startupError, setStartupError] = useState<string | null>(null);
  const mockScenario = route?.params?.mockScenario ?? getDevMockScenario();
  const mockEmptyList = route?.params?.mockEmptyList ?? getDevMockEmptyList();
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

        if (__DEV__ && mockScenario) {
          const runtimeConfig = DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
          const repository = createMemoryChatRepository();
          const wallet = createNativeChatMockWalletAdapter();
          const apiClient = createNativeChatMockApiClient();

          nativeChatStore.getState().setRuntimeConfig(runtimeConfig);
          await seedNativeChatMockScenario({
            store: nativeChatStore,
            repository,
            accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
            emptyList: mockEmptyList,
            scenario: mockScenario,
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
          wallet,
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
              apiClient,
              payload,
              repository,
              store: nativeChatStore,
              wallet,
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
  }, [mockEmptyList, mockScenario]);

  const openChannel = (channel: NativeChatChannel) => {
    state.setActiveChannelId(channel.id);
    navigate('NativeChatRoomPage', { channelId: channel.id });
  };

  const showUiParityList = () => {
    navigate('NativeChatHomePage', { mockScenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY });
  };
  const isUiParityMock = __DEV__ && mockScenario === NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ChatAvatar uri={state.accountAvatar} name={state.accountDisplayName || 'ID'} size={38} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>IDChat</Text>
          <Text style={styles.headerSubtitle}>{activeTab === 'chats' ? 'Chats' : 'Me'}</Text>
        </View>
      </View>
      {startupError ? <Text style={styles.errorText}>{startupError}</Text> : null}
      <View style={styles.content}>
        {activeTab === 'chats' ? (
          <ConversationList
            channels={state.channels}
            onExploreChats={isUiParityMock ? showUiParityList : undefined}
            onJoinRecommendedGroup={isUiParityMock ? showUiParityList : undefined}
            onOpenChannel={openChannel}
          />
        ) : (
          <NativeChatMePage />
        )}
      </View>
      <View accessibilityRole="tablist" style={styles.tabBar}>
        <TouchableOpacity
          accessibilityLabel="Chats tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'chats' }}
          onPress={() => setActiveTab('chats')}
          style={[styles.tabButton, activeTab === 'chats' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Me tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'me' }}
          onPress={() => setActiveTab('me')}
          style={[styles.tabButton, activeTab === 'me' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'me' && styles.tabTextActive]}>Me</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nativeChatTheme.color.surface,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: nativeChatTheme.color.failed,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderBottomColor: nativeChatTheme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerSubtitle: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '600',
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: nativeChatTheme.color.text,
    fontSize: 20,
    fontWeight: '800',
  },
  tabBar: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderTopColor: nativeChatTheme.color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: nativeChatTheme.size.bottomTab,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: nativeChatTheme.radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  tabButtonActive: {
    backgroundColor: nativeChatTheme.color.primarySoft,
  },
  tabText: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  tabTextActive: {
    color: nativeChatTheme.color.primary,
  },
});
