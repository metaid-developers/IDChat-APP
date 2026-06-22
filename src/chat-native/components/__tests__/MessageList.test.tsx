import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { FlatList, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeChatMessage } from '../../domain/types';
import MessageList, { shouldAutoScrollToLatestMessage } from '../MessageList';

function createMessage(overrides: Partial<NativeChatMessage> = {}): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'group-1',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 100,
    senderGlobalMetaId: 'sender',
    status: 'sent',
    ...overrides,
  };
}

describe('MessageList', () => {
  it('triggers older loading from the header control and top scroll edge', () => {
    const onLoadOlder = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder
          messages={[
            createMessage({ content: 'one', index: 1, timestamp: 100, txId: 'tx-1' }),
            createMessage({ content: 'two', index: 2, timestamp: 200, txId: 'tx-2' }),
          ]}
          onLoadOlder={onLoadOlder}
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Load older messages' }).props.onPress();
    });

    const flatList = renderer.root.findByType(FlatList);

    act(() => {
      flatList.props.onScroll({
        nativeEvent: {
          contentOffset: { y: 0 },
          contentSize: { height: 600 },
          layoutMeasurement: { height: 300 },
        },
      });
    });

    expect(onLoadOlder).toHaveBeenCalledTimes(2);
  });

  it('reports the highest visible indexed message for read observation', () => {
    const onVisibleMessageIndexChange = jest.fn();
    const messages = [
      createMessage({ content: 'one', index: 1, timestamp: 100, txId: 'tx-1' }),
      createMessage({ content: 'pending', timestamp: 150, mockId: 'pending' }),
      createMessage({ content: 'four', index: 4, timestamp: 400, txId: 'tx-4' }),
    ];
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          messages={messages}
          onVisibleMessageIndexChange={onVisibleMessageIndexChange}
        />,
      );
    });

    const flatList = renderer.root.findByType(FlatList);
    const rows = flatList.props.data;

    act(() => {
      flatList.props.onViewableItemsChanged({
        viewableItems: [
          { item: rows[0] },
          { item: rows[1] },
          { item: rows[2] },
        ],
      });
    });

    expect(onVisibleMessageIndexChange).toHaveBeenCalledWith(4);
  });

  it('shows retryable older-message error state without hiding the transcript', () => {
    const onLoadOlder = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder={false}
          messages={[createMessage({ content: 'existing message', index: 1, txId: 'tx-1' })]}
          olderLoadError="Could not load earlier messages."
          onLoadOlder={onLoadOlder}
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'Could not load earlier messages.' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'existing message' })).toBeTruthy();

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Retry loading older messages' }).props.onPress();
    });

    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });

  it('shows retryable older-message error before ordinary load state when more history remains', () => {
    const onLoadOlder = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder
          messages={[createMessage({ content: 'existing message', index: 1, txId: 'tx-1' })]}
          olderLoadError="Could not load earlier messages."
          onLoadOlder={onLoadOlder}
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'Could not load earlier messages.' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Retry loading older messages' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'Load earlier messages' })).toHaveLength(0);
  });

  it('prefers loading older state over a stale older-message error', () => {
    const onLoadOlder = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder
          loadingOlder
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          olderLoadError="Could not load earlier messages."
          onLoadOlder={onLoadOlder}
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'Loading earlier messages...' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'Could not load earlier messages.' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Retry loading older messages' })).toHaveLength(0);
  });

  it('disables retry when no older load handler is available', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder={false}
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          olderLoadError="Could not load earlier messages."
        />,
      );
    });

    const retryButton = renderer.root.findByProps({ accessibilityLabel: 'Retry loading older messages' });
    expect(retryButton.props.disabled).toBe(true);
  });

  it('skips older header when preserving visible content position with a rendered header', () => {
    const onLoadOlder = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          onLoadOlder={onLoadOlder}
        />,
      );
    });

    const flatList = renderer.root.findByType(FlatList);
    expect(flatList.props.maintainVisibleContentPosition).toEqual({ minIndexForVisible: 1 });
  });

  it('preserves visible content from the first row when no older header is rendered', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
        />,
      );
    });

    const flatList = renderer.root.findByType(FlatList);
    expect(flatList.props.maintainVisibleContentPosition).toEqual({ minIndexForVisible: 0 });
  });

  it('shows no earlier messages only when requested', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder={false}
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          showNoMoreOlder
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'No earlier messages' })).toBeTruthy();
  });

  it('reports whether the list is at the latest edge from scroll geometry', () => {
    const onLatestStateChange = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          onLatestStateChange={onLatestStateChange}
        />,
      );
    });

    const flatList = renderer.root.findByType(FlatList);

    act(() => {
      flatList.props.onScroll({
        nativeEvent: {
          contentOffset: { y: 10 },
          contentSize: { height: 700 },
          layoutMeasurement: { height: 300 },
        },
      });
    });
    act(() => {
      flatList.props.onScroll({
        nativeEvent: {
          contentOffset: { y: 410 },
          contentSize: { height: 700 },
          layoutMeasurement: { height: 300 },
        },
      });
    });

    expect(onLatestStateChange).toHaveBeenCalledWith(false);
    expect(onLatestStateChange).toHaveBeenCalledWith(true);
  });

  it('shows a scroll-to-latest affordance when newer messages are available', () => {
    const onScrollToLatest = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasNewerMessages
          isAtLatest={false}
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          onScrollToLatest={onScrollToLatest}
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Scroll to latest messages' }).props.onPress();
    });

    expect(onScrollToLatest).toHaveBeenCalledTimes(1);
  });

  it('flags latest pinning only when the room is already at latest and has messages', () => {
    expect(shouldAutoScrollToLatestMessage({ isAtLatest: true, rowCount: 1 })).toBe(true);
    expect(shouldAutoScrollToLatestMessage({ isAtLatest: true, rowCount: 0 })).toBe(false);
  });

  it('does not flag latest pinning when the room is not at the latest edge', () => {
    expect(shouldAutoScrollToLatestMessage({ isAtLatest: false, rowCount: 3 })).toBe(false);
  });

  it('keeps content-size latest pinning wired on the room transcript list', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          isAtLatest
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
        />,
      );
    });

    const flatList = renderer.root.findByType(FlatList);

    expect(typeof flatList.props.onContentSizeChange).toBe('function');
  });

  it('pins to the latest edge when content grows and the room is already at latest', () => {
    const scrollToEnd = jest
      .spyOn(FlatList.prototype, 'scrollToEnd')
      .mockImplementation(() => undefined);
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          isAtLatest
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
        />,
      );
    });

    scrollToEnd.mockClear();
    const flatList = renderer.root.findByType(FlatList);

    act(() => {
      flatList.props.onContentSizeChange();
    });

    expect(scrollToEnd).toHaveBeenCalledWith({ animated: false });
    scrollToEnd.mockRestore();
  });

  it('pins to the latest edge after the transcript layout settles', () => {
    const scrollToEnd = jest
      .spyOn(FlatList.prototype, 'scrollToEnd')
      .mockImplementation(() => undefined);
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          isAtLatest
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
        />,
      );
    });

    scrollToEnd.mockClear();
    const flatList = renderer.root.findByType(FlatList);

    act(() => {
      flatList.props.onLayout();
    });

    expect(scrollToEnd).toHaveBeenCalledWith({ animated: false });
    scrollToEnd.mockRestore();
  });

  it('does not repin older history growth when the room is away from latest', () => {
    const scrollToEnd = jest
      .spyOn(FlatList.prototype, 'scrollToEnd')
      .mockImplementation(() => undefined);
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder
          isAtLatest={false}
          loadingOlder
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
        />,
      );
    });

    const flatList = renderer.root.findByType(FlatList);

    act(() => {
      flatList.props.onContentSizeChange();
    });

    expect(scrollToEnd).not.toHaveBeenCalled();
    scrollToEnd.mockRestore();
  });

  it('passes grouped row models to message bubbles', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          messages={[
            createMessage({ senderGlobalMetaId: 'peer', senderName: 'Nina', index: 1, timestamp: 100 }),
            createMessage({ senderGlobalMetaId: 'peer', senderName: 'Nina', index: 2, timestamp: 120 }),
          ]}
        />,
      );
    });

    const senderLabels = renderer.root.findAll(
      (node) => node.type === Text && node.props.children === 'Nina',
    );
    expect(senderLabels).toHaveLength(1);
  });

  it('contains private room unreadable states without raw ciphertext or technical failure text', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          messages={[
            createMessage({
              channelId: 'private-peer',
              channelType: 'private',
              content: 'U2FsdGVkX19privatepayload',
              index: 1,
              protocol: 'simplemsg',
              senderGlobalMetaId: 'peer',
            }),
            createMessage({
              channelId: 'private-peer',
              channelType: 'private',
              content: '{"redpacket":"raw"}',
              contentType: 'application/json',
              index: 2,
              protocol: '/protocols/redpacket',
              senderGlobalMetaId: 'peer',
            }),
            createMessage({
              channelId: 'private-peer',
              channelType: 'private',
              content: 'readable private text',
              index: 3,
              protocol: 'simplemsg',
              senderGlobalMetaId: 'peer',
            }),
            createMessage({
              channelId: 'private-peer',
              channelType: 'private',
              content: '   ',
              index: 4,
              protocol: 'simplemsg',
              senderGlobalMetaId: 'peer',
            }),
          ]}
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'Encrypted message' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'This message cannot be displayed here.' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Unsupported message' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'This message type is not supported here yet.' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Message unavailable' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'This message has no readable content.' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'readable private text' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'Unable to decrypt this message' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ children: 'U2FsdGVkX19privatepayload' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ children: '{"redpacket":"raw"}' })).toHaveLength(0);
  });
});
