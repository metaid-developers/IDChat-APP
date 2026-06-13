import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resolveNativeChatMediaUri } from '../ui/nativeChatMedia';

type ImageMessageProps = {
  attachmentUri?: string;
  localPreviewUri?: string;
  uri?: string;
  onOpen?: (uri: string) => void;
};

const IMAGE_WIDTH = 220;
const IMAGE_ASPECT_RATIO = 4 / 3;
const LOCAL_IMAGE_LOADING_TIMEOUT_MS = 2500;

export function resolveImageMessageUri(uri?: string): string | undefined {
  return resolveNativeChatMediaUri(uri);
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
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearLoadingTimeout() {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }

  function scheduleLocalPreviewTimeout(nextResolvedUri: string | undefined) {
    clearLoadingTimeout();

    if (
      !nextResolvedUri ||
      !(
        nextResolvedUri.startsWith('file://') ||
        nextResolvedUri.startsWith('ph://') ||
        nextResolvedUri.startsWith('assets-library://') ||
        nextResolvedUri.startsWith('content://') ||
        nextResolvedUri.startsWith('data:image/')
      )
    ) {
      return;
    }

    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      loadingTimeoutRef.current = null;
    }, LOCAL_IMAGE_LOADING_TIMEOUT_MS);
  }

  useEffect(() => {
    setSourceIndex(0);
    setHasError(false);
    setIsLoading(Boolean(resolvedUris[0]));
    scheduleLocalPreviewTimeout(resolvedUris[0]);
    return () => {
      clearLoadingTimeout();
    };
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
        onLoad={() => {
          clearLoadingTimeout();
          setIsLoading(false);
        }}
        onError={() => {
          clearLoadingTimeout();
          if (sourceIndex + 1 < resolvedUris.length) {
            setSourceIndex(sourceIndex + 1);
            setIsLoading(true);
            scheduleLocalPreviewTimeout(resolvedUris[sourceIndex + 1]);
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
