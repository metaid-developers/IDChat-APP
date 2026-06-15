import React, { useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EmojiBar from './EmojiBar';
import type { NativeChatMention } from '../domain/types';

type MaterialIconProps = {
  color: string;
  name: string;
  size: number;
};

function MaterialIconFallback({ color, name, size }: MaterialIconProps) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ color, fontSize: size, lineHeight: size }}
    >
      {name.slice(0, 1)}
    </Text>
  );
}

function getMaterialIconsComponent(): React.ComponentType<MaterialIconProps> {
  try {
    return require('react-native-vector-icons/MaterialIcons').default as React.ComponentType<MaterialIconProps>;
  } catch {
    return MaterialIconFallback;
  }
}

const MaterialIcons = getMaterialIconsComponent();

type ChatComposerProps = {
  disabled?: boolean;
  disabledReason?: string;
  imagePreviewUri?: string;
  mentionSuggestions?: NativeChatMention[];
  mentionsEnabled?: boolean;
  quote?: NativeChatComposerQuote;
  onClearQuote?: () => void;
  onRemoveImage?: () => void;
  onSend: (text: string, options?: NativeChatComposerSendOptions) => Promise<void> | void;
  onSendImage?: () => Promise<void> | void;
  onPickImage?: () => Promise<void> | void;
};

export type NativeChatComposerQuote = {
  replyPin: string;
  senderName: string;
  content: string;
};

export type NativeChatComposerSendOptions = {
  quoteReplyPin?: string;
  mentions?: NativeChatMention[];
};

type MentionQuery = {
  startIndex: number;
  query: string;
};

function getMentionQuery(text: string): MentionQuery | undefined {
  const atIndex = text.lastIndexOf('@');

  if (atIndex === -1) {
    return undefined;
  }

  const query = text.slice(atIndex + 1);

  if (query.includes(' ') || query.includes('\n')) {
    return undefined;
  }

  return { startIndex: atIndex, query };
}

function buildSendOptions(
  quote: NativeChatComposerQuote | undefined,
  mentions: NativeChatMention[],
): NativeChatComposerSendOptions | undefined {
  const options: NativeChatComposerSendOptions = {};

  if (quote?.replyPin) {
    options.quoteReplyPin = quote.replyPin;
  }

  if (mentions.length > 0) {
    options.mentions = mentions;
  }

  return Object.keys(options).length > 0 ? options : undefined;
}

export default function ChatComposer({
  disabled,
  disabledReason,
  imagePreviewUri,
  mentionSuggestions = [],
  mentionsEnabled = false,
  quote,
  onClearQuote,
  onRemoveImage,
  onSend,
  onSendImage,
  onPickImage,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [mentions, setMentions] = useState<NativeChatMention[]>([]);
  const trimmedText = text.trim();
  const sendDisabled = disabled || sending || trimmedText.length === 0;
  const imageDisabled = disabled || sending || !onPickImage;
  const sendImageDisabled = disabled || sending || !imagePreviewUri || !onSendImage;
  const emojiDisabled = disabled || sending;
  const mentionQuery = useMemo(() => getMentionQuery(text), [text]);
  const visibleMentionSuggestions = useMemo(() => {
    if (!mentionsEnabled || !mentionQuery) {
      return [];
    }

    const query = mentionQuery.query.toLowerCase();
    return mentionSuggestions
      .filter((suggestion) => suggestion.name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [mentionQuery, mentionSuggestions, mentionsEnabled]);

  function handleChangeText(nextText: string) {
    setText(nextText);
    setMentions((currentMentions) =>
      currentMentions.filter((mention) => nextText.includes(`@${mention.name}`)),
    );
  }

  async function handleSend() {
    if (sendDisabled) {
      return;
    }

    const textToSend = trimmedText;
    const mentionsToSend = mentions.filter((mention) => textToSend.includes(`@${mention.name}`));
    const sendOptions = buildSendOptions(quote, mentionsToSend);
    setText('');
    setMentions([]);
    setSending(true);

    try {
      if (sendOptions) {
        await onSend(textToSend, sendOptions);
      } else {
        await onSend(textToSend);
      }
    } catch {
      setText(textToSend);
      setMentions(mentionsToSend);
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage() {
    if (sendImageDisabled || !onSendImage) {
      return;
    }

    setSending(true);

    try {
      await onSendImage();
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    if (imageDisabled || !onPickImage) {
      return;
    }

    setSending(true);

    try {
      await onPickImage();
    } catch {
      // Keep the existing composer behavior: failed actions do not clear the draft.
    } finally {
      setSending(false);
    }
  }

  function handleToggleEmojiBar() {
    if (emojiDisabled) {
      return;
    }

    setShowEmojiBar((isVisible) => !isVisible);
  }

  function handleSelectMention(mention: NativeChatMention) {
    if (!mentionQuery) {
      return;
    }

    const beforeMention = text.slice(0, mentionQuery.startIndex);
    const afterMention = text.slice(mentionQuery.startIndex + mentionQuery.query.length + 1);
    const nextText = `${beforeMention}@${mention.name} ${afterMention}`.trimEnd();
    setText(nextText);
    setMentions((currentMentions) => {
      if (currentMentions.some((currentMention) => currentMention.globalMetaId === mention.globalMetaId)) {
        return currentMentions;
      }

      return [...currentMentions, mention];
    });
  }

  return (
    <View style={styles.container}>
      {quote ? (
        <View style={styles.quoteBar}>
          <View style={styles.quoteText}>
            <Text numberOfLines={1} style={styles.quoteTitle}>
              {`Replying to ${quote.senderName}`}
            </Text>
            <Text numberOfLines={1} style={styles.quoteContent}>
              {quote.content}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Clear quote"
            accessibilityRole="button"
            disabled={sending}
            onPress={onClearQuote}
            style={styles.smallActionButton}
          >
            <MaterialIcons color="#21405f" name="close" size={18} />
          </TouchableOpacity>
        </View>
      ) : null}
      {imagePreviewUri ? (
        <View style={styles.imagePreview}>
          <Image resizeMode="cover" source={{ uri: imagePreviewUri }} style={styles.imagePreviewThumb} />
          <View style={styles.imagePreviewText}>
            <Text style={styles.imagePreviewTitle}>Image ready</Text>
            <Text numberOfLines={1} style={styles.imagePreviewSubtitle}>
              Ready to send
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Remove selected image"
            accessibilityRole="button"
            disabled={sending || disabled}
            onPress={onRemoveImage}
            style={styles.smallActionButton}
          >
            <MaterialIcons color="#21405f" name="delete-outline" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Replace selected image"
            accessibilityRole="button"
            disabled={imageDisabled}
            onPress={handlePickImage}
            style={styles.smallActionButton}
          >
            <MaterialIcons color="#21405f" name="photo-library" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Send selected image"
            accessibilityRole="button"
            disabled={sendImageDisabled}
            onPress={handleSendImage}
            style={[styles.smallActionButton, styles.sendImageButton, sendImageDisabled ? styles.disabledSendButton : undefined]}
          >
            <MaterialIcons color="#ffffff" name="send" size={17} />
          </TouchableOpacity>
        </View>
      ) : null}
      {showEmojiBar ? (
        <View style={styles.emojiTray}>
          <EmojiBar
            disabled={emojiDisabled}
            onSelectEmoji={(emoji) => handleChangeText(`${text}${emoji}`)}
          />
        </View>
      ) : null}
      {disabled && disabledReason ? (
        <Text style={styles.disabledReason}>{disabledReason}</Text>
      ) : null}
      {visibleMentionSuggestions.length > 0 ? (
        <View style={styles.mentionTray}>
          {visibleMentionSuggestions.map((suggestion) => (
            <TouchableOpacity
              accessibilityLabel={`Mention ${suggestion.name}`}
              accessibilityRole="button"
              key={suggestion.globalMetaId}
              onPress={() => handleSelectMention(suggestion)}
              style={styles.mentionChip}
            >
              <Text style={styles.mentionChipText}>{suggestion.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TouchableOpacity
          accessibilityLabel="Insert emoji"
          accessibilityRole="button"
          disabled={emojiDisabled}
          onPress={handleToggleEmojiBar}
          style={[
            styles.iconButton,
            styles.emojiButton,
            styles.secondaryButton,
            emojiDisabled ? styles.disabledSecondaryButton : undefined,
          ]}
        >
          <MaterialIcons color="#21405f" name="insert-emoticon" size={22} />
        </TouchableOpacity>
        <TextInput
          accessibilityLabel="Message input"
          editable={!disabled && !sending}
          multiline
          onChangeText={handleChangeText}
          placeholder="Message"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={text}
        />
        {onPickImage ? (
          <TouchableOpacity
            accessibilityLabel="Pick image"
            accessibilityRole="button"
            disabled={imageDisabled}
            onPress={handlePickImage}
            style={[
              styles.iconButton,
              styles.trailingButton,
              styles.secondaryButton,
              imageDisabled ? styles.disabledSecondaryButton : undefined,
            ]}
          >
            <MaterialIcons color="#21405f" name="photo-library" size={22} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          accessibilityLabel="Send message"
          accessibilityRole="button"
          disabled={sendDisabled}
          onPress={handleSend}
          style={[
            styles.iconButton,
            styles.trailingButton,
            styles.sendButton,
            sendDisabled ? styles.disabledSendButton : undefined,
          ]}
        >
          <MaterialIcons color="#ffffff" name={sending ? 'hourglass-empty' : 'send'} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopColor: '#eeeeee',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 9,
  },
  disabledReason: {
    color: '#c62828',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  disabledSecondaryButton: {
    opacity: 0.45,
  },
  disabledSendButton: {
    backgroundColor: '#b7c9e8',
  },
  emojiTray: {
    marginBottom: 6,
  },
  imagePreview: {
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    borderColor: '#dbe3ef',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 7,
    padding: 8,
  },
  imagePreviewText: {
    flex: 1,
    minWidth: 0,
  },
  imagePreviewThumb: {
    backgroundColor: '#dbe3ef',
    borderRadius: 8,
    height: 42,
    width: 42,
  },
  imagePreviewTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  imagePreviewSubtitle: {
    color: '#657287',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  emojiButton: {
    marginRight: 7,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  input: {
    backgroundColor: '#f6f7f9',
    borderRadius: 18,
    color: '#111111',
    flex: 1,
    fontSize: 15,
    maxHeight: 96,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  mentionChip: {
    backgroundColor: '#ffffff',
    borderColor: '#c8d4e4',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 11,
  },
  mentionChipText: {
    color: '#21405f',
    fontSize: 13,
    fontWeight: '700',
  },
  mentionTray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 7,
  },
  quoteBar: {
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    borderColor: '#dbe3ef',
    borderLeftColor: '#1677ff',
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quoteContent: {
    color: '#657287',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  quoteText: {
    flex: 1,
    minWidth: 0,
  },
  quoteTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#c8d4e4',
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendButton: {
    backgroundColor: '#1677ff',
  },
  sendImageButton: {
    backgroundColor: '#1677ff',
    borderColor: '#1677ff',
  },
  smallActionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#c8d4e4',
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  trailingButton: {
    marginLeft: 7,
  },
});
