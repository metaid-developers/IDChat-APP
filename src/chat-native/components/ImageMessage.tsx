import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ImageMessageProps = {
  uri?: string;
  onOpen?: (uri: string) => void;
};

const METAFILE_CONTENT_BASE = 'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/';

export function resolveImageMessageUri(uri?: string): string | undefined {
  const source = uri?.trim();

  if (!source) {
    return undefined;
  }

  if (/^https?:\/\//i.test(source) || source.startsWith('file://')) {
    return source;
  }

  if (source.startsWith('metafile://')) {
    const cleanSrc = source.replace('metafile://', '');

    return cleanSrc ? `${METAFILE_CONTENT_BASE}${cleanSrc}` : undefined;
  }

  return undefined;
}

export default function ImageMessage({ uri, onOpen }: ImageMessageProps) {
  const resolvedUri = resolveImageMessageUri(uri);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedUri]);

  if (!resolvedUri || hasError) {
    return (
      <View style={[styles.image, styles.placeholder]}>
        <Text style={styles.placeholderText}>Image unavailable</Text>
      </View>
    );
  }

  return (
    <Pressable disabled={!onOpen} onPress={() => onOpen?.(resolvedUri)}>
      <Image
        onError={() => setHasError(true)}
        resizeMode="cover"
        source={{ uri: resolvedUri }}
        style={styles.image}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#eeeeee',
    borderRadius: 8,
    height: 180,
    width: 220,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#777777',
    fontSize: 13,
  },
});
