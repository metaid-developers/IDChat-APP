import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';
import ChatAvatar from './ChatAvatar';

type NativeChatAccountCardProps = {
  displayName: string;
  globalMetaId: string;
  avatar?: string;
  address?: string;
  chatPublicKey?: string;
  socketConnected: boolean;
  onCopyValue: (label: string, value: string) => void;
};

function shortValue(value: string | undefined): string {
  if (!value) {
    return '';
  }

  if (value.length <= 32) {
    return value;
  }

  return `${value.slice(0, 14)}...${value.slice(-10)}`;
}

function AccountValueRow({
  label,
  value,
  unavailableText,
  copyLabel,
  onCopyValue,
}: {
  label: string;
  value?: string;
  unavailableText: string;
  copyLabel: string;
  onCopyValue: (label: string, value: string) => void;
}) {
  return (
    <View style={styles.valueRow}>
      <View style={styles.valueText}>
        <Text style={styles.valueLabel}>{label}</Text>
        <Text numberOfLines={1} selectable style={value ? styles.value : styles.unavailableValue}>
          {value ? shortValue(value) : unavailableText}
        </Text>
      </View>
      {value ? (
        <Pressable
          accessibilityLabel={`Copy ${copyLabel}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => onCopyValue(label, value)}
        >
          <Text style={styles.copyText}>Copy</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function NativeChatAccountCard({
  displayName,
  globalMetaId,
  avatar,
  address,
  chatPublicKey,
  socketConnected,
  onCopyValue,
}: NativeChatAccountCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <ChatAvatar uri={avatar} name={displayName || 'ID'} size={58} />
        <View style={styles.profileText}>
          <Text numberOfLines={1} style={styles.displayName}>
            {displayName || 'IDChat User'}
          </Text>
          <Text style={styles.statusText}>{globalMetaId ? 'Connected account' : 'Not connected'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <AccountValueRow
          copyLabel="Global MetaID"
          label="Global MetaID"
          onCopyValue={onCopyValue}
          unavailableText="Not connected"
          value={globalMetaId}
        />
        <AccountValueRow
          copyLabel="MVC address"
          label="MVC address"
          onCopyValue={onCopyValue}
          unavailableText="Address unavailable"
          value={address}
        />
        <AccountValueRow
          copyLabel="chat public key"
          label="Chat public key"
          onCopyValue={onCopyValue}
          unavailableText="Chat public key unavailable"
          value={chatPublicKey}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.statusRow}>
          <Text style={styles.valueLabel}>Chat key</Text>
          <Text style={chatPublicKey ? styles.readyText : styles.unavailableValue}>
            {chatPublicKey ? 'Chat key active' : 'Chat key unavailable'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.valueLabel}>Socket</Text>
          <Text style={socketConnected ? styles.readyText : styles.unavailableValue}>
            {socketConnected ? 'Socket connected' : 'Socket disconnected'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nativeChatTheme.color.surface,
    borderBottomColor: nativeChatTheme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copyText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  displayName: {
    color: nativeChatTheme.color.text,
    fontSize: 22,
    fontWeight: '800',
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  readyText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  section: {
    borderTopColor: nativeChatTheme.color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  statusText: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    marginTop: 5,
  },
  unavailableValue: {
    color: nativeChatTheme.color.faintText,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '600',
  },
  value: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '600',
    marginTop: 4,
  },
  valueLabel: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 50,
  },
  valueText: {
    flex: 1,
    minWidth: 0,
  },
});
