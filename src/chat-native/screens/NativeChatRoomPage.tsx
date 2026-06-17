import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import type * as ExpoFileSystem from 'expo-file-system';
import type * as ExpoMediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { canGoBack, goBack, navigate } from '@/base/NavigationService';
import ChatAvatar from '../components/ChatAvatar';
import ChatComposer, {
  type NativeChatComposerQuote,
  type NativeChatComposerSendOptions,
} from '../components/ChatComposer';
import GroupInfoDrawer from '../components/GroupInfoDrawer';
import MessageActionSheet from '../components/MessageActionSheet';
import MessageList from '../components/MessageList';
import {
  getNativeChatComposerDisabledReason,
  getNativeChatRoomHeaderViewModel,
  getNativeChatRoomState,
  getSafeNativeChatQuotePreview,
  type NativeChatRoomState,
} from '../ui/chatRoomUi';
import { nativeChatTheme } from '../ui/chatTheme';
import { pickImageAttachment } from '../services/nativeChatImageService';
import { sendNativeImageMessage } from '../services/nativeChatImageSendService';
import { loadNativeChatGroupInfo } from '../services/nativeChatGroupInfoService';
import { getNativeChatRuntimeContext } from '../services/nativeChatRuntimeContext';
import { sendNativeTextMessage } from '../services/nativeChatSendService';
import {
  markNativeChannelReadToIndex,
  syncChannelMessageWindow,
  syncOlderChannelMessages,
} from '../services/nativeChatSyncService';
import { nativeChatStore } from '../state/useNativeChatStore';
import type {
  NativeChatChannel,
  NativeChatGroupInfo,
  NativeChatGroupMember,
  NativeChatMention,
} from '../domain/types';
import type { MessageRowViewModel } from '../ui/chatUiSelectors';
import type { NativeChatAttachmentItem } from '../services/chatWalletAdapter';

type MaterialIconProps = {
  color: string;
  name: string;
  size: number;
};

function MaterialIconFallback({ color, name, size }: MaterialIconProps) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ color, fontSize: size, lineHeight: size }}
    >
      {name.slice(0, 1)}
    </Text>
  );
}

function getMaterialIconsComponent(): React.ComponentType<MaterialIconProps> {
  try {
    return require('react-native-vector-icons/MaterialIcons').default as React.ComponentType<MaterialIconProps>;
  } catch {
    return MaterialIconFallback;
  }
}

const MaterialIcons = getMaterialIconsComponent();
const GROUP_MEMBER_PAGE_SIZE = 20;

type NativeChatRoomPageProps = {
  route?: {
    params?: {
      channelId?: string;
    };
  };
};

function getNativeChatImageFileExtension(uri: string): string {
  const cleanUri = uri.split('?')[0] || '';
  const match = cleanUri.match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1] || 'jpg';
}

async function saveNativeChatImageToLibrary(imageUri: string): Promise<void> {
  const FileSystem = require('expo-file-system') as typeof ExpoFileSystem;
  const MediaLibrary = require('expo-media-library') as typeof ExpoMediaLibrary;
  const permission = await MediaLibrary.requestPermissionsAsync();

  if (permission.status !== 'granted') {
    Alert.alert('Photo permission required', 'Allow photo access to save this image.');
    return;
  }

  let localUri = imageUri;

  if (!imageUri.startsWith('file://')) {
    const cacheDirectory = FileSystem.cacheDirectory;

    if (!cacheDirectory) {
      throw new Error('Image cache is unavailable');
    }

    const extension = getNativeChatImageFileExtension(imageUri);
    const downloaded = await FileSystem.downloadAsync(
      imageUri,
      `${cacheDirectory}idchat-image-${Date.now()}.${extension}`,
    );
    localUri = downloaded.uri;
  }

  const asset = await MediaLibrary.createAssetAsync(localUri);

  try {
    await MediaLibrary.createAlbumAsync('IDChat', asset, false);
  } catch {
    // The asset is already saved even if album creation is unavailable or already handled by the OS.
  }

  Alert.alert('Saved', 'Image saved to Photos.');
}

function getGroupInfoMemberCount(serverData: Record<string, unknown> | undefined): number | undefined {
  if (!serverData) {
    return undefined;
  }

  for (const key of ['memberCount', 'membersCount', 'memberTotal', 'userCount', 'userTotal']) {
    const rawValue = serverData[key];
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    const value = Number(rawValue);

    if (Number.isFinite(value)) {
      return Math.max(0, value);
    }
  }

  const members = serverData.members;
  return Array.isArray(members) ? members.length : undefined;
}

function createGroupInfoFallback({
  accountGlobalMetaId,
  channel,
}: {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
}): NativeChatGroupInfo {
  return {
    accountGlobalMetaId,
    groupId: channel.id,
    name: channel.title || channel.id,
    avatar: channel.avatar,
    roomJoinType: channel.roomJoinType,
    memberCount: getGroupInfoMemberCount(channel.serverData),
    updatedAt: Date.now(),
  };
}

function mergeGroupMembers(
  existingMembers: NativeChatGroupMember[],
  incomingMembers: NativeChatGroupMember[],
): NativeChatGroupMember[] {
  const byId = new Map(existingMembers.map((member) => [member.memberId, member]));

  incomingMembers.forEach((member) => {
    byId.set(member.memberId, { ...byId.get(member.memberId), ...member });
  });

  return Array.from(byId.values());
}

function getMentionSuggestion(member: NativeChatGroupMember): NativeChatMention | undefined {
  const globalMetaId = member.globalMetaId || member.memberId;
  const name = member.name || member.globalMetaId || member.metaId || member.memberId;

  if (!globalMetaId || !name) {
    return undefined;
  }

  return { globalMetaId, name };
}

function RoomStatePanel({
  onBack,
  onRetry,
  state,
}: {
  onBack: () => void;
  onRetry?: () => void | Promise<void>;
  state: NativeChatRoomState;
}) {
  const showRetry = Boolean(state.retryLabel && onRetry);

  return (
    <View style={styles.roomStatePanel}>
      {state.kind === 'loading' ? (
        <ActivityIndicator color={nativeChatTheme.color.primary} size="small" style={styles.roomStateSpinner} />
      ) : null}
      <Text style={styles.roomStateTitle}>{state.title}</Text>
      {state.body ? (
        <Text style={styles.roomStateBody}>{state.body}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (showRetry) {
            void onRetry?.();
            return;
          }

          onBack();
        }}
        style={styles.roomStateButton}
      >
        <Text style={styles.roomStateButtonText}>{showRetry ? state.retryLabel : 'Back to Chats'}</Text>
      </Pressable>
    </View>
  );
}

export default function NativeChatRoomPage({ route }: NativeChatRoomPageProps) {
  const [selectedMessage, setSelectedMessage] = useState<MessageRowViewModel | undefined>();
  const [quotedMessage, setQuotedMessage] = useState<NativeChatComposerQuote | undefined>();
  const [pendingImage, setPendingImage] = useState<{
    attachment: NativeChatAttachmentItem;
    localPreviewUri: string;
  } | undefined>();
  const [composerMentions, setComposerMentions] = useState<NativeChatMention[]>([]);
  const [groupInfoDrawerVisible, setGroupInfoDrawerVisible] = useState(false);
  const [groupInfo, setGroupInfo] = useState<NativeChatGroupInfo | undefined>();
  const [groupMembers, setGroupMembers] = useState<NativeChatGroupMember[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupInfoLoading, setGroupInfoLoading] = useState(false);
  const [groupHasMoreMembers, setGroupHasMoreMembers] = useState(false);
  const [groupMembersCursor, setGroupMembersCursor] = useState('0');
  const [roomSyncError, setRoomSyncError] = useState<string | undefined>();
  const [olderLoadError, setOlderLoadError] = useState<string | undefined>();
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );
  const channelId = route?.params?.channelId || nativeChatStore.getState().activeChannelId || '';
  const channelIdRef = useRef(channelId);
  channelIdRef.current = channelId;
  const channel = state.channels.find((item) => item.id === channelId);
  const hasChannel = Boolean(channel);
  const runtimeReady = Boolean(state.runtimeConfig && state.accountGlobalMetaId);
  const messages = state.messagesByChannel[channelId] || [];
  const messageWindow = state.messageWindowsByChannel[channelId];
  const headerViewModel = getNativeChatRoomHeaderViewModel(channel);
  const composerDisabledReason = getNativeChatComposerDisabledReason({ channel, runtimeReady });
  const composerDisabled = Boolean(composerDisabledReason);
  const roomState = getNativeChatRoomState({
    channel,
    channelId,
    loadingLatest: Boolean(messageWindow?.loadingNewer),
    messages,
    runtimeReady,
    syncError: roomSyncError,
  });

  const handleSendText = useCallback(
    async (plaintext: string, options?: NativeChatComposerSendOptions) => {
      if (!channel || !state.accountGlobalMetaId) {
        return;
      }

      const context = getNativeChatRuntimeContext();

      await sendNativeTextMessage({
        accountGlobalMetaId: state.accountGlobalMetaId,
        channel,
        plaintext,
        nickName: state.accountDisplayName,
        addressHost: context.runtimeConfig.addressHost,
        repository: context.repository,
        store: nativeChatStore,
        wallet: context.wallet,
        quoteReplyPin: options?.quoteReplyPin,
        mentions: options?.mentions,
      });

      if (options?.quoteReplyPin) {
        setQuotedMessage(undefined);
      }
    },
    [channel, state.accountDisplayName, state.accountGlobalMetaId],
  );

  const handlePickImage = useCallback(
    async () => {
      if (!channel || !state.accountGlobalMetaId) {
        return;
      }

      const picked = await pickImageAttachment();

      if (!picked) {
        return;
      }

      setPendingImage(picked);
    },
    [channel, state.accountGlobalMetaId],
  );

  const handleRemoveImage = useCallback(() => {
    setPendingImage(undefined);
  }, []);

  const handleSendImage = useCallback(
    async () => {
      if (!channel || !state.accountGlobalMetaId || !pendingImage) {
        return;
      }

      const context = getNativeChatRuntimeContext();

      await sendNativeImageMessage({
        accountGlobalMetaId: state.accountGlobalMetaId,
        channel,
        attachment: pendingImage.attachment,
        localPreviewUri: pendingImage.localPreviewUri,
        nickName: state.accountDisplayName,
        addressHost: context.runtimeConfig.addressHost,
        repository: context.repository,
        store: nativeChatStore,
        wallet: context.wallet,
        quoteReplyPin: quotedMessage?.replyPin,
      });

      setPendingImage(undefined);
      setQuotedMessage(undefined);
    },
    [channel, pendingImage, quotedMessage?.replyPin, state.accountDisplayName, state.accountGlobalMetaId],
  );

  const handleOpenMessageActions = useCallback((row: MessageRowViewModel) => {
    Keyboard.dismiss();
    setSelectedMessage(row);
  }, []);

  const handleCopyTxId = useCallback(async (txId: string) => {
    await Clipboard.setStringAsync(txId);
    Alert.alert('Copied', 'Txid copied to clipboard.');
  }, []);

  const handleCloseMessageActions = useCallback(() => {
    setSelectedMessage(undefined);
  }, []);

  const handleQuoteMessage = useCallback((row: MessageRowViewModel) => {
    const replyPin = row.raw.pinId || row.raw.txId || row.id;

    setQuotedMessage({
      replyPin,
      senderName: row.senderName,
      content: getSafeNativeChatQuotePreview({
        body: row.body,
        fullTxId: row.fullTxId,
        kind: row.kind,
      }),
    });
  }, []);

  const handleSaveImage = useCallback(async (_row: MessageRowViewModel, imageUri: string) => {
    try {
      await saveNativeChatImageToLibrary(imageUri);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save image.');
    }
  }, []);

  const loadGroupDrawer = useCallback(
    async ({
      append,
      cursor = '0',
      query = groupSearchQuery,
    }: {
      append?: boolean;
      cursor?: string;
      query?: string;
    } = {}) => {
      if (!channel || channel.type === 'private' || !state.accountGlobalMetaId) {
        return;
      }

      setGroupInfoLoading(true);

      try {
        const context = getNativeChatRuntimeContext();
        const result = await loadNativeChatGroupInfo({
          accountGlobalMetaId: context.accountGlobalMetaId,
          groupId: channel.id,
          channel,
          apiClient: context.apiClient,
          repository: context.repository,
          cursor,
          size: String(GROUP_MEMBER_PAGE_SIZE),
          query,
        });

        setGroupInfo(result.groupInfo || createGroupInfoFallback({
          accountGlobalMetaId: context.accountGlobalMetaId,
          channel,
        }));
        setGroupMembers((currentMembers) =>
          append ? mergeGroupMembers(currentMembers, result.members) : result.members,
        );
        setComposerMentions((currentMentions) => {
          const incomingMentions = result.members
            .map(getMentionSuggestion)
            .filter((mention): mention is NativeChatMention => Boolean(mention));
          const byId = new Map(currentMentions.map((mention) => [mention.globalMetaId, mention]));
          incomingMentions.forEach((mention) => byId.set(mention.globalMetaId, mention));
          return Array.from(byId.values());
        });
        setGroupHasMoreMembers(result.members.length >= GROUP_MEMBER_PAGE_SIZE);
        setGroupMembersCursor(String((append ? groupMembers.length : 0) + result.members.length));
      } catch {
        setGroupInfo(createGroupInfoFallback({
          accountGlobalMetaId: state.accountGlobalMetaId,
          channel,
        }));
        setGroupHasMoreMembers(false);
      } finally {
        setGroupInfoLoading(false);
      }
    },
    [channel, groupMembers.length, groupSearchQuery, state.accountGlobalMetaId],
  );

  const handleShowChatInfo = useCallback(async () => {
    if (!channel || channel.type === 'private') {
      return;
    }

    if (!state.accountGlobalMetaId) {
      return;
    }

    setGroupInfo(createGroupInfoFallback({
      accountGlobalMetaId: state.accountGlobalMetaId,
      channel,
    }));
    setGroupMembers([]);
    setGroupSearchQuery('');
    setGroupMembersCursor('0');
    setGroupHasMoreMembers(false);
    setGroupInfoDrawerVisible(true);
    await loadGroupDrawer({ query: '', cursor: '0' });
  }, [channel, loadGroupDrawer, state.accountGlobalMetaId]);

  const handleCloseGroupInfo = useCallback(() => {
    setGroupInfoDrawerVisible(false);
  }, []);

  const handleCopyGroupId = useCallback(async () => {
    const groupId = groupInfo?.groupId || channel?.id;

    if (!groupId) {
      return;
    }

    await Clipboard.setStringAsync(groupId);
    Alert.alert('Copied', 'Group id copied to clipboard.');
  }, [channel?.id, groupInfo?.groupId]);

  const handleGroupSearchChange = useCallback((query: string) => {
    setGroupSearchQuery(query);
    setGroupMembersCursor('0');
    loadGroupDrawer({ query, cursor: '0' }).catch(() => undefined);
  }, [loadGroupDrawer]);

  const handleLoadMoreGroupMembers = useCallback(() => {
    loadGroupDrawer({
      append: true,
      cursor: groupMembersCursor,
      query: groupSearchQuery,
    }).catch(() => undefined);
  }, [groupMembersCursor, groupSearchQuery, loadGroupDrawer]);

  useEffect(() => {
    setQuotedMessage(undefined);
    setPendingImage(undefined);
    setGroupInfoDrawerVisible(false);
    setGroupSearchQuery('');
    setComposerMentions([]);
    setRoomSyncError(undefined);
    setOlderLoadError(undefined);
  }, [channelId]);

  const handleLoadOlder = useCallback(async () => {
    if (!channel || !state.accountGlobalMetaId) {
      return;
    }

    const loadOlderChannelId = channelId;
    let context;

    try {
      context = getNativeChatRuntimeContext();
    } catch {
      return;
    }

    const currentChannel = context.store.getState().channels.find((item) => item.id === loadOlderChannelId) || channel;

    setOlderLoadError(undefined);

    try {
      await syncOlderChannelMessages({
        accountGlobalMetaId: context.accountGlobalMetaId,
        channel: currentChannel,
        apiClient: context.apiClient,
        repository: context.repository,
        store: context.store,
        wallet: context.wallet,
      });
    } catch {
      if (channelIdRef.current === loadOlderChannelId) {
        setOlderLoadError('Could not load earlier messages.');
      }
    }
  }, [channel, channelId, state.accountGlobalMetaId]);

  const handleLatestStateChange = useCallback((isAtLatest: boolean) => {
    if (!channelId) {
      return;
    }

    const currentWindow = nativeChatStore.getState().messageWindowsByChannel[channelId];

    if (isAtLatest && currentWindow?.hasMoreNewer) {
      return;
    }

    nativeChatStore.getState().setMessageWindowState(channelId, { isAtLatest });
  }, [channelId]);

  const handleScrollToLatest = useCallback(async () => {
    if (!channel || !state.accountGlobalMetaId) {
      return;
    }

    let context;

    try {
      context = getNativeChatRuntimeContext();
    } catch {
      return;
    }

    const currentChannel = context.store.getState().channels.find((item) => item.id === channelId) || channel;
    context.store.getState().setMessageWindowState(channelId, {
      hasMoreNewer: false,
      isAtLatest: true,
      loadingNewer: true,
    });

    await syncChannelMessageWindow({
      accountGlobalMetaId: context.accountGlobalMetaId,
      channel: currentChannel,
      apiClient: context.apiClient,
      repository: context.repository,
      store: context.store,
      wallet: context.wallet,
    });
  }, [channel, channelId, state.accountGlobalMetaId]);

  const handleVisibleMessageIndexChange = useCallback((messageIndex: number) => {
    if (!channel || !state.accountGlobalMetaId) {
      return;
    }

    let context;

    try {
      context = getNativeChatRuntimeContext();
    } catch {
      return;
    }

    const currentChannel = context.store.getState().channels.find((item) => item.id === channelId) || channel;

    void markNativeChannelReadToIndex({
      accountGlobalMetaId: context.accountGlobalMetaId,
      channel: currentChannel,
      messageIndex,
      repository: context.repository,
      store: context.store,
    });
  }, [channel, channelId, state.accountGlobalMetaId]);

  const handleBack = useCallback(() => {
    if (canGoBack()) {
      goBack();
      return;
    }

    navigate('NativeChatHomePage');
  }, []);

  const retryFocusedChannelSync = useCallback(async () => {
    const syncChannelId = channelId;

    if (!syncChannelId || !hasChannel || !runtimeReady) {
      return;
    }

    setRoomSyncError(undefined);

    let context;

    try {
      context = getNativeChatRuntimeContext();
    } catch {
      if (channelIdRef.current === syncChannelId) {
        setRoomSyncError('Messages could not refresh');
      }
      return;
    }

    const currentChannel = context.store.getState().channels.find((item) => item.id === syncChannelId);

    if (!currentChannel) {
      return;
    }

    try {
      await syncChannelMessageWindow({
        accountGlobalMetaId: context.accountGlobalMetaId,
        channel: currentChannel,
        apiClient: context.apiClient,
        repository: context.repository,
        store: context.store,
        wallet: context.wallet,
      });

      if (channelIdRef.current !== syncChannelId) {
        return;
      }

      if (currentChannel.type !== 'private') {
        const cachedMembers = await context.repository.listGroupMembers(context.accountGlobalMetaId, currentChannel.id);
        if (channelIdRef.current !== syncChannelId) {
          return;
        }

        setComposerMentions(
          cachedMembers
            .map(getMentionSuggestion)
            .filter((mention): mention is NativeChatMention => Boolean(mention)),
        );
      }

      setRoomSyncError(undefined);
    } catch {
      if (channelIdRef.current === syncChannelId) {
        setRoomSyncError('Messages could not refresh');
      }
    }
  }, [channelId, hasChannel, runtimeReady]);

  useFocusEffect(
    useCallback(() => {
      if (!channelId || !hasChannel || !runtimeReady) {
        return undefined;
      }

      nativeChatStore.getState().setActiveChannelId(channelId);

      retryFocusedChannelSync().catch(() => undefined);

      return () => {
        if (nativeChatStore.getState().activeChannelId === channelId) {
          nativeChatStore.getState().setActiveChannelId(undefined);
        }
      };
    }, [channelId, hasChannel, retryFocusedChannelSync, runtimeReady]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" hitSlop={12} onPress={handleBack} style={styles.backButton}>
          <MaterialIcons color={nativeChatTheme.color.text} name="chevron-left" size={24} />
        </Pressable>
        <ChatAvatar name={headerViewModel.title} size={36} uri={headerViewModel.avatar} />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>
            {headerViewModel.title}
          </Text>
          {headerViewModel.subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {headerViewModel.subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Chat info"
          accessibilityRole="button"
          disabled={!headerViewModel.infoEnabled}
          hitSlop={12}
          onPress={headerViewModel.infoEnabled ? handleShowChatInfo : undefined}
          style={[styles.infoButton, !headerViewModel.infoEnabled ? styles.disabledInfoButton : undefined]}
        >
          <MaterialIcons color={nativeChatTheme.color.mutedText} name="info-outline" size={22} />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingArea}
      >
        <View style={styles.messages}>
          {roomState.showMessages ? (
            <MessageList
              accountGlobalMetaId={state.accountGlobalMetaId}
              hasMoreOlder={Boolean(messageWindow?.hasMoreOlder)}
              hasNewerMessages={Boolean(messageWindow?.hasMoreNewer)}
              isAtLatest={messageWindow?.isAtLatest ?? true}
              loadingOlder={Boolean(messageWindow?.loadingOlder)}
              messages={messages}
              olderLoadError={olderLoadError}
              onCopyTxId={handleCopyTxId}
              onLatestStateChange={handleLatestStateChange}
              onLoadOlder={handleLoadOlder}
              onOpenMessageActions={handleOpenMessageActions}
              onScrollToLatest={handleScrollToLatest}
              onVisibleMessageIndexChange={handleVisibleMessageIndexChange}
              showNoMoreOlder={Boolean(messageWindow && messageWindow.hasMoreOlder === false && messages.length > 0)}
            />
          ) : null}
          {!roomState.showMessages || roomState.kind === 'sync-failed' ? (
            <RoomStatePanel
              onBack={handleBack}
              onRetry={roomState.kind === 'sync-failed' ? retryFocusedChannelSync : undefined}
              state={roomState}
            />
          ) : null}
        </View>
        <ChatComposer
          disabled={composerDisabled}
          disabledReason={composerDisabledReason}
          imagePreviewUri={pendingImage?.localPreviewUri}
          mentionSuggestions={composerMentions}
          mentionsEnabled={channel?.type === 'group' || channel?.type === 'sub-group'}
          onClearQuote={() => setQuotedMessage(undefined)}
          onPickImage={handlePickImage}
          onRemoveImage={handleRemoveImage}
          onSend={handleSendText}
          onSendImage={handleSendImage}
          quote={quotedMessage}
        />
      </KeyboardAvoidingView>
      <MessageActionSheet
        onClose={handleCloseMessageActions}
        onQuote={handleQuoteMessage}
        onSaveImage={handleSaveImage}
        row={selectedMessage}
        visible={Boolean(selectedMessage)}
      />
      <GroupInfoDrawer
        groupInfo={groupInfo}
        hasMoreMembers={groupHasMoreMembers}
        loading={groupInfoLoading}
        members={groupMembers}
        onChangeSearchQuery={handleGroupSearchChange}
        onClose={handleCloseGroupInfo}
        onCopyGroupId={handleCopyGroupId}
        onLoadMore={handleLoadMoreGroupMembers}
        searchQuery={groupSearchQuery}
        visible={groupInfoDrawerVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: nativeChatTheme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  infoButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  keyboardAvoidingArea: {
    flex: 1,
  },
  disabledInfoButton: {
    opacity: 0.42,
  },
  messages: {
    flex: 1,
  },
  roomStateBody: {
    color: nativeChatTheme.color.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  roomStateButton: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.compact,
    marginTop: 16,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  roomStateButtonText: {
    color: nativeChatTheme.color.surface,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  roomStatePanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  roomStateSpinner: {
    marginBottom: 12,
  },
  roomStateTitle: {
    color: nativeChatTheme.color.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  subtitle: {
    color: nativeChatTheme.color.mutedText,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  title: {
    color: nativeChatTheme.color.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
});
