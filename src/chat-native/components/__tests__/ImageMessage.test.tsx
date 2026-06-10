import { describe, expect, it } from '@jest/globals';
import { resolveImageMessageUri, resolveImageMessageUris } from '../ImageMessage';

describe('ImageMessage', () => {
  it('resolves metafile uris to the web-compatible file content endpoint', () => {
    expect(resolveImageMessageUri('metafile://abc123i0')).toBe(
      'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/abc123i0',
    );
  });

  it('preserves native and web-renderable image uri schemes', () => {
    expect(resolveImageMessageUri('https://example.test/image.png')).toBe('https://example.test/image.png');
    expect(resolveImageMessageUri('http://example.test/image.png')).toBe('http://example.test/image.png');
    expect(resolveImageMessageUri('file:///tmp/image.png')).toBe('file:///tmp/image.png');
    expect(resolveImageMessageUri('ph://B6E3D7AF-1234-4567-8910-112233445566')).toBe(
      'ph://B6E3D7AF-1234-4567-8910-112233445566',
    );
    expect(resolveImageMessageUri('assets-library://asset/asset.JPG?id=abc&ext=JPG')).toBe(
      'assets-library://asset/asset.JPG?id=abc&ext=JPG',
    );
    expect(resolveImageMessageUri('content://media/external/images/media/42')).toBe(
      'content://media/external/images/media/42',
    );
    expect(resolveImageMessageUri('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123');
  });

  it('returns undefined for empty or unsupported image uris', () => {
    expect(resolveImageMessageUri()).toBeUndefined();
    expect(resolveImageMessageUri('')).toBeUndefined();
    expect(resolveImageMessageUri('ipfs://abc123')).toBeUndefined();
  });

  it('prefers local previews before sent attachment uris', () => {
    expect(
      resolveImageMessageUris({
        localPreviewUri: 'file:///tmp/local-preview.png',
        attachmentUri: 'metafile://remote-filei0',
      }),
    ).toEqual([
      'file:///tmp/local-preview.png',
      'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/remote-filei0',
    ]);
  });

  it('falls back to remote attachment only when no local preview can render', () => {
    expect(
      resolveImageMessageUris({
        localPreviewUri: 'ipfs://not-renderable',
        attachmentUri: 'https://example.test/remote.png',
      }),
    ).toEqual(['https://example.test/remote.png']);
  });

  it('returns no renderable source when local preview and attachment are unsupported', () => {
    expect(
      resolveImageMessageUris({
        localPreviewUri: 'ipfs://not-renderable-local',
        attachmentUri: 'ipfs://not-renderable-remote',
      }),
    ).toEqual([]);
  });
});
