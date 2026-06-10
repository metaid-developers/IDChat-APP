import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { TextInput } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeChatGroupInfo, NativeChatGroupMember } from '../../domain/types';
import GroupInfoDrawer from '../GroupInfoDrawer';

const groupInfo: NativeChatGroupInfo = {
  accountGlobalMetaId: 'self',
  groupId: 'group-1',
  name: 'Build Room',
  avatar: 'https://example.test/group.png',
  shortId: 'build',
  announcement: 'Ship daily',
  memberCount: 2,
  muted: true,
  updatedAt: 1000,
};

const members: NativeChatGroupMember[] = [
  {
    accountGlobalMetaId: 'self',
    groupId: 'group-1',
    memberId: 'owner-gm',
    globalMetaId: 'owner-gm',
    name: 'Owner',
    role: 'owner',
    updatedAt: 1000,
  },
  {
    accountGlobalMetaId: 'self',
    groupId: 'group-1',
    memberId: 'member-gm',
    globalMetaId: 'member-gm',
    name: 'Member',
    role: 'member',
    updatedAt: 1000,
  },
];

describe('GroupInfoDrawer', () => {
  it('renders group info, mute state, and members', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={groupInfo}
          members={members}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={jest.fn()}
          searchQuery=""
          visible
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'Build Room' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Muted' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Owner' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Member' })).toBeTruthy();
  });

  it('exposes close, copy group id, search, and load-more actions', () => {
    const onClose = jest.fn();
    const onCopyGroupId = jest.fn();
    const onChangeSearchQuery = jest.fn();
    const onLoadMore = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={groupInfo}
          hasMoreMembers
          members={members}
          onChangeSearchQuery={onChangeSearchQuery}
          onClose={onClose}
          onCopyGroupId={onCopyGroupId}
          onLoadMore={onLoadMore}
          searchQuery=""
          visible
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Close group info' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Copy group id' }).props.onPress();
      renderer.root.findByType(TextInput).props.onChangeText('owner');
      renderer.root.findByProps({ accessibilityLabel: 'Load more group members' }).props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCopyGroupId).toHaveBeenCalledTimes(1);
    expect(onChangeSearchQuery).toHaveBeenCalledWith('owner');
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
