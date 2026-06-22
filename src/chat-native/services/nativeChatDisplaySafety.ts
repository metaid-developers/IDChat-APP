export const NATIVE_CHAT_DECRYPT_FAILURE_TEXT = 'Unable to decrypt this message';
export const NATIVE_CHAT_PREVIEW_ENCRYPTED_TEXT = 'Encrypted message';
export const NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT = 'Message unavailable';
export const NATIVE_CHAT_PREVIEW_UNSUPPORTED_TEXT = 'Unsupported message';

const MAX_PRODUCT_PROFILE_TEXT_LENGTH = 80;
const PRIVATE_CIPHERTEXT_RE = /^U2FsdGVkX1/i;
const LONG_HEX_CIPHERTEXT_RE = /^[0-9a-f]{96,}$/i;
const RAW_STRUCTURED_TEXT_RE = /^\s*(?:\{|\[)/;
const UNSAFE_DISPLAY_CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function looksLikeStructuredPreviewPayload(value: string): boolean {
  const normalized = value.trim();
  if (!normalized.startsWith('{') && !normalized.startsWith('[')) {
    return false;
  }

  try {
    const parsed = JSON.parse(normalized);
    return parsed !== null && typeof parsed === 'object';
  } catch {
    return false;
  }
}

export function looksLikeNativeChatCiphertext(value?: string | null): boolean {
  if (typeof value !== 'string') return false;

  const normalized = value.trim();
  return (
    PRIVATE_CIPHERTEXT_RE.test(normalized) ||
    LONG_HEX_CIPHERTEXT_RE.test(normalized) ||
    UNSAFE_DISPLAY_CONTROL_RE.test(normalized)
  );
}

export function getSafeNativeChatText(
  value?: string | null,
  fallback = NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
): string {
  const hasReadableValue = typeof value === 'string' && value.trim().length > 0;
  if (hasReadableValue && !looksLikeNativeChatCiphertext(value)) {
    return value;
  }

  if (typeof fallback === 'string' && !looksLikeNativeChatCiphertext(fallback)) {
    return fallback;
  }

  return NATIVE_CHAT_DECRYPT_FAILURE_TEXT;
}

export function getSafeNativeChatPreviewText(value?: string | null): string {
  if (typeof value === 'string') {
    const normalized = value.trim();

    if (normalized === NATIVE_CHAT_DECRYPT_FAILURE_TEXT || looksLikeNativeChatCiphertext(value)) {
      return NATIVE_CHAT_PREVIEW_ENCRYPTED_TEXT;
    }

    if (looksLikeStructuredPreviewPayload(value)) {
      return NATIVE_CHAT_PREVIEW_UNSUPPORTED_TEXT;
    }
  }

  return getSafeNativeChatText(value, NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT);
}

export function getSafeNativeChatProfileText(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (looksLikeNativeChatCiphertext(value) || RAW_STRUCTURED_TEXT_RE.test(value)) return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;

  if (normalized.length > MAX_PRODUCT_PROFILE_TEXT_LENGTH) {
    return `${normalized.slice(0, MAX_PRODUCT_PROFILE_TEXT_LENGTH - 3)}...`;
  }

  return normalized;
}

export function getProductSafeNativeChatError(
  _error: unknown,
  fallback = NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
): string {
  return fallback;
}
