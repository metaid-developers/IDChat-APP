import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import type { NativeChatApiClient } from '../services/chatApiClient';
import type { NativeChatWalletAdapter } from '../services/chatWalletAdapter';
import type { createNativeChatStore } from '../state/useNativeChatStore';
import type { NativeChatRepository } from '../storage/chatRepository';
import type {
  NativeChatUiMockGroupMemberBuckets,
  NativeChatUiMockGroupMemberFixture,
} from './nativeChatUiMockScenario';
import {
  NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
  nativeChatUiMockChannels,
  nativeChatUiMockGroupInfoFixtures,
  nativeChatUiMockGroupMemberFixtures,
  nativeChatUiMockMessages,
} from './nativeChatUiMockScenario';

type NativeChatStoreApi = ReturnType<typeof createNativeChatStore>;
type MockChatApiClient = Pick<
  NativeChatApiClient,
  'getLatestChatInfoList' | 'getGroupMessagesByIndex' | 'getChannelMessagesByIndex' | 'getPrivateMessagesByIndex'
> &
  Pick<NativeChatApiClient, 'getGroupMessages' | 'getChannelMessages' | 'getPrivateMessages'> &
  Pick<NativeChatApiClient, 'getGroupInfo' | 'getGroupMembers' | 'searchGroupMembers'> &
  Pick<NativeChatApiClient, 'searchGroupsAndUsers' | 'getOnlineUsers' | 'getUserInfoByGlobalMetaId'>;

type MockGroupMemberBucketsPayload = Omit<NativeChatUiMockGroupMemberBuckets, 'creator'> & {
  creator?: NativeChatUiMockGroupMemberFixture;
};

const EMPTY_HISTORY_RESPONSE = {
  list: [],
  nextTimestamp: 0,
  total: 0,
};

export const MOCK_ACCOUNT_GLOBAL_META_ID = 'qa-self';
export const NATIVE_CHAT_MOCK_SCENARIO = {
  BASIC: 'basic',
  UI_PARITY: 'ui-parity',
} as const;

export type NativeChatMockScenarioName = (typeof NATIVE_CHAT_MOCK_SCENARIO)[keyof typeof NATIVE_CHAT_MOCK_SCENARIO];

export const NATIVE_CHAT_MOCK_ACCOUNT_STATE = {
  PARTIAL_ACCOUNT: 'mock-partial-account',
  NO_ACCOUNT: 'mock-no-account',
} as const;

export type NativeChatMockAccountStateName =
  (typeof NATIVE_CHAT_MOCK_ACCOUNT_STATE)[keyof typeof NATIVE_CHAT_MOCK_ACCOUNT_STATE];

export const NATIVE_CHAT_MOCK_ACCOUNT_STATES = {
  [NATIVE_CHAT_MOCK_ACCOUNT_STATE.PARTIAL_ACCOUNT]: {
    accountGlobalMetaId: 'mock-partial-account',
    address: 'mock-address-partial-account',
    label: 'mock-partial-account',
    seedAccountGlobalMetaId: 'mock-partial-account',
    source: 'dev/mock',
  },
  [NATIVE_CHAT_MOCK_ACCOUNT_STATE.NO_ACCOUNT]: {
    accountGlobalMetaId: undefined,
    address: undefined,
    label: 'mock-no-account',
    seedAccountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    source: 'dev/mock',
  },
} as const;

const MOCK_DISCOVERY_PUBLIC_KEY = `04${'1'.repeat(128)}`;

const mockDiscoveryRecords = [
  {
    type: 'user',
    globalMetaId: 'qa-discovery-peer',
    name: 'Discovery Peer',
    avatar: 'https://www.idchat.io/logo.png',
    chatPublicKey: MOCK_DISCOVERY_PUBLIC_KEY,
  },
  {
    type: 'group',
    groupId: 'qa-discovery-group',
    roomName: 'Discovery Group',
    memberCount: 12,
    groupAvatar: 'https://www.idchat.io/logo.png',
  },
];

export const mockChannels: NativeChatChannel[] = [
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    id: 'qa-group',
    type: 'group',
    title: 'QA Native Group',
    unreadCount: 1,
    lastReadIndex: 1,
    updatedAt: 1717800001000,
    lastMessage: {
      content: 'Mock group message',
      kind: 'text',
      timestamp: 1717800001000,
      senderGlobalMetaId: 'qa-peer',
    },
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    id: 'qa-peer',
    type: 'private',
    title: 'QA Private Peer',
    publicKeyStr: '04mock-public-key',
    unreadCount: 0,
    lastReadIndex: 2,
    updatedAt: 1717800002000,
    lastMessage: {
      content: 'Mock private message',
      kind: 'text',
      timestamp: 1717800002000,
      senderGlobalMetaId: 'qa-peer',
    },
  },
];

export const mockMessages: NativeChatMessage[] = [
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-group',
    channelType: 'group',
    kind: 'text',
    content: 'Mock group message',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 1717800001000,
    senderGlobalMetaId: 'qa-peer',
    txId: 'mock-group-tx-1',
    status: 'sent',
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-group',
    channelType: 'group',
    kind: 'image',
    content: '',
    contentType: 'image/png',
    protocol: 'simplefilegroupchat',
    timestamp: 1717800001100,
    senderGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    txId: 'mock-group-img-1',
    attachmentUri: 'https://www.idchat.io/logo.png',
    status: 'sent',
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-peer',
    channelType: 'private',
    kind: 'text',
    content: 'Mock private message',
    contentType: 'text/plain',
    protocol: 'simplemsg',
    timestamp: 1717800002000,
    senderGlobalMetaId: 'qa-peer',
    txId: 'mock-private-tx-1',
    status: 'sent',
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-peer',
    channelType: 'private',
    kind: 'text',
    content: 'Pending native reply',
    contentType: 'text/plain',
    protocol: 'simplemsg',
    timestamp: 1717800002100,
    senderGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    mockId: 'mock-pending-1',
    status: 'pending',
  },
];

function isMockSelfId(globalMetaId: string | undefined): boolean {
  return globalMetaId === MOCK_ACCOUNT_GLOBAL_META_ID || globalMetaId === NATIVE_CHAT_UI_MOCK_ACCOUNT_ID;
}

export function normalizeNativeChatMockAccountStateName(value: unknown): NativeChatMockAccountStateName | undefined {
  if (value === NATIVE_CHAT_MOCK_ACCOUNT_STATE.PARTIAL_ACCOUNT) {
    return NATIVE_CHAT_MOCK_ACCOUNT_STATE.PARTIAL_ACCOUNT;
  }

  if (value === NATIVE_CHAT_MOCK_ACCOUNT_STATE.NO_ACCOUNT) {
    return NATIVE_CHAT_MOCK_ACCOUNT_STATE.NO_ACCOUNT;
  }

  return undefined;
}

export function getNativeChatMockAccountSeedGlobalMetaId(
  accountStateName: NativeChatMockAccountStateName | undefined,
): string {
  return accountStateName
    ? NATIVE_CHAT_MOCK_ACCOUNT_STATES[accountStateName].seedAccountGlobalMetaId
    : MOCK_ACCOUNT_GLOBAL_META_ID;
}

export function applyNativeChatMockAccountState({
  accountStateName,
  fallbackGlobalMetaId,
  store,
}: {
  accountStateName?: NativeChatMockAccountStateName;
  fallbackGlobalMetaId: string;
  store: NativeChatStoreApi;
}): void {
  if (accountStateName === NATIVE_CHAT_MOCK_ACCOUNT_STATE.NO_ACCOUNT) {
    store.setState({
      accountAddress: undefined,
      accountAvatar: undefined,
      accountChatPublicKey: undefined,
      accountDisplayName: 'IDChat User',
      accountGlobalMetaId: '',
      activeChannelId: undefined,
    });
    return;
  }

  if (accountStateName === NATIVE_CHAT_MOCK_ACCOUNT_STATE.PARTIAL_ACCOUNT) {
    const fixture = NATIVE_CHAT_MOCK_ACCOUNT_STATES[accountStateName];
    store.getState().setAccount(fixture.accountGlobalMetaId, {
      address: fixture.address,
      chatPublicKey: undefined,
    });
    return;
  }

  store.getState().setAccount(fallbackGlobalMetaId, {
    address: 'mock-mvc-address',
    chatPublicKey: 'mock-chat-public-key',
  });
}

function matchesMockDiscoveryQuery(record: Record<string, unknown>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  const haystack = [
    record.globalMetaId,
    record.name,
    record.groupId,
    record.roomName,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return Boolean(normalizedQuery && haystack.includes(normalizedQuery));
}

function getEmptyGroupMemberBuckets(): MockGroupMemberBucketsPayload {
  return {
    admins: [],
    whiteList: [],
    list: [],
    blockList: [],
  };
}

function getMockGroupMemberRows(groupId: string): Array<{
  bucket: keyof NativeChatUiMockGroupMemberBuckets;
  member: NativeChatUiMockGroupMemberFixture;
}> {
  const fixture = nativeChatUiMockGroupMemberFixtures[groupId];

  if (!fixture) {
    return [];
  }

  return [
    { bucket: 'creator', member: fixture.creator },
    ...fixture.admins.map((member) => ({ bucket: 'admins' as const, member })),
    ...fixture.whiteList.map((member) => ({ bucket: 'whiteList' as const, member })),
    ...fixture.list.map((member) => ({ bucket: 'list' as const, member })),
    ...fixture.blockList.map((member) => ({ bucket: 'blockList' as const, member })),
  ];
}

function buildMockGroupMemberBuckets(
  rows: Array<{ bucket: keyof NativeChatUiMockGroupMemberBuckets; member: NativeChatUiMockGroupMemberFixture }>,
): MockGroupMemberBucketsPayload {
  const buckets = getEmptyGroupMemberBuckets();

  for (const row of rows) {
    if (row.bucket === 'creator') {
      buckets.creator = row.member;
    } else {
      buckets[row.bucket].push(row.member);
    }
  }

  return buckets;
}

function matchesMockGroupMemberQuery(member: NativeChatUiMockGroupMemberFixture, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  const haystack = [member.globalMetaId, member.metaId, member.address, member.name].join(' ').toLowerCase();

  return Boolean(normalizedQuery && haystack.includes(normalizedQuery));
}

function pageMockGroupMemberRows(
  rows: Array<{ bucket: keyof NativeChatUiMockGroupMemberBuckets; member: NativeChatUiMockGroupMemberFixture }>,
  cursor: string | undefined,
  size: string | undefined,
): Array<{ bucket: keyof NativeChatUiMockGroupMemberBuckets; member: NativeChatUiMockGroupMemberFixture }> {
  const start = Math.max(0, Number.parseInt(cursor || '0', 10) || 0);
  const limit = Math.max(0, Number.parseInt(size || '20', 10) || 20);

  return rows.slice(start, start + limit);
}

function asAccountChannel(channel: NativeChatChannel, accountGlobalMetaId: string): NativeChatChannel {
  return {
    ...channel,
    accountGlobalMetaId,
    lastMessage: channel.lastMessage
      ? {
          ...channel.lastMessage,
          senderGlobalMetaId: isMockSelfId(channel.lastMessage.senderGlobalMetaId)
            ? accountGlobalMetaId
            : channel.lastMessage.senderGlobalMetaId,
        }
      : undefined,
  };
}

function asAccountMessage(message: NativeChatMessage, accountGlobalMetaId: string): NativeChatMessage {
  return {
    ...message,
    accountGlobalMetaId,
    senderGlobalMetaId:
      message.senderGlobalMetaId === MOCK_ACCOUNT_GLOBAL_META_ID ||
      message.senderGlobalMetaId === NATIVE_CHAT_UI_MOCK_ACCOUNT_ID
        ? accountGlobalMetaId
        : message.senderGlobalMetaId,
  };
}

function getMockScenarioData(scenario: NativeChatMockScenarioName | undefined): {
  channels: NativeChatChannel[];
  messages: NativeChatMessage[];
} {
  if (scenario === NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY) {
    return {
      channels: nativeChatUiMockChannels,
      messages: nativeChatUiMockMessages,
    };
  }

  return {
    channels: mockChannels,
    messages: mockMessages,
  };
}

export async function seedNativeChatMockScenario(params: {
  store: NativeChatStoreApi;
  repository: NativeChatRepository;
  accountStateName?: NativeChatMockAccountStateName;
  accountGlobalMetaId?: string;
  emptyList?: boolean;
  scenario?: NativeChatMockScenarioName;
}): Promise<void> {
  const accountGlobalMetaId = params.accountGlobalMetaId
    || getNativeChatMockAccountSeedGlobalMetaId(params.accountStateName);
  const scenarioData = params.emptyList
    ? { channels: [], messages: [] }
    : getMockScenarioData(params.scenario);

  applyNativeChatMockAccountState({
    accountStateName: params.accountStateName,
    fallbackGlobalMetaId: accountGlobalMetaId,
    store: params.store,
  });
  params.store.setState({
    activeChannelId: undefined,
    channels: [],
    messagesByChannel: {},
  });

  for (const channel of scenarioData.channels) {
    const nextChannel = asAccountChannel(channel, accountGlobalMetaId);
    await params.repository.upsertChannel(nextChannel);
    params.store.getState().mergeChannels([nextChannel]);
  }

  for (const message of scenarioData.messages) {
    const nextMessage = asAccountMessage(message, accountGlobalMetaId);
    await params.repository.upsertMessage(nextMessage);
    params.store.getState().mergeMessages(nextMessage.channelId, [nextMessage]);
  }
}

export function createNativeChatMockApiClient(): MockChatApiClient {
  return {
    async getLatestChatInfoList() {
      return mockChannels.map((channel) => ({
        type: channel.type === 'private' ? '2' : '1',
        groupId: channel.type === 'private' ? undefined : channel.id,
        globalMetaId: channel.type === 'private' ? channel.id : undefined,
        roomName: channel.title,
        name: channel.title,
        chatPublicKey: channel.publicKeyStr,
        latestMessage: channel.lastMessage,
      }));
    },
    async getGroupMessagesByIndex() {
      return EMPTY_HISTORY_RESPONSE;
    },
    async getChannelMessagesByIndex() {
      return EMPTY_HISTORY_RESPONSE;
    },
    async getPrivateMessagesByIndex() {
      return EMPTY_HISTORY_RESPONSE;
    },
    async getGroupMessages() {
      return EMPTY_HISTORY_RESPONSE;
    },
    async getChannelMessages() {
      return EMPTY_HISTORY_RESPONSE;
    },
    async getPrivateMessages() {
      return EMPTY_HISTORY_RESPONSE;
    },
    async getGroupInfo({ groupId }) {
      return nativeChatUiMockGroupInfoFixtures[groupId] || {
        groupId,
        name: groupId,
        memberCount: 0,
        muted: false,
      };
    },
    async getGroupMembers({ groupId, cursor, size }) {
      return buildMockGroupMemberBuckets(
        pageMockGroupMemberRows(getMockGroupMemberRows(groupId), cursor, size),
      );
    },
    async searchGroupMembers({ groupId, query, cursor, size }) {
      const rows = getMockGroupMemberRows(groupId).filter((row) => matchesMockGroupMemberQuery(row.member, query));
      const page = pageMockGroupMemberRows(rows, cursor, size);

      return {
        list: page.map((row) => row.member),
        total: rows.length,
      };
    },
    async searchGroupsAndUsers({ query }) {
      return {
        data: {
          list: mockDiscoveryRecords.filter((record) => matchesMockDiscoveryQuery(record, query)),
        },
      };
    },
    async getOnlineUsers() {
      return {
        data: {
          cursor: 0,
          list: [],
          onlineWindowSeconds: 0,
          size: 100,
          total: 0,
        },
      };
    },
    async getUserInfoByGlobalMetaId(globalMetaId) {
      const record = mockDiscoveryRecords.find(
        (item) => item.type === 'user' && item.globalMetaId === globalMetaId,
      );

      return {
        data: record || {
          globalMetaId,
          name: globalMetaId,
          chatPublicKey: MOCK_DISCOVERY_PUBLIC_KEY,
        },
      };
    },
  };
}

export function createNativeChatMockWalletAdapter(): NativeChatWalletAdapter {
  let nextTxid = 1;

  return {
    async getPKHByPath(path) {
      return `mock-pkh:${path}`;
    },
    async getGlobalMetaId() {
      return {
        mvc: { address: 'mock-mvc-address', globalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID },
        btc: { address: 'mock-btc-address', globalMetaId: 'qa-self-btc' },
        doge: { address: 'mock-doge-address', globalMetaId: 'qa-self-doge' },
      };
    },
    async getCurrentProfile() {
      return {
        name: 'QA Native User',
        avatar: undefined,
      };
    },
    async getEcdh(externalPubKey) {
      return {
        externalPubKey,
        sharedSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        ecdhPubKey: '04mock-ecdh-public-key',
      } as Awaited<ReturnType<NativeChatWalletAdapter['getEcdh']>>;
    },
    async createPin() {
      return {
        txids: ['mock-native-chat-txid'],
        totalCost: 1,
      } as Awaited<ReturnType<NativeChatWalletAdapter['createPin']>>;
    },
    async createChatNode(params) {
      const txid = nextTxid;
      nextTxid += 1;

      return {
        txids: params.attachments?.length
          ? [`mock-file-txid-${txid}`, `mock-chat-txid-${txid}`]
          : [`mock-native-chat-txid-${txid}`],
        totalCost: 1,
      } as Awaited<ReturnType<NativeChatWalletAdapter['createChatNode']>>;
    },
  };
}
