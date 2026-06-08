import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

const MVP_EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🎉', '🔥', '❤️'];

type EmojiBarProps = {
  disabled?: boolean;
  onSelectEmoji: (emoji: string) => void;
};

export default function EmojiBar({ disabled, onSelectEmoji }: EmojiBarProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      {MVP_EMOJIS.map((emoji) => (
        <TouchableOpacity
          accessibilityRole="button"
          disabled={disabled}
          key={emoji}
          onPress={() => onSelectEmoji(emoji)}
          style={[styles.button, disabled ? styles.disabledButton : undefined]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    marginRight: 8,
    width: 34,
  },
  content: {
    paddingBottom: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
});
