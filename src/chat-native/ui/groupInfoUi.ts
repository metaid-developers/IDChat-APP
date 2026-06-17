import type { NativeChatGroupInfo } from '../domain/types';

export type GroupInfoIdViewModel = {
  copyValue: string;
  displayValue: string;
  copyEnabled: boolean;
};

const MAX_GROUP_ID_DISPLAY_LENGTH = 24;
const GROUP_ID_PREFIX_LENGTH = 12;
const GROUP_ID_SUFFIX_LENGTH = 8;

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
