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

export type NativeChatEcdhRecord = {
  accountGlobalMetaId: string;
  externalPubKey: string;
  sharedSecret: string;
  ecdhPubKey?: string;
  creatorPubkey?: string;
  updatedAt: number;
};
