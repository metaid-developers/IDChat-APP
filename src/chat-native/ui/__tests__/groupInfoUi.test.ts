import type { NativeChatGroupInfo, NativeChatGroupMember } from '../../domain/types';
import {
  getGroupMemberRowViewModel,
  getGroupInfoIdViewModel,
  getGroupInfoMuteLabel,
  getGroupInfoSummaryTitle,
  sortGroupMembersForDisplay,
} from '../groupInfoUi';

const baseGroupInfo: NativeChatGroupInfo = {
  accountGlobalMetaId: 'self',
  groupId: 'group-1',
  name: 'Build Room',
  updatedAt: 1000,
};

function createMember(overrides: Partial<NativeChatGroupMember>): NativeChatGroupMember {
  return {
    accountGlobalMetaId: 'self',
    groupId: 'group-1',
    memberId: 'member-gm',
    role: 'member',
    updatedAt: 1000,
    ...overrides,
  };
}

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

  it('maps member roles to product labels', () => {
    expect(getGroupMemberRowViewModel(createMember({ role: 'owner' })).roleLabel).toBe('Owner');
    expect(getGroupMemberRowViewModel(createMember({ role: 'admin' })).roleLabel).toBe('Admin');
    expect(getGroupMemberRowViewModel(createMember({ role: 'speaker' })).roleLabel).toBe('Speaker');
    expect(getGroupMemberRowViewModel(createMember({ role: 'member' })).roleLabel).toBe('Member');
    expect(getGroupMemberRowViewModel(createMember({ role: 'blocked' })).roleLabel).toBe('Blocked');
  });

  it('prefers display name, then bounded public identifier, then Member for member row title', () => {
    const longGlobalMetaId = 'member-public-global-meta-id-abcdefghijklmnopqrstuvwxyz-1234567890';

    expect(getGroupMemberRowViewModel(createMember({
      globalMetaId: longGlobalMetaId,
      name: 'Nina Builder',
    })).title).toBe('Nina Builder');
    expect(getGroupMemberRowViewModel(createMember({
      globalMetaId: longGlobalMetaId,
      memberId: longGlobalMetaId,
    })).title).toBe('member-publi...34567890');
    expect(getGroupMemberRowViewModel(createMember({
      memberId: '',
    })).title).toBe('Member');
  });

  it('shows role plus at most one bounded public identifier as member row subtitle', () => {
    const longGlobalMetaId = 'member-public-global-meta-id-abcdefghijklmnopqrstuvwxyz-1234567890';
    const viewModel = getGroupMemberRowViewModel(createMember({
      address: '1LongAddressShouldNotAlsoRender',
      globalMetaId: longGlobalMetaId,
      metaId: 'meta-id-should-not-also-render',
      name: 'Nina Builder',
      role: 'admin',
    }));

    expect(viewModel.subtitle).toBe('Admin · member-publi...34567890');
    expect(viewModel.subtitle).not.toContain('1LongAddressShouldNotAlsoRender');
    expect(viewModel.subtitle).not.toContain('meta-id-should-not-also-render');
    expect(viewModel.subtitle.length).toBeLessThan(`Admin · ${longGlobalMetaId}`.length);
  });

  it('does not expose raw member payload JSON in member row models', () => {
    const viewModel = getGroupMemberRowViewModel(createMember({
      name: undefined,
      globalMetaId: 'member-gm',
      raw: {
        nestedSecret: 'do-not-render',
        payload: { id: 'raw-id' },
      },
    }));

    expect(JSON.stringify(viewModel)).not.toContain('do-not-render');
    expect(JSON.stringify(viewModel)).not.toContain('nestedSecret');
    expect(Object.keys(viewModel)).toEqual(['id', 'title', 'subtitle', 'avatar', 'roleLabel']);
  });

  it('sorts member rows by role, timestamp, and id for display', () => {
    const sorted = sortGroupMembersForDisplay([
      createMember({ memberId: 'member-old', role: 'member', updatedAt: 1000 }),
      createMember({ memberId: 'blocked-new', role: 'blocked', updatedAt: 9000 }),
      createMember({ memberId: 'speaker', role: 'speaker', updatedAt: 2000 }),
      createMember({ memberId: 'admin-z', role: 'admin', updatedAt: 3000 }),
      createMember({ memberId: 'owner', role: 'owner', updatedAt: 100 }),
      createMember({ memberId: 'admin-a', role: 'admin', updatedAt: 3000 }),
    ]);

    expect(sorted.map((member) => member.memberId)).toEqual([
      'owner',
      'admin-a',
      'admin-z',
      'speaker',
      'member-old',
      'blocked-new',
    ]);
  });
});
