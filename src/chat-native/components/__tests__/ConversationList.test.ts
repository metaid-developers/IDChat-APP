import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeChatChannel, NativeChatDiscoveryResult } from '../../domain/types';
import { getNativeChatPreviewContent, sortConversationRows } from '../../ui/chatUiSelectors';
import ConversationList from '../ConversationList';

const renderers: TestRenderer.ReactTestRenderer[] = [];

function createChannel(lastMessage?: NativeChatChannel['lastMessage']): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'channel-1',
    type: 'group',
    title: 'Group',
    lastMessage,
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 1,
  };
}

function renderConversationList(props: React.ComponentProps<typeof ConversationList>) {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(React.createElement(ConversationList, props));
  });
  renderers.push(renderer);
  return renderer;
}

afterEach(() => {
  act(() => {
    while (renderers.length > 0) {
      renderers.pop()?.unmount();
    }
  });
});

describe('ConversationList', () => {
  it('keeps text previews readable', () => {
    expect(
      getNativeChatPreviewContent(
        createChannel({
          content: 'hello',
          kind: 'text',
          timestamp: 1,
        }),
      ),
    ).toBe('hello');
  });

  it('does not expose raw metafile uris for image previews', () => {
    expect(
      getNativeChatPreviewContent(
        createChannel({
          content: 'metafile://file-txi0',
          kind: 'image',
          timestamp: 1,
        }),
      ),
    ).toBe('[Image]');
  });

  it('sorts private and group channels together instead of splitting tabs', () => {
    const privateChannel = createChannel({
      content: 'private',
      kind: 'text',
      timestamp: 10,
    });
    privateChannel.id = 'private';
    privateChannel.type = 'private';

    const groupChannel = createChannel({
      content: 'group',
      kind: 'text',
      timestamp: 20,
    });
    groupChannel.id = 'group';
    groupChannel.type = 'group';

    expect(sortConversationRows([privateChannel, groupChannel]).map((item) => item.id)).toEqual([
      'group',
      'private',
    ]);
  });

  it('keeps fake recommended group actions out of the live empty state', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [],
      onOpenChannel: jest.fn(),
    });

    expect(
      renderer.root.findAllByProps({ accessibilityLabel: 'Join recommended group' }),
    ).toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ accessibilityLabel: 'Explore chats first' }),
    ).toHaveLength(0);
    expect(
      renderer.root.findAll((node) => node.props.children === 'No chats yet').length,
    ).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Open online bots' })).toHaveLength(0);
  });

  it('keeps recommended group actions reachable in the mock onboarding scenario', () => {
    const onJoinGroup = jest.fn();
    const onExploreChats = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [],
      onExploreChats,
      onJoinRecommendedGroup: onJoinGroup,
      onOpenChannel: jest.fn(),
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Join recommended group' }).props.onPress();
    });
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Explore chats first' }).props.onPress();
    });

    expect(onJoinGroup).toHaveBeenCalledTimes(1);
    expect(onExploreChats).toHaveBeenCalledTimes(1);
  });

  it('keeps local filtering immediate while requesting remote discovery', () => {
    const onSearchRemote = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [
        {
          ...createChannel({
            content: 'latest',
            kind: 'text',
            timestamp: 1,
          }),
          title: 'Local Alpha',
        },
      ],
      onOpenChannel: jest.fn(),
      onSearchRemote,
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Search chats' }).props.onChangeText('alpha');
    });

    expect(onSearchRemote).toHaveBeenLastCalledWith('alpha');
    expect(
      renderer.root.findAll((node) => node.props.children === 'Local Alpha').length,
    ).toBeGreaterThan(0);
    expect(renderer.root.findAll((node) => node.props.children === 'No matching chats')).toHaveLength(0);
  });

  it('renders selectable remote discovery results from search', () => {
    const onOpenDiscoveryResult = jest.fn();
    const discoveryResult: NativeChatDiscoveryResult = {
      id: 'remote-group',
      type: 'group',
      title: 'Remote Group',
      subtitle: '12 members',
      avatar: 'https://example.com/remote.png',
      raw: { groupId: 'remote-group' },
    };
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [],
      discoveryResults: [discoveryResult],
      onOpenChannel: jest.fn(),
      onOpenDiscoveryResult,
      onSearchRemote: jest.fn(),
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Search chats' }).props.onChangeText('remote');
    });
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Open discovery result Remote Group' }).props.onPress();
    });

    expect(
      renderer.root.findAll((node) => node.props.children === 'Discovery').length,
    ).toBeGreaterThan(0);
    expect(
      renderer.root.findAll((node) => node.props.children === 'Remote Group').length,
    ).toBeGreaterThan(0);
    expect(onOpenDiscoveryResult).toHaveBeenCalledWith(discoveryResult);
  });

  it('opens the online bot panel only when a native handler is provided', () => {
    const onOpenOnlineBots = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [],
      onOpenChannel: jest.fn(),
      onOpenOnlineBots,
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Open online bots' }).props.onPress();
    });

    expect(onOpenOnlineBots).toHaveBeenCalledTimes(1);
  });
});
