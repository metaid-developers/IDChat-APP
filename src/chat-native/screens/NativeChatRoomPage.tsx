import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import type * as ExpoFileSystem from 'expo-file-system';
import type * as ExpoMediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { canGoBack, goBack, navigate } from '@/base/NavigationService';
import ChatAvatar from '../components/ChatAvatar';
import ChatComposer, {
  type NativeChatComposerQuote,
  type NativeChatComposerSendOptions,
} from '../components/ChatComposer';
import GroupInfoDrawer from '../components/GroupInfoDrawer';
import MessageActionSheet from '../components/MessageActionSheet';
import MessageList from '../components/MessageList';
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

function readNumericServerValue(serverData: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  if (!serverData) {
    return undefined;
  }

  for (const key of keys) {
    const value = serverData[key];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const numberValue = Number(value);

    if (Number.isFinite(numberValue)) {
      return Math.max(0, numberValue);
    }
  }

  return undefined;
}

function getServerMemberCount(serverData: Record<string, unknown> | undefined): number | undefined {
  const directCount = readNumericServerValue(serverData, [
    'memberCount',
    'membersCount',
    'memberTotal',
    'userCount',
    'userTotal',
  ]);

  if (directCount !== undefined) {
    return directCount;
  }

  const members = serverData?.members;
  if (Array.isArray(members)) {
    return members.length;
  }

  return undefined;
}

function getHeaderSubtitle(channel: NativeChatChannel | undefined): string {
  if (!channel) {
    return '';
  }

  if (channel.type === 'private') {
    return 'Private chat';
  }

  const memberCount = getServerMemberCount(channel.serverData);
  if (memberCount !== undefined) {
    return `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;
  }

  return 'Group chat';
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
    memberCount: getServerMemberCount(channel.serverData),
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

function getComposerDisabledReason({
  channel,
  runtimeReady,
}: {
  channel?: NativeChatChannel;
  runtimeReady: boolean;
}): string | undefined {
  if (!runtimeReady) {
    return 'Chat is unavailable while account services load.';
  }

  if (!channel) {
    return 'Select a chat to send a message.';
  }

  if (channel.type === 'private' && !channel.publicKeyStr) {
    return 'Missing peer chat public key';
  }

  const serverData = channel.serverData || {};

  if (serverData.isBlocked || serverData.blocked) {
    return 'You cannot send because this chat is blocked.';
  }

  if (serverData.isMember === false || serverData.joined === false) {
    return 'Join this group before sending messages.';
  }

  if (serverData.canSend === false) {
    return typeof serverData.disabledReason === 'string'
      ? serverData.disabledReason
      : 'Sending is unavailable in this chat.';
  }

  return undefined;
}

function getQuoteContent(row: MessageRowViewModel): string {
  if (row.kind === 'image') {
    return '[Image]';
  }

  return row.body || row.raw.content || '';
}

function getMentionSuggestion(member: NativeChatGroupMember): NativeChatMention | undefined {
  const globalMetaId = member.globalMetaId || member.memberId;
  const name = member.name || member.globalMetaId || member.metaId || member.memberId;

  if (!globalMetaId || !name) {
    return undefined;
  }

  return { globalMetaId, name };
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
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );
  const channelId = route?.params?.channelId || nativeChatStore.getState().activeChannelId || '';
  const channel = state.channels.find((item) => item.id === channelId);
  const hasChannel = Boolean(channel);
  const runtimeReady = Boolean(state.runtimeConfig && state.accountGlobalMetaId);
  const messages = state.messagesByChannel[channelId] || [];
  const messageWindow = state.messageWindowsByChannel[channelId];
  const composerDisabledReason = getComposerDisabledReason({ channel, runtimeReady });
  const composerDisabled = Boolean(composerDisabledReason);
  const headerTitle = channel?.title || 'Chat';
  const headerSubtitle = getHeaderSubtitle(channel);

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
      content: getQuoteContent(row),
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
    if (!channel) {
      return;
    }

    if (channel.type === 'private') {
      Alert.alert(headerTitle, headerSubtitle || 'Private chat');
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
  }, [channel, headerSubtitle, headerTitle, loadGroupDrawer, state.accountGlobalMetaId]);

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
  }, [channelId]);

  const handleLoadOlder = useCallback(async () => {
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

    await syncOlderChannelMessages({
      accountGlobalMetaId: context.accountGlobalMetaId,
      channel: currentChannel,
      apiClient: context.apiClient,
      repository: context.repository,
      store: context.store,
      wallet: context.wallet,
    });
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

  useFocusEffect(
    useCallback(() => {
      if (!channelId || !hasChannel || !runtimeReady) {
        return undefined;
      }

      nativeChatStore.getState().setActiveChannelId(channelId);

      async function syncFocusedChannel() {
        let context;

        try {
          context = getNativeChatRuntimeContext();
        } catch {
          return;
        }

        const channel = context.store.getState().channels.find((item) => item.id === channelId);

        if (!channel) {
          return;
        }

        await syncChannelMessageWindow({
          accountGlobalMetaId: context.accountGlobalMetaId,
          channel,
          apiClient: context.apiClient,
          repository: context.repository,
          store: context.store,
          wallet: context.wallet,
        });

        if (channel.type !== 'private') {
          const cachedMembers = await context.repository.listGroupMembers(context.accountGlobalMetaId, channel.id);
          setComposerMentions(
            cachedMembers
              .map(getMentionSuggestion)
              .filter((mention): mention is NativeChatMention => Boolean(mention)),
          );
        }
      }

      syncFocusedChannel().catch(() => undefined);

      return () => {
        if (nativeChatStore.getState().activeChannelId === channelId) {
          nativeChatStore.getState().setActiveChannelId(undefined);
        }
      };
    }, [channelId, hasChannel, runtimeReady, state.accountGlobalMetaId]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" hitSlop={12} onPress={handleBack} style={styles.backButton}>
          <MaterialIcons color={nativeChatTheme.color.text} name="chevron-left" size={24} />
        </Pressable>
        <ChatAvatar name={headerTitle} size={36} uri={channel?.avatar} />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>
            {headerTitle}
          </Text>
          {headerSubtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {headerSubtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Chat info"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleShowChatInfo}
          style={styles.infoButton}
        >
          <MaterialIcons color={nativeChatTheme.color.mutedText} name="info-outline" size={22} />
        </Pressable>
      </View>
      <View style={styles.messages}>
        <MessageList
          accountGlobalMetaId={state.accountGlobalMetaId}
          hasMoreOlder={Boolean(messageWindow?.hasMoreOlder)}
          hasNewerMessages={Boolean(messageWindow?.hasMoreNewer)}
          isAtLatest={messageWindow?.isAtLatest ?? true}
          loadingOlder={Boolean(messageWindow?.loadingOlder)}
          messages={messages}
          onCopyTxId={handleCopyTxId}
          onLatestStateChange={handleLatestStateChange}
          onLoadOlder={handleLoadOlder}
          onOpenMessageActions={handleOpenMessageActions}
          onScrollToLatest={handleScrollToLatest}
          onVisibleMessageIndexChange={handleVisibleMessageIndexChange}
        />
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
  messages: {
    flex: 1,
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
