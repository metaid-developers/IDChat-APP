import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import type { MessageRowViewModel } from '../../ui/chatUiSelectors';
import MessageActionSheet from '../MessageActionSheet';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

function messageRow(overrides: Partial<MessageRowViewModel> = {}): MessageRowViewModel {
  return {
    id: 'message-1',
    isSelf: true,
    senderName: 'You',
    body: 'hello from sheet',
    kind: 'text',
    timeLabel: '13:43',
    txLabel: 'MVC abcd...123',
    fullTxId: 'abcd1234fulltxid',
    statusLabel: '',
    raw: {
      accountGlobalMetaId: 'self',
      channelId: 'group',
      channelType: 'group',
      kind: 'text',
      content: 'hello from sheet',
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

async function pressAction(renderer: TestRenderer.ReactTestRenderer, label: string) {
  const button = renderer.root.findByProps({ accessibilityLabel: label });

  await act(async () => {
    button.props.onPress();
    await Promise.resolve();
  });
}

describe('MessageActionSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('shows the full txid when available', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageActionSheet
          onClose={jest.fn()}
          row={messageRow()}
          visible
        />,
      );
    });

    const fullTxIdNodes = renderer.root.findAll(
      (node) => node.props.selectable === true && node.props.children === 'abcd1234fulltxid',
    );

    expect(fullTxIdNodes.length).toBeGreaterThan(0);
  });

  it('copies message text from the sheet action', async () => {
    const onClose = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageActionSheet
          onClose={onClose}
          row={messageRow()}
          visible
        />,
      );
    });

    await pressAction(renderer, 'Copy text');

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('hello from sheet');
    expect(onClose).toHaveBeenCalled();
  });

  it('copies full txid from the sheet action', async () => {
    const onClose = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageActionSheet
          onClose={onClose}
          row={messageRow()}
          visible
        />,
      );
    });

    await pressAction(renderer, 'Copy txid');

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('abcd1234fulltxid');
    expect(onClose).toHaveBeenCalled();
  });
});
