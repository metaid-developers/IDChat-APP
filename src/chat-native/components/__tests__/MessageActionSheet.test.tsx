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
    safeCopyText: 'hello from sheet',
    isUnsupported: false,
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
          row={messageRow({
            safeCopyText: 'safe visible text',
            raw: {
              ...messageRow().raw,
              content: 'raw content must not copy',
            },
          })}
          visible
        />,
      );
    });

    await pressAction(renderer, 'Copy text');

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('safe visible text');
    expect(Clipboard.setStringAsync).not.toHaveBeenCalledWith('raw content must not copy');
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

  it('does not render copy text for unsupported rows with raw payload content', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageActionSheet
          onClose={jest.fn()}
          row={messageRow({
            body: 'Unsupported message',
            isUnsupported: true,
            safeCopyText: '',
            raw: {
              ...messageRow().raw,
              content: '{"redpacket":"raw"}',
              contentType: 'application/json',
              protocol: '/protocols/redpacket',
            },
          })}
          visible
        />,
      );
    });

    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy text' })).toHaveLength(0);
    expect(Clipboard.setStringAsync).not.toHaveBeenCalledWith('{"redpacket":"raw"}');
  });

  it('does not render copy text for decrypt failure rows with raw ciphertext', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <MessageActionSheet
          onClose={jest.fn()}
          row={messageRow({
            body: 'Unable to decrypt this message',
            safeCopyText: '',
            raw: {
              ...messageRow().raw,
              content: 'U2FsdGVkX19privatepayload',
            },
          })}
          visible
        />,
      );
    });

    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy text' })).toHaveLength(0);
    expect(Clipboard.setStringAsync).not.toHaveBeenCalledWith('U2FsdGVkX19privatepayload');
  });
});
