import {
  decryptGroupText,
  decryptPrivateImageHex,
  decryptPrivateText,
  encryptGroupText,
  encryptPrivateImageHex,
  encryptPrivateText,
} from '../chatCrypto';

describe('chatCrypto', () => {
  const groupKey = '1234567890abcdef';
  const groupPlaintext = 'hello native idchat';
  const groupCiphertext = '943905175995b6f813db36b6a522b9a2cff81261a273a4171fa030fb901ee974';
  const privateSecret =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const privateCiphertext = 'U2FsdGVkX1/HuezozE95VsBrHneFXYJHwD65DuYR2W0=';
  const imageHex = '89504e470d0a1a0a0000000d49484452';
  const imageCiphertext = '22f18f43ce108ff8bfde42aa3925e82647541575567dc89f0080c4bcd7888046';

  it('matches the web group AES-CBC hex fixture', () => {
    expect(encryptGroupText(groupPlaintext, groupKey)).toBe(groupCiphertext);
    expect(decryptGroupText(groupCiphertext, groupKey)).toBe(groupPlaintext);
  });

  it('falls back to the original group payload when decryption cannot produce text', () => {
    expect(decryptGroupText('nothex', groupKey)).toBe('nothex');
    expect(decryptGroupText(groupCiphertext, 'aaaaaaaaaaaaaaaa')).toBe(groupCiphertext);
  });

  it('decrypts a web-compatible private text ciphertext', () => {
    expect(decryptPrivateText(privateCiphertext, privateSecret)).toBe('private hello');
  });

  it('round-trips private text with the current web-compatible passphrase mode', () => {
    const encrypted = encryptPrivateText('fresh private hello', privateSecret);

    expect(encrypted).not.toBe('fresh private hello');
    expect(decryptPrivateText(encrypted, privateSecret)).toBe('fresh private hello');
  });

  it('matches the web private image AES-CBC hex fixture', () => {
    expect(encryptPrivateImageHex(imageHex, privateSecret)).toBe(imageCiphertext);
    expect(decryptPrivateImageHex(imageCiphertext, privateSecret)).toBe(imageHex);
  });
});
