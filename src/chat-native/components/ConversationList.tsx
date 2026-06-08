import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeChatChannel } from '../domain/types';

type ConversationListProps = {
  channels: NativeChatChannel[];
  onOpenChannel: (channel: NativeChatChannel) => void;
};

export default function ConversationList({ channels, onOpenChannel }: ConversationListProps) {
  return (
    <FlatList
      data={channels}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.emptyText}>No chats yet</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => onOpenChannel(item)}>
          <View style={styles.textColumn}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage?.content || ''}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: '#777777',
    padding: 24,
    textAlign: 'center',
  },
  preview: {
    color: '#666666',
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    borderBottomColor: '#eeeeee',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
});
