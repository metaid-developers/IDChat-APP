import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { NATIVE_CHAT_MOCK_SCENARIO } from '../../dev/nativeChatMockScenario';
import NativeChatHomePage from '../NativeChatHomePage';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/chatWalletAdapter', () => ({
  createNativeChatWalletAdapter: jest.fn(),
}));

jest.mock('../../storage/chatDatabase', () => ({
  openNativeChatDatabase: jest.fn(),
}));

describe('NativeChatHomePage QA selectors', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  afterEach(() => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
  });

  it('renders stable selectors for the P0.5 simulator release gate', async () => {
    await act(async () => {
      renderer = TestRenderer.create(
        <NativeChatHomePage route={{ params: { mockScenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY } }} />,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'native-chat-home-screen' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'native-chat-header-subtitle' }).props.children).toBe('Chats');
    expect(renderer!.root.findByProps({ testID: 'native-chat-tab-chats' })).toBeTruthy();

    act(() => {
      renderer!.root.findByProps({ testID: 'native-chat-tab-me' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ testID: 'native-chat-header-subtitle' }).props.children).toBe('Me');
    expect(renderer!.root.findByProps({ testID: 'native-chat-me-screen' })).toBeTruthy();
  });
});
