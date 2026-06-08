import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EmojiBar from './EmojiBar';

type ChatComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
};

export default function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const trimmedText = text.trim();
  const sendDisabled = disabled || sending || trimmedText.length === 0;

  async function handleSend() {
    if (sendDisabled) {
      return;
    }

    const textToSend = trimmedText;
    setText('');
    setSending(true);

    try {
      await onSend(textToSend);
    } catch {
      setText(textToSend);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <EmojiBar
        disabled={disabled || sending}
        onSelectEmoji={(emoji) => setText((currentText) => `${currentText}${emoji}`)}
      />
      <View style={styles.inputRow}>
        <TextInput
          editable={!disabled && !sending}
          multiline
          onChangeText={setText}
          placeholder="Message"
          style={styles.input}
          value={text}
        />
        <TouchableOpacity
          accessibilityRole="button"
          disabled={sendDisabled}
          onPress={handleSend}
          style={[styles.sendButton, sendDisabled ? styles.disabledSendButton : undefined]}
        >
          <Text style={styles.sendButtonText}>{sending ? 'Sending' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopColor: '#eeeeee',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  disabledSendButton: {
    backgroundColor: '#b7c9e8',
  },
  input: {
    backgroundColor: '#f6f7f9',
    borderRadius: 18,
    color: '#111111',
    flex: 1,
    fontSize: 15,
    maxHeight: 112,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#1677ff',
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 64,
    paddingHorizontal: 14,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
