import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import {
  NATIVE_CHAT_MOCK_ACCOUNT_STATE,
  NATIVE_CHAT_MOCK_SCENARIO,
} from '../../dev/nativeChatMockScenario';

const mockNavigate = jest.fn();

jest.mock('../../../base/NavigationService', () => ({
  navigate: mockNavigate,
}));

const mockExpoConstants = {
  expoConfig: {
    extra: {},
  },
};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: mockExpoConstants,
}));

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

const NativeChatHomePage = require('../NativeChatHomePage').default as typeof import('../NativeChatHomePage').default;

describe('NativeChatHomePage QA selectors', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  const originalMockAccountStateEnv = process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_ACCOUNT_STATE;
  const originalMockScenarioEnv = process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO;

  afterEach(() => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
    mockExpoConstants.expoConfig.extra = {};
    if (originalMockScenarioEnv === undefined) {
      delete process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO;
    } else {
      process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO = originalMockScenarioEnv;
    }
    if (originalMockAccountStateEnv === undefined) {
      delete process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_ACCOUNT_STATE;
    } else {
      process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_ACCOUNT_STATE = originalMockAccountStateEnv;
    }
    jest.restoreAllMocks();
    mockNavigate.mockReset();
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

  it('uses Expo config to activate UI parity mock discovery without route params', async () => {
    delete process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO;
    delete process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_ACCOUNT_STATE;
    mockExpoConstants.expoConfig.extra = {
      nativeIdchatMockScenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
    };

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatHomePage />);
    });

    const searchInput = renderer!.root.findByProps({ testID: 'native-chat-search-input' });

    await act(async () => {
      searchInput.props.onChangeText('Discovery');
    });

    await act(async () => {
      renderer!.root.findByProps({ testID: 'native-chat-remote-search-button' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({ testID: 'native-chat-discovery-result-private-qa-discovery-peer' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ testID: 'native-chat-discovery-result-group-qa-discovery-group' }),
    ).not.toHaveLength(0);
  });

  it('reaches the partial-account mock state through explicit route params', async () => {
    await act(async () => {
      renderer = TestRenderer.create(
        <NativeChatHomePage
          route={{
            params: {
              mockAccountState: NATIVE_CHAT_MOCK_ACCOUNT_STATE.PARTIAL_ACCOUNT,
              mockScenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
            },
          }}
        />,
      );
    });

    act(() => {
      renderer!.root.findByProps({ testID: 'native-chat-tab-me' }).props.onPress();
    });

    expect(renderer!.root.findAllByProps({ children: 'mock-partial-account' })).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'mock-address-partial-account' })).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Chat public key unavailable' })).not.toHaveLength(0);
  });

  it('reaches the no-account mock state through Expo public env', async () => {
    process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO = NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY;
    process.env.EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_ACCOUNT_STATE = NATIVE_CHAT_MOCK_ACCOUNT_STATE.NO_ACCOUNT;

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatHomePage />);
    });

    act(() => {
      renderer!.root.findByProps({ testID: 'native-chat-tab-me' }).props.onPress();
    });

    expect(renderer!.root.findAllByProps({ children: 'Not connected' })).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Address unavailable' })).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Private chat unavailable' })).not.toHaveLength(0);
  });

  it('converts the native QA mock route URL into UI parity route params', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(
      'com.meta.idchat://native-chat?nativeIdchatMockScenario=ui-parity&nativeIdchatMockAccountState=mock-no-account',
    );
    jest.spyOn(Linking, 'addEventListener').mockReturnValue(
      { remove: jest.fn() } as unknown as ReturnType<typeof Linking.addEventListener>,
    );

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatHomePage />);
      await Promise.resolve();
    });

    expect(mockNavigate).toHaveBeenCalledWith('NativeChatHomePage', {
      mockAccountState: NATIVE_CHAT_MOCK_ACCOUNT_STATE.NO_ACCOUNT,
      mockEmptyList: false,
      mockScenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY,
    });
  });
});
