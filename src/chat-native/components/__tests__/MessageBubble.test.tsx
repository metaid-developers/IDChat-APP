import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import type { MessageRowViewModel } from '../../ui/chatUiSelectors';
import { nativeChatTheme } from '../../ui/chatTheme';
import MessageBubble from '../MessageBubble';

function messageRow(overrides: Partial<MessageRowViewModel> = {}): MessageRowViewModel {
  return {
    id: 'message-1',
    isSelf: true,
    senderName: 'You',
    body: 'hello',
    kind: 'text',
    timeLabel: '13:43',
    txLabel: 'MVC abcd...123',
    fullTxId: 'abcd1234fulltxid',
    statusLabel: '',
    showSenderLabel: false,
    showAvatar: true,
    isGroupedWithPrevious: false,
    isUnsupported: false,
    safeCopyText: 'hello',
    raw: {
      accountGlobalMetaId: 'self',
      channelId: 'group',
      channelType: 'group',
      kind: 'text',
      content: 'hello',
      contentType: 'text/plain',
      protocol: 'simplegroupchat',
      timestamp: 1710000000,
      senderGlobalMetaId: 'self',
      txId: 'abcd1234fulltxid',
      status: 'sent',
    },
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('copies the full txid from the visible Copy chip', () => {
    const row = messageRow();
    const onCopyTxId = jest.fn<(txId: string, row: MessageRowViewModel) => void>();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageBubble onCopyTxId={onCopyTxId} row={row} />,
      );
    });

    const copyButton = renderer.root.findByProps({ accessibilityLabel: 'Copy txid' });

    act(() => {
      copyButton.props.onPress();
    });

    expect(onCopyTxId).toHaveBeenCalledWith('abcd1234fulltxid', row);
  });

  it('opens message actions from normal tap and long press', () => {
    const row = messageRow();
    const onOpenActions = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageBubble onOpenActions={onOpenActions} row={row} />,
      );
    });

    const actionTargets = renderer.root.findAll(
      (node) =>
        node.props.accessibilityLabel === 'Open message actions' &&
        typeof node.props.onPress === 'function' &&
        typeof node.props.onLongPress === 'function',
    );

    expect(actionTargets.length).toBeGreaterThan(0);

    act(() => {
      actionTargets[0].props.onPress();
    });
    act(() => {
      actionTargets[0].props.onLongPress();
    });

    expect(onOpenActions).toHaveBeenCalledTimes(2);
    expect(onOpenActions).toHaveBeenCalledWith(row);
  });

  it('hides repeated sender label and reserves avatar space for grouped messages', () => {
    const row = messageRow({
      isSelf: false,
      senderName: 'Nina',
      showSenderLabel: false,
      showAvatar: false,
      isGroupedWithPrevious: true,
      isUnsupported: false,
      safeCopyText: 'hello',
      raw: {
        ...messageRow().raw,
        senderGlobalMetaId: 'peer',
      },
    });
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<MessageBubble row={row} />);
    });

    expect(renderer.root.findAllByProps({ children: 'Nina' })).toHaveLength(0);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Grouped message avatar spacer' })).toBeTruthy();
  });

  it('renders unsupported messages as product placeholders', () => {
    const row = {
      ...messageRow({
        body: 'Unsupported message',
        isUnsupported: true,
        safeCopyText: '',
        showSenderLabel: true,
        showAvatar: true,
        isGroupedWithPrevious: false,
      }),
      bodyDetail: 'This message type is not supported here yet.',
      productState: 'unsupported',
    } as MessageRowViewModel;
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<MessageBubble row={row} />);
    });

    expect(renderer.root.findByProps({ children: 'Unsupported message' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'This message type is not supported here yet.' })).toBeTruthy();
  });

  it('keeps self unsupported placeholder readable on outgoing bubbles', () => {
    const row = {
      ...messageRow({
        body: 'Unsupported message',
        isSelf: true,
        isUnsupported: true,
        safeCopyText: '',
      }),
      bodyDetail: 'This message type is not supported here yet.',
      productState: 'unsupported',
    } as MessageRowViewModel;
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<MessageBubble row={row} />);
    });

    const placeholder = renderer.root.findByProps({ children: 'Unsupported message' });
    const flattened = StyleSheet.flatten(placeholder.props.style);

    expect(flattened.color).toBe(nativeChatTheme.color.surface);
    expect(flattened.color).not.toBe(nativeChatTheme.color.mutedText);
  });

  it('renders encrypted fallback messages without raw technical failure text', () => {
    const row = {
      ...messageRow({
        body: 'Encrypted message',
        isUnsupported: false,
        safeCopyText: '',
        showSenderLabel: false,
        showAvatar: true,
      }),
      bodyDetail: 'This message cannot be displayed here.',
      productState: 'encrypted',
    } as MessageRowViewModel;
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<MessageBubble row={row} />);
    });

    expect(renderer.root.findByProps({ children: 'Encrypted message' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'This message cannot be displayed here.' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'Unable to decrypt this message' })).toHaveLength(0);
  });

  it('renders image rows from message content when attachment and local preview are missing', () => {
    const contentUri = 'metafile://content-only-imagei0';
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageBubble
          row={messageRow({
            body: '[Image]',
            kind: 'image',
            raw: {
              ...messageRow().raw,
              kind: 'image',
              content: contentUri,
              attachmentUri: undefined,
              localPreviewUri: undefined,
            },
          })}
        />,
      );
    });

    expect(renderer.root.findByProps({ accessibilityLabel: 'Open image preview' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'Image unavailable' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ children: '[Image]' })).toHaveLength(0);
  });

  it('keeps attachment uri precedence when both attachment and content are renderable', () => {
    const attachmentUri = 'https://example.test/attachment-image.png';
    const contentUri = 'metafile://content-fallback-imagei0';
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageBubble
          row={messageRow({
            body: '[Image]',
            kind: 'image',
            raw: {
              ...messageRow().raw,
              kind: 'image',
              content: contentUri,
              attachmentUri,
              localPreviewUri: undefined,
            },
          })}
        />,
      );
    });

    const image = renderer.root.findByType(Image);

    expect(image.props.source).toEqual({ uri: attachmentUri });
  });

  it('keeps image fallback bounded when no renderable image uri exists anywhere', () => {
    const rawUri = 'ipfs://not-renderable-image';
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageBubble
          row={messageRow({
            body: '[Image]',
            kind: 'image',
            raw: {
              ...messageRow().raw,
              kind: 'image',
              content: rawUri,
              attachmentUri: undefined,
              localPreviewUri: undefined,
            },
          })}
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'Image unavailable' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: rawUri })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ children: 'Unable to decrypt this message' })).toHaveLength(0);
  });

  it('keeps transaction footer compact without rendering the full txid', () => {
    const fullTxId = 'abcd1234fulltxidwithlongtail';
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageBubble
          onCopyTxId={jest.fn<(txId: string, row: MessageRowViewModel) => void>()}
          row={messageRow({
            fullTxId,
            txLabel: 'MVC abcd...ail',
            raw: {
              ...messageRow().raw,
              txId: fullTxId,
            },
          })}
        />,
      );
    });

    expect(renderer.root.findAllByProps({ children: fullTxId })).toHaveLength(0);
    expect(renderer.root.findByProps({ children: 'MVC abcd...ail' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Copy txid' })).toBeTruthy();

    const compactFooters = renderer.root.findAll((node) => {
      const flattened = StyleSheet.flatten(node.props.style);

      return (
        flattened?.flexDirection === 'row' &&
        flattened?.flexWrap === 'wrap' &&
        flattened?.maxWidth === '100%'
      );
    });

    expect(compactFooters.length).toBeGreaterThan(0);
  });
});
