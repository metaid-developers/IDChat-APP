import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';
import { resolveNativeChatAvatarSource } from '../ui/avatarSource';

type ChatAvatarProps = {
  uri?: string;
  name?: string;
  size?: number;
};

function initialsForName(name?: string): string {
  const cleaned = String(name || 'ID').trim();
  if (!cleaned) return 'ID';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

export default function ChatAvatar({ uri, name, size = nativeChatTheme.size.listAvatar }: ChatAvatarProps) {
  const borderRadius = size / 2;
  const resolvedUri = resolveNativeChatAvatarSource(uri);
  const [failedUri, setFailedUri] = useState<string | undefined>();
  const shouldRenderImage = Boolean(resolvedUri && failedUri !== resolvedUri);

  useEffect(() => {
    setFailedUri(undefined);
  }, [resolvedUri, uri]);

  if (shouldRenderImage && resolvedUri) {
    return (
      <Image
        accessibilityLabel={`${name || 'User'} avatar`}
        cachePolicy="memory-disk"
        contentFit="cover"
        onError={() => setFailedUri(resolvedUri)}
        recyclingKey={resolvedUri || name || 'fallback'}
        source={{ uri: resolvedUri }}
        style={[styles.avatar, { borderRadius, height: size, width: size }]}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`${name || 'User'} avatar`}
      style={[styles.fallback, { borderRadius, height: size, width: size }]}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.initials, { fontSize: size <= 32 ? 11 : 14 }]}
      >
        {initialsForName(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: nativeChatTheme.color.primarySoft,
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.avatarFallback,
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
