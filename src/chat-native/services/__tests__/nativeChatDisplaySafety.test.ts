import {
  NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
  NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
  getProductSafeNativeChatError,
  getSafeNativeChatPreviewText,
  getSafeNativeChatProfileText,
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

  it('uses product preview fallback text for encrypted previews', () => {
    expect(getSafeNativeChatPreviewText('U2FsdGVkX19privatepayload')).toBe(
      NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
    );
    expect(getSafeNativeChatPreviewText('Unable to decrypt this message')).toBe(
      NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
    );
    expect(getSafeNativeChatPreviewText('normal preview')).toBe('normal preview');
  });

  it('uses product preview fallback text for structured previews', () => {
    expect(getSafeNativeChatPreviewText('{"redpacket":"raw"}')).toBe(
      NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
    );
    expect(getSafeNativeChatPreviewText('  ["raw"]')).toBe(
      NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
    );
  });

  it('keeps bracketed plaintext previews visible', () => {
    expect(getSafeNativeChatPreviewText('[todo] review release notes')).toBe(
      '[todo] review release notes',
    );
    expect(getSafeNativeChatPreviewText('{draft} check group name')).toBe(
      '{draft} check group name',
    );
  });

  it('removes raw structured profile text while keeping product copy', () => {
    expect(getSafeNativeChatProfileText('{"background":"raw prompt"}')).toBe(
      undefined,
    );
    expect(getSafeNativeChatProfileText('["raw"]')).toBe(undefined);
    expect(getSafeNativeChatProfileText('  Building on MetaID  ')).toBe(
      'Building on MetaID',
    );
  });

  it('truncates long profile text to product-safe copy', () => {
    const longText = 'p'.repeat(120);

    expect(getSafeNativeChatProfileText(longText)).toBe(`${'p'.repeat(77)}...`);
    expect(getSafeNativeChatProfileText('short profile copy')).toBe(
      'short profile copy',
    );
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
