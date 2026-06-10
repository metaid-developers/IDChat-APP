import type {
  NativeChatChannel,
  NativeChatGroupInfo,
  NativeChatGroupMember,
  NativeChatGroupMemberRole,
} from '../domain/types';
import type { NativeChatRepository } from '../storage/chatRepository';

type GroupInfoApi = {
  getGroupInfo?: (params: { groupId: string }) => Promise<any>;
  getGroupMembers?: (params: { groupId: string; cursor?: string; size?: string }) => Promise<any>;
  searchGroupMembers?: (params: { groupId: string; query: string; size?: string }) => Promise<any>;
};

type LoadGroupInfoDeps = {
  accountGlobalMetaId: string;
  groupId: string;
  channel?: NativeChatChannel;
  apiClient?: GroupInfoApi;
  repository: NativeChatRepository;
  cursor?: string;
  size?: string;
  query?: string;
};

type LoadGroupInfoResult = {
  groupInfo?: NativeChatGroupInfo;
  members: NativeChatGroupMember[];
  source: 'network' | 'cache';
};

function asObject(value: any): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
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

function firstNumber(...values: any[]): number | undefined {
  for (const value of values) {
    const numberValue = Number(value);

    if (Number.isFinite(numberValue)) {
      return Math.max(0, numberValue);
    }
  }

  return undefined;
}

function firstBoolean(...values: any[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value !== 0;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const normalized = value.trim().toLowerCase();

      if (['1', 'true', 'yes', 'muted'].includes(normalized)) {
        return true;
      }

      if (['0', 'false', 'no', 'unmuted'].includes(normalized)) {
        return false;
      }
    }
  }

  return undefined;
}

function getPayloadData(payload: any): any {
  return payload?.data ?? payload;
}

export function normalizeNativeChatGroupInfo({
  accountGlobalMetaId,
  channel,
  groupId,
  payload,
}: {
  accountGlobalMetaId: string;
  channel?: NativeChatChannel;
  groupId: string;
  payload: any;
}): NativeChatGroupInfo {
  const source = asObject(getPayloadData(payload));
  const serverData = asObject(channel?.serverData);
  const resolvedGroupId = firstString(source.groupId, source.groupID, source.id, groupId) || groupId;
  const name = firstString(source.name, source.groupName, source.title, channel?.title, resolvedGroupId) || resolvedGroupId;
  const memberCount = firstNumber(
    source.memberCount,
    source.membersCount,
    source.memberTotal,
    source.userCount,
    source.userTotal,
    serverData.memberCount,
    serverData.membersCount,
    serverData.memberTotal,
    serverData.userCount,
    serverData.userTotal,
  );

  return {
    accountGlobalMetaId,
    groupId: resolvedGroupId,
    name,
    avatar: firstString(source.avatar, source.avatarImage, source.groupAvatar, source.icon, channel?.avatar),
    shortId: firstString(source.shortId, source.shortID, source.groupNumber, source.number),
    status: firstString(source.status, source.groupStatus),
    roomJoinType: firstString(source.roomJoinType, source.joinType, channel?.roomJoinType),
    announcement: firstString(source.announcement, source.notice, source.description),
    memberCount,
    muted: firstBoolean(source.muted, source.isMuted, source.mute, source.muteStatus, serverData.muted),
    updatedAt: Date.now(),
    raw: source,
  };
}

function normalizeMemberPayload({
  accountGlobalMetaId,
  groupId,
  payload,
  role,
}: {
  accountGlobalMetaId: string;
  groupId: string;
  payload: any;
  role: NativeChatGroupMemberRole;
}): NativeChatGroupMember | undefined {
  const source = asObject(payload);
  const userInfo = asObject(source.userInfo || source.user || source.memberInfo);
  const merged = { ...userInfo, ...source };
  const globalMetaId = firstString(
    merged.globalMetaId,
    merged.globalMetaID,
    merged.globalmetaid,
    merged.globalMetaID,
  );
  const metaId = firstString(merged.metaId, merged.metaid);
  const address = firstString(merged.address, merged.addressId);
  const memberId = firstString(globalMetaId, metaId, address, merged.memberId, merged.id);

  if (!memberId) {
    return undefined;
  }

  return {
    accountGlobalMetaId,
    groupId,
    memberId,
    globalMetaId,
    metaId,
    address,
    name: firstString(merged.name, merged.metaName, merged.nickName, merged.nickname, merged.userName),
    avatar: firstString(merged.avatar, merged.avatarImage, merged.nftAvatar),
    role,
    chatPublicKey: firstString(merged.chatPublicKey, merged.chatpubkey, merged.publicKeyStr),
    updatedAt: Date.now(),
    raw: source,
  };
}

function addMember(
  membersById: Map<string, NativeChatGroupMember>,
  member: NativeChatGroupMember | undefined,
): void {
  if (!member) {
    return;
  }

  membersById.set(member.memberId, { ...membersById.get(member.memberId), ...member });
}

export function normalizeNativeChatGroupMembers({
  accountGlobalMetaId,
  groupId,
  payload,
}: {
  accountGlobalMetaId: string;
  groupId: string;
  payload: any;
}): NativeChatGroupMember[] {
  const source = getPayloadData(payload);
  const payloadObject = asObject(source);
  const membersById = new Map<string, NativeChatGroupMember>();

  if (Array.isArray(source)) {
    source.forEach((member) => {
      addMember(membersById, normalizeMemberPayload({ accountGlobalMetaId, groupId, payload: member, role: 'member' }));
    });
    return Array.from(membersById.values());
  }

  if (payloadObject.creator) {
    addMember(
      membersById,
      normalizeMemberPayload({
        accountGlobalMetaId,
        groupId,
        payload: payloadObject.creator,
        role: 'owner',
      }),
    );
  }

  [
    { role: 'admin' as const, values: payloadObject.admins },
    { role: 'speaker' as const, values: payloadObject.whiteList },
    { role: 'blocked' as const, values: payloadObject.blockList },
    { role: 'member' as const, values: payloadObject.list },
  ].forEach(({ role, values }) => {
    asArray(values).forEach((member) => {
      addMember(membersById, normalizeMemberPayload({ accountGlobalMetaId, groupId, payload: member, role }));
    });
  });

  return Array.from(membersById.values());
}

async function fetchGroupInfo({
  accountGlobalMetaId,
  apiClient,
  channel,
  groupId,
  repository,
}: {
  accountGlobalMetaId: string;
  apiClient?: GroupInfoApi;
  channel?: NativeChatChannel;
  groupId: string;
  repository: NativeChatRepository;
}): Promise<NativeChatGroupInfo | undefined> {
  if (!apiClient?.getGroupInfo) {
    return undefined;
  }

  try {
    const payload = await apiClient.getGroupInfo({ groupId });
    const groupInfo = normalizeNativeChatGroupInfo({ accountGlobalMetaId, channel, groupId, payload });
    await repository.upsertGroupInfo(groupInfo);
    return groupInfo;
  } catch {
    return undefined;
  }
}

async function fetchGroupMembers({
  accountGlobalMetaId,
  apiClient,
  cursor,
  groupId,
  query,
  repository,
  size,
}: {
  accountGlobalMetaId: string;
  apiClient?: GroupInfoApi;
  cursor: string;
  groupId: string;
  query?: string;
  repository: NativeChatRepository;
  size: string;
}): Promise<NativeChatGroupMember[] | undefined> {
  try {
    let payload;

    if (query?.trim() && apiClient?.searchGroupMembers) {
      payload = await apiClient.searchGroupMembers({
        groupId,
        query: query.trim(),
        size,
      });
    } else if (apiClient?.getGroupMembers) {
      payload = await apiClient.getGroupMembers({
        groupId,
        cursor,
        size,
      });
    } else {
      return undefined;
    }

    const members = normalizeNativeChatGroupMembers({ accountGlobalMetaId, groupId, payload });
    await repository.upsertGroupMembers(members);
    return members;
  } catch {
    return undefined;
  }
}

export async function loadNativeChatGroupInfo({
  accountGlobalMetaId,
  apiClient,
  channel,
  cursor = '0',
  groupId,
  query,
  repository,
  size = '20',
}: LoadGroupInfoDeps): Promise<LoadGroupInfoResult> {
  const [cachedGroupInfo, cachedMembers] = await Promise.all([
    repository.getGroupInfo(accountGlobalMetaId, groupId),
    repository.listGroupMembers(accountGlobalMetaId, groupId, query),
  ]);
  const [fetchedGroupInfo, fetchedMembers] = await Promise.all([
    fetchGroupInfo({ accountGlobalMetaId, apiClient, channel, groupId, repository }),
    fetchGroupMembers({ accountGlobalMetaId, apiClient, cursor, groupId, query, repository, size }),
  ]);
  const fallbackGroupInfo =
    cachedGroupInfo ||
    (channel ? normalizeNativeChatGroupInfo({ accountGlobalMetaId, channel, groupId, payload: channel.serverData || {} }) : undefined);

  return {
    groupInfo: fetchedGroupInfo || fallbackGroupInfo,
    members: fetchedMembers || cachedMembers,
    source: fetchedGroupInfo || fetchedMembers ? 'network' : 'cache',
  };
}
