import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeChatMessage } from '../domain/types';
import { nativeChatTheme } from '../ui/chatTheme';
import { getMessageRowViewModels, type MessageRowViewModel } from '../ui/chatUiSelectors';
import MessageBubble from './MessageBubble';

type MessageListProps = {
  accountGlobalMetaId: string;
  hasMoreOlder?: boolean;
  hasNewerMessages?: boolean;
  isAtLatest?: boolean;
  loadingOlder?: boolean;
  messages: NativeChatMessage[];
  olderLoadError?: string;
  onCopyTxId?: (txId: string, row: MessageRowViewModel) => void | Promise<void>;
  onLatestStateChange?: (isAtLatest: boolean) => void;
  onLoadOlder?: () => void | Promise<void>;
  onOpenMessageActions?: (row: MessageRowViewModel) => void;
  onScrollToLatest?: () => void | Promise<void>;
  onVisibleMessageIndexChange?: (messageIndex: number) => void;
  showNoMoreOlder?: boolean;
};

const TOP_LOAD_THRESHOLD = 24;
const LATEST_EDGE_THRESHOLD = 64;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 40 };

export default function MessageList({
  accountGlobalMetaId,
  hasMoreOlder,
  hasNewerMessages,
  isAtLatest = true,
  loadingOlder,
  messages,
  olderLoadError,
  onCopyTxId,
  onLatestStateChange,
  onLoadOlder,
  onOpenMessageActions,
  onScrollToLatest,
  onVisibleMessageIndexChange,
  showNoMoreOlder,
}: MessageListProps) {
  const listRef = useRef<FlatList<MessageRowViewModel>>(null);
  const canLoadOlder = Boolean(hasMoreOlder && !loadingOlder && onLoadOlder);
  const showLatestAffordance = Boolean(hasNewerMessages || !isAtLatest);
  const rows = useMemo(
    () => getMessageRowViewModels(messages, accountGlobalMetaId),
    [accountGlobalMetaId, messages],
  );

  const handleLoadOlder = useCallback(() => {
    if (!canLoadOlder) {
      return;
    }

    void onLoadOlder?.();
  }, [canLoadOlder, onLoadOlder]);

  const handleRetryLoadOlder = useCallback(() => {
    void onLoadOlder?.();
  }, [onLoadOlder]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      if (contentOffset.y <= TOP_LOAD_THRESHOLD) {
        handleLoadOlder();
      }

      if (onLatestStateChange) {
        const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
        onLatestStateChange(contentSize.height <= layoutMeasurement.height || distanceFromBottom <= LATEST_EDGE_THRESHOLD);
      }
    },
    [handleLoadOlder, onLatestStateChange],
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item?: MessageRowViewModel }> }) => {
      if (!onVisibleMessageIndexChange) {
        return;
      }

      const visibleIndexes = viewableItems
        .map((viewableItem) => viewableItem.item?.raw.index)
        .filter((index): index is number => index !== undefined);

      if (visibleIndexes.length === 0) {
        return;
      }

      onVisibleMessageIndexChange(Math.max(...visibleIndexes));
    },
    [onVisibleMessageIndexChange],
  );

  const handleScrollToLatest = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
    onLatestStateChange?.(true);
    void onScrollToLatest?.();
  }, [onLatestStateChange, onScrollToLatest]);

  const olderHeader = olderLoadError ? (
    <View style={styles.olderError}>
      <Text style={styles.olderErrorText}>{olderLoadError}</Text>
      <Pressable
        accessibilityLabel="Retry loading older messages"
        accessibilityRole="button"
        disabled={!onLoadOlder}
        onPress={handleRetryLoadOlder}
        style={[styles.olderButton, !onLoadOlder ? styles.disabledButton : undefined]}
      >
        <Text style={styles.olderButtonText}>Retry</Text>
      </Pressable>
    </View>
  ) : loadingOlder || hasMoreOlder ? (
    <View style={styles.olderHeader}>
      <Pressable
        accessibilityLabel="Load older messages"
        accessibilityRole="button"
        disabled={!canLoadOlder}
        onPress={handleLoadOlder}
        style={[styles.olderButton, !canLoadOlder ? styles.disabledButton : undefined]}
      >
        <Text style={styles.olderButtonText}>
          {loadingOlder ? 'Loading earlier messages...' : 'Load earlier messages'}
        </Text>
      </Pressable>
    </View>
  ) : showNoMoreOlder ? (
    <View style={styles.olderHeader}>
      <Text style={styles.noMoreText}>No earlier messages</Text>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(row) => row.id}
        ListHeaderComponent={olderHeader}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onScroll={handleScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
        renderItem={({ item }) => (
          <MessageBubble onCopyTxId={onCopyTxId} onOpenActions={onOpenMessageActions} row={item} />
        )}
        scrollEventThrottle={16}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />
      {showLatestAffordance ? (
        <Pressable
          accessibilityLabel="Scroll to latest messages"
          accessibilityRole="button"
          onPress={handleScrollToLatest}
          style={styles.latestButton}
        >
          <Text style={styles.latestButtonText}>{hasNewerMessages ? 'New messages' : 'Latest'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.55,
  },
  latestButton: {
    alignSelf: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.round,
    bottom: 14,
    elevation: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  latestButtonText: {
    color: nativeChatTheme.color.surface,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '800',
  },
  olderButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 32,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  olderButtonText: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
  },
  noMoreText: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    textAlign: 'center',
  },
  olderError: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  olderErrorText: {
    color: nativeChatTheme.color.failed,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    textAlign: 'center',
  },
  olderHeader: {
    paddingBottom: 8,
  },
});
