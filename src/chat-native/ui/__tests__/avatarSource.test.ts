import { resolveNativeChatAvatarSource } from '../avatarSource';

const PIN_ID = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefi0';
const CONTENT_BASE = 'https://file.metaid.io/metafile-indexer/content/';
const LEGACY_ACCELERATE_BASE =
  'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/';
const RESIZE_QUERY = '?x-oss-process=image/auto-orient,1/quality,q_80/resize,m_lfit,w_128';

describe('resolveNativeChatAvatarSource', () => {
  it('preserves direct HTTPS image URLs', () => {
    expect(resolveNativeChatAvatarSource('  https://example.test/avatar.png  ')).toBe(
      'https://example.test/avatar.png',
    );
  });

  it('preserves arbitrary HTTPS content paths that are not MetaID pin ids', () => {
    expect(resolveNativeChatAvatarSource('https://cdn.example.com/content/avatar.png')).toBe(
      'https://cdn.example.com/content/avatar.png',
    );
  });

  it('preserves local renderable avatar URI schemes', () => {
    expect(resolveNativeChatAvatarSource('file:///tmp/avatar.png')).toBe('file:///tmp/avatar.png');
    expect(resolveNativeChatAvatarSource('content://media/external/images/media/42')).toBe(
      'content://media/external/images/media/42',
    );
    expect(resolveNativeChatAvatarSource('ph://B6E3D7AF-1234-4567-8910-112233445566')).toBe(
      'ph://B6E3D7AF-1234-4567-8910-112233445566',
    );
    expect(resolveNativeChatAvatarSource('assets-library://asset/asset.JPG?id=abc&ext=JPG')).toBe(
      'assets-library://asset/asset.JPG?id=abc&ext=JPG',
    );
  });

  it('preserves data image URLs', () => {
    expect(resolveNativeChatAvatarSource('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123');
  });

  it('resolves metafile avatar pins to the content endpoint with resize query', () => {
    expect(resolveNativeChatAvatarSource(`metafile://${PIN_ID}`)).toBe(`${CONTENT_BASE}${PIN_ID}${RESIZE_QUERY}`);
  });

  it('resolves content avatar paths to the content endpoint with resize query', () => {
    expect(resolveNativeChatAvatarSource(`/content/${PIN_ID}`)).toBe(`${CONTENT_BASE}${PIN_ID}${RESIZE_QUERY}`);
  });

  it('normalizes full MetaID avatar content URLs to the avatar content endpoint with resize query', () => {
    expect(resolveNativeChatAvatarSource(`${CONTENT_BASE}${PIN_ID}`)).toBe(`${CONTENT_BASE}${PIN_ID}${RESIZE_QUERY}`);
  });

  it('repairs legacy cached accelerate avatar URLs to the avatar content endpoint', () => {
    expect(resolveNativeChatAvatarSource(`${LEGACY_ACCELERATE_BASE}${PIN_ID}${RESIZE_QUERY}`)).toBe(
      `${CONTENT_BASE}${PIN_ID}${RESIZE_QUERY}`,
    );
  });

  it('resolves thumbnail avatar paths with valid pins to the content endpoint with resize query', () => {
    expect(resolveNativeChatAvatarSource(`/thumbnail/${PIN_ID}`)).toBe(`${CONTENT_BASE}${PIN_ID}${RESIZE_QUERY}`);
  });

  it('resolves raw pin ids to the content endpoint with resize query', () => {
    expect(resolveNativeChatAvatarSource(PIN_ID)).toBe(`${CONTENT_BASE}${PIN_ID}${RESIZE_QUERY}`);
  });

  it('filters default avatar placeholders', () => {
    expect(resolveNativeChatAvatarSource('https://static.test/default_user.png')).toBeUndefined();
    expect(resolveNativeChatAvatarSource('/assets/default_avatar.abcdef.png')).toBeUndefined();
  });

  it('filters empty content placeholders', () => {
    expect(resolveNativeChatAvatarSource('/content')).toBeUndefined();
    expect(resolveNativeChatAvatarSource('/thumbnail')).toBeUndefined();
    expect(resolveNativeChatAvatarSource('metafile://')).toBeUndefined();
  });

  it('returns the first usable source', () => {
    expect(
      resolveNativeChatAvatarSource(
        'metafile://',
        'https://example.test/avatar-image.png',
        `metafile://${PIN_ID}`,
      ),
    ).toBe('https://example.test/avatar-image.png');
  });
});
