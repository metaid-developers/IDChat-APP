import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { NativeChatMessage } from '../domain/types';
import { getMessageRowViewModel } from '../ui/chatUiSelectors';
import MessageBubble from './MessageBubble';

type MessageListProps = {
  accountGlobalMetaId: string;
  messages: NativeChatMessage[];
};

export default function MessageList({ accountGlobalMetaId, messages }: MessageListProps) {
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={messages}
      keyExtractor={(item) => getMessageRowViewModel(item, accountGlobalMetaId).id}
      renderItem={({ item }) => {
        const row = getMessageRowViewModel(item, accountGlobalMetaId);
        return <MessageBubble row={row} />;
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
  },
});
