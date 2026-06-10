import { describe, expect, it, jest } from '@jest/globals';
import { decryptPrivateImageHex } from '../chatCrypto';
import {
  createLocalImagePreviewUri,
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

  it('copies non-file picker previews into cache-backed file uris', async () => {
    const writeAsStringAsync = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const fileSystem = {
      cacheDirectory: 'file:///cache/',
      EncodingType: { Base64: 'base64' },
      writeAsStringAsync,
    } as any;

    await expect(
      createLocalImagePreviewUri({
        uri: 'ph://AD53637D-F48E-4B89-A001',
        base64: 'AQID',
        mimeType: 'image/png',
        fileSystem,
        nowMs: () => 123,
      }),
    ).resolves.toBe('file:///cache/idchat-image-preview-123.png');
    expect(writeAsStringAsync).toHaveBeenCalledWith(
      'file:///cache/idchat-image-preview-123.png',
      'AQID',
      { encoding: 'base64' },
    );
  });

  it('copies file picker previews into cache-backed file uris', async () => {
    const writeAsStringAsync = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await expect(
      createLocalImagePreviewUri({
        uri: 'file:///tmp/local.jpg',
        base64: 'AQID',
        mimeType: 'image/jpeg',
        fileSystem: {
          cacheDirectory: 'file:///cache/',
          EncodingType: { Base64: 'base64' },
          writeAsStringAsync,
        } as any,
        nowMs: () => 123,
      }),
    ).resolves.toBe('file:///cache/idchat-image-preview-123.jpeg');
    expect(writeAsStringAsync).toHaveBeenCalledWith(
      'file:///cache/idchat-image-preview-123.jpeg',
      'AQID',
      { encoding: 'base64' },
    );
  });

  it('falls back to the picker uri when preview cache writing is unavailable', async () => {
    const writeAsStringAsync = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('disk full'));

    await expect(
      createLocalImagePreviewUri({
        uri: 'ph://AD53637D-F48E-4B89-A001',
        base64: 'AQID',
        mimeType: 'image/png',
        fileSystem: {
          cacheDirectory: 'file:///cache/',
          EncodingType: { Base64: 'base64' },
          writeAsStringAsync,
        } as any,
      }),
    ).resolves.toBe('ph://AD53637D-F48E-4B89-A001');
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
