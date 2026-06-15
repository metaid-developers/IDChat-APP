import * as Clipboard from 'expo-clipboard';
import React, { useMemo } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getNativeChatTxExplorerUrl } from '../ui/chatUiFormatters';
import type { MessageRowViewModel } from '../ui/chatUiSelectors';
import {
  getNativeChatMessageActions,
  type NativeChatMessageAction,
} from '../ui/messageActions';
import { nativeChatTheme } from '../ui/chatTheme';
import { resolveImageMessageUris } from './ImageMessage';

type MessageActionSheetProps = {
  visible: boolean;
  row?: MessageRowViewModel;
  onClose: () => void;
  onQuote?: (row: MessageRowViewModel) => void | Promise<void>;
  onViewImage?: (row: MessageRowViewModel, uri: string) => void | Promise<void>;
  onSaveImage?: (row: MessageRowViewModel, uri: string) => void | Promise<void>;
};

export default function MessageActionSheet({
  visible,
  row,
  onClose,
  onQuote,
  onViewImage,
  onSaveImage,
}: MessageActionSheetProps) {
  const actions = useMemo(
    () => (row ? getNativeChatMessageActions(row) : []),
    [row],
  );
  const isVisible = visible && Boolean(row);
  const txId = row?.fullTxId || '';

  async function handleAction(action: NativeChatMessageAction) {
    if (!row) {
      onClose();
      return;
    }

    try {
      if (action.id === 'copy-text') {
        if (!row.safeCopyText) {
          return;
        }

        await Clipboard.setStringAsync(row.safeCopyText);
        Alert.alert('Copied', 'Message text copied to clipboard.');
        return;
      }

      if (action.id === 'copy-txid') {
        await Clipboard.setStringAsync(txId);
        Alert.alert('Copied', 'Txid copied to clipboard.');
        return;
      }

      if (action.id === 'open-tx' && txId) {
        await Linking.openURL(getNativeChatTxExplorerUrl(row.raw.chain, txId));
        return;
      }

      if (action.id === 'view-image') {
        const imageUri = resolveImageMessageUris(row.raw)[0];

        if (imageUri) {
          if (onViewImage) {
            await onViewImage(row, imageUri);
          } else {
            await Linking.openURL(imageUri);
          }
        }
        return;
      }

      if (action.id === 'save-image') {
        const imageUri = resolveImageMessageUris(row.raw)[0];

        if (imageUri) {
          await onSaveImage?.(row, imageUri);
        }
        return;
      }

      if (action.id === 'quote') {
        await onQuote?.(row);
      }
    } finally {
      onClose();
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={isVisible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close message actions"
          onPress={onClose}
          style={styles.backdrop}
        />
        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Message actions</Text>
            <Pressable accessibilityLabel="Close message actions" hitSlop={12} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          {txId ? (
            <View style={styles.txBlock}>
              <Text style={styles.txLabel}>Full txid</Text>
              <Text selectable style={styles.txValue}>
                {txId}
              </Text>
            </View>
          ) : null}
          <View style={styles.actionList}>
            {actions.map((action) => (
              <Pressable
                accessibilityLabel={action.label}
                accessibilityRole="button"
                key={action.id}
                onPress={() => {
                  handleAction(action).catch(() => undefined);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed ? styles.actionButtonPressed : null,
                ]}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionButtonPressed: {
    backgroundColor: nativeChatTheme.color.primarySoft,
  },
  actionLabel: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  actionList: {
    gap: 8,
    marginTop: 12,
  },
  backdrop: {
    flex: 1,
  },
  closeText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.round,
    height: 4,
    marginBottom: 12,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overlay: {
    backgroundColor: 'rgba(17, 24, 39, 0.36)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: nativeChatTheme.color.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  title: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.headerTitle,
    fontWeight: '700',
  },
  txBlock: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    padding: 12,
  },
  txLabel: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  txValue: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.meta,
    lineHeight: 16,
  },
});
