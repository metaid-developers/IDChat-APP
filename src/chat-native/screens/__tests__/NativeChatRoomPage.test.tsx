import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { nativeChatStore } from '../../state/useNativeChatStore';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import {
  clearNativeChatRuntimeContext,
  setNativeChatRuntimeContext,
} from '../../services/nativeChatRuntimeContext';
import { loadNativeChatGroupInfo } from '../../services/nativeChatGroupInfoService';
import NativeChatRoomPage from '../NativeChatRoomPage';

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

jest.mock('@/base/NavigationService', () => ({
  canGoBack: jest.fn(() => false),
  goBack: jest.fn(),
  navigate: jest.fn(),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('../../services/nativeChatSyncService', () => ({
  markNativeChannelReadToIndex: jest.fn(),
  syncChannelMessageWindow: jest.fn(),
  syncOlderChannelMessages: jest.fn(),
}));

jest.mock('../../services/nativeChatGroupInfoService', () => ({
  loadNativeChatGroupInfo: jest.fn(),
}));

jest.mock('../../components/MessageList', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: () => React.createElement(View, { accessibilityLabel: 'Messages' }),
  };
});

const runtimeConfig = {
  chatApiBase: 'https://api.example.test',
  chatWsBase: 'wss://ws.example.test',
  chatWsPath: '/ws',
  socketPath: '/socket.io',
  addressHost: 'https://address.example.test',
};

describe('NativeChatRoomPage', () => {
  beforeEach(() => {
    clearNativeChatRuntimeContext();
    jest.clearAllMocks();
    nativeChatStore.setState({
      accountGlobalMetaId: 'self',
      accountDisplayName: 'Self',
      accountAvatar: undefined,
      activeChannelId: undefined,
      runtimeConfig,
      channels: [
        {
          accountGlobalMetaId: 'self',
          id: 'group-1',
          type: 'group',
          title: 'Build Room',
          unreadCount: 0,
          lastReadIndex: 0,
          updatedAt: 100,
        },
      ],
      messagesByChannel: { 'group-1': [] },
      messageWindowsByChannel: {},
      socketConnected: false,
    });
    setNativeChatRuntimeContext({
      accountGlobalMetaId: 'self',
      apiClient: {} as any,
      repository: createMemoryChatRepository(),
      runtimeConfig,
      store: nativeChatStore,
      wallet: {} as any,
    });
  });

  it('opens the group info drawer from the header info action', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockResolvedValue({
      groupInfo: {
        accountGlobalMetaId: 'self',
        groupId: 'group-1',
        name: 'Build Room',
        muted: true,
        memberCount: 1,
        updatedAt: 1000,
      },
      members: [
        {
          accountGlobalMetaId: 'self',
          groupId: 'group-1',
          memberId: 'owner-gm',
          globalMetaId: 'owner-gm',
          name: 'Owner',
          role: 'owner' as const,
          updatedAt: 1000,
        },
      ],
      source: 'network',
    });
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    await act(async () => {
      await renderer.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });

    expect(loadNativeChatGroupInfo).toHaveBeenCalledWith(expect.objectContaining({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
    }));
    expect(alertSpy).not.toHaveBeenCalledWith('Build Room', expect.any(String));
    expect(renderer.root.findByProps({ children: 'Muted' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Owner' })).toBeTruthy();
  });
});
