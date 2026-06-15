import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';
import type { MessageRowViewModel } from '../ui/chatUiSelectors';
import ChatAvatar from './ChatAvatar';
import ImageMessage from './ImageMessage';

type MessageBubbleProps = {
  onCopyTxId?: (txId: string, row: MessageRowViewModel) => void | Promise<void>;
  row: MessageRowViewModel;
  onOpenActions?: (row: MessageRowViewModel) => void;
};

export default function MessageBubble({ row, onCopyTxId, onOpenActions }: MessageBubbleProps) {
  const { isSelf, raw: message } = row;
  const showAvatar = row.showAvatar !== false;
  const showSenderLabel = row.showSenderLabel ?? (!isSelf && message.channelType !== 'private');
  const shouldShowImage = message.kind === 'image';
  const shouldShowStatus = !row.fullTxId && row.statusLabel;
  const openActions = () => onOpenActions?.(row);
  const copyTxId = () => {
    if (!row.fullTxId) {
      return;
    }

    Promise.resolve(onCopyTxId?.(row.fullTxId, row)).catch(() => undefined);
  };

  return (
    <View
      style={[
        styles.row,
        row.isGroupedWithPrevious === true ? styles.groupedRow : null,
        { flexDirection: isSelf ? 'row-reverse' : 'row' },
      ]}
    >
      {showAvatar ? (
        <ChatAvatar
          name={row.senderName}
          size={nativeChatTheme.size.messageAvatar}
          uri={row.avatar}
        />
      ) : (
        <View
          accessibilityLabel="Grouped message avatar spacer"
          style={styles.avatarSpacer}
        />
      )}
      <View style={[styles.messageColumn, isSelf ? styles.selfColumn : styles.otherColumn]}>
        {showSenderLabel ? (
          <Text style={[styles.senderLabel, isSelf ? styles.selfSenderLabel : styles.otherMetaText]}>
            {row.senderName}
          </Text>
        ) : null}
        <View
          style={[
            styles.bubble,
            isSelf ? styles.selfBubble : styles.otherBubble,
            message.status === 'failed' ? styles.failedBubble : null,
          ]}
        >
          {shouldShowImage ? (
            <ImageMessage attachmentUri={message.attachmentUri} localPreviewUri={message.localPreviewUri} />
          ) : (
            <Pressable
              accessibilityActions={[{ name: 'activate', label: 'Open message actions' }]}
              accessibilityLabel="Open message actions"
              accessibilityRole="button"
              disabled={!onOpenActions}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'activate') {
                  openActions();
                }
              }}
              onLongPress={openActions}
              onPress={openActions}
              style={({ pressed }) => (pressed ? styles.pressedBubble : null)}
            >
              <Text
                style={[
                  styles.messageText,
                  isSelf ? styles.selfText : styles.otherText,
                  row.isUnsupported ? styles.unsupportedText : null,
                ]}
              >
                {row.body}
              </Text>
            </Pressable>
          )}
          {message.status === 'failed' && message.errorMessage ? (
            <Text style={[styles.failedText, isSelf ? styles.selfFailedText : null]}>
              {message.errorMessage}
            </Text>
          ) : null}
          <View style={[styles.footer, isSelf ? styles.selfFooter : styles.otherFooter]}>
            <Text style={[styles.footerText, isSelf ? styles.selfMetaText : styles.otherMetaText]}>
              {row.timeLabel}
            </Text>
            {row.txLabel ? (
              <>
                <Text style={[styles.footerText, isSelf ? styles.selfMetaText : styles.otherMetaText]}>
                  {row.txLabel}
                </Text>
                <Pressable
                  accessibilityLabel="Copy txid"
                  accessibilityRole="button"
                  disabled={!onCopyTxId}
                  onPress={copyTxId}
                  style={({ pressed }) => [
                    styles.copyChip,
                    isSelf ? styles.selfCopyChip : styles.otherCopyChip,
                    pressed ? styles.chipPressed : null,
                  ]}
                >
                  <Text style={[styles.copyText, isSelf ? styles.selfMetaText : styles.otherMetaText]}>
                    Copy
                  </Text>
                </Pressable>
              </>
            ) : null}
            {shouldShowStatus ? (
              <Text
                style={[
                  styles.footerText,
                  message.status === 'failed'
                    ? isSelf
                      ? styles.selfFailedStatusText
                      : styles.failedStatusText
                    : isSelf
                      ? styles.selfMetaText
                      : styles.otherMetaText,
                ]}
              >
                {row.statusLabel}
              </Text>
            ) : null}
            {onOpenActions ? (
              <Pressable
                accessibilityLabel="Open message actions"
                accessibilityRole="button"
                hitSlop={8}
                onPress={openActions}
                style={({ pressed }) => [
                  styles.actionChip,
                  isSelf ? styles.selfCopyChip : styles.otherCopyChip,
                  pressed ? styles.chipPressed : null,
                ]}
              >
                <Text style={[styles.copyText, isSelf ? styles.selfMetaText : styles.otherMetaText]}>
                  ...
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSpacer: {
    height: nativeChatTheme.size.messageAvatar,
    width: nativeChatTheme.size.messageAvatar,
  },
  bubble: {
    borderRadius: nativeChatTheme.radius.bubble,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionChip: {
    alignItems: 'center',
    borderRadius: nativeChatTheme.radius.round,
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipPressed: {
    opacity: 0.68,
  },
  copyChip: {
    borderRadius: nativeChatTheme.radius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  failedText: {
    color: nativeChatTheme.color.failed,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    marginTop: 6,
  },
  failedStatusText: {
    color: nativeChatTheme.color.failed,
    fontWeight: '700',
  },
  failedBubble: {
    borderColor: nativeChatTheme.color.failed,
    borderWidth: 1,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  footerText: {
    fontSize: nativeChatTheme.font.meta,
  },
  groupedRow: {
    marginVertical: 1,
  },
  messageText: {
    flexShrink: 1,
    fontSize: nativeChatTheme.font.body,
    lineHeight: 20,
    maxWidth: '100%',
  },
  messageColumn: {
    flexShrink: 1,
    maxWidth: '78%',
  },
  otherBubble: {
    backgroundColor: nativeChatTheme.color.incomingBubble,
    borderColor: nativeChatTheme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  otherColumn: {
    alignItems: 'flex-start',
  },
  otherCopyChip: {
    backgroundColor: nativeChatTheme.color.background,
  },
  otherFooter: {
    justifyContent: 'flex-start',
  },
  otherMetaText: {
    color: nativeChatTheme.color.mutedText,
  },
  otherText: {
    color: nativeChatTheme.color.text,
  },
  pressedBubble: {
    opacity: 0.82,
  },
  row: {
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  selfColumn: {
    alignItems: 'flex-end',
  },
  selfBubble: {
    backgroundColor: nativeChatTheme.color.outgoingBubble,
  },
  selfCopyChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  selfFooter: {
    justifyContent: 'flex-end',
  },
  selfFailedStatusText: {
    color: '#ffe1e6',
    fontWeight: '800',
  },
  selfFailedText: {
    color: '#ffe1e6',
  },
  selfMetaText: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
  selfSenderLabel: {
    color: nativeChatTheme.color.primary,
  },
  selfText: {
    color: nativeChatTheme.color.surface,
  },
  senderLabel: {
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    marginBottom: 3,
    paddingHorizontal: 4,
  },
  unsupportedText: {
    color: nativeChatTheme.color.mutedText,
    fontStyle: 'italic',
  },
  copyText: {
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
  },
});
