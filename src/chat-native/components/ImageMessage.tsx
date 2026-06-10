import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ImageMessageProps = {
  attachmentUri?: string;
  localPreviewUri?: string;
  uri?: string;
  onOpen?: (uri: string) => void;
};

const METAFILE_CONTENT_BASE = 'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/';
const IMAGE_WIDTH = 220;
const IMAGE_ASPECT_RATIO = 4 / 3;

export function resolveImageMessageUri(uri?: string): string | undefined {
  const source = uri?.trim();

  if (!source) {
    return undefined;
  }

  if (
    /^https?:\/\//i.test(source) ||
    source.startsWith('file://') ||
    source.startsWith('ph://') ||
    source.startsWith('assets-library://') ||
    source.startsWith('content://') ||
    source.startsWith('data:image/')
  ) {
    return source;
  }

  if (source.startsWith('metafile://')) {
    const cleanSrc = source.replace('metafile://', '');

    return cleanSrc ? `${METAFILE_CONTENT_BASE}${cleanSrc}` : undefined;
  }

  return undefined;
}

function appendUniqueImageUri(uris: string[], uri?: string): string[] {
  const resolvedUri = resolveImageMessageUri(uri);

  if (!resolvedUri || uris.includes(resolvedUri)) {
    return uris;
  }

  return [...uris, resolvedUri];
}

export function resolveImageMessageUris({
  attachmentUri,
  localPreviewUri,
  uri,
}: Pick<ImageMessageProps, 'attachmentUri' | 'localPreviewUri' | 'uri'>): string[] {
  return [localPreviewUri, uri, attachmentUri].reduce(appendUniqueImageUri, [] as string[]);
}

export default function ImageMessage({ attachmentUri, localPreviewUri, uri, onOpen }: ImageMessageProps) {
  const resolvedUris = resolveImageMessageUris({ attachmentUri, localPreviewUri, uri });
  const [sourceIndex, setSourceIndex] = useState(0);
  const resolvedUri = resolvedUris[sourceIndex];
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedUri));

  useEffect(() => {
    setSourceIndex(0);
    setHasError(false);
    setIsLoading(Boolean(resolvedUris[0]));
  }, [attachmentUri, localPreviewUri, uri]);

  if (!resolvedUri || hasError) {
    return (
      <View style={[styles.frame, styles.placeholder]}>
        <Text style={styles.placeholderText}>Image unavailable</Text>
      </View>
    );
  }

  const imageContent = (
    <View style={styles.frame}>
      <Image
        onError={() => {
          if (sourceIndex + 1 < resolvedUris.length) {
            setSourceIndex(sourceIndex + 1);
            setIsLoading(true);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }}
        onLoadEnd={() => setIsLoading(false)}
        onLoadStart={() => setIsLoading(true)}
        resizeMode="cover"
        source={{ uri: resolvedUri }}
        style={styles.image}
      />
      {isLoading ? (
        <View style={[StyleSheet.absoluteFillObject, styles.placeholder, styles.loadingOverlay]}>
          <ActivityIndicator color="#657287" size="small" />
          <Text style={styles.placeholderText}>Loading image</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <Pressable
      accessibilityLabel="Open image preview"
      accessibilityRole="button"
      onPress={() => {
        const openResult = onOpen ? onOpen(resolvedUri) : Linking.openURL(resolvedUri);
        Promise.resolve(openResult).catch(() => undefined);
      }}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {imageContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: IMAGE_ASPECT_RATIO,
    backgroundColor: '#eeeeee',
    borderRadius: 10,
    maxWidth: '100%',
    overflow: 'hidden',
    width: IMAGE_WIDTH,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  loadingOverlay: {
    backgroundColor: '#eef2f7',
    gap: 6,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#777777',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.84,
  },
});
