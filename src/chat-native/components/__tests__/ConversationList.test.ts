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

  it('filters local conversations immediately without requesting remote discovery', () => {
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
      {
        ...createChannel({
          content: 'quiet',
          kind: 'text',
          timestamp: 2,
        }),
        id: 'channel-2',
        title: 'Beta Room',
      },
      ],
      onOpenChannel: jest.fn(),
      onSearchRemote,
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Search chats' }).props.onChangeText('alpha');
    });

    expect(onSearchRemote).not.toHaveBeenCalled();
    expect(
      renderer.root.findAll((node) => node.props.children === 'Local Alpha').length,
    ).toBeGreaterThan(0);
    expect(renderer.root.findAll((node) => node.props.children === 'Beta Room')).toHaveLength(0);
    expect(renderer.root.findAll((node) => node.props.children === 'No matching chats')).toHaveLength(0);
  });

  it('clears remote discovery when the local search field is cleared', () => {
    const onClearRemoteSearch = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [createChannel()],
      onClearRemoteSearch,
      onOpenChannel: jest.fn(),
      onSearchRemote: jest.fn(),
    });

    const searchInput = renderer.root.findByProps({ accessibilityLabel: 'Search chats' });

    act(() => {
      searchInput.props.onChangeText('alpha');
    });
    act(() => {
      searchInput.props.onChangeText('');
    });

    expect(onClearRemoteSearch).toHaveBeenCalledTimes(1);
  });

  it('runs remote discovery from the explicit search action with the trimmed query', () => {
    const onSearchRemote = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [createChannel()],
      onOpenChannel: jest.fn(),
      onSearchRemote,
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Search chats' }).props.onChangeText('  alpha  ');
    });
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Search IDChat for alpha' }).props.onPress();
    });

    expect(onSearchRemote).toHaveBeenCalledTimes(1);
    expect(onSearchRemote).toHaveBeenCalledWith('alpha');
  });

  it('runs remote discovery from the search input submit with the trimmed query', () => {
    const onSearchRemote = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [createChannel()],
      onOpenChannel: jest.fn(),
      onSearchRemote,
    });

    const searchInput = renderer.root.findByProps({ accessibilityLabel: 'Search chats' });

    act(() => {
      searchInput.props.onChangeText('  beta  ');
    });
    act(() => {
      searchInput.props.onSubmitEditing();
    });

    expect(onSearchRemote).toHaveBeenCalledTimes(1);
    expect(onSearchRemote).toHaveBeenCalledWith('beta');
  });

  it('opens a conversation from an accessible stable row', () => {
    const onOpenChannel = jest.fn();
    const channel = {
      ...createChannel({
        content: 'see you soon',
        kind: 'text',
        timestamp: 1,
      }),
      id: 'alpha-room',
      title: 'Alpha Room',
    };
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [channel],
      onOpenChannel,
    });

    const row = renderer.root.findByProps({ testID: 'native-chat-row-alpha-room' });

    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toBe('Open chat Alpha Room. see you soon');

    act(() => {
      row.props.onPress();
    });

    expect(onOpenChannel).toHaveBeenCalledTimes(1);
    expect(onOpenChannel).toHaveBeenCalledWith(channel);
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

  it('exposes stable simulator selectors for search and discovery rows', () => {
    const onSearchRemote = jest.fn();
    const discoveryResult: NativeChatDiscoveryResult = {
      id: 'qa-discovery-peer',
      type: 'private',
      title: 'Discovery Peer',
      subtitle: 'qa-discovery-peer',
    };
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [createChannel()],
      discoveryResults: [discoveryResult],
      onOpenChannel: jest.fn(),
      onOpenDiscoveryResult: jest.fn(),
      onSearchRemote,
    });

    const searchInput = renderer.root.findByProps({ testID: 'native-chat-search-input' });

    expect(searchInput.props.accessibilityLabel).toBe('Search chats');

    act(() => {
      searchInput.props.onChangeText('discovery');
    });

    expect(renderer.root.findByProps({ testID: 'native-chat-remote-search-button' })).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'native-chat-discovery-result-private-qa-discovery-peer' }),
    ).toBeTruthy();
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
