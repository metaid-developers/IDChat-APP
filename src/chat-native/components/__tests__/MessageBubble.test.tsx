import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { MessageRowViewModel } from '../../ui/chatUiSelectors';
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
    const row = messageRow({
      body: 'Unsupported message',
      isUnsupported: true,
      safeCopyText: '',
      showSenderLabel: true,
      showAvatar: true,
      isGroupedWithPrevious: false,
    });
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<MessageBubble row={row} />);
    });

    expect(renderer.root.findByProps({ children: 'Unsupported message' })).toBeTruthy();
  });
});
