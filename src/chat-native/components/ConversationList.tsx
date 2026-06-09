import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeChatChannel } from '../domain/types';
import { nativeChatTheme } from '../ui/chatTheme';
import { getConversationRowViewModel, sortConversationRows } from '../ui/chatUiSelectors';
import ChatAvatar from './ChatAvatar';
import ChatBadge from './ChatBadge';

type ConversationListProps = {
  channels: NativeChatChannel[];
  onOpenChannel: (channel: NativeChatChannel) => void;
};

export default function ConversationList({ channels, onOpenChannel }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const sortedChannels = useMemo(() => sortConversationRows(channels), [channels]);
  const filteredChannels = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return sortedChannels;
    }

    return sortedChannels.filter((channel) => {
      const row = getConversationRowViewModel(channel);
      return `${row.title} ${row.preview} ${row.typeLabel}`.toLowerCase().includes(normalizedQuery);
    });
  }, [searchQuery, sortedChannels]);

  return (
    <FlatList
      data={filteredChannels}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={(
        <View style={styles.searchRow}>
          <View style={styles.botPill}>
            <Text style={styles.botText}>Bot</Text>
          </View>
          <View style={styles.searchBox}>
            <TextInput
              accessibilityLabel="Search chats"
              onChangeText={setSearchQuery}
              placeholder="Search chats, groups, MetaID"
              placeholderTextColor={nativeChatTheme.color.faintText}
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>{searchQuery ? 'No matching chats' : 'No chats yet'}</Text>}
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
  emptyText: {
    color: nativeChatTheme.color.mutedText,
    padding: 24,
    textAlign: 'center',
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
