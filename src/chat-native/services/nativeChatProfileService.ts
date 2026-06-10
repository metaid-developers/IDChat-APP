import type { NativeChatChannel, NativeChatMessage, NativeChatUserProfile } from '../domain/types';
import type { NativeChatRepository } from '../storage/chatRepository';

type ProfileApi = {
  getUserInfoByGlobalMetaId?: (globalMetaId: string) => Promise<any>;
};

type HydrateChannelsDeps = {
  accountGlobalMetaId: string;
  channels: NativeChatChannel[];
  apiClient?: ProfileApi;
  repository: NativeChatRepository;
  concurrency?: number;
};

type HydrateMessagesDeps = {
  accountGlobalMetaId: string;
  messages: NativeChatMessage[];
  apiClient?: ProfileApi;
  repository: NativeChatRepository;
  concurrency?: number;
};

const DEFAULT_PROFILE_CONCURRENCY = 4;

function asObject(value: any): Record<string, any> {
  return value && typeof value === 'object' ? value : {};
}

function firstString(...values: any[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function normalizeProfilePayload({
  accountGlobalMetaId,
  profileKey,
  payload,
}: {
  accountGlobalMetaId: string;
  profileKey: string;
  payload: any;
}): NativeChatUserProfile | undefined {
  const source = asObject(payload?.data || payload);
  const globalMetaId = firstString(source.globalMetaId, source.globalMetaID, source.globalmetaid, profileKey);
  const key = globalMetaId || profileKey;

  if (!key) {
    return undefined;
  }

  const avatar = firstString(source.avatar, source.avatarImage, source.nftAvatar);

  return {
    accountGlobalMetaId,
    profileKey: key,
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

function getPrivateProfileKey(channel: NativeChatChannel): string | undefined {
  if (channel.type !== 'private') {
    return undefined;
  }

  const serverData = asObject(channel.serverData);
  const userInfo = asObject(serverData.userInfo || serverData.targetUserInfo || serverData.peerUserInfo);

  return firstString(userInfo.globalMetaId, userInfo.metaid, userInfo.metaId, serverData.targetMetaId, channel.id);
}

function getMessageProfileKey(message: NativeChatMessage): string | undefined {
  return firstString(message.senderGlobalMetaId);
}

function profileFromMessagePayload(
  accountGlobalMetaId: string,
  message: NativeChatMessage,
): NativeChatUserProfile | undefined {
  const profileKey = getMessageProfileKey(message);

  if (!profileKey || (!message.senderName && !message.senderAvatar)) {
    return undefined;
  }

  return normalizeProfilePayload({
    accountGlobalMetaId,
    profileKey,
    payload: {
      globalMetaId: profileKey,
      name: message.senderName,
      avatar: message.senderAvatar,
    },
  });
}

async function fetchProfile({
  accountGlobalMetaId,
  apiClient,
  profileKey,
  repository,
}: {
  accountGlobalMetaId: string;
  apiClient?: ProfileApi;
  profileKey: string;
  repository: NativeChatRepository;
}): Promise<NativeChatUserProfile | undefined> {
  if (!apiClient?.getUserInfoByGlobalMetaId) {
    return undefined;
  }

  try {
    const payload = await apiClient.getUserInfoByGlobalMetaId(profileKey);
    const profile = normalizeProfilePayload({ accountGlobalMetaId, profileKey, payload });

    if (profile) {
      await repository.upsertUserProfile(profile);
    }

    return profile;
  } catch {
    return undefined;
  }
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        await worker(items[currentIndex]);
      }
    }),
  );
}

function applyProfileToPrivateChannel(
  channel: NativeChatChannel,
  profile: NativeChatUserProfile | undefined,
): NativeChatChannel {
  if (!profile) {
    return channel;
  }

  return {
    ...channel,
    title: profile.name || channel.title,
    avatar: profile.avatar || profile.avatarImage || channel.avatar,
    publicKeyStr: profile.chatPublicKey || channel.publicKeyStr,
  };
}

function applyProfileToMessage(
  message: NativeChatMessage,
  profile: NativeChatUserProfile | undefined,
): NativeChatMessage {
  if (!profile) {
    return message;
  }

  return {
    ...message,
    senderName: message.senderName || profile.name,
    senderAvatar: message.senderAvatar || profile.avatar || profile.avatarImage,
  };
}

export async function hydrateNativeChatChannels({
  accountGlobalMetaId,
  channels,
  apiClient,
  repository,
  concurrency = DEFAULT_PROFILE_CONCURRENCY,
}: HydrateChannelsDeps): Promise<NativeChatChannel[]> {
  const hydratedChannels = [...channels];
  const targets = hydratedChannels
    .map((channel, index) => ({ channel, index, profileKey: getPrivateProfileKey(channel) }))
    .filter((target): target is { channel: NativeChatChannel; index: number; profileKey: string } =>
      Boolean(target.profileKey),
    );

  await mapWithConcurrency(targets, concurrency, async ({ channel, index, profileKey }) => {
    const cachedProfile = await repository.getUserProfile(accountGlobalMetaId, profileKey);
    const profile =
      cachedProfile ||
      await fetchProfile({
        accountGlobalMetaId,
        apiClient,
        profileKey,
        repository,
      });

    hydratedChannels[index] = applyProfileToPrivateChannel(channel, profile);
  });

  return hydratedChannels;
}

export async function hydrateNativeChatMessages({
  accountGlobalMetaId,
  messages,
  apiClient,
  repository,
  concurrency = DEFAULT_PROFILE_CONCURRENCY,
}: HydrateMessagesDeps): Promise<NativeChatMessage[]> {
  const hydratedMessages = [...messages];
  const targets = hydratedMessages
    .map((message, index) => ({ message, index, profileKey: getMessageProfileKey(message) }))
    .filter((target): target is { message: NativeChatMessage; index: number; profileKey: string } =>
      Boolean(target.profileKey),
    );

  await mapWithConcurrency(targets, concurrency, async ({ message, index, profileKey }) => {
    const payloadProfile = profileFromMessagePayload(accountGlobalMetaId, message);

    if (payloadProfile) {
      await repository.upsertUserProfile(payloadProfile);
      hydratedMessages[index] = applyProfileToMessage(message, payloadProfile);
      return;
    }

    const cachedProfile = await repository.getUserProfile(accountGlobalMetaId, profileKey);
    const profile =
      cachedProfile ||
      await fetchProfile({
        accountGlobalMetaId,
        apiClient,
        profileKey,
        repository,
      });

    hydratedMessages[index] = applyProfileToMessage(message, profile);
  });

  return hydratedMessages;
}
