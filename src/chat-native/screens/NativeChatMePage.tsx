import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import NativeChatAccountCard from '../components/NativeChatAccountCard';
import { nativeChatStore } from '../state/useNativeChatStore';
import { nativeChatTheme } from '../ui/chatTheme';

export default function NativeChatMePage() {
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );
  const copyValue = useCallback(async (_label: string, value: string) => {
    await Clipboard.setStringAsync(value);
  }, []);

  return (
    <ScrollView style={styles.container}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nativeChatTheme.color.surface,
    flex: 1,
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
