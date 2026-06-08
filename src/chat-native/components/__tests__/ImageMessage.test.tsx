import { describe, expect, it } from '@jest/globals';
import { resolveImageMessageUri } from '../ImageMessage';

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
  });

  it('returns undefined for empty or unsupported image uris', () => {
    expect(resolveImageMessageUri()).toBeUndefined();
    expect(resolveImageMessageUri('')).toBeUndefined();
    expect(resolveImageMessageUri('ipfs://abc123')).toBeUndefined();
  });
});
