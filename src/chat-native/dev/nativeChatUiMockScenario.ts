import type { NativeChatChannel, NativeChatMessage } from '../domain/types';

export const NATIVE_CHAT_UI_MOCK_ACCOUNT_ID = 'qa-self';

const SELF_ID = NATIVE_CHAT_UI_MOCK_ACCOUNT_ID;
const BASE_TIME = 1717800000000;
const MOCK_IMAGE_URI = 'https://reactnative.dev/img/tiny_logo.png';
const MOCK_AVATAR_URI = 'https://www.idchat.io/logo.png';

type NativeChatUiMockGroupInfoFixture = {
  groupId: string;
  name: string;
  groupAvatar: string;
  memberCount: number;
  muted: boolean;
  roomJoinType: string;
};

export type NativeChatUiMockGroupMemberFixture = {
  globalMetaId: string;
  metaId: string;
  address: string;
  name: string;
  avatar: string;
};

export type NativeChatUiMockGroupMemberBuckets = {
  creator: NativeChatUiMockGroupMemberFixture;
  admins: NativeChatUiMockGroupMemberFixture[];
  whiteList: NativeChatUiMockGroupMemberFixture[];
  list: NativeChatUiMockGroupMemberFixture[];
  blockList: NativeChatUiMockGroupMemberFixture[];
};

export const nativeChatUiMockGroupInfoFixtures: Record<string, NativeChatUiMockGroupInfoFixture> = {
  'ui-metaweb-builders': {
    groupId: 'ui-metaweb-builders',
    name: 'MetaWeb Builders',
    groupAvatar: MOCK_AVATAR_URI,
    memberCount: 5,
    muted: false,
    roomJoinType: '0',
  },
};

export const nativeChatUiMockGroupMemberFixtures: Record<string, NativeChatUiMockGroupMemberBuckets> = {
  'ui-metaweb-builders': {
    creator: {
      globalMetaId: 'qa-owner-gm',
      metaId: 'qa-owner-metaid',
      address: 'qa-address-owner',
      name: 'QA Owner',
      avatar: MOCK_AVATAR_URI,
    },
    admins: [
      {
        globalMetaId: 'qa-admin-gm',
        metaId: 'qa-admin-metaid',
        address: 'qa-address-admin',
        name: 'QA Admin',
        avatar: MOCK_AVATAR_URI,
      },
    ],
    whiteList: [
      {
        globalMetaId: 'qa-speaker-gm',
        metaId: 'qa-speaker-metaid',
        address: 'qa-address-speaker',
        name: 'QA Speaker',
        avatar: MOCK_AVATAR_URI,
      },
    ],
    list: [
      {
        globalMetaId: 'qa-member-gm',
        metaId: 'qa-member-metaid',
        address: 'qa-address-member',
        name: 'QA Member',
        avatar: MOCK_AVATAR_URI,
      },
    ],
    blockList: [
      {
        globalMetaId: 'qa-blocked-gm',
        metaId: 'qa-blocked-metaid',
        address: 'qa-address-blocked',
        name: 'QA Blocked',
        avatar: MOCK_AVATAR_URI,
      },
    ],
  },
};

export const nativeChatUiMockChannels: NativeChatChannel[] = [
  {
    accountGlobalMetaId: SELF_ID,
    avatar: MOCK_AVATAR_URI,
    id: 'ui-metaweb-builders',
    lastMessage: {
      content: 'Retry should stay visible when broadcast fails.',
      index: 46,
      kind: 'text',
      senderGlobalMetaId: SELF_ID,
      senderName: 'You',
      timestamp: BASE_TIME + 180_000,
    },
    lastReadIndex: 41,
    roomJoinType: '0',
    serverData: {
      memberCount: 128,
      unreadMentionCount: 2,
    },
    title: 'MetaWeb Builders',
    type: 'group',
    unreadCount: 5,
    updatedAt: BASE_TIME + 180_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    avatar: 'https://www.idchat.io/logo.png',
    id: 'ui-lisa-hahn',
    lastMessage: {
      content: 'Yes, the outgoing avatar confirms it.',
      kind: 'text',
      senderGlobalMetaId: SELF_ID,
      senderName: 'You',
      timestamp: BASE_TIME + 150_000,
    },
    lastReadIndex: 12,
    publicKeyStr: '04ui-lisa-hahn-public-key',
    serverData: {
      userInfo: {
        avatar: 'https://www.idchat.io/logo.png',
        globalMetaId: 'ui-lisa-hahn',
        name: 'Lisa Hahn',
      },
    },
    title: 'Lisa Hahn',
    type: 'private',
    unreadCount: 0,
    updatedAt: BASE_TIME + 150_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    avatar: 'https://www.idchat.io/logo.png',
    id: 'ui-missing-key-peer',
    lastMessage: {
      content: 'Readable history remains available while sending is disabled.',
      kind: 'text',
      senderGlobalMetaId: 'ui-missing-key-peer',
      senderName: 'Missing Key Peer',
      timestamp: BASE_TIME + 140_000,
    },
    lastReadIndex: 4,
    serverData: {
      canSend: false,
      disabledReason: 'Missing peer chat public key',
      userInfo: {
        avatar: 'https://www.idchat.io/logo.png',
        globalMetaId: 'ui-missing-key-peer',
        name: 'Missing Key Peer',
      },
    },
    title: 'Missing Key Peer',
    type: 'private',
    unreadCount: 0,
    updatedAt: BASE_TIME + 140_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    avatar: 'https://www.idchat.io/logo.png',
    id: 'ui-bitcoin-circle',
    lastMessage: {
      content: MOCK_IMAGE_URI,
      kind: 'image',
      senderGlobalMetaId: 'nina-xu',
      senderName: 'Nina',
      timestamp: BASE_TIME + 30_000,
    },
    lastReadIndex: 7,
    roomJoinType: '0',
    serverData: {
      memberCount: 64,
      unreadMentionCount: 0,
    },
    title: 'Bitcoin Circle',
    type: 'group',
    unreadCount: 1,
    updatedAt: BASE_TIME + 30_000,
  },
];

export const nativeChatUiMockMessages: NativeChatMessage[] = [
  {
    accountGlobalMetaId: SELF_ID,
    chain: 'mvc',
    channelId: 'ui-metaweb-builders',
    channelType: 'group',
    content: 'The tx should be visible like IDChat.',
    contentType: 'text/plain',
    index: 42,
    kind: 'text',
    protocol: 'simplegroupchat',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: 'nina-xu',
    senderName: 'Nina Xu',
    status: 'sent',
    timestamp: BASE_TIME + 60_000,
    txId: '9f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8091a2b3c4d5e6f708192a0c18',
  },
  {
    accountGlobalMetaId: SELF_ID,
    chain: 'mvc',
    channelId: 'ui-metaweb-builders',
    channelType: 'group',
    content: 'Right side also shows my current account avatar.',
    contentType: 'text/plain',
    index: 43,
    kind: 'text',
    protocol: 'simplegroupchat',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: SELF_ID,
    senderName: 'You',
    status: 'sent',
    timestamp: BASE_TIME + 90_000,
    txId: 'a8d142e9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76990b',
  },
  {
    accountGlobalMetaId: SELF_ID,
    channelId: 'ui-metaweb-builders',
    channelType: 'group',
    content: `long-message-evidence ${'abcdefghij'.repeat(24)}\nSecond line stays inside the bubble.`,
    contentType: 'text/plain',
    index: 44,
    kind: 'text',
    protocol: 'simplegroupchat',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: 'oliver-chen',
    senderName: 'Oliver Chen',
    status: 'sent',
    timestamp: BASE_TIME + 100_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    channelId: 'ui-metaweb-builders',
    channelType: 'group',
    content: '{"protocol":"redpacket","amount":"hidden"}',
    contentType: 'application/json',
    index: 45,
    kind: 'text',
    protocol: '/protocols/redpacket',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: 'nina-xu',
    senderName: 'Nina Xu',
    status: 'sent',
    timestamp: BASE_TIME + 110_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    chain: 'doge',
    channelId: 'ui-bitcoin-circle',
    channelType: 'group',
    attachmentUri: 'ipfs://not-renderable-p1-2',
    content: 'ipfs://not-renderable-p1-2',
    contentType: 'image/png',
    index: 7,
    kind: 'image',
    protocol: 'simplefilegroupchat',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: 'nina-xu',
    senderName: 'Nina',
    status: 'sent',
    timestamp: BASE_TIME + 20_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    chain: 'doge',
    channelId: 'ui-bitcoin-circle',
    channelType: 'group',
    attachmentUri: MOCK_IMAGE_URI,
    content: MOCK_IMAGE_URI,
    contentType: 'image/png',
    index: 8,
    kind: 'image',
    localPreviewUri: MOCK_IMAGE_URI,
    protocol: 'simplefilegroupchat',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: 'nina-xu',
    senderName: 'Nina',
    status: 'sent',
    timestamp: BASE_TIME + 30_000,
    txId: 'd94b7d2c9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76919a',
  },
  {
    accountGlobalMetaId: SELF_ID,
    chain: 'btc',
    channelId: 'ui-lisa-hahn',
    channelType: 'private',
    content: 'Are you testing with the right account?',
    contentType: 'text/plain',
    index: 13,
    kind: 'text',
    protocol: 'simplemsg',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: 'ui-lisa-hahn',
    senderName: 'Lisa Hahn',
    status: 'sent',
    timestamp: BASE_TIME + 120_000,
    txId: '18fe5c2d9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b7694b9',
  },
  {
    accountGlobalMetaId: SELF_ID,
    channelId: 'ui-lisa-hahn',
    channelType: 'private',
    content: 'Yes, the outgoing avatar confirms it.',
    contentType: 'text/plain',
    kind: 'text',
    mockId: 'ui-pending-outgoing',
    protocol: 'simplemsg',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: SELF_ID,
    senderName: 'You',
    status: 'pending',
    timestamp: BASE_TIME + 150_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    channelId: 'ui-missing-key-peer',
    channelType: 'private',
    content: 'Readable history remains available while sending is disabled.',
    contentType: 'text/plain',
    index: 4,
    kind: 'text',
    protocol: 'simplemsg',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: 'ui-missing-key-peer',
    senderName: 'Missing Key Peer',
    status: 'sent',
    timestamp: BASE_TIME + 140_000,
  },
  {
    accountGlobalMetaId: SELF_ID,
    channelId: 'ui-metaweb-builders',
    channelType: 'group',
    content: 'Retry should stay visible when broadcast fails.',
    contentType: 'text/plain',
    errorMessage: 'Broadcast failed. Tap to retry.',
    kind: 'text',
    mockId: 'ui-failed-outgoing',
    protocol: 'simplegroupchat',
    senderAvatar: 'https://www.idchat.io/logo.png',
    senderGlobalMetaId: SELF_ID,
    senderName: 'You',
    status: 'failed',
    timestamp: BASE_TIME + 180_000,
  },
];
