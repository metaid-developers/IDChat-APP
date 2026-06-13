export const NATIVE_CHAT_METAFILE_CONTENT_BASE =
  'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/';

export function resolveNativeChatMediaUri(uri?: string): string | undefined {
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

    return cleanSrc ? `${NATIVE_CHAT_METAFILE_CONTENT_BASE}${cleanSrc}` : undefined;
  }

  return undefined;
}
