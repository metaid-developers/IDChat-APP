import {
  NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
  getProductSafeNativeChatError,
  getSafeNativeChatText,
  looksLikeNativeChatCiphertext,
} from '../nativeChatDisplaySafety';

describe('nativeChatDisplaySafety', () => {
  it('detects private salted ciphertext and long group hex payloads', () => {
    expect(looksLikeNativeChatCiphertext('U2FsdGVkX19privatepayload')).toBe(true);
    expect(looksLikeNativeChatCiphertext('a'.repeat(96))).toBe(true);
    expect(looksLikeNativeChatCiphertext('H\u001cN<')).toBe(true);
    expect(looksLikeNativeChatCiphertext('hello native chat')).toBe(false);
    expect(looksLikeNativeChatCiphertext('a'.repeat(95))).toBe(false);
  });

  it('uses fallback text for empty or encrypted display candidates', () => {
    expect(getSafeNativeChatText('', 'plain fallback')).toBe('plain fallback');
    expect(getSafeNativeChatText('U2FsdGVkX19privatepayload', 'plain fallback')).toBe(
      'plain fallback',
    );
    expect(getSafeNativeChatText('a'.repeat(96), 'plain fallback')).toBe('plain fallback');
    expect(getSafeNativeChatText('readable plaintext', 'plain fallback')).toBe(
      'readable plaintext',
    );
  });

  it('does not return ciphertext when fallback is also encrypted', () => {
    expect(getSafeNativeChatText('', 'U2FsdGVkX19privatepayload')).toBe(
      NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
    );
  });

  it('uses decrypt failure text as the default fallback', () => {
    expect(getSafeNativeChatText('')).toBe(NATIVE_CHAT_DECRYPT_FAILURE_TEXT);
  });

  it('keeps empty text empty when caller explicitly supplies an empty fallback', () => {
    expect(getSafeNativeChatText('', '')).toBe('');
  });

  it('maps low-level crypto errors to the default product-safe text', () => {
    expect(getProductSafeNativeChatError(new Error('Unknown point format'))).toBe(
      NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
    );
  });

  it('returns caller-supplied fallback for crypto and transport errors', () => {
    const fallback = 'Search failed. Try again.';

    expect(getProductSafeNativeChatError(new Error('Unknown point format'), fallback)).toBe(
      fallback,
    );
    expect(getProductSafeNativeChatError(new Error('Invalid public key'), fallback)).toBe(
      fallback,
    );
    expect(getProductSafeNativeChatError(new Error('Network request failed'), fallback)).toBe(
      fallback,
    );
  });
});
