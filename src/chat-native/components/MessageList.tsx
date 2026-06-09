import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { NativeChatMessage } from '../domain/types';
import { getMessageRowViewModel, type MessageRowViewModel } from '../ui/chatUiSelectors';
import MessageBubble from './MessageBubble';

type MessageListProps = {
  accountGlobalMetaId: string;
  messages: NativeChatMessage[];
  onOpenMessageActions?: (row: MessageRowViewModel) => void;
};

export default function MessageList({
  accountGlobalMetaId,
  messages,
  onOpenMessageActions,
}: MessageListProps) {
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={messages}
      keyExtractor={(item) => getMessageRowViewModel(item, accountGlobalMetaId).id}
      renderItem={({ item }) => {
        const row = getMessageRowViewModel(item, accountGlobalMetaId);
        return <MessageBubble onOpenActions={onOpenMessageActions} row={row} />;
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
  },
});
