import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import NativeChatAccountCard from '../components/NativeChatAccountCard';
import { nativeChatStore } from '../state/useNativeChatStore';
import { nativeChatTheme } from '../ui/chatTheme';

export default function NativeChatMePage() {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );
  const copyValue = useCallback(async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopiedLabel(label);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      testID="native-chat-me-screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Me</Text>
        <Text style={styles.subtitle}>IDChat profile and account identity</Text>
      </View>
      <NativeChatAccountCard
        address={state.accountAddress}
        avatar={state.accountAvatar}
        chatPublicKey={state.accountChatPublicKey}
        displayName={state.accountDisplayName}
        globalMetaId={state.accountGlobalMetaId}
        onCopyValue={copyValue}
        socketConnected={state.socketConnected}
      />
      {copiedLabel ? (
        <Text style={styles.copyFeedback} testID="native-chat-copy-feedback">
          {`Copied ${copiedLabel}`}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nativeChatTheme.color.surface,
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  copyFeedback: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  subtitle: {
    color: nativeChatTheme.color.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: nativeChatTheme.color.text,
    fontSize: 22,
    fontWeight: '700',
  },
});
