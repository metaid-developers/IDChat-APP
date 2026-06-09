import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import type { NativeChatApiClient } from '../services/chatApiClient';
import type { NativeChatWalletAdapter } from '../services/chatWalletAdapter';
import type { createNativeChatStore } from '../state/useNativeChatStore';
import type { NativeChatRepository } from '../storage/chatRepository';
import {
  NATIVE_CHAT_UI_MOCK_ACCOUNT_ID,
  nativeChatUiMockChannels,
  nativeChatUiMockMessages,
} from './nativeChatUiMockScenario';

type NativeChatStoreApi = ReturnType<typeof createNativeChatStore>;
type MockChatApiClient = Pick<
  NativeChatApiClient,
  'getLatestChatInfoList' | 'getGroupMessagesByIndex' | 'getChannelMessagesByIndex' | 'getPrivateMessagesByIndex'
> &
  Pick<NativeChatApiClient, 'getGroupMessages' | 'getChannelMessages' | 'getPrivateMessages'>;

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
  accountGlobalMetaId?: string;
  emptyList?: boolean;
  scenario?: NativeChatMockScenarioName;
}): Promise<void> {
  const accountGlobalMetaId = params.accountGlobalMetaId || MOCK_ACCOUNT_GLOBAL_META_ID;
  const scenarioData = params.emptyList
    ? { channels: [], messages: [] }
    : getMockScenarioData(params.scenario);

  params.store.getState().setAccount(accountGlobalMetaId);
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
