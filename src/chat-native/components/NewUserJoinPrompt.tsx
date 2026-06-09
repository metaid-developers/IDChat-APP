import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';
import ChatAvatar from './ChatAvatar';

type NewUserJoinPromptProps = {
  onJoinGroup?: () => void;
  onExplore?: () => void;
};

export default function NewUserJoinPrompt({ onJoinGroup, onExplore }: NewUserJoinPromptProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>ID</Text>
      </View>
      <Text style={styles.title}>Join the official group</Text>
      <Text style={styles.body}>
        Start in the public IDChat room, meet MetaID users, and verify native chat immediately.
      </Text>

      <View style={styles.groupBox}>
        <ChatAvatar name="MetaWeb Builders" size={42} />
        <View style={styles.groupText}>
          <Text style={styles.groupTitle} numberOfLines={1}>
            MetaWeb Builders
          </Text>
          <Text style={styles.groupMeta}>Public group - recommended</Text>
        </View>
      </View>

      {onJoinGroup ? (
        <TouchableOpacity
          accessibilityLabel="Join recommended group"
          accessibilityRole="button"
          activeOpacity={0.86}
          onPress={onJoinGroup}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryText}>Join group</Text>
        </TouchableOpacity>
      ) : null}
      {onExplore ? (
        <TouchableOpacity
          accessibilityLabel="Explore chats first"
          accessibilityRole="button"
          activeOpacity={0.82}
          onPress={onExplore}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Explore chats first</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 52,
  },
  groupBox: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.bubble,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: 26,
    padding: 14,
    width: '100%',
  },
  groupMeta: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    marginTop: 2,
  },
  groupText: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  groupTitle: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.listTitle,
    fontWeight: '700',
  },
  logo: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.avatarFallback,
    borderRadius: 22,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  logoText: {
    color: nativeChatTheme.color.surface,
    fontSize: 24,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.bubble,
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
    width: '100%',
  },
  primaryText: {
    color: nativeChatTheme.color.surface,
    fontSize: nativeChatTheme.font.listTitle,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primarySoft,
    borderRadius: nativeChatTheme.radius.compact,
    height: 44,
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  secondaryText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  title: {
    color: nativeChatTheme.color.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
});
