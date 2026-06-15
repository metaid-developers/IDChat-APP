import type {
  NativeChatChannel,
  NativeChatDiscoveryResult,
  NativeChatOnlineBot,
  NativeChatUserProfile,
} from '../domain/types';
import type { NativeChatRepository } from '../storage/chatRepository';
import { resolveNativeChatAvatarSource } from '../ui/avatarSource';
import { getSafeNativeChatProfileText } from './nativeChatDisplaySafety';

type DiscoveryApiClient = {
  searchGroupsAndUsers?: (params: { query: string }) => Promise<any>;
  getOnlineUsers?: (params: { cursor: string; size: string }) => Promise<any>;
  getUserInfoByGlobalMetaId?: (globalMetaId: string) => Promise<any>;
};

type SearchNativeChatDiscoveryParams = {
  apiClient: DiscoveryApiClient;
  query: string;
};

type LoadNativeChatOnlineBotsParams = {
  apiClient: DiscoveryApiClient;
  cursor?: string;
  size?: string;
};

type NativeChatOnlineBotsResult = {
  total: number;
  cursor: number;
  size: number;
  onlineWindowSeconds: number;
  bots: NativeChatOnlineBot[];
};

type CreateNativePrivateChatFromDiscoveryParams = {
  accountGlobalMetaId: string;
  apiClient: DiscoveryApiClient;
  repository: Pick<NativeChatRepository, 'upsertChannel' | 'upsertUserProfile'>;
  targetGlobalMetaId: string;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function compactGlobalMetaId(globalMetaId: string): string {
  if (globalMetaId.length <= 12) {
    return globalMetaId;
  }

  return `${globalMetaId.slice(0, 8)}...${globalMetaId.slice(-4)}`;
}

function getPayloadList(payload: unknown): unknown[] {
  const data = asObject(asObject(payload).data || payload);
  return asArray(data.list || data.items || data);
}

function normalizeDiscoveryResult(source: unknown): NativeChatDiscoveryResult | undefined {
  const record = asObject(source);
  const sourceType = firstString(record.type, record.chatType, record.kind)?.toLowerCase();
  const isUser = sourceType === 'user' || sourceType === 'private';
  const type: NativeChatDiscoveryResult['type'] = isUser ? 'private' : 'group';
  const id = type === 'private'
    ? firstString(record.globalMetaId, record.globalMetaID, record.globalmetaid, record.id, record.metaId)
    : firstString(record.groupId, record.channelId, record.id, record.globalMetaId, record.globalmetaid);

  if (!id) {
    return undefined;
  }

  const memberCount = firstNumber(record.memberCount, record.membersCount, record.count);
  const title = type === 'private'
    ? firstString(record.name, record.userName, record.displayName) || compactGlobalMetaId(id)
    : firstString(record.groupName, record.roomName, record.name, record.title) || id;
  const subtitle = type === 'private'
    ? firstString(record.globalMetaId, record.globalMetaID, record.metaId, record.address, id)
    : memberCount !== undefined
      ? `${memberCount} members`
      : firstString(record.shortId, record.metaId, record.globalMetaId, record.address);

  return {
    id,
    type,
    title,
    subtitle,
    avatar: resolveNativeChatAvatarSource(
      record.avatar as string | undefined,
      record.avatarImage as string | undefined,
      record.groupAvatar as string | undefined,
    ),
    raw: record,
  };
}

function normalizeBio(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    const safeText = getSafeNativeChatProfileText(value);
    if (safeText) {
      return safeText;
    }

    try {
      return normalizeBio(JSON.parse(value));
    } catch {
      return undefined;
    }
  }

  const record = asObject(value);
  const provider = firstString(record.primaryProvider, record.fallbackProvider, record.LLM, record.llm);
  if (provider) {
    return `LLM:${provider}`;
  }

  return getSafeNativeChatProfileText(firstString(record.summary, record.description, record.title));
}

function normalizeOnlineBot(source: unknown): NativeChatOnlineBot | undefined {
  const record = asObject(source);
  const userInfo = asObject(record.userInfo);
  const globalMetaId = firstString(userInfo.globalMetaId, record.globalMetaId, userInfo.metaid, record.metaid);
  const chatPublicKey = firstString(userInfo.chatPublicKey, userInfo.chatpubkey, userInfo.publicKeyStr);

  if (!globalMetaId || !chatPublicKey) {
    return undefined;
  }

  return {
    globalMetaId,
    name: firstString(userInfo.name, userInfo.displayName) || compactGlobalMetaId(globalMetaId),
    avatar: resolveNativeChatAvatarSource(
      userInfo.avatar as string | undefined,
      userInfo.avatarImage as string | undefined,
    ),
    bio: normalizeBio(userInfo.bio),
    chatPublicKey,
    lastSeenAt: firstNumber(record.lastSeenAt) ?? 0,
    lastSeenAgoSeconds: firstNumber(record.lastSeenAgoSeconds) ?? 0,
    deviceCount: firstNumber(record.deviceCount) ?? 0,
    raw: record,
  };
}

function normalizeDiscoveryUserProfile({
  accountGlobalMetaId,
  payload,
  targetGlobalMetaId,
}: {
  accountGlobalMetaId: string;
  payload: unknown;
  targetGlobalMetaId: string;
}): NativeChatUserProfile {
  const source = asObject(asObject(payload).data || payload);
  const globalMetaId = firstString(source.globalMetaId, source.globalMetaID, source.globalmetaid, targetGlobalMetaId);
  const avatar = resolveNativeChatAvatarSource(
    source.avatar as string | undefined,
    source.avatarImage as string | undefined,
    source.nftAvatar as string | undefined,
  );

  return {
    accountGlobalMetaId,
    profileKey: globalMetaId || targetGlobalMetaId,
    globalMetaId,
    metaId: firstString(source.metaid, source.metaId),
    address: firstString(source.address),
    name: firstString(source.name, source.metaName, source.nickName),
    avatar,
    avatarImage: firstString(source.avatarImage, avatar),
    chatPublicKey: firstString(source.chatPublicKey, source.chatpubkey, source.publicKeyStr),
    chatPublicKeyId: firstString(source.chatPublicKeyId, source.chatpubkeyId),
    updatedAt: Date.now(),
    raw: source,
  };
}

export async function createNativePrivateChatFromDiscovery({
  accountGlobalMetaId,
  apiClient,
  repository,
  targetGlobalMetaId,
}: CreateNativePrivateChatFromDiscoveryParams): Promise<NativeChatChannel> {
  if (!apiClient.getUserInfoByGlobalMetaId) {
    throw new Error('Private chat profile lookup is unavailable');
  }

  const payload = await apiClient.getUserInfoByGlobalMetaId(targetGlobalMetaId);
  const profile = normalizeDiscoveryUserProfile({
    accountGlobalMetaId,
    payload,
    targetGlobalMetaId,
  });

  if (!profile.chatPublicKey) {
    throw new Error('Private chat is unavailable for this user');
  }

  const now = Date.now();
  const channel: NativeChatChannel = {
    accountGlobalMetaId,
    id: profile.globalMetaId || targetGlobalMetaId,
    type: 'private',
    title: profile.name || compactGlobalMetaId(profile.globalMetaId || targetGlobalMetaId),
    avatar: resolveNativeChatAvatarSource(profile.avatar, profile.avatarImage),
    publicKeyStr: profile.chatPublicKey,
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: now,
    serverData: {
      targetMetaId: profile.globalMetaId || targetGlobalMetaId,
      userInfo: profile.raw,
    },
  };

  await repository.upsertUserProfile(profile);
  await repository.upsertChannel(channel);

  return channel;
}

export async function searchNativeChatDiscovery({
  apiClient,
  query,
}: SearchNativeChatDiscoveryParams): Promise<NativeChatDiscoveryResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || !apiClient.searchGroupsAndUsers) {
    return [];
  }

  const payload = await apiClient.searchGroupsAndUsers({ query: normalizedQuery });
  return getPayloadList(payload)
    .map(normalizeDiscoveryResult)
    .filter((result): result is NativeChatDiscoveryResult => Boolean(result));
}

export async function loadNativeChatOnlineBots({
  apiClient,
  cursor = '0',
  size = '100',
}: LoadNativeChatOnlineBotsParams): Promise<NativeChatOnlineBotsResult> {
  if (!apiClient.getOnlineUsers) {
    return {
      total: 0,
      cursor: Number(cursor) || 0,
      size: Number(size) || 100,
      onlineWindowSeconds: 0,
      bots: [],
    };
  }

  const payload = await apiClient.getOnlineUsers({ cursor, size });
  const data = asObject(asObject(payload).data || payload);
  const botsByGlobalMetaId = new Map<string, NativeChatOnlineBot>();

  getPayloadList(data).forEach((item) => {
    const bot = normalizeOnlineBot(item);
    if (bot && !botsByGlobalMetaId.has(bot.globalMetaId)) {
      botsByGlobalMetaId.set(bot.globalMetaId, bot);
    }
  });

  return {
    total: firstNumber(data.total) ?? botsByGlobalMetaId.size,
    cursor: firstNumber(data.cursor) ?? (Number(cursor) || 0),
    size: firstNumber(data.size) ?? (Number(size) || 100),
    onlineWindowSeconds: firstNumber(data.onlineWindowSeconds) ?? 0,
    bots: Array.from(botsByGlobalMetaId.values()),
  };
}
