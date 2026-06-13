import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { navigate } from '../../base/NavigationService';
import ChatAvatar from '../components/ChatAvatar';
import ConversationList from '../components/ConversationList';
import OnlineBotPanel from '../components/OnlineBotPanel';
import NativeChatMePage from './NativeChatMePage';
import {
  createNativeChatMockApiClient,
  createNativeChatMockWalletAdapter,
  MOCK_ACCOUNT_GLOBAL_META_ID,
  NATIVE_CHAT_MOCK_SCENARIO,
  type NativeChatMockScenarioName,
  seedNativeChatMockScenario,
} from '../dev/nativeChatMockScenario';
import type { NativeChatChannel, NativeChatDiscoveryResult, NativeChatOnlineBot } from '../domain/types';
import { NativeChatApiClient } from '../services/chatApiClient';
import { DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG, loadNativeChatRuntimeConfig } from '../services/chatRuntimeConfig';
import { createNativeChatSocketClient } from '../services/chatSocketClient';
import { createNativeChatWalletAdapter } from '../services/chatWalletAdapter';
import {
  createNativePrivateChatFromDiscovery,
  loadNativeChatOnlineBots,
  searchNativeChatDiscovery,
} from '../services/nativeChatDiscoveryService';
import { resolveNativeChatAccount } from '../services/nativeChatAccount';
import {
  clearNativeChatRuntimeContext,
  getNativeChatRuntimeContext,
  setNativeChatRuntimeContext,
} from '../services/nativeChatRuntimeContext';
import { bootstrapNativeChatSync, handleNativeRealtimeMessage } from '../services/nativeChatSyncService';
import { nativeChatStore } from '../state/useNativeChatStore';
import { openNativeChatDatabase } from '../storage/chatDatabase';
import { createMemoryChatRepository, createSQLiteChatRepository } from '../storage/chatRepository';
import { nativeChatTheme } from '../ui/chatTheme';
import { getProductSafeNativeChatError } from '../services/nativeChatDisplaySafety';

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
const REMOTE_GROUP_JOIN_BLOCKER = 'Native group join is not available yet';
const DISCOVERY_SEARCH_ERROR_TEXT = 'Search failed. Try again.';
const PRIVATE_CHAT_START_ERROR_TEXT = 'Unable to start chat. Try again.';

export function getNativeChatHomeProductError(error: unknown, fallback: string): string {
  return getProductSafeNativeChatError(error, fallback);
}

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

function getAccountChatPublicKey(payload: unknown): string | undefined {
  const record = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
  const source = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
    ? record.data as Record<string, unknown>
    : record;

  return [source.chatPublicKey, source.chatpubkey, source.publicKeyStr]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim();
}

function findDiscoveryChannel(
  result: NativeChatDiscoveryResult,
  channels: NativeChatChannel[],
): NativeChatChannel | undefined {
  return channels.find((channel) => {
    if (channel.id === result.id) {
      return true;
    }

    const serverData = channel.serverData || {};
    return (
      result.type === 'private' &&
      channel.type === 'private' &&
      (serverData.targetMetaId === result.id || serverData.globalMetaId === result.id)
    );
  });
}

function decorateDiscoveryResult(
  result: NativeChatDiscoveryResult,
  channels: NativeChatChannel[],
): NativeChatDiscoveryResult {
  if (findDiscoveryChannel(result, channels)) {
    return result;
  }

  if (result.type === 'group') {
    return {
      ...result,
      disabledReason: REMOTE_GROUP_JOIN_BLOCKER,
    };
  }

  return result;
}

export default function NativeChatHomePage({ route }: NativeChatHomePageProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'me'>('chats');
  const [startupError, setStartupError] = useState<string | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<NativeChatDiscoveryResult[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [onlineBotPanelVisible, setOnlineBotPanelVisible] = useState(false);
  const [onlineBots, setOnlineBots] = useState<NativeChatOnlineBot[]>([]);
  const [onlineBotsLoading, setOnlineBotsLoading] = useState(false);
  const [onlineBotsError, setOnlineBotsError] = useState<string | null>(null);
  const discoveryRequestId = useRef(0);
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
          nativeChatStore.getState().setAccount(MOCK_ACCOUNT_GLOBAL_META_ID, {
            address: 'mock-mvc-address',
            chatPublicKey: 'mock-chat-public-key',
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
        let accountChatPublicKey: string | undefined;

        try {
          accountChatPublicKey = getAccountChatPublicKey(
            await apiClient.getUserInfoByGlobalMetaId(account.accountGlobalMetaId),
          );
        } catch {
          accountChatPublicKey = undefined;
        }

        nativeChatStore.getState().setRuntimeConfig(runtimeConfig);
        nativeChatStore.getState().setAccount(account.accountGlobalMetaId, {
          address: account.address,
          displayName: account.displayName,
          avatar: account.avatar,
          chatPublicKey: accountChatPublicKey,
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

  const decoratedDiscoveryResults = useMemo(
    () => discoveryResults.map((result) => decorateDiscoveryResult(result, state.channels)),
    [discoveryResults, state.channels],
  );

  const openChannel = useCallback((channel: NativeChatChannel) => {
    state.setActiveChannelId(channel.id);
    navigate('NativeChatRoomPage', { channelId: channel.id });
  }, [state]);

  const searchRemoteDiscovery = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    const requestId = discoveryRequestId.current + 1;
    discoveryRequestId.current = requestId;

    if (!normalizedQuery) {
      setDiscoveryResults([]);
      setDiscoveryError(null);
      setDiscoveryLoading(false);
      return;
    }

    setDiscoveryLoading(true);
    setDiscoveryError(null);

    try {
      const context = getNativeChatRuntimeContext();
      const results = await searchNativeChatDiscovery({
        apiClient: context.apiClient,
        query: normalizedQuery,
      });

      if (discoveryRequestId.current === requestId) {
        setDiscoveryResults(results);
      }
    } catch (error) {
      if (discoveryRequestId.current === requestId) {
        console.warn('NativeChatHomePage discovery search failed', { error });
        setDiscoveryResults([]);
        setDiscoveryError(getNativeChatHomeProductError(error, DISCOVERY_SEARCH_ERROR_TEXT));
      }
    } finally {
      if (discoveryRequestId.current === requestId) {
        setDiscoveryLoading(false);
      }
    }
  }, []);

  const clearRemoteDiscovery = useCallback(() => {
    discoveryRequestId.current += 1;
    setDiscoveryResults([]);
    setDiscoveryError(null);
    setDiscoveryLoading(false);
  }, []);

  const openDiscoveryResult = useCallback(async (result: NativeChatDiscoveryResult) => {
    const existingChannel = findDiscoveryChannel(result, state.channels);

    if (existingChannel) {
      openChannel(existingChannel);
      return;
    }

    if (result.type === 'group') {
      Alert.alert('Group join unavailable', REMOTE_GROUP_JOIN_BLOCKER);
      return;
    }

    try {
      const context = getNativeChatRuntimeContext();
      const channel = await createNativePrivateChatFromDiscovery({
        accountGlobalMetaId: context.accountGlobalMetaId,
        apiClient: context.apiClient,
        repository: context.repository,
        targetGlobalMetaId: result.id,
      });

      context.store.getState().mergeChannels([channel]);
      openChannel(channel);
    } catch (error) {
      console.warn('NativeChatHomePage private chat start failed', { error });
      Alert.alert(
        'Unable to start chat',
        getNativeChatHomeProductError(error, PRIVATE_CHAT_START_ERROR_TEXT),
      );
    }
  }, [openChannel, state.channels]);

  const loadOnlineBots = useCallback(async () => {
    setOnlineBotsLoading(true);
    setOnlineBotsError(null);

    try {
      const context = getNativeChatRuntimeContext();
      const result = await loadNativeChatOnlineBots({ apiClient: context.apiClient });
      setOnlineBots(result.bots);
    } catch (error) {
      setOnlineBots([]);
      setOnlineBotsError(error instanceof Error ? error.message : 'Failed to load online bots');
    } finally {
      setOnlineBotsLoading(false);
    }
  }, []);

  const openOnlineBots = useCallback(() => {
    setOnlineBotPanelVisible(true);
    void loadOnlineBots();
  }, [loadOnlineBots]);

  const openOnlineBot = useCallback((bot: NativeChatOnlineBot) => {
    setOnlineBotPanelVisible(false);
    void openDiscoveryResult({
      id: bot.globalMetaId,
      type: 'private',
      title: bot.name,
      subtitle: bot.bio || bot.globalMetaId,
      avatar: bot.avatar,
      raw: bot.raw,
    });
  }, [openDiscoveryResult]);

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
            discoveryError={discoveryError}
            discoveryLoading={discoveryLoading}
            discoveryResults={decoratedDiscoveryResults}
            onExploreChats={isUiParityMock ? showUiParityList : undefined}
            onJoinRecommendedGroup={isUiParityMock ? showUiParityList : undefined}
            onClearRemoteSearch={clearRemoteDiscovery}
            onOpenChannel={openChannel}
            onOpenDiscoveryResult={openDiscoveryResult}
            onOpenOnlineBots={openOnlineBots}
            onSearchRemote={searchRemoteDiscovery}
          />
        ) : (
          <NativeChatMePage />
        )}
      </View>
      <OnlineBotPanel
        bots={onlineBots}
        error={onlineBotsError}
        loading={onlineBotsLoading}
        onClose={() => setOnlineBotPanelVisible(false)}
        onOpenBot={openOnlineBot}
        onRefresh={loadOnlineBots}
        visible={onlineBotPanelVisible}
      />
      <View accessibilityRole="tablist" style={styles.tabBar}>
        <Pressable
          accessibilityLabel="Chats tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'chats' }}
          onPress={() => setActiveTab('chats')}
          style={[styles.tabButton, activeTab === 'chats' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>Chats</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Me tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'me' }}
          onPress={() => setActiveTab('me')}
          style={[styles.tabButton, activeTab === 'me' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'me' && styles.tabTextActive]}>Me</Text>
        </Pressable>
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
