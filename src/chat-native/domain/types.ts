export type NativeChatChannelType = 'private' | 'group' | 'sub-group';

export type NativeChatMessageKind = 'text' | 'image';

export type NativeChatSendStatus = 'idle' | 'pending' | 'sent' | 'failed' | 'cancelled';

export type NativeChatRuntimeConfig = {
  chatApiBase: string;
  chatWsBase: string;
  chatWsPath: string;
  socketPath: string;
  addressHost: string;
};

export type NativeChatChannel = {
  accountGlobalMetaId: string;
  id: string;
  type: NativeChatChannelType;
  title: string;
  avatar?: string;
  parentGroupId?: string;
  roomJoinType?: string;
  path?: string;
  passwordKey?: string;
  publicKeyStr?: string;
  lastMessage?: NativeChatMessageSummary;
  unreadCount: number;
  lastReadIndex: number;
  updatedAt: number;
  serverData?: Record<string, unknown>;
};

export type NativeChatMessageSummary = {
  content: string;
  kind: NativeChatMessageKind;
  timestamp: number;
  index?: number;
  senderGlobalMetaId?: string;
  senderName?: string;
};

export type NativeChatMessage = {
  accountGlobalMetaId: string;
  channelId: string;
  channelType: NativeChatChannelType;
  kind: NativeChatMessageKind;
  content: string;
  contentType: string;
  encryption?: string;
  protocol: string;
  timestamp: number;
  senderGlobalMetaId?: string;
  senderName?: string;
  senderAvatar?: string;
  txId?: string;
  pinId?: string;
  chain?: string;
  mockId?: string;
  index?: number;
  attachmentUri?: string;
  localPreviewUri?: string;
  replyPin?: string;
  status: NativeChatSendStatus;
  errorMessage?: string;
  raw?: Record<string, unknown>;
};

export type NativeChatMention = {
  globalMetaId: string;
  name: string;
};

export type NativeChatDiscoveryResult = {
  id: string;
  type: 'private' | 'group';
  title: string;
  subtitle?: string;
  avatar?: string;
  disabledReason?: string;
  raw?: Record<string, unknown>;
};

export type NativeChatUserProfile = {
  accountGlobalMetaId: string;
  profileKey: string;
  globalMetaId?: string;
  metaId?: string;
  address?: string;
  name?: string;
  avatar?: string;
  avatarImage?: string;
  chatPublicKey?: string;
  chatPublicKeyId?: string;
  updatedAt: number;
  raw?: Record<string, unknown>;
};

export type NativeChatGroupInfo = {
  accountGlobalMetaId: string;
  groupId: string;
  name: string;
  avatar?: string;
  shortId?: string;
  status?: string;
  roomJoinType?: string;
  announcement?: string;
  memberCount?: number;
  muted?: boolean;
  updatedAt: number;
  raw?: Record<string, unknown>;
};

export type NativeChatGroupMemberRole = 'owner' | 'admin' | 'speaker' | 'member' | 'blocked';

export type NativeChatGroupMember = {
  accountGlobalMetaId: string;
  groupId: string;
  memberId: string;
  globalMetaId?: string;
  metaId?: string;
  address?: string;
  name?: string;
  avatar?: string;
  role: NativeChatGroupMemberRole;
  chatPublicKey?: string;
  updatedAt: number;
  raw?: Record<string, unknown>;
};

export type NativeChatEcdhRecord = {
  accountGlobalMetaId: string;
  externalPubKey: string;
  sharedSecret: string;
  ecdhPubKey?: string;
  creatorPubkey?: string;
  updatedAt: number;
};
