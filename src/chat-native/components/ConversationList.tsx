import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeChatChannel, NativeChatDiscoveryResult } from '../domain/types';
import { nativeChatTheme } from '../ui/chatTheme';
import { getConversationRowViewModel, sortConversationRows } from '../ui/chatUiSelectors';
import ChatAvatar from './ChatAvatar';
import ChatBadge from './ChatBadge';
import NewUserJoinPrompt from './NewUserJoinPrompt';

type ConversationListProps = {
  channels: NativeChatChannel[];
  discoveryError?: string | null;
  discoveryLoading?: boolean;
  discoveryResults?: NativeChatDiscoveryResult[];
  onExploreChats?: () => void;
  onJoinRecommendedGroup?: () => void;
  onOpenDiscoveryResult?: (result: NativeChatDiscoveryResult) => void;
  onOpenOnlineBots?: () => void;
  onOpenChannel: (channel: NativeChatChannel) => void;
  onClearRemoteSearch?: () => void;
  onSearchRemote?: (query: string) => void;
};

type ConversationRowProps = {
  id: string;
  title: string;
  preview: string;
  avatar?: string;
  typeLabel: string;
  timeLabel: string;
  unreadLabel: string;
  mentionCount: number;
  onOpenChannelId: (channelId: string) => void;
};

const ConversationRow = memo(function ConversationRow({
  id,
  title,
  preview,
  avatar,
  typeLabel,
  timeLabel,
  unreadLabel,
  mentionCount,
  onOpenChannelId,
}: ConversationRowProps) {
  return (
    <Pressable
      accessibilityLabel={`Open chat ${title}. ${preview || 'No messages'}`}
      accessibilityRole="button"
      onPress={() => onOpenChannelId(id)}
      style={styles.row}
      testID={`native-chat-row-${id}`}
    >
      <ChatAvatar uri={avatar} name={title} />
      <View style={styles.rowBody}>
        <View style={styles.titleLine}>
          <ChatBadge label={typeLabel} tone="neutral" />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <View style={styles.metaColumn}>
        <Text style={styles.time}>{timeLabel}</Text>
        {unreadLabel ? <ChatBadge label={unreadLabel} /> : null}
        {mentionCount > 0 ? <ChatBadge label="@" tone="mention" /> : null}
      </View>
    </Pressable>
  );
});

export default function ConversationList({
  channels,
  discoveryError,
  discoveryLoading = false,
  discoveryResults = [],
  onExploreChats,
  onJoinRecommendedGroup,
  onOpenDiscoveryResult,
  onOpenOnlineBots,
  onOpenChannel,
  onClearRemoteSearch,
  onSearchRemote,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.trim();
  const sortedChannels = useMemo(() => sortConversationRows(channels), [channels]);
  const channelsById = useMemo(() => {
    const map = new Map<string, NativeChatChannel>();
    channels.forEach((channel) => {
      map.set(channel.id, channel);
    });
    return map;
  }, [channels]);
  const filteredChannels = useMemo(() => {
    const normalizedQuery = normalizedSearchQuery.toLowerCase();
    if (!normalizedQuery) {
      return sortedChannels;
    }

    return sortedChannels.filter((channel) => {
      const row = getConversationRowViewModel(channel);
      return `${row.title} ${row.preview} ${row.typeLabel}`.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedSearchQuery, sortedChannels]);
  const hasNoChannels = channels.length === 0;
  const shouldShowDiscovery = Boolean(
    normalizedSearchQuery && (discoveryLoading || discoveryError || discoveryResults.length > 0),
  );

  const handleSearchQueryChange = (nextQuery: string) => {
    setSearchQuery(nextQuery);
    if (!nextQuery.trim()) {
      onClearRemoteSearch?.();
    }
  };

  const submitRemoteSearch = useCallback(() => {
    if (normalizedSearchQuery) {
      onSearchRemote?.(normalizedSearchQuery);
    }
  }, [normalizedSearchQuery, onSearchRemote]);

  const handleOpenChannelId = useCallback((channelId: string) => {
    const channel = channelsById.get(channelId);
    if (channel) {
      onOpenChannel(channel);
    }
  }, [channelsById, onOpenChannel]);

  const renderConversationRow = useCallback(({ item }: { item: NativeChatChannel }) => {
    const row = getConversationRowViewModel(item);
    return (
      <ConversationRow
        avatar={row.avatar}
        id={row.id}
        mentionCount={row.mentionCount}
        onOpenChannelId={handleOpenChannelId}
        preview={row.preview}
        timeLabel={row.timeLabel}
        title={row.title}
        typeLabel={row.typeLabel}
        unreadLabel={row.unreadLabel}
      />
    );
  }, [handleOpenChannelId]);

  const renderDiscoveryResult = (result: NativeChatDiscoveryResult) => {
    const disabled = Boolean(result.disabledReason || !onOpenDiscoveryResult);
    const discoveryTestID = `native-chat-discovery-result-${result.type}-${result.id}`;
    const content = (
      <>
        <ChatAvatar uri={result.avatar} name={result.title} />
        <View style={styles.discoveryBody}>
          <Text style={styles.discoveryTitle} numberOfLines={1}>
            {result.title}
          </Text>
          {result.subtitle ? (
            <Text style={styles.discoverySubtitle} numberOfLines={1}>
              {result.subtitle}
            </Text>
          ) : null}
          {result.disabledReason ? (
            <Text style={styles.discoveryDisabledReason} numberOfLines={1}>
              {result.disabledReason}
            </Text>
          ) : null}
        </View>
        <ChatBadge label={result.type === 'private' ? 'Private' : 'Group'} tone="neutral" />
      </>
    );

    if (disabled) {
      return (
        <View
          key={`${result.type}:${result.id}`}
          style={[styles.discoveryRow, styles.discoveryRowDisabled]}
          testID={discoveryTestID}
        >
          {content}
        </View>
      );
    }

    return (
      <Pressable
        accessibilityLabel={`Open discovery result ${result.title}`}
        accessibilityRole="button"
        key={`${result.type}:${result.id}`}
        onPress={() => onOpenDiscoveryResult(result)}
        style={styles.discoveryRow}
        testID={discoveryTestID}
      >
        {content}
      </Pressable>
    );
  };

  const listHeader = (
    <>
      <View style={styles.searchRow}>
        {onOpenOnlineBots ? (
          <Pressable
            accessibilityLabel="Open online bots"
            accessibilityRole="button"
            onPress={onOpenOnlineBots}
            style={styles.botPill}
          >
            <Text style={styles.botText}>Bot</Text>
          </Pressable>
        ) : null}
        <View style={styles.searchBox}>
          <TextInput
            accessibilityLabel="Search chats"
            onChangeText={handleSearchQueryChange}
            onSubmitEditing={submitRemoteSearch}
            placeholder="Search chats, groups, MetaID"
            placeholderTextColor={nativeChatTheme.color.faintText}
            returnKeyType="search"
            style={styles.searchInput}
            testID="native-chat-search-input"
            value={searchQuery}
          />
        </View>
        {normalizedSearchQuery.length > 0 && onSearchRemote ? (
          <Pressable
            accessibilityLabel={`Search IDChat for ${normalizedSearchQuery}`}
            accessibilityRole="button"
            onPress={submitRemoteSearch}
            style={styles.remoteSearchButton}
            testID="native-chat-remote-search-button"
          >
            <Text style={styles.remoteSearchText}>Search</Text>
          </Pressable>
        ) : null}
      </View>
      {shouldShowDiscovery ? (
        <View style={styles.discoverySection}>
          <Text style={styles.discoveryHeader}>Discovery</Text>
          {discoveryLoading ? <Text style={styles.discoveryStatus}>Searching IDChat...</Text> : null}
          {discoveryError ? <Text style={styles.discoveryError}>{discoveryError}</Text> : null}
          {!discoveryLoading && !discoveryError ? discoveryResults.map(renderDiscoveryResult) : null}
        </View>
      ) : null}
    </>
  );

  return (
    <FlatList
      data={filteredChannels}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={listHeader}
      contentContainerStyle={filteredChannels.length === 0 ? styles.emptyContent : undefined}
      ListEmptyComponent={
        shouldShowDiscovery ? null :
        hasNoChannels ? (
          <NewUserJoinPrompt onExplore={onExploreChats} onJoinGroup={onJoinRecommendedGroup} />
        ) : (
          <Text style={styles.emptyText}>No matching chats</Text>
        )
      }
      renderItem={renderConversationRow}
    />
  );
}

const styles = StyleSheet.create({
  botPill: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.round,
    height: 34,
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: 14,
  },
  botText: {
    color: nativeChatTheme.color.surface,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '800',
  },
  discoveryBody: {
    flex: 1,
    minWidth: 0,
  },
  discoveryDisabledReason: {
    color: nativeChatTheme.color.faintText,
    fontSize: nativeChatTheme.font.meta,
    marginTop: 3,
  },
  discoveryError: {
    color: nativeChatTheme.color.failed,
    fontSize: nativeChatTheme.font.body,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  discoveryHeader: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '800',
    paddingHorizontal: 18,
    paddingTop: 6,
    textTransform: 'uppercase',
  },
  discoveryRow: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderBottomColor: nativeChatTheme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 66,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  discoveryRowDisabled: {
    opacity: 0.78,
  },
  discoverySection: {
    backgroundColor: nativeChatTheme.color.background,
    paddingBottom: 8,
  },
  discoveryStatus: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  discoverySubtitle: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    marginTop: 3,
  },
  discoveryTitle: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  emptyText: {
    color: nativeChatTheme.color.mutedText,
    padding: 24,
    textAlign: 'center',
  },
  emptyContent: {
    flexGrow: 1,
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 5,
    justifyContent: 'center',
    minWidth: 44,
  },
  preview: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    marginTop: 4,
  },
  remoteSearchButton: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.round,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  remoteSearchText: {
    color: nativeChatTheme.color.surface,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderBottomColor: nativeChatTheme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: nativeChatTheme.size.listRowMinHeight,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  searchBox: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 14,
  },
  searchRow: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.background,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  searchInput: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    minHeight: 34,
    padding: 0,
  },
  time: {
    color: nativeChatTheme.color.faintText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '600',
  },
  title: {
    color: nativeChatTheme.color.text,
    flex: 1,
    fontSize: nativeChatTheme.font.listTitle,
    fontWeight: '700',
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    minWidth: 0,
  },
});
