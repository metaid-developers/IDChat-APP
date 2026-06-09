import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EmojiBar from './EmojiBar';

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
  onSend: (text: string) => Promise<void> | void;
  onPickImage?: () => Promise<void> | void;
};

export default function ChatComposer({ disabled, onSend, onPickImage }: ChatComposerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const trimmedText = text.trim();
  const sendDisabled = disabled || sending || trimmedText.length === 0;
  const imageDisabled = disabled || sending || !onPickImage;
  const emojiDisabled = disabled || sending;

  async function handleSend() {
    if (sendDisabled) {
      return;
    }

    const textToSend = trimmedText;
    setText('');
    setSending(true);

    try {
      await onSend(textToSend);
    } catch {
      setText(textToSend);
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

  return (
    <View style={styles.container}>
      {showEmojiBar ? (
        <View style={styles.emojiTray}>
          <EmojiBar
            disabled={emojiDisabled}
            onSelectEmoji={(emoji) => setText((currentText) => `${currentText}${emoji}`)}
          />
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
          editable={!disabled && !sending}
          multiline
          onChangeText={setText}
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
  disabledSecondaryButton: {
    opacity: 0.45,
  },
  disabledSendButton: {
    backgroundColor: '#b7c9e8',
  },
  emojiTray: {
    marginBottom: 6,
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
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#c8d4e4',
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendButton: {
    backgroundColor: '#1677ff',
  },
  trailingButton: {
    marginLeft: 7,
  },
});
