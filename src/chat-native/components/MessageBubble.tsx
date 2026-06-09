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
  row: MessageRowViewModel;
  onOpenActions?: (row: MessageRowViewModel) => void;
};

export default function MessageBubble({ row, onOpenActions }: MessageBubbleProps) {
  const { isSelf, raw: message } = row;
  const imageUri = message.localPreviewUri || message.attachmentUri;
  const shouldShowImage = message.kind === 'image';
  const shouldShowStatus = !row.fullTxId && row.statusLabel;

  return (
    <View style={[styles.row, { flexDirection: isSelf ? 'row-reverse' : 'row' }]}>
      <ChatAvatar
        name={row.senderName}
        size={nativeChatTheme.size.messageAvatar}
        uri={row.avatar}
      />
      <View style={[styles.messageColumn, isSelf ? styles.selfColumn : styles.otherColumn]}>
        <Text style={[styles.senderLabel, isSelf ? styles.selfSenderLabel : styles.otherMetaText]}>
          {row.senderName}
        </Text>
        <Pressable
          accessibilityActions={[{ name: 'activate', label: 'Open message actions' }]}
          accessibilityLabel="Open message actions"
          accessibilityRole="button"
          disabled={!onOpenActions}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'activate') {
              onOpenActions?.(row);
            }
          }}
          onLongPress={() => onOpenActions?.(row)}
          style={({ pressed }) => [
            styles.bubble,
            isSelf ? styles.selfBubble : styles.otherBubble,
            message.status === 'failed' ? styles.failedBubble : null,
            pressed ? styles.pressedBubble : null,
          ]}
        >
          {shouldShowImage ? (
            <ImageMessage uri={imageUri} />
          ) : (
            <Text style={[styles.messageText, isSelf ? styles.selfText : styles.otherText]}>
              {row.body}
            </Text>
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
                <View style={[styles.copyChip, isSelf ? styles.selfCopyChip : styles.otherCopyChip]}>
                  <Text style={[styles.copyText, isSelf ? styles.selfMetaText : styles.otherMetaText]}>
                    Copy
                  </Text>
                </View>
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
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: nativeChatTheme.radius.bubble,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  messageText: {
    fontSize: nativeChatTheme.font.body,
    lineHeight: 20,
  },
  messageColumn: {
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
  copyText: {
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
  },
});
