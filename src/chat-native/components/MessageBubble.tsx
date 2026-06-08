import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeChatMessage } from '../domain/types';

type MessageBubbleProps = {
  message: NativeChatMessage;
  isSelf: boolean;
};

export default function MessageBubble({ message, isSelf }: MessageBubbleProps) {
  const imageUri = message.localPreviewUri || message.attachmentUri;
  const shouldShowImage = message.kind === 'image' && !!imageUri;

  return (
    <View style={[styles.row, isSelf ? styles.selfRow : styles.otherRow]}>
      <View style={[styles.bubble, isSelf ? styles.selfBubble : styles.otherBubble]}>
        {shouldShowImage ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={[styles.messageText, isSelf ? styles.selfText : styles.otherText]}>
            {message.content}
          </Text>
        )}
        {message.status === 'failed' ? (
          <Text style={styles.failedText}>{message.errorMessage || 'Send failed'}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 12,
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  failedText: {
    color: '#c62828',
    fontSize: 12,
    marginTop: 6,
  },
  image: {
    borderRadius: 8,
    height: 180,
    width: 220,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  otherBubble: {
    backgroundColor: '#f1f1f1',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  otherText: {
    color: '#111111',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  selfBubble: {
    backgroundColor: '#1677ff',
  },
  selfRow: {
    justifyContent: 'flex-end',
  },
  selfText: {
    color: '#ffffff',
  },
});
