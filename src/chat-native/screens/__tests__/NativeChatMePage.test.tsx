import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { nativeChatStore } from '../../state/useNativeChatStore';
import NativeChatMePage from '../NativeChatMePage';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

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

  it('renders account data from the native chat store and shows copy feedback', async () => {
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

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ children: 'Alice' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'alice-gm' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'mvc-address' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Socket connected' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Copied Global MetaID' })).toBeTruthy();
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('alice-gm');

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Copy MVC address' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ children: 'Copied MVC address' })).toBeTruthy();
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('mvc-address');
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

  it('renders unavailable account values without copy buttons', () => {
    nativeChatStore.getState().setAccount('alice-gm', {
      displayName: 'Alice',
    });

    act(() => {
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    expect(renderer!.root.findByProps({ children: 'Address unavailable' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Chat public key unavailable' })).toBeTruthy();
    expect(
      renderer!.root.findAll((node) => node.props.children === 'Chat key unavailable').length,
    ).toBeGreaterThan(0);
    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Copy MVC address' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Copy chat public key' })).toHaveLength(0);
  });
});
