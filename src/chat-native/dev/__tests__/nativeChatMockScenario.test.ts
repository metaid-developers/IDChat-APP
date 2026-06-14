import {
  NATIVE_CHAT_MOCK_SCENARIO,
  createNativeChatMockApiClient,
  createNativeChatMockWalletAdapter,
  seedNativeChatMockScenario,
} from '../nativeChatMockScenario';
import {
  NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
  nativeChatUiMockChannels,
} from '../nativeChatUiMockScenario';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { createNativeChatStore } from '../../state/useNativeChatStore';
import { syncChannelMessages } from '../../services/nativeChatSyncService';

describe('nativeChatMockScenario', () => {
  it('seeds private and group conversations for simulator QA', async () => {
    const store = createNativeChatStore();
    const repo = createMemoryChatRepository();

    await seedNativeChatMockScenario({ store, repository: repo, accountGlobalMetaId: 'qa-self' });

    expect(store.getState().channels.map((channel) => channel.type).sort()).toEqual(['group', 'private']);
    expect(store.getState().messagesByChannel['qa-group']).toHaveLength(2);
    expect(store.getState().messagesByChannel['qa-peer']).toHaveLength(2);
    await expect(repo.listChannels('qa-self')).resolves.toHaveLength(2);
    await expect(repo.listMessages('qa-self', 'qa-group')).resolves.toHaveLength(2);
    await expect(repo.listMessages('qa-self', 'qa-peer')).resolves.toHaveLength(2);
  });

  it('seeds the UI parity scenario for screenshot QA', async () => {
    const store = createNativeChatStore();
    const repo = createMemoryChatRepository();

    await seedNativeChatMockScenario({
      store,
      repository: repo,
      accountGlobalMetaId: NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      scenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
    });

    expect(store.getState().channels.map((channel) => channel.id)).toEqual(
      nativeChatUiMockChannels.map((channel) => channel.id),
    );
    expect(store.getState().channels.filter((channel) => channel.type === 'private')).toHaveLength(1);
    expect(store.getState().channels.filter((channel) => channel.type === 'group')).toHaveLength(2);
    expect(store.getState().messagesByChannel['ui-metaweb-builders']).toHaveLength(3);
    expect(store.getState().messagesByChannel['ui-lisa-hahn']).toHaveLength(2);
    expect(store.getState().messagesByChannel['ui-bitcoin-circle']).toHaveLength(1);
    await expect(repo.listChannels(NATIVE_CHAT_UI_MOCK_ACCOUNT_ID)).resolves.toHaveLength(3);
  });

  it('can seed an empty UI parity scenario for the new-user prompt', async () => {
    const store = createNativeChatStore();
    const repo = createMemoryChatRepository();

    await seedNativeChatMockScenario({
      store,
      repository: repo,
      accountGlobalMetaId: NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      scenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
      emptyList: true,
    });

    expect(store.getState().channels).toHaveLength(0);
    expect(store.getState().messagesByChannel).toEqual({});
    await expect(repo.listChannels(NATIVE_CHAT_UI_MOCK_ACCOUNT_ID)).resolves.toHaveLength(0);
  });

  it('clears existing UI parity state when reseeding the empty prompt scenario', async () => {
    const store = createNativeChatStore();

    await seedNativeChatMockScenario({
      store,
      repository: createMemoryChatRepository(),
      accountGlobalMetaId: NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      scenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
    });
    expect(store.getState().channels).toHaveLength(3);

    const emptyRepo = createMemoryChatRepository();
    await seedNativeChatMockScenario({
      store,
      repository: emptyRepo,
      accountGlobalMetaId: NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      scenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
      emptyList: true,
    });

    expect(store.getState().channels).toHaveLength(0);
    expect(store.getState().messagesByChannel).toEqual({});
    await expect(emptyRepo.listChannels(NATIVE_CHAT_UI_MOCK_ACCOUNT_ID)).resolves.toHaveLength(0);
  });

  it('replaces the basic fixture when switching to the UI parity scenario', async () => {
    const store = createNativeChatStore();

    await seedNativeChatMockScenario({
      store,
      repository: createMemoryChatRepository(),
      accountGlobalMetaId: NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      scenario: NATIVE_CHAT_MOCK_SCENARIO.BASIC,
    });
    expect(store.getState().channels.map((channel) => channel.id).sort()).toEqual(['qa-group', 'qa-peer']);

    await seedNativeChatMockScenario({
      store,
      repository: createMemoryChatRepository(),
      accountGlobalMetaId: NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
      scenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
    });

    expect(store.getState().channels.map((channel) => channel.id)).toEqual(
      nativeChatUiMockChannels.map((channel) => channel.id),
    );
    expect(store.getState().messagesByChannel['qa-group']).toBeUndefined();
    expect(store.getState().messagesByChannel['qa-peer']).toBeUndefined();
  });

  it('provides mocked API and wallet behavior for offline simulator runs', async () => {
    const api = createNativeChatMockApiClient();
    const wallet = createNativeChatMockWalletAdapter();

    await expect(api.getLatestChatInfoList({ metaId: 'qa-self' })).resolves.toHaveLength(2);
    await expect(api.searchGroupsAndUsers({ query: 'discovery' })).resolves.toMatchObject({
      data: {
        list: expect.arrayContaining([
          expect.objectContaining({ globalMetaId: 'qa-discovery-peer', name: 'Discovery Peer' }),
          expect.objectContaining({ groupId: 'qa-discovery-group', roomName: 'Discovery Group' }),
        ]),
      },
    });
    await expect(api.getUserInfoByGlobalMetaId('qa-discovery-peer')).resolves.toMatchObject({
      data: expect.objectContaining({
        globalMetaId: 'qa-discovery-peer',
        chatPublicKey: expect.any(String),
      }),
    });
    await expect(wallet.getEcdh('04mock-public-key')).resolves.toMatchObject({
      externalPubKey: '04mock-public-key',
      sharedSecret: expect.any(String),
    });
    await expect(
      wallet.createChatNode({
        addressHost: 'bc1p-host',
        protocol: 'simplegroupchat',
        body: { content: 'hello' },
        externalEncryption: '0',
      }),
    ).resolves.toMatchObject({
      txids: ['mock-native-chat-txid-1'],
    });
  });

  it('returns unique chat txids and file plus chat txids for attachment sends', async () => {
    const wallet = createNativeChatMockWalletAdapter();

    const first = await wallet.createChatNode({
      addressHost: 'bc1p-host',
      protocol: 'simplegroupchat',
      body: { content: 'hello' },
      externalEncryption: '0',
    });
    const second = await wallet.createChatNode({
      addressHost: 'bc1p-host',
      protocol: 'simplemsg',
      body: { content: 'hello again' },
      externalEncryption: '1',
    });
    const image = await wallet.createChatNode({
      addressHost: 'bc1p-host',
      protocol: 'simplefilegroupchat',
      body: { fileType: 'png' },
      externalEncryption: '0',
      fileEncryption: '0',
      attachments: [{ data: '00', fileType: 'image/png' }],
    });

    expect(first.txids).toEqual(['mock-native-chat-txid-1']);
    expect(second.txids).toEqual(['mock-native-chat-txid-2']);
    expect(image.txids).toEqual(['mock-file-txid-3', 'mock-chat-txid-3']);
  });

  it('keeps mock room focus sync offline for group and private channels', async () => {
    const store = createNativeChatStore();
    const repo = createMemoryChatRepository();
    const api = createNativeChatMockApiClient();

    await seedNativeChatMockScenario({ store, repository: repo, accountGlobalMetaId: 'qa-self' });

    const group = store.getState().channels.find((channel) => channel.id === 'qa-group');
    const privateChannel = store.getState().channels.find((channel) => channel.id === 'qa-peer');

    expect(group).toBeDefined();
    expect(privateChannel).toBeDefined();
    await expect(
      syncChannelMessages({
        accountGlobalMetaId: 'qa-self',
        channel: group!,
        apiClient: api,
        repository: repo,
        store,
      }),
    ).resolves.toHaveLength(2);
    await expect(
      syncChannelMessages({
        accountGlobalMetaId: 'qa-self',
        channel: privateChannel!,
        apiClient: api,
        repository: repo,
        store,
      }),
    ).resolves.toHaveLength(2);
  });

  it('keeps native and mock entry flags committed off', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat/page/ChatHomePage.tsx', 'utf8');

    expect(source).toContain('const ENABLE_NATIVE_IDCHAT = false');
    expect(source).toContain('const ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = false');
    expect(source).not.toContain('const ENABLE_NATIVE_IDCHAT = true');
    expect(source).not.toContain('const ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = true');
  });

  it('routes legacy ChatHomePage entries to native chat instead of the WebView fallback', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/base/AppNavigator.jsx', 'utf8');

    expect(source).toContain('<Stack.Screen name="ChatHomePage" component={NativeChatHomePage} />');
    expect(source).not.toContain('<Stack.Screen name="ChatHomePage" component={ChatHomePage} />');
    expect(source).not.toContain("import ChatHomePage from '@/chat/page/ChatHomePage'");
    expect(source).toContain('name="ChatHomePage"');
    expect(source).toContain('component={NativeChatHomePage}');
    expect(source).toContain("tabBarStyle: { display: 'none' }");
  });

  it('keeps native chat rooms navigable without relying on the WebView shell', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatRoomPage.tsx', 'utf8');
    const navigationSource = await fs.readFile('src/base/NavigationService.tsx', 'utf8');

    expect(source).toContain("import { canGoBack, goBack, navigate } from '@/base/NavigationService'");
    expect(source).toContain('const handleBack = useCallback(() => {');
    expect(source).toContain('if (canGoBack())');
    expect(source).toContain("navigate('NativeChatHomePage')");
    expect(source).toContain('accessibilityLabel="Back"');
    expect(source).toContain('onPress={handleBack}');
    expect(source).toContain("name=\"chevron-left\"");
    expect(navigationSource).toContain('export function canGoBack()');
    expect(navigationSource).toContain('_navigator?.canGoBack?.()');
  });

  it('wires the native home page to the UI parity mock route', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).toContain('mockScenario?: NativeChatMockScenarioName');
    expect(source).toContain('mockEmptyList?: boolean');
    expect(source).toContain('scenario: mockScenario');
    expect(source).toContain("mockScenario === NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY");
    expect(source).toContain('EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO');
    expect(source).toContain('EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST');
  });

  it('does not ship a disabled native create chat affordance', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).not.toContain('accessibilityLabel="Create chat"');
    expect(source).not.toContain('createButtonDisabled');
  });

  it('wires native discovery and online bot handlers on the home page', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).toContain("import OnlineBotPanel from '../components/OnlineBotPanel'");
    expect(source).toContain('searchNativeChatDiscovery');
    expect(source).toContain('loadNativeChatOnlineBots');
    expect(source).toContain('createNativePrivateChatFromDiscovery');
    expect(source).toContain('discoveryResults={decoratedDiscoveryResults}');
    expect(source).toContain('onSearchRemote={searchRemoteDiscovery}');
    expect(source).toContain('onOpenDiscoveryResult={openDiscoveryResult}');
    expect(source).toContain('onOpenOnlineBots={openOnlineBots}');
    expect(source).toContain('Native group join is not available yet');
  });

  it('hydrates native Me tab account metadata during home startup', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).toContain('address: account.address');
    expect(source).toContain('accountChatPublicKey');
    expect(source).toContain('chatPublicKey: accountChatPublicKey');
  });

  it('keeps simulator-only UI parity force switches committed off', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).toContain('const FORCE_NATIVE_IDCHAT_UI_PARITY_MOCK = false');
    expect(source).toContain('const FORCE_NATIVE_IDCHAT_UI_PARITY_EMPTY_LIST = false');
    expect(source).not.toContain('const FORCE_NATIVE_IDCHAT_UI_PARITY_MOCK = true');
    expect(source).not.toContain('const FORCE_NATIVE_IDCHAT_UI_PARITY_EMPTY_LIST = true');
  });

  it('does not gate configured mock scenario startup behind the dev global', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).toContain('if (mockScenario) {');
    expect(source).toContain("mockScenario === NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY");
    expect(source).not.toContain('if (__DEV__ && mockScenario)');
    expect(source).not.toContain('__DEV__ && mockScenario === NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY');
  });

  it('reads Expo injected public env values from global process', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).toContain('runtimeGlobal.process?.env');
    expect(source).toContain("getRuntimeEnvValue('EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO')");
    expect(source).toContain("getRuntimeEnvValue('EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST')");
  });

  it('opens the P0.5 simulator mock route as a cold start', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('scripts/qa/native-idchat-p0-5-open-dev-client.sh', 'utf8');

    expect(source).toContain('nativeIdchatMockScenario');
    expect(source).toContain('simctl-terminate-before-mock-route.log');
    expect(source).toContain('simctl-openurl-mock-route.log');
    expect(source).toContain('sleep 35');
  });

  it('guards native chat startup so stale live initialization cannot overwrite mock state', async () => {
    const fs = require('fs/promises') as typeof import('fs/promises');
    const source = await fs.readFile('src/chat-native/screens/NativeChatHomePage.tsx', 'utf8');

    expect(source).toContain('let nativeChatHomeStartupSequence = 0');
    expect(source).toContain('const isCurrentStartup = () => isMounted && startupSequence === nativeChatHomeStartupSequence');
    expect(source).toContain('isCancelled: () => !isCurrentStartup()');
  });

  it('exposes the native mock scenario through Expo config extra', () => {
    const previousScenario = process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO;
    const previousEmptyList = process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST;

    try {
      process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO = NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY;
      process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST = 'true';

      jest.isolateModules(() => {
        const createExpoConfig = require('../../../../app.config.js') as (params: { config: object }) => object;
        const config = createExpoConfig({ config: {} }) as {
          extra?: {
            nativeIdchatMockEmptyList?: string;
            nativeIdchatMockScenario?: string;
          };
        };

        expect(config.extra?.nativeIdchatMockScenario).toBe(NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY);
        expect(config.extra?.nativeIdchatMockEmptyList).toBe('true');
      });
    } finally {
      if (previousScenario === undefined) {
        delete process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO;
      } else {
        process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO = previousScenario;
      }

      if (previousEmptyList === undefined) {
        delete process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST;
      } else {
        process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST = previousEmptyList;
      }
    }
  });
});
