import { NATIVE_CHAT_METAFILE_CONTENT_BASE } from './nativeChatMedia';

const PIN_ID_RE = /^[a-f0-9]{64}i\d+$/i;
const AVATAR_RESIZE_QUERY = '?x-oss-process=image/auto-orient,1/quality,q_80/resize,m_lfit,w_128';
const LOCAL_AVATAR_URI_RE = /^(?:file|content|ph|assets-library):\/\//i;

function stripQueryAndHash(value: string): string {
  return value.split(/[?#]/)[0];
}

function isEmptyAvatarPlaceholder(value: string): boolean {
  const withoutQuery = stripQueryAndHash(value).replace(/\/+$/, '');

  return (
    withoutQuery === '/content' ||
    withoutQuery === '/thumbnail' ||
    withoutQuery.endsWith('/content') ||
    withoutQuery.endsWith('/thumbnail') ||
    withoutQuery === 'metafile://'
  );
}

function isDefaultAvatarPlaceholder(value: string): boolean {
  const withoutQuery = stripQueryAndHash(value).replace(/\/+$/, '');

  return /(?:^|\/)default_(?:user|avatar)(?:\.[a-f0-9]+)?\.png$/i.test(withoutQuery);
}

function getNativeChatAvatarPinId(value: string): string {
  const source = value.trim();

  if (!source) {
    return '';
  }

  const withoutQuery = stripQueryAndHash(source);
  const contentMatch = withoutQuery.match(/\/(?:content|thumbnail)\/([^/]+)$/i);

  if (contentMatch?.[1] && PIN_ID_RE.test(contentMatch[1])) {
    return contentMatch[1];
  }

  if (withoutQuery.startsWith('metafile://')) {
    return withoutQuery.replace('metafile://', '');
  }

  return PIN_ID_RE.test(withoutQuery) ? withoutQuery : '';
}

function buildNativeChatAvatarContentUrl(pinId: string): string {
  return `${NATIVE_CHAT_METAFILE_CONTENT_BASE}${pinId}${AVATAR_RESIZE_QUERY}`;
}

export function resolveNativeChatAvatarSource(
  ...sources: Array<string | null | undefined>
): string | undefined {
  for (const source of sources) {
    if (typeof source !== 'string') {
      continue;
    }

    const trimmed = source.trim();

    if (!trimmed || isEmptyAvatarPlaceholder(trimmed) || isDefaultAvatarPlaceholder(trimmed)) {
      continue;
    }

    if (trimmed.startsWith('data:image/') || LOCAL_AVATAR_URI_RE.test(trimmed)) {
      return trimmed;
    }

    const pinId = getNativeChatAvatarPinId(trimmed);

    if (pinId) {
      return buildNativeChatAvatarContentUrl(pinId);
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
  }

  return undefined;
}
