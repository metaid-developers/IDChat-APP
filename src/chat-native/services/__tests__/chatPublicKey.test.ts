import { normalizeNativeChatPublicKey } from '../chatPublicKey';

describe('normalizeNativeChatPublicKey', () => {
  const compressedKey = '03604d0eac7a9dd1544690c87def4b89e483547aaa79239df6b04b447666e484df';
  const uncompressedKey =
    '04604d0eac7a9dd1544690c87def4b89e483547aaa79239df6b04b447666e484dfa73548e0097c6d8a6ca20da2e9082b1111803c9711aac72a14b0fb50468c8479';

  it('normalizes compressed and uncompressed hex public keys', () => {
    expect(normalizeNativeChatPublicKey(`  0x${compressedKey.toUpperCase()}  `)).toBe(
      compressedKey,
    );
    expect(normalizeNativeChatPublicKey(uncompressedKey.toUpperCase())).toBe(uncompressedKey);
  });

  it('rejects malformed, empty, and non-string values', () => {
    expect(normalizeNativeChatPublicKey('peer-public-key')).toBeUndefined();
    expect(normalizeNativeChatPublicKey(`05${'a'.repeat(64)}`)).toBeUndefined();
    expect(normalizeNativeChatPublicKey('')).toBeUndefined();
    expect(normalizeNativeChatPublicKey(null)).toBeUndefined();
    expect(normalizeNativeChatPublicKey(undefined)).toBeUndefined();
  });

  it('rejects hex keys that are not valid p256 points', () => {
    expect(normalizeNativeChatPublicKey(`02${'a'.repeat(64)}`)).toBeUndefined();
  });
});
