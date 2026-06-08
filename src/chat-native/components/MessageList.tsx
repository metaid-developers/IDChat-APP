import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { NativeChatMessage } from '../domain/types';
import MessageBubble from './MessageBubble';

type MessageListProps = {
  accountGlobalMetaId: string;
  messages: NativeChatMessage[];
};

function getMessageUiKey(message: NativeChatMessage): string {
  return (
    message.mockId ||
    message.txId ||
    message.pinId ||
    `${message.timestamp}:${message.index ?? ''}:${message.senderGlobalMetaId || ''}:${message.content}`
  );
}

export default function MessageList({ accountGlobalMetaId, messages }: MessageListProps) {
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={messages}
      keyExtractor={getMessageUiKey}
      renderItem={({ item }) => (
        <MessageBubble
          message={item}
          isSelf={item.senderGlobalMetaId === accountGlobalMetaId}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
  },
});
