import React, { useSyncExternalStore } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { navigate } from '../../base/NavigationService';
import ConversationList from '../components/ConversationList';
import type { NativeChatChannel } from '../domain/types';
import { nativeChatStore } from '../state/useNativeChatStore';

export default function NativeChatHomePage() {
  const state = useSyncExternalStore(
    nativeChatStore.subscribe,
    nativeChatStore.getState,
    nativeChatStore.getState,
  );

  const openChannel = (channel: NativeChatChannel) => {
    state.setActiveChannelId(channel.id);
    navigate('NativeChatRoomPage', { channelId: channel.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ConversationList channels={state.channels} onOpenChannel={openChannel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
});
