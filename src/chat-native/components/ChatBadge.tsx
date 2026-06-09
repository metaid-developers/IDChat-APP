import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';

type ChatBadgeProps = {
  label: string;
  tone?: 'primary' | 'neutral' | 'mention';
};

export default function ChatBadge({ label, tone = 'primary' }: ChatBadgeProps) {
  return (
    <View style={[styles.badge, tone === 'neutral' && styles.neutral, tone === 'mention' && styles.mention]}>
      <Text style={[styles.text, tone === 'neutral' && styles.neutralText, tone === 'mention' && styles.mentionText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.round,
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  mention: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.primary,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mentionText: {
    color: nativeChatTheme.color.primary,
  },
  neutral: {
    backgroundColor: nativeChatTheme.color.primarySoft,
  },
  neutralText: {
    color: nativeChatTheme.color.primary,
  },
  text: {
    color: '#ffffff',
    fontSize: nativeChatTheme.font.badge,
    fontWeight: '800',
  },
});
