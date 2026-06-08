import React, { useSyncExternalStore } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MessageList from '../components/MessageList';
import { nativeChatStore } from '../state/useNativeChatStore';

type NativeChatRoomPageProps = {
  route?: {
    params?: {
      channelId?: string;
    };
  };
};

export default function NativeChatRoomPage({ route }: NativeChatRoomPageProps) {
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );
  const channelId = route?.params?.channelId || nativeChatStore.getState().activeChannelId || '';
  const messages = state.messagesByChannel[channelId] || [];

  return (
    <SafeAreaView style={styles.container}>
      <MessageList accountGlobalMetaId={state.accountGlobalMetaId} messages={messages} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
});
