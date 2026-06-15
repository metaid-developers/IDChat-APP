import { ec as EC } from 'elliptic';

const PUBLIC_KEY_HEX_RE = /^(04[0-9a-f]{128}|0[23][0-9a-f]{64})$/i;
const p256 = new EC('p256');

function isValidNativeChatPublicKeyPoint(value: string): boolean {
  try {
    const publicKey = p256.keyFromPublic(value, 'hex').getPublic();
    return p256.curve.validate(publicKey);
  } catch {
    return false;
  }
}

export function normalizeNativeChatPublicKey(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().replace(/^0x/i, '').toLowerCase();
  return PUBLIC_KEY_HEX_RE.test(normalized) && isValidNativeChatPublicKeyPoint(normalized)
    ? normalized
    : undefined;
}
