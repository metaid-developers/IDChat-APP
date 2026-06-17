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
  function renderDrawer(props: Partial<React.ComponentProps<typeof GroupInfoDrawer>> = {}) {
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
          {...props}
        />,
      );
    });

    return renderer;
  }

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

  it('renders member rows with ChatAvatar image or initials fallback labels', () => {
    const renderer = renderDrawer({
      members: [
        {
          accountGlobalMetaId: 'self',
          groupId: 'group-1',
          memberId: 'nina-gm',
          globalMetaId: 'nina-gm',
          name: 'Nina Builder',
          avatar: 'https://example.test/nina.png',
          role: 'admin',
          updatedAt: 1000,
        },
        {
          accountGlobalMetaId: 'self',
          groupId: 'group-1',
          memberId: 'fallback-gm',
          globalMetaId: 'fallback-gm',
          name: 'Fallback User',
          role: 'member',
          updatedAt: 900,
        },
      ],
    });

    expect(renderer.root.findByProps({ accessibilityLabel: 'Nina Builder avatar' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Fallback User avatar' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Admin · nina-gm' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Member · fallback-gm' })).toBeTruthy();
  });

  it('keeps long member names and identifiers in one-line bounded text', () => {
    const longName = 'Nina Builder With A Very Long Display Name That Should Stay On One Row';
    const longIdentifier = 'member-public-global-meta-id-abcdefghijklmnopqrstuvwxyz-1234567890';
    const renderer = renderDrawer({
      members: [
        {
          accountGlobalMetaId: 'self',
          groupId: 'group-1',
          memberId: longIdentifier,
          globalMetaId: longIdentifier,
          name: longName,
          role: 'speaker',
          updatedAt: 1000,
        },
      ],
    });
    const textNodes = renderer.root.findAllByType(Text);
    const titleNode = textNodes.find((node) => node.props.children === longName);
    const subtitleNode = textNodes.find((node) => node.props.children === 'Speaker · member-publi...34567890');

    expect(titleNode?.props.numberOfLines).toBe(1);
    expect(subtitleNode?.props.numberOfLines).toBe(1);
    expect(renderer.root.findAllByProps({ children: longIdentifier })).toHaveLength(0);
  });

  it('shows an empty member state after members finish loading', () => {
    const renderer = renderDrawer({ members: [] });

    expect(renderer.root.findByProps({ children: 'No members found' })).toBeTruthy();
  });

  it('shows a member search loading state without covering controls', () => {
    const renderer = renderDrawer({
      memberSearchLoading: true,
      members,
      searchQuery: 'owner',
    });

    expect(renderer.root.findByProps({ children: 'Searching members' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Search group members' })).toBeTruthy();
  });

  it('shows contained retryable member search failure copy', () => {
    const onRetryMembers = jest.fn();
    const renderer = renderDrawer({
      memberErrorMessage: 'Members could not refresh. Retry when your connection is stable.',
      onRetryMembers,
      searchQuery: 'owner',
    });

    expect(renderer.root.findByProps({ children: 'Members could not refresh' })).toBeTruthy();
    expect(renderer.root.findByProps({
      children: 'Members could not refresh. Retry when your connection is stable.',
    })).toBeTruthy();

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Retry members' }).props.onPress();
    });

    expect(onRetryMembers).toHaveBeenCalledTimes(1);
  });

  it('shows member failure instead of the empty member state', () => {
    const renderer = renderDrawer({
      memberErrorMessage: 'Members could not refresh. Retry when your connection is stable.',
      members: [],
      searchQuery: 'owner',
    });

    expect(renderer.root.findByProps({ children: 'Members could not refresh' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'No members found' })).toHaveLength(0);
  });

  it('shows member failure instead of the end cue when rows remain visible', () => {
    const renderer = renderDrawer({
      hasMoreMembers: false,
      memberErrorMessage: 'Members could not refresh. Retry when your connection is stable.',
      members,
      searchQuery: 'owner',
    });

    expect(renderer.root.findByProps({ children: 'Members could not refresh' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Owner' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'No more members' })).toHaveLength(0);
  });

  it('disables load more and shows progress while a member page is loading', () => {
    const onLoadMore = jest.fn();
    const renderer = renderDrawer({
      hasMoreMembers: true,
      memberLoadMoreLoading: true,
      onLoadMore,
    });
    const loadMoreButton = renderer.root.findByProps({ accessibilityLabel: 'Load more group members' });

    expect(loadMoreButton.props.disabled).toBe(true);
    expect(renderer.root.findByProps({ children: 'Loading more' })).toBeTruthy();

    act(() => {
      loadMoreButton.props.onPress?.();
    });

    expect(onLoadMore).toHaveBeenCalledTimes(0);
  });

  it('disables load more while member search is loading', () => {
    const onLoadMore = jest.fn();
    const renderer = renderDrawer({
      hasMoreMembers: true,
      memberSearchLoading: true,
      onLoadMore,
    });
    const loadMoreButton = renderer.root.findByProps({ accessibilityLabel: 'Load more group members' });

    expect(loadMoreButton.props.disabled).toBe(true);

    act(() => {
      loadMoreButton.props.onPress?.();
    });

    expect(onLoadMore).toHaveBeenCalledTimes(0);
  });

  it('shows a noninteractive end cue when no more members exist', () => {
    const renderer = renderDrawer({
      hasMoreMembers: false,
      members,
    });

    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Load more group members' })).toHaveLength(0);
    expect(renderer.root.findByProps({ children: 'No more members' })).toBeTruthy();
  });
});
