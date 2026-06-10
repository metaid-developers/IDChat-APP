import React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeChatOnlineBot } from '../domain/types';
import { nativeChatTheme } from '../ui/chatTheme';
import ChatAvatar from './ChatAvatar';

type OnlineBotPanelProps = {
  visible: boolean;
  bots: NativeChatOnlineBot[];
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onOpenBot: (bot: NativeChatOnlineBot) => void;
  onRefresh: () => void;
};

function getBotSubtitle(bot: NativeChatOnlineBot): string {
  const onlineAgo = bot.lastSeenAgoSeconds > 0 ? `Seen ${bot.lastSeenAgoSeconds}s ago` : 'Online now';
  const devices = bot.deviceCount > 0 ? `${bot.deviceCount} device${bot.deviceCount === 1 ? '' : 's'}` : '';
  return [bot.bio, onlineAgo, devices].filter(Boolean).join(' · ');
}

export default function OnlineBotPanel({
  visible,
  bots,
  loading,
  error,
  onClose,
  onOpenBot,
  onRefresh,
}: OnlineBotPanelProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Dismiss online bots" onPress={onClose} style={styles.backdrop} />
        <SafeAreaView style={styles.panel}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Online bots</Text>
            <View style={styles.headerActions}>
              <Pressable accessibilityLabel="Refresh online bots" hitSlop={12} onPress={onRefresh}>
                <Text style={styles.linkText}>Refresh</Text>
              </Pressable>
              <Pressable accessibilityLabel="Close online bots" hitSlop={12} onPress={onClose}>
                <Text style={styles.linkText}>Close</Text>
              </Pressable>
            </View>
          </View>

          {loading ? <Text style={styles.statusText}>Loading online bots</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <ScrollView keyboardShouldPersistTaps="handled" style={styles.botList}>
            {!loading && !error && bots.length === 0 ? (
              <Text style={styles.emptyText}>No online bots found</Text>
            ) : null}
            {bots.map((bot) => (
              <Pressable
                accessibilityLabel={`Open online bot ${bot.name}`}
                accessibilityRole="button"
                key={bot.globalMetaId}
                onPress={() => onOpenBot(bot)}
                style={styles.botRow}
              >
                <ChatAvatar name={bot.name} size={38} uri={bot.avatar} />
                <View style={styles.botText}>
                  <Text numberOfLines={1} style={styles.botName}>
                    {bot.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.botMeta}>
                    {getBotSubtitle(bot)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  botList: {
    marginTop: 8,
  },
  botMeta: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    marginTop: 4,
  },
  botName: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  botRow: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderBottomColor: nativeChatTheme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  botText: {
    flex: 1,
    minWidth: 0,
  },
  emptyText: {
    color: nativeChatTheme.color.mutedText,
    paddingHorizontal: 16,
    paddingVertical: 18,
    textAlign: 'center',
  },
  errorText: {
    color: nativeChatTheme.color.failed,
    fontSize: nativeChatTheme.font.body,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: nativeChatTheme.color.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 10,
    width: 38,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  headerTitle: {
    color: nativeChatTheme.color.text,
    fontSize: 20,
    fontWeight: '800',
  },
  linkText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: nativeChatTheme.color.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '82%',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  statusText: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
