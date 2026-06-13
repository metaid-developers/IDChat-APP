export const NATIVE_CHAT_DECRYPT_FAILURE_TEXT = 'Unable to decrypt this message';

const PRIVATE_CIPHERTEXT_RE = /^U2FsdGVkX1/i;
const LONG_HEX_CIPHERTEXT_RE = /^[0-9a-f]{96,}$/i;
const UNSAFE_DISPLAY_CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

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

export function getProductSafeNativeChatError(
  _error: unknown,
  fallback = NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
): string {
  return fallback;
}
