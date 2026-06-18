import type { NativeChatGroupInfo, NativeChatGroupMember, NativeChatGroupMemberRole } from '../domain/types';

export type GroupInfoIdViewModel = {
  copyValue: string;
  displayValue: string;
  copyEnabled: boolean;
};

export type GroupMemberRowViewModel = {
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  roleLabel: 'Owner' | 'Admin' | 'Speaker' | 'Member' | 'Blocked';
};

const MAX_GROUP_ID_DISPLAY_LENGTH = 24;
const GROUP_ID_PREFIX_LENGTH = 12;
const GROUP_ID_SUFFIX_LENGTH = 8;
const MEMBER_ROLE_LABELS: Record<NativeChatGroupMemberRole, GroupMemberRowViewModel['roleLabel']> = {
  owner: 'Owner',
  admin: 'Admin',
  speaker: 'Speaker',
  member: 'Member',
  blocked: 'Blocked',
};
const MEMBER_ROLE_DISPLAY_ORDER: Record<NativeChatGroupMemberRole, number> = {
  owner: 0,
  admin: 1,
  speaker: 2,
  member: 3,
  blocked: 4,
};

function firstNonEmptyString(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
}

function boundPublicGroupId(value: string): string {
  if (value.length <= MAX_GROUP_ID_DISPLAY_LENGTH) {
    return value;
  }

  return `${value.slice(0, GROUP_ID_PREFIX_LENGTH)}...${value.slice(-GROUP_ID_SUFFIX_LENGTH)}`;
}

export function getGroupInfoSummaryTitle(groupInfo: NativeChatGroupInfo | undefined): string {
  return firstNonEmptyString(groupInfo?.name) || 'Group info';
}

export function getGroupInfoIdViewModel(
  groupInfo: NativeChatGroupInfo | undefined,
  fallbackGroupId?: string,
): GroupInfoIdViewModel {
  const copyValue = firstNonEmptyString(groupInfo?.groupId, fallbackGroupId) || '';
  const displayValue = firstNonEmptyString(groupInfo?.shortId, groupInfo?.groupId, fallbackGroupId);

  return {
    copyValue,
    displayValue: displayValue ? boundPublicGroupId(displayValue) : 'Unavailable',
    copyEnabled: Boolean(copyValue),
  };
}

export function getGroupInfoMuteLabel(
  groupInfo: NativeChatGroupInfo | undefined,
): 'Muted' | 'Notifications on' | 'Notifications unavailable' {
  if (groupInfo?.muted === true) {
    return 'Muted';
  }

  if (groupInfo?.muted === false) {
    return 'Notifications on';
  }

  return 'Notifications unavailable';
}

function getMemberPublicIdentifier(member: NativeChatGroupMember): string | undefined {
  return firstNonEmptyString(member.globalMetaId, member.metaId, member.address, member.memberId);
}

export function getGroupMemberRowViewModel(member: NativeChatGroupMember): GroupMemberRowViewModel {
  const publicIdentifier = getMemberPublicIdentifier(member);
  const boundedIdentifier = publicIdentifier ? boundPublicGroupId(publicIdentifier) : undefined;
  const roleLabel = MEMBER_ROLE_LABELS[member.role];

  return {
    id: firstNonEmptyString(member.memberId, publicIdentifier) || 'member',
    title: firstNonEmptyString(member.name) || boundedIdentifier || 'Member',
    subtitle: boundedIdentifier ? `${roleLabel} · ${boundedIdentifier}` : roleLabel,
    avatar: firstNonEmptyString(member.avatar),
    roleLabel,
  };
}

export function sortGroupMembersForDisplay(members: NativeChatGroupMember[]): NativeChatGroupMember[] {
  return [...members].sort(
    (a, b) =>
      MEMBER_ROLE_DISPLAY_ORDER[a.role] - MEMBER_ROLE_DISPLAY_ORDER[b.role] ||
      b.updatedAt - a.updatedAt ||
      a.memberId.localeCompare(b.memberId),
  );
}
