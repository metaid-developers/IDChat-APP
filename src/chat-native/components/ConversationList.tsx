import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  onSearchRemote?: (query: string) => void;
};

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
  onSearchRemote,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.trim();
  const sortedChannels = useMemo(() => sortConversationRows(channels), [channels]);
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
    onSearchRemote?.(nextQuery.trim());
  };

  const renderDiscoveryResult = (result: NativeChatDiscoveryResult) => {
    const disabled = Boolean(result.disabledReason || !onOpenDiscoveryResult);
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
        <View key={`${result.type}:${result.id}`} style={[styles.discoveryRow, styles.discoveryRowDisabled]}>
          {content}
        </View>
      );
    }

    return (
      <TouchableOpacity
        accessibilityLabel={`Open discovery result ${result.title}`}
        accessibilityRole="button"
        key={`${result.type}:${result.id}`}
        onPress={() => onOpenDiscoveryResult(result)}
        style={styles.discoveryRow}
      >
        {content}
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <>
      <View style={styles.searchRow}>
        {onOpenOnlineBots ? (
          <TouchableOpacity
            accessibilityLabel="Open online bots"
            accessibilityRole="button"
            onPress={onOpenOnlineBots}
            style={styles.botPill}
          >
            <Text style={styles.botText}>Bot</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.searchBox}>
          <TextInput
            accessibilityLabel="Search chats"
            onChangeText={handleSearchQueryChange}
            placeholder="Search chats, groups, MetaID"
            placeholderTextColor={nativeChatTheme.color.faintText}
            style={styles.searchInput}
            value={searchQuery}
          />
        </View>
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
      renderItem={({ item }) => {
        const row = getConversationRowViewModel(item);
        return (
          <TouchableOpacity style={styles.row} onPress={() => onOpenChannel(item)}>
            <ChatAvatar uri={row.avatar} name={row.title} />
            <View style={styles.rowBody}>
              <View style={styles.titleLine}>
                <ChatBadge label={row.typeLabel} tone="neutral" />
                <Text style={styles.title} numberOfLines={1}>
                  {row.title}
                </Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {row.preview}
              </Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.time}>{row.timeLabel}</Text>
              {row.unreadCount > 0 ? <ChatBadge label={String(row.unreadCount)} /> : null}
              {row.mentionCount > 0 ? <ChatBadge label="@" tone="mention" /> : null}
            </View>
          </TouchableOpacity>
        );
      }}
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
