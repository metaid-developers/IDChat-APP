import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeChatGroupInfo, NativeChatGroupMember } from '../../domain/types';
import { nativeChatStore } from '../../state/useNativeChatStore';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import {
  clearNativeChatRuntimeContext,
  setNativeChatRuntimeContext,
} from '../../services/nativeChatRuntimeContext';
import { loadNativeChatGroupInfo } from '../../services/nativeChatGroupInfoService';
import {
  markNativeChannelReadToIndex,
  syncChannelMessageWindow,
  syncOlderChannelMessages,
} from '../../services/nativeChatSyncService';
import GroupInfoDrawer from '../../components/GroupInfoDrawer';
import MessageActionSheet from '../../components/MessageActionSheet';
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

let mockMessageListProps: any;

jest.mock('../../components/MessageList', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    __esModule: true,
    default: (props: any) => {
      mockMessageListProps = props;
      return React.createElement(
        View,
        { accessibilityLabel: 'Messages' },
        props.olderLoadError
          ? React.createElement(
            View,
            null,
            React.createElement(Text, null, props.olderLoadError),
            React.createElement(
              Pressable,
              {
                accessibilityLabel: 'Retry loading older messages',
                onPress: props.onLoadOlder,
              },
              React.createElement(Text, null, 'Retry'),
            ),
          )
          : null,
        React.createElement(
          Pressable,
          {
            accessibilityLabel: 'Open mocked image actions',
            onPress: () => props.onOpenMessageActions?.({
              id: 'image-row',
              isSelf: false,
              avatar: undefined,
              senderName: 'Nina',
              body: '',
              kind: 'image',
              timeLabel: '13:43',
              txLabel: 'MVC abcd...123',
              fullTxId: 'abcd1234fulltxid',
              statusLabel: '',
              showSenderLabel: true,
              showAvatar: true,
              isGroupedWithPrevious: false,
              isUnsupported: false,
              safeCopyText: '',
              raw: {
                accountGlobalMetaId: 'self',
                channelId: 'group-1',
                channelType: 'group',
                kind: 'image',
                content: 'https://example.test/image.png',
                attachmentUri: 'https://example.test/image.png',
                contentType: 'image/png',
                protocol: 'simplefilegroupchat',
                timestamp: 1710000000,
                senderGlobalMetaId: 'nina',
                senderName: 'Nina',
                txId: 'abcd1234fulltxid',
                status: 'sent',
              },
            }),
          },
          React.createElement(Text, null, 'Open mocked image actions'),
        ),
      );
    },
  };
});

const runtimeConfig = {
  chatApiBase: 'https://api.example.test',
  chatWsBase: 'wss://ws.example.test',
  chatWsPath: '/ws',
  socketPath: '/socket.io',
  addressHost: 'https://address.example.test',
};

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

function createGroupInfo(overrides: Partial<NativeChatGroupInfo> = {}): NativeChatGroupInfo {
  return {
    accountGlobalMetaId: 'self',
    groupId: 'group-1',
    name: 'Build Room',
    memberCount: 20,
    updatedAt: 1000,
    ...overrides,
  };
}

function createGroupMember(index: number, overrides: Partial<NativeChatGroupMember> = {}): NativeChatGroupMember {
  const paddedIndex = String(index).padStart(2, '0');

  return {
    accountGlobalMetaId: 'self',
    groupId: 'group-1',
    memberId: `member-${paddedIndex}`,
    globalMetaId: `member-${paddedIndex}`,
    name: `Member ${paddedIndex}`,
    role: 'member',
    updatedAt: 1000 - index,
    ...overrides,
  };
}

function createMemberPage(count: number, namePrefix = 'Member', startIndex = 1): NativeChatGroupMember[] {
  return Array.from({ length: count }, (_, offset) => {
    const index = startIndex + offset;
    const paddedIndex = String(index).padStart(2, '0');

    return createGroupMember(index, {
      memberId: `${namePrefix.toLowerCase()}-${paddedIndex}`,
      globalMetaId: `${namePrefix.toLowerCase()}-${paddedIndex}`,
      name: `${namePrefix} ${paddedIndex}`,
    });
  });
}

describe('NativeChatRoomPage', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    clearNativeChatRuntimeContext();
    jest.clearAllMocks();
    mockMessageListProps = undefined;
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

  afterEach(() => {
    if (!renderer) {
      return;
    }

    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
  });

  it('shows product copy for an invalid room route', async () => {
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'missing-room' } }} />);
    });

    expect(renderer!.root.findByProps({ children: 'Chat not found' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Return to Chats and choose a conversation.' })).toBeTruthy();
  });

  it('keeps readable private history visible while explaining the missing peer key composer state', async () => {
    nativeChatStore.setState({
      channels: [
        {
          accountGlobalMetaId: 'self',
          id: 'lisa',
          type: 'private',
          title: 'Lisa Hahn',
          unreadCount: 0,
          lastReadIndex: 0,
          updatedAt: 100,
        },
      ],
      messagesByChannel: {
        lisa: [
          {
            accountGlobalMetaId: 'self',
            channelId: 'lisa',
            channelType: 'private',
            kind: 'text',
            content: 'hello lisa',
            contentType: 'text/plain',
            protocol: 'simplemsg',
            timestamp: 1710000000,
            senderGlobalMetaId: 'lisa',
            senderName: 'Lisa Hahn',
            status: 'sent',
          },
        ],
      },
    });
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'lisa' } }} />);
    });

    expect(renderer!.root.findByProps({ accessibilityLabel: 'Messages' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Missing peer chat public key' })).toBeTruthy();
  });

  it('wraps the transcript and composer in a keyboard avoiding layout', async () => {
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    const keyboardViews = renderer!.root.findAllByType(KeyboardAvoidingView);
    expect(keyboardViews).toHaveLength(1);
    expect(keyboardViews[0].props.behavior).toBe(Platform.OS === 'ios' ? 'padding' : undefined);
    expect(keyboardViews[0].props.style).toEqual(expect.objectContaining({ flex: 1 }));
    expect(keyboardViews[0].findAllByType(MessageActionSheet)).toHaveLength(0);
    expect(keyboardViews[0].findAllByType(GroupInfoDrawer)).toHaveLength(0);
    expect(renderer!.root.findAllByType(MessageActionSheet)).toHaveLength(1);
    expect(renderer!.root.findAllByType(GroupInfoDrawer)).toHaveLength(1);
  });

  it('dismisses the keyboard before opening message actions', async () => {
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    nativeChatStore.setState({
      messagesByChannel: {
        'group-1': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'group-1',
            channelType: 'group',
            kind: 'image',
            content: 'https://example.test/image.png',
            attachmentUri: 'https://example.test/image.png',
            contentType: 'image/png',
            protocol: 'simplefilegroupchat',
            timestamp: 1710000000,
            senderGlobalMetaId: 'nina',
            senderName: 'Nina',
            txId: 'abcd1234fulltxid',
            status: 'sent',
          },
        ],
      },
    });

    try {
      await act(async () => {
        renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
      });

      await act(async () => {
        renderer!.root.findByProps({ accessibilityLabel: 'Open mocked image actions' }).props.onPress();
      });

      expect(dismissSpy).toHaveBeenCalledTimes(1);
    } finally {
      dismissSpy.mockRestore();
    }
  });

  it('quotes image messages as image placeholders without raw tx internals', async () => {
    nativeChatStore.setState({
      messagesByChannel: {
        'group-1': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'group-1',
            channelType: 'group',
            kind: 'image',
            content: 'https://example.test/image.png',
            attachmentUri: 'https://example.test/image.png',
            contentType: 'image/png',
            protocol: 'simplefilegroupchat',
            timestamp: 1710000000,
            senderGlobalMetaId: 'nina',
            senderName: 'Nina',
            txId: 'abcd1234fulltxid',
            status: 'sent',
          },
        ],
      },
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    expect(mockMessageListProps).toBeDefined();

    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Open mocked image actions' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Quote' }).props.onPress();
      await Promise.resolve();
    });

    expect(renderer!.root.findByProps({ children: 'Replying to Nina' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: '[Image]' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'abcd1234fulltxid' })).toHaveLength(0);
  });

  it('shows retryable older-message failure without clearing messages', async () => {
    const syncOlderMock = syncOlderChannelMessages as jest.MockedFunction<typeof syncOlderChannelMessages>;
    syncOlderMock.mockRejectedValueOnce(new Error('network failed'));
    nativeChatStore.setState({
      messageWindowsByChannel: {
        'group-1': {
          hasMoreOlder: true,
        },
      },
      messagesByChannel: {
        'group-1': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'group-1',
            channelType: 'group',
            kind: 'text',
            content: 'existing message',
            contentType: 'text/plain',
            protocol: 'simplegroupchat',
            timestamp: 100,
            senderGlobalMetaId: 'owner-gm',
            status: 'sent',
            index: 1,
          },
        ],
      },
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    await act(async () => {
      await mockMessageListProps.onLoadOlder();
    });

    expect(renderer!.root.findByProps({ children: 'Could not load earlier messages.' })).toBeTruthy();
    expect(renderer!.root.findByProps({ accessibilityLabel: 'Retry loading older messages' })).toBeTruthy();
    expect(mockMessageListProps.messages).toHaveLength(1);
  });

  it('does not show a stale older-message failure after the route changes to another room', async () => {
    const syncOlderMock = syncOlderChannelMessages as jest.MockedFunction<typeof syncOlderChannelMessages>;
    const firstRoomOlderSync = createDeferred<Awaited<ReturnType<typeof syncOlderChannelMessages>>>();
    syncOlderMock.mockImplementationOnce(() => firstRoomOlderSync.promise);
    nativeChatStore.setState({
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
        {
          accountGlobalMetaId: 'self',
          id: 'group-2',
          type: 'group',
          title: 'Design Room',
          unreadCount: 0,
          lastReadIndex: 0,
          updatedAt: 101,
        },
      ],
      messageWindowsByChannel: {
        'group-1': {
          hasMoreOlder: true,
        },
      },
      messagesByChannel: {
        'group-1': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'group-1',
            channelType: 'group',
            kind: 'text',
            content: 'build room message',
            contentType: 'text/plain',
            protocol: 'simplegroupchat',
            timestamp: 100,
            senderGlobalMetaId: 'owner-gm',
            status: 'sent',
            index: 1,
          },
        ],
        'group-2': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'group-2',
            channelType: 'group',
            kind: 'text',
            content: 'design room message',
            contentType: 'text/plain',
            protocol: 'simplegroupchat',
            timestamp: 200,
            senderGlobalMetaId: 'designer-gm',
            status: 'sent',
            index: 2,
          },
        ],
      },
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    let olderPromise!: Promise<void>;
    await act(async () => {
      olderPromise = mockMessageListProps.onLoadOlder();
      await Promise.resolve();
    });
    await act(async () => {
      renderer!.update(<NativeChatRoomPage route={{ params: { channelId: 'group-2' } }} />);
    });
    await act(async () => {
      firstRoomOlderSync.reject(new Error('group-1 offline'));
      await olderPromise;
    });

    expect(renderer!.root.findByProps({ children: 'Design Room' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'Could not load earlier messages.' })).toHaveLength(0);
  });

  it('advances read state only after visible indexed messages are reported', async () => {
    const markReadMock = markNativeChannelReadToIndex as jest.MockedFunction<typeof markNativeChannelReadToIndex>;
    nativeChatStore.setState({
      messagesByChannel: {
        'group-1': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'group-1',
            channelType: 'group',
            kind: 'text',
            content: 'visible message',
            contentType: 'text/plain',
            protocol: 'simplegroupchat',
            timestamp: 100,
            senderGlobalMetaId: 'owner-gm',
            status: 'sent',
            index: 4,
          },
        ],
      },
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    expect(markReadMock).not.toHaveBeenCalled();

    await act(async () => {
      mockMessageListProps.onVisibleMessageIndexChange(4);
      await Promise.resolve();
    });

    expect(markReadMock).toHaveBeenCalledWith(expect.objectContaining({
      accountGlobalMetaId: 'self',
      channel: expect.objectContaining({ id: 'group-1' }),
      messageIndex: 4,
    }));
  });

  it('falls back to the chat list route when native back stack cannot go back', async () => {
    const navigation = require('@/base/NavigationService');
    navigation.canGoBack.mockReturnValue(false);

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Back' }).props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('NativeChatHomePage');
  });

  it('clears a stale sync failure panel while retrying latest messages', async () => {
    const syncMock = syncChannelMessageWindow as jest.MockedFunction<typeof syncChannelMessageWindow>;
    syncMock.mockRejectedValueOnce(new Error('offline'));
    nativeChatStore.setState({
      messageWindowsByChannel: {
        'group-1': {
          loadingNewer: true,
        },
      },
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    expect(renderer!.root.findByProps({ children: 'Messages could not refresh' })).toBeTruthy();

    syncMock.mockImplementationOnce(() => new Promise(() => undefined));
    const retryButton = renderer!.root.findAll((node) =>
      node.props.accessibilityRole === 'button'
      && typeof node.props.onPress === 'function'
      && node.findAllByProps({ children: 'Retry' }).length > 0,
    )[0];
    expect(retryButton).toBeTruthy();

    await act(async () => {
      retryButton.props.onPress();
    });

    expect(renderer!.root.findByProps({ children: 'Loading messages' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'Messages could not refresh' })).toHaveLength(0);
  });

  it('does not show a stale sync failure after the route changes to another room', async () => {
    const syncMock = syncChannelMessageWindow as jest.MockedFunction<typeof syncChannelMessageWindow>;
    const firstRoomSync = createDeferred<never>();
    const secondRoomSync = createDeferred<never>();
    syncMock
      .mockImplementationOnce(() => firstRoomSync.promise)
      .mockImplementationOnce(() => secondRoomSync.promise);
    nativeChatStore.setState({
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
        {
          accountGlobalMetaId: 'self',
          id: 'group-2',
          type: 'group',
          title: 'Design Room',
          unreadCount: 0,
          lastReadIndex: 0,
          updatedAt: 101,
        },
      ],
      messagesByChannel: {
        'group-1': [],
        'group-2': [],
      },
      messageWindowsByChannel: {},
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    await act(async () => {
      renderer!.update(<NativeChatRoomPage route={{ params: { channelId: 'group-2' } }} />);
    });

    await act(async () => {
      firstRoomSync.reject(new Error('group-1 offline'));
      await Promise.resolve();
    });

    expect(renderer!.root.findByProps({ children: 'Design Room' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'Messages could not refresh' })).toHaveLength(0);
    expect(syncMock).toHaveBeenCalledTimes(2);
  });

  it('does not open group info or a placeholder alert from private room info', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    nativeChatStore.setState({
      channels: [
        {
          accountGlobalMetaId: 'self',
          id: 'lisa',
          type: 'private',
          title: 'Lisa Hahn',
          unreadCount: 0,
          lastReadIndex: 0,
          updatedAt: 100,
        },
      ],
      messagesByChannel: { lisa: [] },
      messageWindowsByChannel: {},
    });

    try {
      await act(async () => {
        renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'lisa' } }} />);
      });

      const infoButton = renderer!.root.findByProps({ accessibilityLabel: 'Chat info' });

      expect(infoButton.props.disabled).toBe(true);

      if (typeof infoButton.props.onPress === 'function') {
        await act(async () => {
          await infoButton.props.onPress();
        });
      }

      expect(loadNativeChatGroupInfo).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    } finally {
      alertSpy.mockRestore();
    }
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
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });

    expect(loadNativeChatGroupInfo).toHaveBeenCalledWith(expect.objectContaining({
      accountGlobalMetaId: 'self',
      groupId: 'group-1',
    }));
    expect(alertSpy).not.toHaveBeenCalledWith('Build Room', expect.any(String));
    expect(renderer!.root.findByProps({ children: 'Muted' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Owner' })).toBeTruthy();
  });

  it('copies the full group id and sets drawer-visible feedback', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    const longGroupId = 'group-info-public-id-abcdefghijklmnopqrstuvwxyz-1234567890';
    loadGroupInfoMock.mockResolvedValue({
      groupInfo: {
        accountGlobalMetaId: 'self',
        groupId: longGroupId,
        name: 'Build Room',
        shortId: 'build',
        memberCount: 1,
        updatedAt: 1000,
      },
      members: [],
      source: 'network',
    });

    try {
      await act(async () => {
        renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
      });

      await act(async () => {
        await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
      });
      await act(async () => {
        await renderer!.root.findByProps({ accessibilityLabel: 'Copy group id' }).props.onPress();
      });

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(longGroupId);
      expect(renderer!.root.findByProps({ children: 'Copied group id' })).toBeTruthy();
      expect(alertSpy).not.toHaveBeenCalledWith('Copied', expect.any(String));
    } finally {
      alertSpy.mockRestore();
    }
  });

  it('shows contained group info failure copy while keeping fallback summary visible', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockResolvedValue({
      groupInfo: undefined,
      members: [],
      source: 'cache',
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });

    expect(renderer!.root.findAllByProps({ children: 'Build Room' }).length).toBeGreaterThan(0);
    expect(renderer!.root.findByProps({ children: 'Group info could not refresh' })).toBeTruthy();
    expect(renderer!.root.findByProps({
      children: 'Showing available group details. Retry when your connection is stable.',
    })).toBeTruthy();
    expect(renderer!.root.findAll((node) =>
      typeof node.props.children === 'string'
      && /https?:\/\/|\[object Object\]|Error:|TypeError|stack/i.test(node.props.children),
    )).toHaveLength(0);
  });

  it('retries group info loading for the same group', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockResolvedValue({
      groupInfo: undefined,
      members: [],
      source: 'cache',
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });

    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Retry group info' }).props.onPress();
    });

    expect(loadGroupInfoMock).toHaveBeenCalledTimes(2);
    expect(loadGroupInfoMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ groupId: 'group-1' }));
    expect(loadGroupInfoMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ groupId: 'group-1' }));
  });

  it('resets the member cursor and calls member search with the typed query', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo(),
        members: createMemberPage(20),
        source: 'network',
      })
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 1 }),
        members: [createGroupMember(1, {
          memberId: 'nina-gm',
          globalMetaId: 'nina-gm',
          name: 'Nina Builder',
        })],
        source: 'network',
      });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Search group members' }).props.onChangeText('nina');
      await Promise.resolve();
    });

    expect(loadGroupInfoMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursor: '0',
      query: 'nina',
      size: '20',
    }));
    expect(renderer!.root.findByProps({ children: 'Nina Builder' })).toBeTruthy();
  });

  it('clearing member search restores the default member list from cursor zero', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo(),
        members: createMemberPage(2, 'Default'),
        source: 'network',
      })
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 1 }),
        members: [createGroupMember(1, {
          memberId: 'nina-gm',
          globalMetaId: 'nina-gm',
          name: 'Nina Builder',
        })],
        source: 'network',
      })
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo(),
        members: createMemberPage(2, 'Default'),
        source: 'network',
      });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    const searchInput = renderer!.root.findByProps({ accessibilityLabel: 'Search group members' });
    await act(async () => {
      searchInput.props.onChangeText('nina');
      await Promise.resolve();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Search group members' }).props.onChangeText('');
      await Promise.resolve();
    });

    expect(loadGroupInfoMock).toHaveBeenNthCalledWith(3, expect.objectContaining({
      cursor: '0',
      query: '',
    }));
    expect(renderer!.root.findByProps({ children: 'Default 01' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'Nina Builder' })).toHaveLength(0);
  });

  it('ignores stale member search responses that resolve after the latest query', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    const staleSearch = createDeferred<Awaited<ReturnType<typeof loadNativeChatGroupInfo>>>();
    const latestSearch = createDeferred<Awaited<ReturnType<typeof loadNativeChatGroupInfo>>>();
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 20 }),
        members: createMemberPage(20, 'Default'),
        source: 'network',
      })
      .mockReturnValueOnce(staleSearch.promise)
      .mockReturnValueOnce(latestSearch.promise);

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Search group members' }).props.onChangeText('n');
      await Promise.resolve();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Search group members' }).props.onChangeText('ni');
      await Promise.resolve();
    });

    expect(loadGroupInfoMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ query: 'n' }));
    expect(loadGroupInfoMock).toHaveBeenNthCalledWith(3, expect.objectContaining({ query: 'ni' }));

    await act(async () => {
      latestSearch.resolve({
        groupInfo: createGroupInfo({ memberCount: 1 }),
        members: createMemberPage(1, 'Ni'),
        source: 'network',
      });
      await latestSearch.promise;
    });

    expect(renderer!.root.findByProps({ children: 'Ni 01' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'Stale 01' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Searching members' })).toHaveLength(0);

    await act(async () => {
      staleSearch.resolve({
        groupInfo: createGroupInfo({ memberCount: 1 }),
        members: createMemberPage(1, 'Stale'),
        source: 'network',
      });
      await staleSearch.promise;
      await Promise.resolve();
    });

    expect(renderer!.root.findByProps({ children: 'Ni 01' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'Stale 01' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Searching members' })).toHaveLength(0);
  });

  it('does not let load more supersede an active member search', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    const activeSearch = createDeferred<Awaited<ReturnType<typeof loadNativeChatGroupInfo>>>();
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 40 }),
        members: createMemberPage(20, 'Default'),
        source: 'network',
      })
      .mockReturnValueOnce(activeSearch.promise);

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Search group members' }).props.onChangeText('ni');
      await Promise.resolve();
    });

    expect(renderer!.root.findByProps({ children: 'Searching members' })).toBeTruthy();

    await act(async () => {
      renderer!.root.findByType(GroupInfoDrawer).props.onLoadMore();
      await Promise.resolve();
    });

    expect(loadGroupInfoMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      activeSearch.resolve({
        groupInfo: createGroupInfo({ memberCount: 1 }),
        members: createMemberPage(1, 'Ni'),
        source: 'network',
      });
      await activeSearch.promise;
    });

    expect(loadGroupInfoMock).toHaveBeenCalledTimes(2);
    expect(renderer!.root.findByProps({ children: 'Ni 01' })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ children: 'Default 01' })).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Searching members' })).toHaveLength(0);
  });

  it('preserves the active member query when loading more and appends members', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 0 }),
        members: [],
        source: 'network',
      })
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 21 }),
        members: createMemberPage(20, 'Nina'),
        source: 'network',
      })
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 21 }),
        members: [createGroupMember(21, {
          memberId: 'nina-21',
          globalMetaId: 'nina-21',
          name: 'Nina 21',
        })],
        source: 'network',
      });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Search group members' }).props.onChangeText('nina');
      await Promise.resolve();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Load more group members' }).props.onPress();
      await Promise.resolve();
    });

    expect(loadGroupInfoMock).toHaveBeenNthCalledWith(3, expect.objectContaining({
      cursor: '20',
      query: 'nina',
    }));
    expect(renderer!.root.findByProps({ children: 'Nina 01' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Nina 21' })).toBeTruthy();
  });

  it('shows a retryable member failure when searched members fail but group info succeeds', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 20, muted: true }),
        members: createMemberPage(20),
        source: 'network',
      })
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 20, muted: true }),
        members: [],
        memberError: true,
        memberSource: 'cache',
        source: 'network',
      });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Search group members' }).props.onChangeText('nina');
      await Promise.resolve();
    });

    expect(renderer!.root.findByProps({ children: 'Muted' })).toBeTruthy();
    expect(renderer!.root.findByProps({ accessibilityLabel: 'Search group members' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Members could not refresh' })).toBeTruthy();
    expect(renderer!.root.findByProps({ accessibilityLabel: 'Retry members' })).toBeTruthy();
  });

  it('uses known group member count to hide Load more when the first full page is complete', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock.mockResolvedValue({
      groupInfo: createGroupInfo({ memberCount: 20 }),
      members: createMemberPage(20),
      source: 'network',
    });

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });

    expect(renderer!.root.findAllByProps({ accessibilityLabel: 'Load more group members' })).toHaveLength(0);
    expect(renderer!.root.findByProps({ children: 'No more members' })).toBeTruthy();
  });

  it('keeps existing member rows visible when loading another page fails', async () => {
    const loadGroupInfoMock = loadNativeChatGroupInfo as jest.MockedFunction<typeof loadNativeChatGroupInfo>;
    loadGroupInfoMock.mockReset();
    loadGroupInfoMock
      .mockResolvedValueOnce({
        groupInfo: createGroupInfo({ memberCount: 21 }),
        members: createMemberPage(20),
        source: 'network',
      })
      .mockRejectedValueOnce(new Error('offline'));

    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await renderer!.root.findByProps({ accessibilityLabel: 'Chat info' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ accessibilityLabel: 'Load more group members' }).props.onPress();
      await Promise.resolve();
    });

    expect(renderer!.root.findByProps({ children: 'Member 01' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Member 20' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'Members could not refresh' })).toBeTruthy();
  });
});
