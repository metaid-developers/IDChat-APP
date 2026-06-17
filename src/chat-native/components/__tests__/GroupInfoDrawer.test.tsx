import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Text, TextInput } from 'react-native';
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
  it('renders summary, bounded group id, mute state, announcement, and members', () => {
    const longGroupId = 'group-info-public-id-abcdefghijklmnopqrstuvwxyz-1234567890';
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={{ ...groupInfo, groupId: longGroupId, shortId: undefined }}
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
    expect(renderer.root.findByProps({ accessibilityLabel: 'Build Room avatar' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: '2 members' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: longGroupId })).toHaveLength(0);
    expect(renderer.root.findAll((node) =>
      typeof node.props.children === 'string'
      && node.props.children.includes('group-info')
      && node.props.children.includes('7890'),
    ).length).toBeGreaterThan(0);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Copy group id' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Muted' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Ship daily' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Owner' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Member' })).toBeTruthy();
  });

  it('does not render an empty announcement card when announcement is absent', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={{ ...groupInfo, announcement: undefined }}
          members={members}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={jest.fn()}
          searchQuery=""
          visible
        />,
      );
    });

    expect(renderer.root.findAllByProps({ children: 'Announcement' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ children: 'Ship daily' })).toHaveLength(0);
  });

  it('contains missing group id without a dash primary value or copy action', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={{ ...groupInfo, groupId: '', shortId: undefined }}
          members={members}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={jest.fn()}
          searchQuery=""
          visible
        />,
      );
    });

    expect(renderer.root.findAllByProps({ children: '-' })).toHaveLength(0);
    expect(renderer.root.findByProps({ children: 'Unavailable' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy group id' })).toHaveLength(0);
  });

  it('contains missing mute state without raw unknown-status copy', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={{ ...groupInfo, muted: undefined }}
          members={members}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={jest.fn()}
          searchQuery=""
          visible
        />,
      );
    });

    expect(renderer.root.findAllByProps({ children: 'Notification status unknown' })).toHaveLength(0);
    expect(renderer.root.findByProps({ children: 'Notifications unavailable' })).toBeTruthy();
  });

  it('shows scoped group id copy feedback', () => {
    const onCopyGroupId = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={groupInfo}
          members={members}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={onCopyGroupId}
          searchQuery=""
          visible
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Copy group id' }).props.onPress();
      renderer.update(
        <GroupInfoDrawer
          copyFeedback="Copied group id"
          groupInfo={groupInfo}
          members={members}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={onCopyGroupId}
          searchQuery=""
          visible
        />,
      );
    });

    expect(onCopyGroupId).toHaveBeenCalledTimes(1);
    expect(renderer.root.findByProps({ children: 'Copied group id' })).toBeTruthy();
  });

  it('keeps close and the summary shell visible while loading', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          groupInfo={groupInfo}
          loading
          members={[]}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={jest.fn()}
          searchQuery=""
          visible
        />,
      );
    });

    expect(renderer.root.findByProps({ accessibilityLabel: 'Close group info' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Build Room' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Loading group info' })).toBeTruthy();
  });

  it('shows contained product failure copy with retry and no raw technical details', () => {
    const onRetry = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <GroupInfoDrawer
          errorMessage="Showing available group details. Retry when your connection is stable."
          groupInfo={groupInfo}
          members={members}
          onChangeSearchQuery={jest.fn()}
          onClose={jest.fn()}
          onCopyGroupId={jest.fn()}
          onRetry={onRetry}
          searchQuery=""
          visible
        />,
      );
    });

    const failureText = renderer.root
      .findAllByType(Text)
      .map((node) => node.props.children)
      .filter((children): children is string => typeof children === 'string')
      .join(' ');

    expect(renderer.root.findByProps({ children: 'Group info could not refresh' })).toBeTruthy();
    expect(renderer.root.findByProps({
      children: 'Showing available group details. Retry when your connection is stable.',
    })).toBeTruthy();
    expect(failureText).not.toMatch(/https?:\/\//);
    expect(failureText).not.toMatch(/\{|\}|\[object Object\]|Error:|TypeError|stack/i);

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Retry group info' }).props.onPress();
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
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
