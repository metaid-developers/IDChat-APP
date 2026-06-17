import type { NativeChatGroupInfo } from '../../domain/types';
import {
  getGroupInfoIdViewModel,
  getGroupInfoMuteLabel,
  getGroupInfoSummaryTitle,
} from '../groupInfoUi';

const baseGroupInfo: NativeChatGroupInfo = {
  accountGlobalMetaId: 'self',
  groupId: 'group-1',
  name: 'Build Room',
  updatedAt: 1000,
};

describe('groupInfoUi', () => {
  it('uses Group info as the summary title fallback', () => {
    expect(getGroupInfoSummaryTitle(undefined)).toBe('Group info');
    expect(getGroupInfoSummaryTitle({ ...baseGroupInfo, name: '  ' })).toBe('Group info');
    expect(getGroupInfoSummaryTitle(baseGroupInfo)).toBe('Build Room');
  });

  it('bounds public group id display while preserving the full copy value', () => {
    const longGroupId = 'group-info-public-id-abcdefghijklmnopqrstuvwxyz-1234567890';

    const viewModel = getGroupInfoIdViewModel({
      ...baseGroupInfo,
      groupId: longGroupId,
    });

    expect(viewModel.copyValue).toBe(longGroupId);
    expect(viewModel.copyEnabled).toBe(true);
    expect(viewModel.displayValue.length).toBeLessThan(longGroupId.length);
    expect(viewModel.displayValue).toContain('group-info');
    expect(viewModel.displayValue).toContain('7890');
  });

  it('keeps mute copy to the approved read-only labels', () => {
    expect(getGroupInfoMuteLabel({ ...baseGroupInfo, muted: true })).toBe('Muted');
    expect(getGroupInfoMuteLabel({ ...baseGroupInfo, muted: false })).toBe('Notifications on');
    expect(getGroupInfoMuteLabel({ ...baseGroupInfo, muted: undefined })).toBe('Notifications unavailable');
    expect(getGroupInfoMuteLabel(undefined)).toBe('Notifications unavailable');
  });
});
