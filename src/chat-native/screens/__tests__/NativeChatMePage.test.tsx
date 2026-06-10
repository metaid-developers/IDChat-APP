import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { nativeChatStore } from '../../state/useNativeChatStore';
import NativeChatMePage from '../NativeChatMePage';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

describe('NativeChatMePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nativeChatStore.setState({
      accountGlobalMetaId: '',
      accountDisplayName: 'IDChat User',
      accountAvatar: undefined,
      accountAddress: undefined,
      accountChatPublicKey: undefined,
      socketConnected: false,
    });
  });

  it('renders account data from the native chat store and copies values', async () => {
    nativeChatStore.getState().setAccount('alice-gm', {
      address: 'mvc-address',
      avatar: 'https://example.test/avatar.png',
      chatPublicKey: 'chat-key',
      displayName: 'Alice',
    });
    nativeChatStore.getState().setSocketConnected(true);
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<NativeChatMePage />);
    });

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Copy MVC address' }).props.onPress();
      await Promise.resolve();
    });

    expect(renderer.root.findByProps({ children: 'Alice' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'alice-gm' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'mvc-address' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Socket connected' })).toBeTruthy();
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('alice-gm');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('mvc-address');
  });
});
