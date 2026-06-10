import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { FlatList } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeChatMessage } from '../../domain/types';
import MessageList from '../MessageList';

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
    const onLoadOlder = jest.fn();
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

    act(() => {
      flatList.props.onViewableItemsChanged({
        viewableItems: [
          { item: messages[0] },
          { item: messages[1] },
          { item: messages[2] },
        ],
      });
    });

    expect(onVisibleMessageIndexChange).toHaveBeenCalledWith(4);
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
    const onScrollToLatest = jest.fn();
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
});
