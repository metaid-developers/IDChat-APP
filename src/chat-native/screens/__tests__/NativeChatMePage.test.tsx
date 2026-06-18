import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { nativeChatStore } from '../../state/useNativeChatStore';
import NativeChatMePage from '../NativeChatMePage';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

function collectText(
  node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | string | null,
): string[] {
  if (!node) {
    return [];
  }

  if (typeof node === 'string') {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  return (node.children || []).flatMap(collectText);
}

describe('NativeChatMePage', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      nativeChatStore.setState({
        accountGlobalMetaId: '',
        accountDisplayName: 'IDChat User',
        accountAvatar: undefined,
        accountAddress: undefined,
        accountChatPublicKey: undefined,
        socketConnected: false,
      });
    });
  });

  afterEach(() => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
  });

  it('renders account data from the native chat store and shows scoped public copy feedback', async () => {
    nativeChatStore.getState().setAccount('alice-gm', {
      address: 'mvc-address',
      avatar: 'https://example.test/avatar.png',
      chatPublicKey: 'chat-key',
      displayName: 'Alice',
    });
    nativeChatStore.getState().setSocketConnected(true);

    act(() => {
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    const screenText = collectText(renderer.toJSON()).join('\n');
    expect(renderer!.root.findByProps({ children: 'Alice' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'alice-gm' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'mvc-address' })).toBeTruthy();
    expect(screenText).toContain('Private chat ready');
    expect(screenText).toContain('Chat sync connected');
    expect(screenText).not.toContain('Socket connected');
    expect(renderer!.root.findByProps({ testID: 'native-chat-me-screen' })).toBeTruthy();

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ children: 'Copied Global MetaID' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'native-chat-copy-feedback' }).props.children).toBe(
      'Copied Global MetaID',
    );
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('alice-gm');

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Copy MVC address' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ children: 'Copied MVC address' })).toBeTruthy();
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('mvc-address');

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Copy chat public key' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ children: 'Copied chat public key' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'native-chat-copy-feedback' }).props.children).toBe(
      'Copied chat public key',
    );
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('chat-key');
    expect(collectText(renderer.toJSON()).join('\n')).not.toMatch(/private key/i);
  });

  it('does not keep copy feedback after the Me page is mounted again', async () => {
    nativeChatStore.getState().setAccount('alice-gm', {
      address: 'mvc-address',
      chatPublicKey: 'chat-key',
      displayName: 'Alice',
    });

    act(() => {
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ testID: 'native-chat-copy-feedback' }).props.children).toBe(
      'Copied Global MetaID',
    );

    act(() => {
      renderer!.unmount();
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    expect(renderer!.root.findAllByProps({ testID: 'native-chat-copy-feedback' })).toHaveLength(0);
  });

  it('does not render placeholder native settings content', () => {
    nativeChatStore.getState().setAccount('alice-gm', {
      address: 'mvc-address',
      chatPublicKey: 'chat-key',
      displayName: 'Alice',
    });

    act(() => {
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    expect(renderer!.root.findAll((node) => node.props.children === 'Native settings')).toHaveLength(0);
    expect(
      renderer!.root.findAll((node) => node.props.children === 'No native chat settings available yet'),
    ).toHaveLength(0);
  });

  it('renders partial account state with available public identity only', () => {
    nativeChatStore.getState().setAccount('alice-gm', {
      displayName: 'Alice',
    });

    act(() => {
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    const screenText = collectText(renderer.toJSON()).join('\n');
    expect(renderer!.root.findByProps({ children: 'alice-gm' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Address unavailable' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Chat public key unavailable' })).toBeTruthy();
    expect(screenText).toContain('Private chat unavailable');
    expect(screenText).toContain('Chat sync disconnected');
    expect(renderer!.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Copy MVC address' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Copy chat public key' })).toHaveLength(0);
  });

  it('renders a not-connected product state without broken account rows', () => {
    act(() => {
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    const screenText = collectText(renderer.toJSON()).join('\n');
    expect(renderer!.root.findByProps({ children: 'IDChat User' })).toBeTruthy();
    expect(screenText).toContain('Not connected');
    expect(screenText).toContain('Address unavailable');
    expect(screenText).toContain('Chat public key unavailable');
    expect(screenText).toContain('Private chat unavailable');
    expect(screenText).toContain('Chat sync disconnected');
    expect(screenText).not.toContain('Chat key unavailable');
    expect(screenText).not.toContain('Socket disconnected');
    expect(screenText).not.toContain('undefined');
    expect(screenText).not.toContain('[object Object]');
    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Copy Global MetaID' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Copy MVC address' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Copy chat public key' })).toHaveLength(0);
  });
});
