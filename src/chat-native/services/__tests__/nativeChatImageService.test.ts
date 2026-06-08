import { describe, expect, it } from '@jest/globals';
import { decryptPrivateImageHex } from '../chatCrypto';
import {
  encryptImageAttachmentForChannel,
  fileExtensionFromMime,
  makeAttachmentItem,
} from '../nativeChatImageService';

describe('nativeChatImageService', () => {
  it('extracts image file extension', () => {
    expect(fileExtensionFromMime('image/png')).toBe('png');
    expect(fileExtensionFromMime('image/jpeg')).toBe('jpeg');
  });

  it('creates attachment item from base64 content', () => {
    expect(makeAttachmentItem({ base64: 'AQID', mimeType: 'image/png' })).toEqual({
      data: '010203',
      fileType: 'image/png',
    });
  });

  it('does not encrypt public group image bytes', () => {
    expect(
      encryptImageAttachmentForChannel({
        attachment: { data: '010203', fileType: 'image/png' },
        channel: { type: 'group' } as any,
      }),
    ).toEqual({ data: '010203', fileType: 'image/png' });
  });

  it('encrypts private group image bytes with the group password key', () => {
    const secret = '0123456789abcdef0123456789abcdef';
    const encrypted = encryptImageAttachmentForChannel({
      attachment: { data: '010203', fileType: 'image/png' },
      channel: { type: 'group', roomJoinType: '100', passwordKey: secret } as any,
    });

    expect(encrypted.data).not.toBe('010203');
    expect(encrypted.fileType).toBe('image/png');
    expect(decryptPrivateImageHex(encrypted.data, secret)).toBe('010203');
  });

  it('encrypts private image bytes when a shared secret is provided', () => {
    const secret = '0123456789abcdef0123456789abcdef';
    const encrypted = encryptImageAttachmentForChannel({
      attachment: { data: '010203', fileType: 'image/png' },
      channel: { type: 'private' } as any,
      sharedSecret: secret,
    });

    expect(encrypted.data).not.toBe('010203');
    expect(encrypted.fileType).toBe('image/png');
    expect(decryptPrivateImageHex(encrypted.data, secret)).toBe('010203');
  });

  it('rejects private image encryption without a shared secret', () => {
    expect(() =>
      encryptImageAttachmentForChannel({
        attachment: { data: '010203', fileType: 'image/png' },
        channel: { type: 'private' } as any,
      }),
    ).toThrow('Missing private image shared secret');
  });
});
