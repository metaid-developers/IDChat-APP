import { Buffer } from 'buffer';
import { AES, enc, mode, pad } from 'crypto-js';

const Utf8 = enc.Utf8;
const Hex = enc.Hex;
const iv = Utf8.parse('0000000000000000');

function hexToBase64(hex: string): string {
  return Buffer.from(hex, 'hex').toString('base64');
}

function base64ToHex(base64: string): string {
  return Buffer.from(base64, 'base64').toString('hex');
}

export function decryptGroupText(messageHex: string, secretKeyStr: string): string {
  const secretKey = Utf8.parse(secretKeyStr);

  try {
    const messageBase64 = hexToBase64(messageHex);
    const messageBytes = AES.decrypt(messageBase64, secretKey, {
      iv,
      mode: mode.CBC,
      padding: pad.Pkcs7,
    });

    const plaintext = messageBytes.toString(Utf8);

    return plaintext || messageHex;
  } catch {
    return messageHex;
  }
}

export function encryptGroupText(message: string, secretKeyStr: string): string {
  const encrypted = AES.encrypt(Utf8.parse(message), Utf8.parse(secretKeyStr), {
    iv,
    mode: mode.CBC,
    padding: pad.Pkcs7,
  });

  return base64ToHex(encrypted.toString());
}

export function encryptPrivateText(message: string, sharedSecret: string): string {
  return AES.encrypt(message, sharedSecret).toString();
}

export function decryptPrivateText(message: string, sharedSecret: string): string {
  try {
    return AES.decrypt(message, sharedSecret).toString(Utf8);
  } catch {
    return '';
  }
}

export function encryptPrivateImageHex(messageHex: string, secretKeyHex: string): string {
  const encrypted = AES.encrypt(Hex.parse(messageHex), Hex.parse(secretKeyHex), {
    mode: mode.CBC,
    padding: pad.Pkcs7,
    iv,
  });

  return encrypted.ciphertext.toString(Hex);
}

export function decryptPrivateImageHex(cipherHex: string, secretKeyHex: string): string {
  const cipherParams = { ciphertext: Hex.parse(cipherHex) } as any;
  const decrypted = AES.decrypt(cipherParams, Hex.parse(secretKeyHex), {
    mode: mode.CBC,
    padding: pad.Pkcs7,
    iv,
  });

  return decrypted.toString(Hex);
}
