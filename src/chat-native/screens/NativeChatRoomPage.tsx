import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useSyncExternalStore } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { goBack } from '@/base/NavigationService';
import ChatComposer from '../components/ChatComposer';
import MessageList from '../components/MessageList';
import { pickImageAttachment } from '../services/nativeChatImageService';
import { sendNativeImageMessage } from '../services/nativeChatImageSendService';
import { getNativeChatRuntimeContext } from '../services/nativeChatRuntimeContext';
import { sendNativeTextMessage } from '../services/nativeChatSendService';
import { markNativeChannelRead, syncChannelMessages } from '../services/nativeChatSyncService';
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
  const channel = state.channels.find((item) => item.id === channelId);
  const hasChannel = Boolean(channel);
  const runtimeReady = Boolean(state.runtimeConfig && state.accountGlobalMetaId);
  const messages = state.messagesByChannel[channelId] || [];
  const composerDisabled = !runtimeReady || !channel;

  const handleSendText = useCallback(
    async (plaintext: string) => {
      if (!channel || !state.accountGlobalMetaId) {
        return;
      }

      const context = getNativeChatRuntimeContext();

      await sendNativeTextMessage({
        accountGlobalMetaId: state.accountGlobalMetaId,
        channel,
        plaintext,
        nickName: state.accountDisplayName,
        addressHost: context.runtimeConfig.addressHost,
        repository: context.repository,
        store: nativeChatStore,
        wallet: context.wallet,
      });
    },
    [channel, state.accountDisplayName, state.accountGlobalMetaId],
  );

  const handlePickImage = useCallback(
    async () => {
      if (!channel || !state.accountGlobalMetaId) {
        return;
      }

      const picked = await pickImageAttachment();

      if (!picked) {
        return;
      }

      const context = getNativeChatRuntimeContext();

      await sendNativeImageMessage({
        accountGlobalMetaId: state.accountGlobalMetaId,
        channel,
        attachment: picked.attachment,
        localPreviewUri: picked.localPreviewUri,
        nickName: state.accountDisplayName,
        addressHost: context.runtimeConfig.addressHost,
        repository: context.repository,
        store: nativeChatStore,
        wallet: context.wallet,
      });
    },
    [channel, state.accountDisplayName, state.accountGlobalMetaId],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (!channelId || !hasChannel || !runtimeReady) {
        return undefined;
      }

      nativeChatStore.getState().setActiveChannelId(channelId);

      async function syncFocusedChannel() {
        let context;

        try {
          context = getNativeChatRuntimeContext();
        } catch {
          return;
        }

        const channel = context.store.getState().channels.find((item) => item.id === channelId);

        if (!channel) {
          return;
        }

        await syncChannelMessages({
          accountGlobalMetaId: context.accountGlobalMetaId,
          channel,
          apiClient: context.apiClient,
          repository: context.repository,
          store: context.store,
          wallet: context.wallet,
        });

        if (!isActive) {
          return;
        }

        await markNativeChannelRead({
          accountGlobalMetaId: context.accountGlobalMetaId,
          channel,
          repository: context.repository,
          store: context.store,
        });
      }

      syncFocusedChannel().catch(() => undefined);

      return () => {
        isActive = false;
        if (nativeChatStore.getState().activeChannelId === channelId) {
          nativeChatStore.getState().setActiveChannelId(undefined);
        }
      };
    }, [channelId, hasChannel, runtimeReady, state.accountGlobalMetaId]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" hitSlop={12} onPress={goBack} style={styles.backButton}>
          <MaterialIcons color="#111111" name="chevron-left" size={28} />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          {channel?.title || 'Chat'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.messages}>
        <MessageList accountGlobalMetaId={state.accountGlobalMetaId} messages={messages} />
      </View>
      <ChatComposer disabled={composerDisabled} onPickImage={handlePickImage} onSend={handleSendText} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#eeeeee',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 44,
  },
  messages: {
    flex: 1,
  },
  title: {
    color: '#111111',
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
