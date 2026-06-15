import React from 'react';
import { Image, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import ChatAvatar from '../ChatAvatar';

const PIN_ID = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefi0';
const CONTENT_BASE = 'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/';
const RESIZE_QUERY = '?x-oss-process=image/auto-orient,1/quality,q_80/resize,m_lfit,w_128';

function findInitials(renderer: TestRenderer.ReactTestRenderer, value: string) {
  return renderer.root.findAll((node) => node.type === Text && node.props.children === value);
}

function renderAvatar(props: React.ComponentProps<typeof ChatAvatar>) {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(<ChatAvatar {...props} />);
  });

  return renderer;
}

describe('ChatAvatar', () => {
  it('renders a resolved HTTPS URI as an accessible avatar image', () => {
    const renderer = renderAvatar({
      name: 'Ada Lovelace',
      uri: '  https://example.test/ada.png  ',
    });

    const image = renderer.root.findByType(Image);
    expect(image.props.accessibilityLabel).toBe('Ada Lovelace avatar');
    expect(image.props.source).toEqual({ uri: 'https://example.test/ada.png' });
    expect(image.props.contentFit).toBe('cover');
    expect(image.props.cachePolicy).toBe('memory-disk');
    expect(image.props.recyclingKey).toBe('https://example.test/ada.png');
  });

  it('resolves metafile avatar pins before rendering', () => {
    const renderer = renderAvatar({ name: 'Pin User', uri: `metafile://${PIN_ID}` });

    expect(renderer.root.findByType(Image).props.source).toEqual({
      uri: `${CONTENT_BASE}${PIN_ID}${RESIZE_QUERY}`,
    });
  });

  it('switches to initials fallback when image loading fails', () => {
    const renderer = renderAvatar({ name: 'Load Error', uri: 'https://example.test/missing.png' });

    act(() => {
      renderer.root.findByType(Image).props.onError();
    });

    expect(findInitials(renderer, 'LE')).toHaveLength(1);
  });

  it('resets failed image state when updated to a new URI', () => {
    const renderer = renderAvatar({ name: 'Reset Avatar', uri: 'https://example.test/missing.png' });

    act(() => {
      renderer.root.findByType(Image).props.onError();
    });

    expect(findInitials(renderer, 'RA')).toHaveLength(1);

    act(() => {
      renderer.update(<ChatAvatar name="Reset Avatar" uri="https://example.test/recovered.png" />);
    });

    expect(renderer.root.findAllByType(Image)).toHaveLength(1);
    expect(renderer.root.findByType(Image).props.source).toEqual({
      uri: 'https://example.test/recovered.png',
    });
  });

  it('renders initials fallback for default avatar placeholders', () => {
    const renderer = renderAvatar({
      name: 'Default User',
      uri: 'https://static.test/default_user.png',
    });

    expect(renderer.root.findAllByType(Image)).toHaveLength(0);
    expect(findInitials(renderer, 'DU')).toHaveLength(1);
  });
});
